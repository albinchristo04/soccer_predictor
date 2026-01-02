"""
FotMob API integration service for real-time soccer data.

This module provides functions to fetch live match data, results, 
team statistics, and recent form from the FotMob API.

Based on: https://www.fotmob.com/api
Reference: https://medium.com/@lmirandam07/fotmob-fixtures-data-extraction-with-python-f1ee03d2dfe
"""

import requests
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from functools import lru_cache
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FotMob API base URL
BASE_URL = "https://www.fotmob.com/api"

# League ID mapping (FotMob uses specific IDs)
LEAGUE_IDS = {
    "premier_league": 47,
    "la_liga": 87,
    "bundesliga": 54,
    "serie_a": 55,
    "ligue_1": 53,
    "mls": 130,
    "ucl": 42,  # Champions League
    "uel": 73,  # Europa League
    "world_cup": 77,
}

# Reverse mapping for display names
LEAGUE_NAMES = {
    47: "Premier League",
    87: "La Liga", 
    54: "Bundesliga",
    55: "Serie A",
    53: "Ligue 1",
    130: "MLS",
    42: "Champions League",
    73: "Europa League",
    77: "World Cup",
}

# Session for connection pooling
_session = None

def get_session() -> requests.Session:
    """Get or create a requests session for connection pooling."""
    global _session
    if _session is None:
        _session = requests.Session()
        _session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
        })
    return _session


def get_current_season() -> str:
    """Get the current season string (e.g., '2025/2026')."""
    now = datetime.now()
    year = now.year
    # If we're in the second half of the year (Aug-Dec), season started this year
    # If we're in the first half (Jan-Jul), season started last year
    if now.month >= 8:
        return f"{year}/{year + 1}"
    else:
        return f"{year - 1}/{year}"


def fetch_league_matches(league: str, season: Optional[str] = None) -> Tuple[Optional[Dict], Optional[List[Dict]]]:
    """
    Fetch league details and matches from the FotMob API.
    
    Args:
        league: Internal league name (e.g., 'premier_league')
        season: Season string (e.g., '2025/2026'). Defaults to current season.
    
    Returns:
        Tuple of (league_details, matches) or (None, None) on error
    """
    league_id = LEAGUE_IDS.get(league)
    if not league_id:
        logger.error(f"Unknown league: {league}")
        return None, None
    
    if season is None:
        season = get_current_season()
    
    url = f"{BASE_URL}/leagues"
    params = {"id": league_id, "season": season}
    
    try:
        session = get_session()
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        details = data.get("details", {})
        matches = data.get("matches", {}).get("allMatches", [])
        
        return details, matches
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching league {league}: {e}")
        return None, None
    except Exception as e:
        logger.error(f"Unexpected error fetching league {league}: {e}")
        return None, None


def fetch_matches_by_date(date_str: str) -> Optional[List[Dict]]:
    """
    Fetch all matches for a specific date.
    
    Args:
        date_str: Date string in YYYYMMDD format
    
    Returns:
        List of match dictionaries or None on error
    """
    url = f"{BASE_URL}/matches"
    params = {"date": date_str}
    
    try:
        session = get_session()
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return data.get("leagues", [])
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching matches for date {date_str}: {e}")
        return None


def fetch_team_data(team_id: int) -> Optional[Dict]:
    """
    Fetch detailed team data including recent form.
    
    Args:
        team_id: FotMob team ID
    
    Returns:
        Team data dictionary or None on error
    """
    url = f"{BASE_URL}/teams"
    params = {"id": team_id}
    
    try:
        session = get_session()
        response = session.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching team {team_id}: {e}")
        return None


def extract_match_data(match: Dict) -> Dict[str, Any]:
    """
    Extract relevant data from a FotMob match object.
    
    Args:
        match: Raw match dictionary from FotMob API
    
    Returns:
        Cleaned match data dictionary
    """
    status = match.get("status", {})
    home = match.get("home", {})
    away = match.get("away", {})
    
    # Determine match status
    finished = status.get("finished", False)
    cancelled = status.get("cancelled", False)
    started = status.get("started", False)
    
    if cancelled:
        match_status = "cancelled"
    elif finished:
        match_status = "played"
    elif started:
        match_status = "live"
    else:
        match_status = "scheduled"
    
    # Parse score
    score_str = status.get("scoreStr", "")
    home_goals = None
    away_goals = None
    if score_str and "-" in score_str:
        try:
            parts = score_str.split("-")
            home_goals = int(parts[0].strip())
            away_goals = int(parts[1].strip())
        except (ValueError, IndexError):
            pass
    
    return {
        "match_id": match.get("id"),
        "date": status.get("utcTime"),
        "home_team": home.get("name"),
        "home_team_id": home.get("id"),
        "away_team": away.get("name"),
        "away_team_id": away.get("id"),
        "home_goals": home_goals,
        "away_goals": away_goals,
        "status": match_status,
        "round": match.get("round"),
        "score_str": score_str,
    }


