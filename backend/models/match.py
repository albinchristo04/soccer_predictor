"""
Pydantic models for match-related data.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum


class MatchStatus(str, Enum):
    """Match status enumeration."""
    NOT_STARTED = "not_started"
    FIRST_HALF = "first_half"
    HALF_TIME = "half_time"
    SECOND_HALF = "second_half"
    EXTRA_TIME = "extra_time"
    PENALTIES = "penalties"
    FINISHED = "finished"
    POSTPONED = "postponed"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"


class TeamInfo(BaseModel):
    """Basic team information for a match."""
    id: int
    name: str
    short_name: Optional[str] = None
    logo_url: Optional[str] = None
    score: Optional[int] = None


class LeagueInfo(BaseModel):
    """Basic league information."""
    id: int
    name: str
    country: Optional[str] = None
    country_code: Optional[str] = None
    logo_url: Optional[str] = None


class MatchEvent(BaseModel):
    """A single match event (goal, card, substitution)."""
    id: Optional[str] = None
    type: str  # 'goal', 'yellow_card', 'red_card', 'substitution', 'var'
    minute: int
    added_time: Optional[int] = None
    team_id: int
    player_id: Optional[int] = None
    player_name: Optional[str] = None
    assist_player_id: Optional[int] = None
    assist_player_name: Optional[str] = None
    is_own_goal: bool = False
    is_penalty: bool = False
    # For substitutions
    player_in_id: Optional[int] = None
    player_in_name: Optional[str] = None
    player_out_id: Optional[int] = None
    player_out_name: Optional[str] = None


class PlayerLineup(BaseModel):
    """Player in a lineup."""
    id: int
    name: str
    shirt_number: Optional[int] = None
    position: Optional[str] = None
    position_row: Optional[int] = None
    position_col: Optional[int] = None
    is_captain: bool = False
    rating: Optional[float] = None


class TeamLineup(BaseModel):
    """Team lineup information."""
    formation: Optional[str] = None
    starting_xi: List[PlayerLineup] = []
    substitutes: List[PlayerLineup] = []
    coach: Optional[str] = None


class MatchStats(BaseModel):
    """Match statistics."""
    possession: Optional[tuple[int, int]] = None  # home, away
    shots: Optional[tuple[int, int]] = None
    shots_on_target: Optional[tuple[int, int]] = None
    corners: Optional[tuple[int, int]] = None
    fouls: Optional[tuple[int, int]] = None
    offsides: Optional[tuple[int, int]] = None
    yellow_cards: Optional[tuple[int, int]] = None
    red_cards: Optional[tuple[int, int]] = None
    passes: Optional[tuple[int, int]] = None
    pass_accuracy: Optional[tuple[float, float]] = None
    expected_goals: Optional[tuple[float, float]] = None


class H2HMatch(BaseModel):
    """Head-to-head historical match."""
    match_id: int
    date: datetime
    home_team: str
    away_team: str
    home_score: int
    away_score: int
    competition: Optional[str] = None


class HeadToHead(BaseModel):
    """Head-to-head summary between two teams."""
    total_matches: int
    home_wins: int
    draws: int
    away_wins: int
    home_goals: int
    away_goals: int
    recent_matches: List[H2HMatch] = []


class Match(BaseModel):
    """Complete match information."""
    id: int
    home_team: TeamInfo
    away_team: TeamInfo
    league: LeagueInfo
    kickoff_time: datetime
    status: MatchStatus = MatchStatus.NOT_STARTED
    minute: Optional[int] = None
    added_time: Optional[int] = None
    
    # Scores
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    home_score_ht: Optional[int] = None
    away_score_ht: Optional[int] = None
    
    # Venue
    venue: Optional[str] = None
    attendance: Optional[int] = None
    referee: Optional[str] = None
    
    # Detailed data (optional, loaded on demand)
    events: Optional[List[MatchEvent]] = None
    lineups: Optional[Dict[str, TeamLineup]] = None
    stats: Optional[MatchStats] = None
    h2h: Optional[HeadToHead] = None


class MatchSummary(BaseModel):
    """Lightweight match summary for lists."""
    id: int
    home_team: TeamInfo
    away_team: TeamInfo
    league: LeagueInfo
    kickoff_time: datetime
    status: MatchStatus
    minute: Optional[int] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None


class LiveMatchUpdate(BaseModel):
    """Real-time match update."""
    match_id: int
    home_score: int
    away_score: int
    minute: int
    status: MatchStatus
    last_event: Optional[MatchEvent] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class MatchDay(BaseModel):
    """All matches for a specific date."""
    date: str
    matches_by_league: Dict[str, List[MatchSummary]]
    total_matches: int
    live_matches: int
    finished_matches: int
    upcoming_matches: int
