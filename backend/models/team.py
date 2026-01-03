"""
Pydantic models for team-related data.
"""

from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class TeamOverview(BaseModel):
    """Basic team overview."""
    id: int
    name: str
    short_name: Optional[str] = None
    logo_url: Optional[str] = None
    country: Optional[str] = None
    founded: Optional[int] = None
    stadium: Optional[str] = None
    stadium_capacity: Optional[int] = None
    manager: Optional[str] = None


class TeamColors(BaseModel):
    """Team kit colors."""
    primary: Optional[str] = None
    secondary: Optional[str] = None


class PlayerBasic(BaseModel):
    """Basic player information."""
    id: int
    name: str
    shirt_number: Optional[int] = None
    position: Optional[str] = None
    nationality: Optional[str] = None
    age: Optional[int] = None
    photo_url: Optional[str] = None
    is_injured: bool = False
    injury_info: Optional[str] = None


class TeamSquad(BaseModel):
    """Team squad grouped by position."""
    goalkeepers: List[PlayerBasic] = []
    defenders: List[PlayerBasic] = []
    midfielders: List[PlayerBasic] = []
    forwards: List[PlayerBasic] = []


class TeamSeasonStats(BaseModel):
    """Team statistics for a season."""
    matches_played: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0
    goals_scored: int = 0
    goals_conceded: int = 0
    goal_difference: int = 0
    points: int = 0
    clean_sheets: int = 0
    
    # Averages
    goals_per_game: float = 0.0
    conceded_per_game: float = 0.0
    points_per_game: float = 0.0
    
    # Home/Away splits
    home_wins: int = 0
    home_draws: int = 0
    home_losses: int = 0
    away_wins: int = 0
    away_draws: int = 0
    away_losses: int = 0


class TeamForm(BaseModel):
    """Team recent form."""
    last_5: List[str] = []  # ['W', 'D', 'L', 'W', 'W']
    last_5_points: int = 0
    last_10: List[str] = []
    last_10_points: int = 0
    unbeaten_run: int = 0
    winning_run: int = 0
    losing_run: int = 0


class TeamRating(BaseModel):
    """Team rating information."""
    elo_rating: float
    elo_rank: Optional[int] = None
    attack_rating: float
    defense_rating: float
    form_rating: float
    overall_rating: float
    rating_change_last_match: float = 0.0
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TeamFixture(BaseModel):
    """A team's fixture."""
    match_id: int
    date: datetime
    opponent_id: int
    opponent_name: str
    opponent_logo: Optional[str] = None
    is_home: bool
    competition: str
    status: str  # 'upcoming', 'live', 'finished'
    score: Optional[str] = None  # "2-1"
    result: Optional[str] = None  # "W", "D", "L"


class Team(BaseModel):
    """Complete team information."""
    overview: TeamOverview
    squad: Optional[TeamSquad] = None
    stats: Optional[TeamSeasonStats] = None
    form: Optional[TeamForm] = None
    rating: Optional[TeamRating] = None
    fixtures: Optional[List[TeamFixture]] = None
    
    # League position
    league_id: Optional[int] = None
    league_name: Optional[str] = None
    position: Optional[int] = None
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class StandingsRow(BaseModel):
    """A row in the league standings."""
    position: int
    team_id: int
    team_name: str
    team_logo: Optional[str] = None
    played: int
    won: int
    drawn: int
    lost: int
    goals_for: int
    goals_against: int
    goal_difference: int
    points: int
    form: List[str] = []  # Last 5 results
    next_match: Optional[str] = None


class LeagueStandings(BaseModel):
    """Complete league standings."""
    league_id: int
    league_name: str
    season: str
    standings: List[StandingsRow]
    updated_at: datetime = Field(default_factory=datetime.utcnow)