def get_live_matches(league: str) -> List[Dict[str, Any]]:
    """
    Get all matches for a league in the current season.
    
    Args:
        league: Internal league name
    
    Returns:
        List of match dictionaries
    """
    details, matches = fetch_league_matches(league)
    
    if not matches:
        return []
    
    extracted = []
    for match in matches:
        try:
            match_data = extract_match_data(match)
            if match_data["home_team"] and match_data["away_team"]:
                extracted.append(match_data)
        except Exception as e:
            logger.warning(f"Error extracting match data: {e}")
            continue
    
    return extracted


def get_upcoming_fixtures(league: str, days_ahead: int = 14) -> List[Dict[str, Any]]:
    """
    Get upcoming fixtures for a league.
    
    Args:
        league: Internal league name
        days_ahead: Number of days to look ahead (default 14)
    
    Returns:
        List of upcoming match dictionaries
    """
    matches = get_live_matches(league)
    
    now = datetime.utcnow()
    cutoff = now + timedelta(days=days_ahead)
    
    upcoming = []
    for match in matches:
        if match["status"] in ["scheduled", "live"]:
            try:
                match_date = datetime.fromisoformat(match["date"].replace("Z", "+00:00"))
                if match_date <= cutoff:
                    upcoming.append(match)
            except (ValueError, TypeError):
                # Include if we can't parse the date
                upcoming.append(match)
    
    # Sort by date
    upcoming.sort(key=lambda x: x.get("date", ""))
    return upcoming


def get_recent_results(league: str, days_back: int = 14) -> List[Dict[str, Any]]:
    """
    Get recent results for a league.
    
    Args:
        league: Internal league name
        days_back: Number of days to look back (default 14)
    
    Returns:
        List of recent result dictionaries
    """
    matches = get_live_matches(league)
    
    now = datetime.utcnow()
    cutoff = now - timedelta(days=days_back)
    
    results = []
    for match in matches:
        if match["status"] == "played":
            try:
                match_date = datetime.fromisoformat(match["date"].replace("Z", "+00:00"))
                if match_date >= cutoff:
                    results.append(match)
            except (ValueError, TypeError):
                # Include if we can't parse the date
                results.append(match)
    
    # Sort by date descending (most recent first)
    results.sort(key=lambda x: x.get("date", ""), reverse=True)
    return results


