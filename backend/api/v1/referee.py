"""
Referee statistics API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from backend.services.referee import get_referee_service

router = APIRouter(prefix="/referees", tags=["referees"])


@router.get("/")
async def list_referees(league: Optional[str] = None):
    """
    List available referees.
    
    Args:
        league: Optional league filter (premier_league, la_liga, etc.)
    """
    referee_service = get_referee_service()
    referees = referee_service.list_available_referees(league)
    
    return {
        "count": len(referees),
        "referees": referees,
        "league": league,
    }


@router.get("/{referee_name}")
async def get_referee_stats(referee_name: str):
    """
    Get statistics for a specific referee.
    
    Returns career statistics including cards per game, penalties, etc.
    """
    referee_service = get_referee_service()
    referee = referee_service.get_referee_by_name(referee_name)
    
    if not referee:
        raise HTTPException(
            status_code=404,
            detail=f"Referee '{referee_name}' not found"
        )
    
    return referee.to_dict()


@router.get("/match-data/{referee_name}")
async def get_match_referee_data(
    referee_name: str,
    home_team: str = Query(..., description="Home team name"),
    away_team: str = Query(..., description="Away team name"),
):
    """
    Get complete referee data for a match.
    
    Includes referee statistics and both teams' historical performance
    with the referee.
    """
    referee_service = get_referee_service()
    referee = await referee_service.get_match_referee_data(
        referee_name, home_team, away_team
    )
    
    if not referee:
        raise HTTPException(
            status_code=404,
            detail=f"Referee '{referee_name}' not found"
        )
    
    return referee.to_dict()


@router.get("/impact/{referee_name}")
async def get_referee_impact(
    referee_name: str,
    home_team: str = Query(..., description="Home team name"),
    away_team: str = Query(..., description="Away team name"),
):
    """
    Get referee impact analysis for a match.
    
    Returns prediction adjustments based on referee tendencies
    and team histories with this referee.
    """
    referee_service = get_referee_service()
    referee = await referee_service.get_match_referee_data(
        referee_name, home_team, away_team
    )
    
    if not referee:
        raise HTTPException(
            status_code=404,
            detail=f"Referee '{referee_name}' not found"
        )
    
    adjustments = referee_service.calculate_referee_adjustment(
        referee, home_team, away_team
    )
    
    return {
        "referee": referee.to_dict(),
        "adjustments": adjustments,
        "summary": _generate_referee_summary(referee, adjustments),
    }


def _generate_referee_summary(referee, adjustments) -> str:
    """Generate a human-readable summary of referee impact."""
    parts = []
    
    stats = referee.statistics
    if stats.strictness_rating > 0.7:
        parts.append(f"{referee.name} is a strict referee (avg {stats.yellow_cards_per_game:.1f} yellows/game)")
    elif stats.strictness_rating < 0.5:
        parts.append(f"{referee.name} is lenient (avg {stats.yellow_cards_per_game:.1f} yellows/game)")
    
    if stats.penalties_per_game > 0.3:
        parts.append(f"tends to award more penalties ({stats.penalties_per_game:.2f}/game)")
    
    if stats.home_win_rate > 0.48:
        parts.append("slight tendency to favor home teams")
    elif stats.home_win_rate < 0.42:
        parts.append("no significant home bias")
    
    if referee.home_team_history and referee.home_team_history.win_rate > 0.55:
        parts.append(f"home team has good record with this referee ({referee.home_team_history.win_rate:.0%} win rate)")
    
    if referee.away_team_history and referee.away_team_history.win_rate > 0.5:
        parts.append(f"away team has favorable history ({referee.away_team_history.win_rate:.0%} win rate)")
    
    return ". ".join(parts) if parts else "Standard referee assignment expected"
