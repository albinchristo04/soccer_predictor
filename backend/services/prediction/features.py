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
    
    # News/Sentiment factors (NEW)
    home_news_sentiment: float  # -1 to 1
    away_news_sentiment: float  # -1 to 1
    home_news_factor: float  # Adjusted factor for prediction
    away_news_factor: float
    
    # Player form factors (NEW)
    home_player_form: float  # 0-1, aggregate player form
    away_player_form: float
    home_key_player_available: float  # 0-1, key players availability
    away_key_player_available: float
    
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
            self.home_news_sentiment,
            self.away_news_sentiment,
            self.home_news_factor,
            self.away_news_factor,
            self.home_player_form,
            self.away_player_form,
            self.home_key_player_available,
            self.away_key_player_available,
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
            "home_news_sentiment",
            "away_news_sentiment",
            "home_news_factor",
            "away_news_factor",
            "home_player_form",
            "away_player_form",
            "home_key_player_available",
            "away_key_player_available",
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


def calculate_weighted_form_points(results: List[str]) -> float:
    """
    Calculate weighted form points with recency bias.
    
    More recent matches have higher weight.
    """
    if not results:
        return 0.0
    
    # Weights: most recent = 1.0, decreasing
    weights = [1.0, 0.85, 0.7, 0.55, 0.4]
    total_weight = 0.0
    weighted_points = 0.0
    
    for i, result in enumerate(results[:5]):
        weight = weights[i] if i < len(weights) else 0.3
        total_weight += weight
        
        if result.upper() == 'W':
            weighted_points += 3 * weight
        elif result.upper() == 'D':
            weighted_points += 1 * weight
    
    if total_weight == 0:
        return 0.0
    
    # Normalize to 0-15 scale like regular form points
    return (weighted_points / total_weight) * 5


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


def calculate_player_form(
    squad_data: Optional[Dict] = None,
    recent_stats: Optional[Dict] = None
) -> float:
    """
    Calculate aggregate player form score (0-1).
    
    Uses recent match ratings and statistics.
    """
    if not squad_data and not recent_stats:
        return 0.5  # Neutral default
    
    # If we have recent stats, use average player rating
    if recent_stats:
        avg_rating = recent_stats.get("avg_player_rating", 6.5)
        # Convert 1-10 rating to 0-1 scale
        return min(1.0, max(0.0, (avg_rating - 5) / 5))
    
    return 0.5


def calculate_key_player_availability(
    injuries: List[Dict],
    squad_data: Optional[Dict] = None
) -> float:
    """
    Calculate availability of key players (0-1).
    
    1.0 = all key players available
    0.0 = all key players injured/suspended
    """
    if not injuries:
        return 1.0
    
    # Count high-importance injuries
    key_player_count = 0
    for injury in injuries:
        importance = injury.get('importance_score', 0.5)
        if importance >= 0.7:  # Key player threshold
            key_player_count += 1
    
    # Assume 3 key players missing = 0 availability
    return max(0.0, 1.0 - (key_player_count / 3.0))


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
    match_context: Optional[Dict] = None,
    news_factors: Optional[Dict] = None,
) -> MatchFeatures:
    """
    Build complete feature set for a match prediction.
    
    Args:
        home_team_data: Home team statistics and info
        away_team_data: Away team statistics and info
        h2h_data: Head-to-head history
        match_context: Additional context (positions, matchday, etc.)
        news_factors: News sentiment factors from ESPN service
    
    Returns:
        MatchFeatures instance
    """
    # Default values
    h2h = h2h_data or {}
    context = match_context or {}
    news = news_factors or {}
    
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
        
        # News/Sentiment factors (NEW)
        home_news_sentiment=news.get('home_sentiment', {}).get('score', 0.0),
        away_news_sentiment=news.get('away_sentiment', {}).get('score', 0.0),
        home_news_factor=news.get('home_news_factor', 0.0),
        away_news_factor=news.get('away_news_factor', 0.0),
        
        # Player form factors (NEW)
        home_player_form=calculate_player_form(
            home_team_data.get('squad'),
            home_team_data.get('recent_stats')
        ),
        away_player_form=calculate_player_form(
            away_team_data.get('squad'),
            away_team_data.get('recent_stats')
        ),
        home_key_player_available=calculate_key_player_availability(home_injuries),
        away_key_player_available=calculate_key_player_availability(away_injuries),
    )
