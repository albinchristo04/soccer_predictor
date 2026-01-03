"""
Feature engineering for match predictions.
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass


@dataclass
class MatchFeatures:
    """All features for a match prediction."""
    # Team ratings
    home_elo: float
    away_elo: float
    elo_diff: float
    
    # Form features
    home_form_points: int  # Points in last 5 (max 15)
    away_form_points: int
    home_form_goals_scored: float
    away_form_goals_scored: float
    home_form_goals_conceded: float
    away_form_goals_conceded: float
    
    # Season stats
    home_ppg: float  # Points per game
    away_ppg: float
    home_goals_per_game: float
    away_goals_per_game: float
    home_conceded_per_game: float
    away_conceded_per_game: float
    home_clean_sheet_pct: float
    away_clean_sheet_pct: float
    
    # Home/Away specific
    home_home_win_pct: float
    away_away_win_pct: float
    home_home_goals_avg: float
    away_away_goals_avg: float
    
    # Head-to-head
    h2h_home_wins: int
    h2h_draws: int
    h2h_away_wins: int
    h2h_home_goals_avg: float
    h2h_away_goals_avg: float
    
    # External factors
    home_rest_days: int
    away_rest_days: int
    home_injuries_impact: float  # 0-1, higher = more key players out
    away_injuries_impact: float
    
    # Match context
    league_position_diff: int  # Positive = home team higher
    is_derby: bool
    match_importance: float  # 0-1
    
    def to_array(self) -> np.ndarray:
        """Convert to numpy array for model input."""
        return np.array([
            self.home_elo,
            self.away_elo,
            self.elo_diff,
            self.home_form_points,
            self.away_form_points,
            self.home_form_goals_scored,
            self.away_form_goals_scored,
            self.home_form_goals_conceded,
            self.away_form_goals_conceded,
            self.home_ppg,
            self.away_ppg,
            self.home_goals_per_game,
            self.away_goals_per_game,
            self.home_conceded_per_game,
            self.away_conceded_per_game,
            self.home_clean_sheet_pct,
            self.away_clean_sheet_pct,
            self.home_home_win_pct,
            self.away_away_win_pct,
            self.home_home_goals_avg,
            self.away_away_goals_avg,
            self.h2h_home_wins,
            self.h2h_draws,
            self.h2h_away_wins,
            self.h2h_home_goals_avg,
            self.h2h_away_goals_avg,
            self.home_rest_days,
            self.away_rest_days,
            self.home_injuries_impact,
            self.away_injuries_impact,
            self.league_position_diff,
            float(self.is_derby),
            self.match_importance,
        ])
    
    @classmethod
    def feature_names(cls) -> List[str]:
        """Get list of feature names."""
        return [
            "home_elo",
            "away_elo",
            "elo_diff",
            "home_form_points",
            "away_form_points",
            "home_form_goals_scored",
            "away_form_goals_scored",
            "home_form_goals_conceded",
            "away_form_goals_conceded",
            "home_ppg",
            "away_ppg",
            "home_goals_per_game",
            "away_goals_per_game",
            "home_conceded_per_game",
            "away_conceded_per_game",
            "home_clean_sheet_pct",
            "away_clean_sheet_pct",
            "home_home_win_pct",
            "away_away_win_pct",
            "home_home_goals_avg",
            "away_away_goals_avg",
            "h2h_home_wins",
            "h2h_draws",
            "h2h_away_wins",
            "h2h_home_goals_avg",
            "h2h_away_goals_avg",
            "home_rest_days",
            "away_rest_days",
            "home_injuries_impact",
            "away_injuries_impact",
            "league_position_diff",
            "is_derby",
            "match_importance",
        ]


def calculate_form_points(results: List[str]) -> int:
    """Calculate points from form results (W=3, D=1, L=0)."""
    points = 0
    for result in results[:5]:  # Last 5 only
        if result.upper() == 'W':
            points += 3
        elif result.upper() == 'D':
            points += 1
    return points


def calculate_form_goals(
    matches: List[Dict],
    team_id: int,
    num_matches: int = 5
) -> Tuple[float, float]:
    """Calculate average goals scored and conceded from recent matches."""
    scored = []
    conceded = []
    
    for match in matches[:num_matches]:
        is_home = match.get('home_team_id') == team_id
        home_goals = match.get('home_score', 0)
        away_goals = match.get('away_score', 0)
        
        if is_home:
            scored.append(home_goals)
            conceded.append(away_goals)
        else:
            scored.append(away_goals)
            conceded.append(home_goals)
    
    if not scored:
        return 1.5, 1.5  # Default averages
    
    return sum(scored) / len(scored), sum(conceded) / len(conceded)


def calculate_injury_impact(
    injuries: List[Dict],
    squad_size: int = 25
) -> float:
    """
    Calculate injury impact score (0-1).
    
    Higher = more impact from injuries.
    Considers player importance if available.
    """
    if not injuries:
        return 0.0
    
    total_impact = 0.0
    for injury in injuries:
        importance = injury.get('importance_score', 0.5)
        total_impact += importance
    
    # Normalize: assume 3+ key injuries is maximum impact
    return min(1.0, total_impact / 3.0)


def is_derby_match(
    home_team: str,
    away_team: str,
    derby_pairs: Optional[Dict[str, List[str]]] = None
) -> bool:
    """Check if the match is a derby."""
    if derby_pairs is None:
        # Common derby pairs
        derby_pairs = {
            "Manchester United": ["Manchester City", "Liverpool"],
            "Manchester City": ["Manchester United"],
            "Liverpool": ["Manchester United", "Everton"],
            "Everton": ["Liverpool"],
            "Arsenal": ["Tottenham", "Chelsea"],
            "Tottenham": ["Arsenal", "Chelsea", "West Ham"],
            "Chelsea": ["Arsenal", "Tottenham"],
            "Real Madrid": ["Barcelona", "Atletico Madrid"],
            "Barcelona": ["Real Madrid", "Espanyol"],
            "Atletico Madrid": ["Real Madrid"],
            "AC Milan": ["Inter", "Juventus"],
            "Inter": ["AC Milan", "Juventus"],
            "Juventus": ["Inter", "AC Milan", "Torino"],
            "Bayern Munich": ["Borussia Dortmund"],
            "Borussia Dortmund": ["Bayern Munich", "Schalke 04"],
            "PSG": ["Marseille"],
            "Marseille": ["PSG"],
        }
    
    home_rivals = derby_pairs.get(home_team, [])
    return away_team in home_rivals


def calculate_match_importance(
    home_position: int,
    away_position: int,
    matchday: int,
    total_matchdays: int,
    home_points_from_safety: int = 10,
    away_points_from_safety: int = 10,
) -> float:
    """
    Calculate match importance factor (0-1).
    
    Higher importance for:
    - Late season matches
    - Relegation battles
    - Title deciders
    - Top 4 races
    """
    importance = 0.5  # Base importance
    
    # Season stage factor (higher at end of season)
    season_progress = matchday / total_matchdays
    if season_progress > 0.7:
        importance += 0.2 * (season_progress - 0.7) / 0.3
    
    # Title race (top 2 teams)
    if home_position <= 2 or away_position <= 2:
        importance += 0.15
    
    # Top 4 race
    elif home_position <= 5 or away_position <= 5:
        importance += 0.1
    
    # Relegation battle (bottom 3)
    if home_position >= 18 or away_position >= 18:
        importance += 0.15
    
    # Close to relegation zone
    if home_points_from_safety <= 5 or away_points_from_safety <= 5:
        importance += 0.1
    
    return min(1.0, importance)


def build_features(
    home_team_data: Dict,
    away_team_data: Dict,
    h2h_data: Optional[Dict] = None,
    match_context: Optional[Dict] = None
) -> MatchFeatures:
    """
    Build complete feature set for a match prediction.
    
    Args:
        home_team_data: Home team statistics and info
        away_team_data: Away team statistics and info
        h2h_data: Head-to-head history
        match_context: Additional context (positions, matchday, etc.)
    
    Returns:
        MatchFeatures instance
    """
    # Default values
    h2h = h2h_data or {}
    context = match_context or {}
    
    home_elo = home_team_data.get('elo_rating', 1500)
    away_elo = away_team_data.get('elo_rating', 1500)
    
    home_form = home_team_data.get('form', [])
    away_form = away_team_data.get('form', [])
    
    home_stats = home_team_data.get('season_stats', {})
    away_stats = away_team_data.get('season_stats', {})
    
    home_injuries = home_team_data.get('injuries', [])
    away_injuries = away_team_data.get('injuries', [])
    
    return MatchFeatures(
        # ELO ratings
        home_elo=home_elo,
        away_elo=away_elo,
        elo_diff=home_elo - away_elo,
        
        # Form
        home_form_points=calculate_form_points(home_form),
        away_form_points=calculate_form_points(away_form),
        home_form_goals_scored=home_team_data.get('form_goals_scored', 1.5),
        away_form_goals_scored=away_team_data.get('form_goals_scored', 1.5),
        home_form_goals_conceded=home_team_data.get('form_goals_conceded', 1.0),
        away_form_goals_conceded=away_team_data.get('form_goals_conceded', 1.0),
        
        # Season stats
        home_ppg=home_stats.get('points_per_game', 1.5),
        away_ppg=away_stats.get('points_per_game', 1.5),
        home_goals_per_game=home_stats.get('goals_per_game', 1.5),
        away_goals_per_game=away_stats.get('goals_per_game', 1.5),
        home_conceded_per_game=home_stats.get('conceded_per_game', 1.0),
        away_conceded_per_game=away_stats.get('conceded_per_game', 1.0),
        home_clean_sheet_pct=home_stats.get('clean_sheet_pct', 0.3),
        away_clean_sheet_pct=away_stats.get('clean_sheet_pct', 0.3),
        
        # Home/Away specific
        home_home_win_pct=home_stats.get('home_win_pct', 0.5),
        away_away_win_pct=away_stats.get('away_win_pct', 0.3),
        home_home_goals_avg=home_stats.get('home_goals_avg', 1.8),
        away_away_goals_avg=away_stats.get('away_goals_avg', 1.2),
        
        # H2H
        h2h_home_wins=h2h.get('home_wins', 0),
        h2h_draws=h2h.get('draws', 0),
        h2h_away_wins=h2h.get('away_wins', 0),
        h2h_home_goals_avg=h2h.get('home_goals_avg', 1.5),
        h2h_away_goals_avg=h2h.get('away_goals_avg', 1.0),
        
        # External
        home_rest_days=context.get('home_rest_days', 7),
        away_rest_days=context.get('away_rest_days', 7),
        home_injuries_impact=calculate_injury_impact(home_injuries),
        away_injuries_impact=calculate_injury_impact(away_injuries),
        
        # Context
        league_position_diff=context.get('away_position', 10) - context.get('home_position', 10),
        is_derby=is_derby_match(
            home_team_data.get('name', ''),
            away_team_data.get('name', '')
        ),
        match_importance=context.get('importance', 0.5),
    )
