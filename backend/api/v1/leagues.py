"""
League-related API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from backend.services.fotmob import get_fotmob_client
from backend.services.espn import get_espn_client, get_news_service
from backend.services.simulation import get_league_simulator
from backend.config import LEAGUE_IDS, LEAGUE_NAMES

router = APIRouter(prefix="/leagues", tags=["leagues"])


# Mapping from league_id to league_key
LEAGUE_ID_TO_KEY = {v: k for k, v in LEAGUE_IDS.items()}


@router.get("/")
async def list_leagues():
    """List all available leagues."""
    return {
        "leagues": [
            {
                "id": league_id,
                "name": LEAGUE_NAMES.get(league_id, name),
                "key": name
            }
            for name, league_id in LEAGUE_IDS.items()
        ]
    }


@router.get("/{league_id}")
async def get_league(league_id: int):
    """Get league information."""
    client = get_fotmob_client()
    data = await client.get_league(league_id)
    
    if not data:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    
    return data


@router.get("/{league_id}/standings")
async def get_league_standings(league_id: int):
    """Get current league standings."""
    client = get_fotmob_client()
    standings = await client.get_league_standings(league_id)
    
    if standings is None:
        raise HTTPException(status_code=404, detail=f"Standings not found for league {league_id}")
    
    return {
        "league_id": league_id,
        "league_name": LEAGUE_NAMES.get(league_id, "Unknown"),
        "standings": standings
    }


@router.get("/{league_id}/matches")
async def get_league_matches(league_id: int):
    """Get all matches for a league this season."""
    client = get_fotmob_client()
    matches = await client.get_league_matches(league_id)
    
    if matches is None:
        raise HTTPException(status_code=404, detail=f"Matches not found for league {league_id}")
    
    return {
        "league_id": league_id,
        "league_name": LEAGUE_NAMES.get(league_id, "Unknown"),
        "matches": matches
    }


@router.get("/{league_id}/top-scorers")
async def get_league_top_scorers(league_id: int):
    """Get top scorers in the league."""
    client = get_fotmob_client()
    scorers = await client.get_league_top_scorers(league_id)
    
    if scorers is None:
        scorers = []
    
    return {
        "league_id": league_id,
        "league_name": LEAGUE_NAMES.get(league_id, "Unknown"),
        "top_scorers": scorers
    }


@router.get("/by-name/{league_name}")
async def get_league_by_name(league_name: str):
    """Get league by name/key."""
    league_key = league_name.lower().replace(" ", "_").replace("-", "_")
    
    if league_key not in LEAGUE_IDS:
        raise HTTPException(
            status_code=404, 
            detail=f"League '{league_name}' not found. Available: {list(LEAGUE_IDS.keys())}"
        )
    
    league_id = LEAGUE_IDS[league_key]
    return await get_league(league_id)


# ==================== ESPN Data Endpoints ====================


@router.get("/{league_id}/news")
async def get_league_news(league_id: int, limit: int = Query(10, ge=1, le=50)):
    """
    Get latest news for a league from ESPN.
    
    Returns news articles with headlines and descriptions.
    """
    league_key = LEAGUE_ID_TO_KEY.get(league_id)
    if not league_key:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    
    espn_client = get_espn_client()
    news = await espn_client.get_league_news(league_key, limit)
    
    return {
        "league_id": league_id,
        "league_name": LEAGUE_NAMES.get(league_id, "Unknown"),
        "news": news,
        "source": "ESPN"
    }


@router.get("/{league_id}/espn-standings")
async def get_espn_standings(league_id: int):
    """
    Get league standings from ESPN (alternative source).
    
    Useful for comparison and data validation.
    """
    league_key = LEAGUE_ID_TO_KEY.get(league_id)
    if not league_key:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    
    espn_client = get_espn_client()
    standings = await espn_client.get_standings(league_key)
    
    if standings is None:
        raise HTTPException(status_code=404, detail=f"ESPN standings not available for league {league_id}")
    
    return {
        "league_id": league_id,
        "league_name": LEAGUE_NAMES.get(league_id, "Unknown"),
        "standings": standings,
        "source": "ESPN"
    }


# ==================== League Simulation Endpoints ====================


@router.get("/{league_id}/simulation")
async def simulate_league_standings(
    league_id: int,
    n_simulations: int = Query(1000, ge=100, le=10000)
):
    """
    Run Monte Carlo simulation to predict final league standings.
    
    Simulates remaining matches using team ELO ratings and
    Poisson goal distributions.
    
    Returns:
    - Predicted final standings
    - Title/Top 4/Relegation probabilities
    - Position distributions for each team
    """
    league_key = LEAGUE_ID_TO_KEY.get(league_id)
    if not league_key:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    
    # Get current standings
    client = get_fotmob_client()
    standings = await client.get_league_standings(league_id)
    
    if not standings:
        raise HTTPException(status_code=404, detail="Standings not available")
    
    # Get remaining fixtures
    matches = await client.get_league_matches(league_id)
    
    if not matches:
        matches = []
    
    # Filter to remaining (unplayed) matches
    remaining = []
    for match in matches:
        status = match.get("status", {})
        if not status.get("finished") and not status.get("started"):
            home = match.get("home", {})
            away = match.get("away", {})
            remaining.append({
                "home_team": home.get("name"),
                "away_team": away.get("name"),
                "home_id": home.get("id"),
                "away_id": away.get("id"),
            })
    
    # Run simulation
    simulator = get_league_simulator()
    simulator.n_simulations = n_simulations
    
    result = simulator.simulate_league(
        current_standings=standings,
        remaining_fixtures=remaining,
        league_key=league_key,
        league_name=LEAGUE_NAMES.get(league_id, "Unknown"),
    )
    
    return {
        "league_id": league_id,
        "league_name": result.league_name,
        "n_simulations": result.n_simulations,
        "remaining_matches": result.remaining_matches,
        "most_likely_champion": result.most_likely_champion,
        "champion_probability": result.champion_probability,
        "likely_top_4": result.likely_top_4,
        "relegation_candidates": result.relegation_candidates,
        "standings": [
            {
                "team_name": s.team_name,
                "team_id": s.team_id,
                "current_position": s.current_position,
                "current_points": s.current_points,
                "avg_final_position": round(s.avg_final_position, 2),
                "avg_final_points": round(s.avg_final_points, 1),
                "position_std": round(s.position_std, 2),
                "title_probability": s.title_probability,
                "top_4_probability": s.top_4_probability,
                "europa_probability": s.europa_probability,
                "relegation_probability": s.relegation_probability,
                "position_distribution": s.position_distribution,
            }
            for s in result.standings
        ],
    }


@router.get("/{league_id}/title-race")
async def get_title_race(league_id: int):
    """
    Quick title race probabilities.
    
    Returns probability of each team winning the league.
    """
    league_key = LEAGUE_ID_TO_KEY.get(league_id)
    if not league_key:
        raise HTTPException(status_code=404, detail=f"League {league_id} not found")
    
    # Get current standings
    client = get_fotmob_client()
    standings = await client.get_league_standings(league_id)
    
    if not standings:
        raise HTTPException(status_code=404, detail="Standings not available")
    
    # Get remaining fixtures
    matches = await client.get_league_matches(league_id)
    
    remaining = []
    for match in (matches or []):
        status = match.get("status", {})
        if not status.get("finished") and not status.get("started"):
            home = match.get("home", {})
            away = match.get("away", {})
            remaining.append({
                "home_team": home.get("name"),
                "away_team": away.get("name"),
            })
    
    # Run quick simulation
    simulator = get_league_simulator()
    simulator.n_simulations = 1000  # Quick simulation
    
    result = simulator.simulate_league(
        current_standings=standings,
        remaining_fixtures=remaining,
        league_key=league_key,
        league_name=LEAGUE_NAMES.get(league_id, "Unknown"),
    )
    
    # Return just title probabilities
    title_probs = {
        s.team_name: s.title_probability
        for s in result.standings
        if s.title_probability > 0.001
    }
    
    # Sort by probability
    sorted_probs = dict(sorted(
        title_probs.items(),
        key=lambda x: x[1],
        reverse=True
    ))
    
    return {
        "league_id": league_id,
        "league_name": LEAGUE_NAMES.get(league_id, "Unknown"),
        "remaining_matches": len(remaining),
        "title_probabilities": sorted_probs,
        "most_likely_champion": result.most_likely_champion,
        "champion_probability": result.champion_probability,
    }
