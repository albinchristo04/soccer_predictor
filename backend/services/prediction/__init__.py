"""Prediction service module."""

from backend.services.prediction.model import (
    PredictionService,
    get_prediction_service,
)
from backend.services.prediction.features import (
    MatchFeatures,
    build_features,
    calculate_form_points,
    calculate_injury_impact,
    is_derby_match,
)
from backend.services.prediction.probabilistic import (
    PoissonModel,
    HybridPredictionModel,
    monte_carlo_simulation,
    GoalDistribution,
    ScoreMatrix,
)

__all__ = [
    "PredictionService",
    "get_prediction_service",
    "MatchFeatures",
    "build_features",
    "calculate_form_points",
    "calculate_injury_impact",
    "is_derby_match",
    "PoissonModel",
    "HybridPredictionModel",
    "monte_carlo_simulation",
    "GoalDistribution",
    "ScoreMatrix",
]
