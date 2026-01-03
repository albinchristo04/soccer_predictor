"""
Match-related API endpoints.
"""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query

from backend.services.fotmob import get_fotmob_client
from backend.models.match import MatchSummary, Match, MatchDay, MatchStatus

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/today", response_model=dict)
async def get_today_matches():
    """Get all matches for today."""
    client = get_fotmob_client()
    today = datetime.now().strftime("%Y%m%d")
    
    data = await client.get_matches_by_date(today)
    
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch matches from FotMob")
    
    return data


@router.get("/date/{date}")
async def get_matches_by_date(date: str):
    """
    Get all matches for a specific date.
    
    Args:
        date: Date in YYYYMMDD format
    """
    if len(date) != 8 or not date.isdigit():
        raise HTTPException(status_code=400, detail="Date must be in YYYYMMDD format")
    
    client = get_fotmob_client()
    data = await client.get_matches_by_date(date)
    
    if not data:
        raise HTTPException(status_code=502, detail="Failed to fetch matches")
    
    return data


@router.get("/live")
async def get_live_matches():
    """Get all currently live matches."""
    client = get_fotmob_client()
    matches = await client.get_live_matches()
    
    return {
        "count": len(matches),
        "matches": matches
    }


@router.get("/upcoming")
async def get_upcoming_matches(days: int = Query(default=7, ge=1, le=30)):
    """Get upcoming matches for the next N days."""
    client = get_fotmob_client()
    matches = await client.get_upcoming_matches(days)
    
    # Group by date
    by_date = {}
    for match in matches:
        date = match.get("date", "unknown")
        if date not in by_date:
            by_date[date] = []
        by_date[date].append(match)
    
    return {
        "days": days,
        "total_matches": len(matches),
        "matches_by_date": by_date
    }


@router.get("/{match_id}")
async def get_match_details(match_id: int):
    """
    Get detailed information about a specific match.
    
    Includes:
    - Match header (teams, score, status)
    - Events (goals, cards, substitutions)
    - Lineups and formations
    - Match statistics
    - Head-to-head history
    """
    client = get_fotmob_client()
    data = await client.get_match_details(match_id)
    
    if not data:
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")
    
    return data


@router.get("/{match_id}/events")
async def get_match_events(match_id: int):
    """Get match events (goals, cards, substitutions)."""
    client = get_fotmob_client()
    data = await client.get_match_details(match_id)
    
    if not data:
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")
    
    events = data.get("content", {}).get("matchFacts", {}).get("events", {})
    
    return {
        "match_id": match_id,
        "events": events
    }


@router.get("/{match_id}/lineups")
async def get_match_lineups(match_id: int):
    """Get match lineups and formations."""
    client = get_fotmob_client()
    data = await client.get_match_details(match_id)
    
    if not data:
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")
    
    lineups = data.get("content", {}).get("lineup", {})
    
    return {
        "match_id": match_id,
        "lineups": lineups
    }


@router.get("/{match_id}/stats")
async def get_match_stats(match_id: int):
    """Get match statistics."""
    client = get_fotmob_client()
    data = await client.get_match_details(match_id)
    
    if not data:
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")
    
    stats = data.get("content", {}).get("stats", {})
    
    return {
        "match_id": match_id,
        "stats": stats
    }


@router.get("/{match_id}/h2h")
async def get_match_h2h(match_id: int):
    """Get head-to-head history for a match."""
    client = get_fotmob_client()
    data = await client.get_h2h(match_id)
    
    if not data:
        raise HTTPException(status_code=404, detail=f"H2H data not found for match {match_id}")
    
    return {
        "match_id": match_id,
        "h2h": data
    }
