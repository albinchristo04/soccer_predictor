"""
Team-related API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query

from backend.services.fotmob import get_fotmob_client
from backend.services.ratings import get_elo_system

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/search")
async def search_teams(q: str = Query(..., min_length=2)):
    """Search for teams by name."""
    client = get_fotmob_client()
    results = await client.search_team(q)
    
    if results is None:
        results = []
    
    return {
        "query": q,
        "results": results,
        "count": len(results)
    }


@router.get("/{team_id}")
async def get_team(team_id: int):
    """Get team information."""
    client = get_fotmob_client()
    data = await client.get_team(team_id)
    
    if not data:
        raise HTTPException(status_code=404, detail=f"Team {team_id} not found")
    
    return data


@router.get("/{team_id}/fixtures")
async def get_team_fixtures(team_id: int):
    """Get team's fixtures (past and upcoming)."""
    client = get_fotmob_client()
    fixtures = await client.get_team_fixtures(team_id)
    
    if fixtures is None:
        raise HTTPException(status_code=404, detail=f"Fixtures not found for team {team_id}")
    
    return {
        "team_id": team_id,
        "fixtures": fixtures,
        "count": len(fixtures)
    }


@router.get("/{team_id}/squad")
async def get_team_squad(team_id: int):
    """Get team's current squad."""
    client = get_fotmob_client()
    squad = await client.get_team_squad(team_id)
    
    if squad is None:
        raise HTTPException(status_code=404, detail=f"Squad not found for team {team_id}")
    
    return {
        "team_id": team_id,
        "squad": squad
    }


@router.get("/{team_id}/form")
async def get_team_form(
    team_id: int,
    matches: int = Query(default=5, ge=1, le=10)
):
    """Get team's recent form (W/D/L)."""
    client = get_fotmob_client()
    form = await client.get_team_form(team_id, matches)
    
    # Calculate form points
    points = sum(3 if r == 'W' else (1 if r == 'D' else 0) for r in form)
    
    return {
        "team_id": team_id,
        "form": form,
        "matches": len(form),
        "points": points,
        "max_points": len(form) * 3,
        "form_string": "".join(form)
    }


@router.get("/{team_id}/injuries")
async def get_team_injuries(team_id: int):
    """Get team's current injuries and suspensions."""
    client = get_fotmob_client()
    injuries = await client.get_team_injuries(team_id)
    
    if injuries is None:
        injuries = []
    
    return {
        "team_id": team_id,
        "injuries": injuries,
        "count": len(injuries)
    }


@router.get("/ratings/rankings")
async def get_team_rankings(top: int = Query(default=50, ge=1, le=200)):
    """Get team rankings by ELO rating."""
    elo = get_elo_system()
    rankings = elo.get_rankings(top)
    
    return {
        "rankings": rankings,
        "count": len(rankings)
    }


@router.get("/ratings/{team_name}")
async def get_team_rating(team_name: str):
    """Get a team's ELO rating."""
    elo = get_elo_system()
    rating_data = elo.get_rating(team_name)
    
    return {
        "team": team_name,
        **rating_data
    }
