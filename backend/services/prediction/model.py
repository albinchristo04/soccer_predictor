"""
Main prediction service combining all components.
"""

from typing import Dict, List, Optional
from datetime import datetime
import numpy as np
import logging

from backend.models.prediction import (
    MatchPrediction,
    OutcomeProbabilities,
    GoalsPrediction,
    ScorelinePrediction,
    PredictionFactors,
    ConfidenceBreakdown,
    TeamPredictionContext,
    InjuryInfo,
)
from backend.services.prediction.features import (
    MatchFeatures,
    build_features,
    calculate_form_points,
    calculate_injury_impact,
)
from backend.services.prediction.probabilistic import (
    PoissonModel,
    HybridPredictionModel,
    monte_carlo_simulation,
)

logger = logging.getLogger(__name__)


class PredictionService:
    """
    Main service for generating match predictions.
    
    Combines:
    - ELO-based team ratings
    - Feature engineering from team stats
    - Probabilistic Poisson model for goals
    - ML model for outcome classification (optional)
    """
    
    def __init__(
        self,
        ml_model=None,
        league_avg_goals: float = 1.35,
        home_advantage: float = 0.25,
        model_version: str = "2.0.0"
    ):
        self.ml_model = ml_model
        self.league_avg_goals = league_avg_goals
        self.home_advantage = home_advantage
        self.model_version = model_version
        
        self.poisson = PoissonModel()
        self.hybrid = HybridPredictionModel(
            outcome_model=ml_model,
            poisson_model=self.poisson,
            league_avg_goals=league_avg_goals,
            home_advantage=home_advantage
        )
    
    async def predict_match(
        self,
        match_id: int,
        home_team_data: Dict,
        away_team_data: Dict,
        h2h_data: Optional[Dict] = None,
        match_context: Optional[Dict] = None,
        kickoff_time: Optional[datetime] = None
    ) -> MatchPrediction:
        """
        Generate a complete prediction for a match.
        
        Args:
            match_id: Unique match identifier
            home_team_data: Home team stats, form, injuries, etc.
            away_team_data: Away team stats, form, injuries, etc.
            h2h_data: Head-to-head history
            match_context: Additional context (league positions, importance, etc.)
            kickoff_time: Match kickoff time
        
        Returns:
            Complete MatchPrediction
        """
        # Build features
        features = build_features(
            home_team_data,
            away_team_data,
            h2h_data,
            match_context
        )
        
        # Get core prediction from hybrid model
        prediction = self.hybrid.predict(
            home_elo=features.home_elo,
            away_elo=features.away_elo,
            home_goals_pg=features.home_goals_per_game,
            home_conceded_pg=features.home_conceded_per_game,
            away_goals_pg=features.away_goals_per_game,
            away_conceded_pg=features.away_conceded_per_game,
            features=features.to_array() if self.ml_model else None
        )
        
        # Build outcome probabilities
        outcome = OutcomeProbabilities(
            home_win=prediction["outcome"]["home_win"],
            draw=prediction["outcome"]["draw"],
            away_win=prediction["outcome"]["away_win"],
            confidence=prediction["outcome"]["confidence"]
        )
        
        # Build goals prediction
        goals = GoalsPrediction(
            home_expected_goals=prediction["goals"]["home_xG"],
            away_expected_goals=prediction["goals"]["away_xG"],
            total_expected_goals=prediction["goals"]["total_xG"],
            over_1_5=prediction["goals"]["over_1_5"],
            over_2_5=prediction["goals"]["over_2_5"],
            over_3_5=prediction["goals"]["over_3_5"],
            btts_yes=prediction["goals"]["btts"]
        )
        
        # Build scoreline predictions
        scorelines = prediction["scorelines"]
        most_likely = ScorelinePrediction(
            score=scorelines[0]["score"],
            home_goals=int(scorelines[0]["score"].split("-")[0]),
            away_goals=int(scorelines[0]["score"].split("-")[1]),
            probability=scorelines[0]["probability"]
        )
        
        alternatives = [
            ScorelinePrediction(
                score=s["score"],
                home_goals=int(s["score"].split("-")[0]),
                away_goals=int(s["score"].split("-")[1]),
                probability=s["probability"]
            )
            for s in scorelines[1:5]
        ]
        
        # Build factors
        h2h = h2h_data or {}
        h2h_home_wins = h2h.get('home_wins', 0)
        h2h_away_wins = h2h.get('away_wins', 0)
        h2h_total = h2h_home_wins + h2h.get('draws', 0) + h2h_away_wins
        h2h_advantage = 0.0
        if h2h_total > 0:
            h2h_advantage = (h2h_home_wins - h2h_away_wins) / h2h_total
        
        factors = PredictionFactors(
            home_elo=features.home_elo,
            away_elo=features.away_elo,
            elo_difference=features.elo_diff,
            home_form_score=min(1.0, features.home_form_points / 15.0),
            away_form_score=min(1.0, features.away_form_points / 15.0),
            home_advantage=self.home_advantage,
            h2h_advantage=h2h_advantage,
            injury_impact=-(features.home_injuries_impact - features.away_injuries_impact),
            rest_days_diff=features.home_rest_days - features.away_rest_days,
            importance_factor=features.match_importance
        )
        
        # Build confidence breakdown
        data_quality = self._calculate_data_quality(home_team_data, away_team_data, h2h_data)
        confidence = ConfidenceBreakdown(
            data_quality=data_quality,
            model_certainty=prediction["outcome"]["confidence"],
            historical_accuracy=0.65,  # Would come from accuracy tracking
            overall=(data_quality + prediction["outcome"]["confidence"] + 0.65) / 3
        )
        
        # Build team contexts
        home_context = self._build_team_context(home_team_data, features, is_home=True)
        away_context = self._build_team_context(away_team_data, features, is_home=False)
        
        return MatchPrediction(
            match_id=match_id,
            home_team=home_team_data.get('name', 'Home'),
            away_team=away_team_data.get('name', 'Away'),
            league=match_context.get('league', 'Unknown') if match_context else 'Unknown',
            kickoff_time=kickoff_time or datetime.utcnow(),
            outcome=outcome,
            goals=goals,
            most_likely_score=most_likely,
            alternative_scores=alternatives,
            factors=factors,
            confidence=confidence,
            home_context=home_context,
            away_context=away_context,
            model_version=self.model_version
        )
    
    def _calculate_data_quality(
        self,
        home_data: Dict,
        away_data: Dict,
        h2h_data: Optional[Dict]
    ) -> float:
        """Calculate data quality score based on available information."""
        score = 0.3  # Base score
        
        # Check home team data
        if home_data.get('form'):
            score += 0.1
        if home_data.get('season_stats'):
            score += 0.1
        if home_data.get('elo_rating'):
            score += 0.05
        
        # Check away team data
        if away_data.get('form'):
            score += 0.1
        if away_data.get('season_stats'):
            score += 0.1
        if away_data.get('elo_rating'):
            score += 0.05
        
        # Check H2H
        if h2h_data and h2h_data.get('total_matches', 0) > 0:
            score += 0.1
            if h2h_data.get('total_matches', 0) >= 5:
                score += 0.1
        
        return min(1.0, score)
    
    def _build_team_context(
        self,
        team_data: Dict,
        features: MatchFeatures,
        is_home: bool
    ) -> TeamPredictionContext:
        """Build team prediction context."""
        form = team_data.get('form', [])
        injuries = [
            InjuryInfo(
                player_id=inj.get('player_id', 0),
                player_name=inj.get('player_name', 'Unknown'),
                position=inj.get('position'),
                injury_type=inj.get('injury'),
                expected_return=inj.get('expected_return'),
                importance_score=inj.get('importance_score', 0.5)
            )
            for inj in team_data.get('injuries', [])
        ]
        
        stats = team_data.get('season_stats', {})
        
        return TeamPredictionContext(
            team_id=team_data.get('id', 0),
            team_name=team_data.get('name', 'Unknown'),
            elo_rating=features.home_elo if is_home else features.away_elo,
            form=form[:5],
            form_points=calculate_form_points(form),
            goals_scored_avg=stats.get('goals_per_game', 1.5),
            goals_conceded_avg=stats.get('conceded_per_game', 1.0),
            clean_sheet_rate=stats.get('clean_sheet_pct', 0.3),
            injuries=injuries,
            days_since_last_match=team_data.get('days_since_last_match', 7)
        )
    
    async def predict_multiple(
        self,
        matches: List[Dict]
    ) -> List[MatchPrediction]:
        """
        Generate predictions for multiple matches.
        
        Args:
            matches: List of match data dicts
        
        Returns:
            List of MatchPredictions
        """
        predictions = []
        
        for match in matches:
            try:
                pred = await self.predict_match(
                    match_id=match.get('match_id', 0),
                    home_team_data=match.get('home_team', {}),
                    away_team_data=match.get('away_team', {}),
                    h2h_data=match.get('h2h'),
                    match_context=match.get('context'),
                    kickoff_time=match.get('kickoff_time')
                )
                predictions.append(pred)
            except Exception as e:
                logger.error(f"Error predicting match {match.get('match_id')}: {e}")
                continue
        
        return predictions


# Singleton instance
_service: Optional[PredictionService] = None


def get_prediction_service() -> PredictionService:
    """Get or create prediction service singleton."""
    global _service
    if _service is None:
        _service = PredictionService()
    return _service
