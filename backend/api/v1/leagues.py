"""
League-related API endpoints.
"""

from fastapi import APIRouter, HTTPException

from backend.services.fotmob import get_fotmob_client
from backend.config import LEAGUE_IDS, LEAGUE_NAMES

router = APIRouter(prefix="/leagues", tags=["leagues"])


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