def get_all_matches_for_display(league: str, days_range: int = 30) -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all matches (past and upcoming) for display on the matches page.
    
    Args:
        league: Internal league name
        days_range: Number of days before and after today to include
    
    Returns:
        Dictionary with 'results' and 'upcoming' lists
    """
    matches = get_live_matches(league)
    
    now = datetime.utcnow()
    past_cutoff = now - timedelta(days=days_range)
    future_cutoff = now + timedelta(days=days_range)
    
    results = []
    upcoming = []
    live = []
    
    for match in matches:
        try:
            match_date = datetime.fromisoformat(match["date"].replace("Z", "+00:00"))
            
            if match["status"] == "live":
                live.append(match)
            elif match["status"] == "played" and match_date >= past_cutoff:
                results.append(match)
            elif match["status"] == "scheduled" and match_date <= future_cutoff:
                upcoming.append(match)
        except (ValueError, TypeError):
            # Include based on status if date parsing fails
            if match["status"] == "played":
                results.append(match)
            elif match["status"] == "scheduled":
                upcoming.append(match)
            elif match["status"] == "live":
                live.append(match)
    
    # Sort results by date descending, upcoming by date ascending
    results.sort(key=lambda x: x.get("date", ""), reverse=True)
    upcoming.sort(key=lambda x: x.get("date", ""))
    
    return {
        "results": results,
        "upcoming": upcoming,
        "live": live,
    }


def get_team_form(team_name: str, league: str, num_matches: int = 5) -> List[str]:
    """
    Get recent form for a team (W/D/L for last N matches).
    
    Args:
        team_name: Team name to search for
        league: League to search in
        num_matches: Number of recent matches to include
    
    Returns:
        List of result strings (e.g., ['W', 'D', 'L', 'W', 'W'])
    """
    matches = get_live_matches(league)
    
    # Filter to completed matches involving this team
    team_lower = team_name.lower()
    team_matches = []
    
    for match in matches:
        if match["status"] != "played":
            continue
        
        home = match.get("home_team", "").lower()
        away = match.get("away_team", "").lower()
        
        if team_lower in home or team_lower in away:
            is_home = team_lower in home
            home_goals = match.get("home_goals", 0) or 0
            away_goals = match.get("away_goals", 0) or 0
            
            if is_home:
                if home_goals > away_goals:
                    result = "W"
                elif home_goals < away_goals:
                    result = "L"
                else:
                    result = "D"
            else:
                if away_goals > home_goals:
                    result = "W"
                elif away_goals < home_goals:
                    result = "L"
                else:
                    result = "D"
            
            team_matches.append({
                "date": match.get("date", ""),
                "result": result
            })
    
    # Sort by date descending and take last N
    team_matches.sort(key=lambda x: x.get("date", ""), reverse=True)
    return [m["result"] for m in team_matches[:num_matches]]


def get_team_season_stats(team_name: str, league: str) -> Dict[str, Any]:
    """
    Calculate season statistics for a team from FotMob data.
    
    Args:
        team_name: Team name
        league: League name
    
    Returns:
        Dictionary with team statistics
    """
    matches = get_live_matches(league)
    team_lower = team_name.lower()
    
    stats = {
        "matches_played": 0,
        "wins": 0,
        "draws": 0,
        "losses": 0,
        "goals_scored": 0,
        "goals_conceded": 0,
        "home_wins": 0,
        "home_matches": 0,
        "away_wins": 0,
        "away_matches": 0,
        "recent_form": [],
    }
    
    team_matches = []
    
    for match in matches:
        if match["status"] != "played":
            continue
        
        home = match.get("home_team", "").lower()
        away = match.get("away_team", "").lower()
        home_goals = match.get("home_goals", 0) or 0
        away_goals = match.get("away_goals", 0) or 0
        
        is_home = team_lower in home
        is_away = team_lower in away
        
        if not is_home and not is_away:
            continue
        
        stats["matches_played"] += 1
        
        if is_home:
            stats["home_matches"] += 1
            stats["goals_scored"] += home_goals
            stats["goals_conceded"] += away_goals
            
            if home_goals > away_goals:
                stats["wins"] += 1
                stats["home_wins"] += 1
                result = "W"
            elif home_goals < away_goals:
                stats["losses"] += 1
                result = "L"
            else:
                stats["draws"] += 1
                result = "D"
        else:
            stats["away_matches"] += 1
            stats["goals_scored"] += away_goals
            stats["goals_conceded"] += home_goals
            
            if away_goals > home_goals:
                stats["wins"] += 1
                stats["away_wins"] += 1
                result = "W"
            elif away_goals < home_goals:
                stats["losses"] += 1
                result = "L"
            else:
                stats["draws"] += 1
                result = "D"
        
        team_matches.append({
            "date": match.get("date", ""),
            "result": result
        })
    
    # Calculate derived stats
    if stats["matches_played"] > 0:
        stats["win_rate"] = stats["wins"] / stats["matches_played"]
        stats["avg_goals_scored"] = stats["goals_scored"] / stats["matches_played"]
        stats["avg_goals_conceded"] = stats["goals_conceded"] / stats["matches_played"]
    else:
        stats["win_rate"] = 0
        stats["avg_goals_scored"] = 0
        stats["avg_goals_conceded"] = 0
    
    if stats["home_matches"] > 0:
        stats["home_win_rate"] = stats["home_wins"] / stats["home_matches"]
    else:
        stats["home_win_rate"] = 0
    
    if stats["away_matches"] > 0:
        stats["away_win_rate"] = stats["away_wins"] / stats["away_matches"]
    else:
        stats["away_win_rate"] = 0
    
    # Get recent form (last 5 matches)
    team_matches.sort(key=lambda x: x.get("date", ""), reverse=True)
    stats["recent_form"] = [m["result"] for m in team_matches[:5]]
    
    return stats


# Cache for league matches (expires after 5 minutes)
_match_cache: Dict[str, Tuple[float, List[Dict]]] = {}
CACHE_TTL = 300  # 5 minutes

def get_cached_matches(league: str) -> List[Dict[str, Any]]:
    """
    Get matches with caching to avoid excessive API calls.
    
    Args:
        league: Internal league name
    
    Returns:
        List of match dictionaries
    """
    now = time.time()
    
    if league in _match_cache:
        cached_time, cached_data = _match_cache[league]
        if now - cached_time < CACHE_TTL:
            return cached_data
    
    matches = get_live_matches(league)
    _match_cache[league] = (now, matches)
    return matches


def clear_cache():
    """Clear the match cache."""
    global _match_cache
    _match_cache = {}


# Fallback function if FotMob API is unavailable
def is_api_available() -> bool:
    """Check if the FotMob API is available."""
    try:
        session = get_session()
        response = session.get(f"{BASE_URL}/matches", params={"date": "20260101"}, timeout=5)
        return response.status_code == 200
    except:
        return False
