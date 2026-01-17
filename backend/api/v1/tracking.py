"""
Prediction tracking API endpoints.

Handles storing predictions, updating outcomes, and retrieving accuracy metrics.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel

from backend.services.prediction.tracker import get_prediction_tracker

router = APIRouter(prefix="/tracking", tags=["tracking"])


class StorePredictionRequest(BaseModel):
    """Request to store a prediction."""
    match_id: str
    home_team: str
    away_team: str
    league: str
    match_date: str
    home_win_prob: float
    draw_prob: float
    away_win_prob: float
    home_xG: float
    away_xG: float
    confidence: float
    home_elo: Optional[float] = None
    away_elo: Optional[float] = None
    weather_factor: Optional[float] = 1.0
    referee_factor: Optional[float] = 1.0


class UpdateOutcomeRequest(BaseModel):
    """Request to update match outcome."""
    match_id: str
    home_goals: int
    away_goals: int


@router.post("/store")
async def store_prediction(request: StorePredictionRequest):
    """
    Store a prediction before a match.
    
    This should be called when generating a prediction for an upcoming match.
    """
    tracker = get_prediction_tracker()
    
    record = tracker.store_prediction(
        match_id=request.match_id,
        home_team=request.home_team,
        away_team=request.away_team,
        league=request.league,
        match_date=request.match_date,
        home_win_prob=request.home_win_prob,
        draw_prob=request.draw_prob,
        away_win_prob=request.away_win_prob,
        home_xG=request.home_xG,
        away_xG=request.away_xG,
        confidence=request.confidence,
        home_elo=request.home_elo or 0.0,
        away_elo=request.away_elo or 0.0,
        weather_factor=request.weather_factor or 1.0,
        referee_factor=request.referee_factor or 1.0,
    )
    
    return {
        "success": True,
        "match_id": record.match_id,
        "predicted_winner": record.predicted_winner,
        "predicted_scoreline": record.predicted_scoreline,
    }


@router.post("/outcome")
async def update_outcome(request: UpdateOutcomeRequest):
    """
    Update a prediction with the actual match outcome.
    
    This should be called after a match completes.
    """
    tracker = get_prediction_tracker()
    
    record = tracker.update_outcome(
        match_id=request.match_id,
        home_goals=request.home_goals,
        away_goals=request.away_goals,
    )
    
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"No prediction found for match {request.match_id}"
        )
    
    return {
        "success": True,
        "match_id": record.match_id,
        "predicted_winner": record.predicted_winner,
        "actual_winner": record.actual_winner,
        "winner_correct": record.winner_correct,
        "scoreline_correct": record.scoreline_correct,
        "predicted_scoreline": record.predicted_scoreline,
        "actual_scoreline": f"{record.actual_home_goals}-{record.actual_away_goals}",
    }


@router.get("/prediction/{match_id}")
async def get_prediction(match_id: str):
    """
    Get a stored prediction by match ID.
    
    Returns the prediction and outcome (if completed).
    """
    tracker = get_prediction_tracker()
    record = tracker.get_prediction(match_id)
    
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"No prediction found for match {match_id}"
        )
    
    return record.to_dict()


@router.get("/recent")
async def get_recent_predictions(
    limit: int = Query(50, ge=1, le=200),
    league: Optional[str] = None,
    completed_only: bool = False,
):
    """
    Get recent predictions.
    
    Args:
        limit: Maximum number of predictions to return
        league: Filter by league
        completed_only: Only return predictions with outcomes
    """
    tracker = get_prediction_tracker()
    predictions = tracker.get_recent_predictions(
        limit=limit,
        league=league,
        completed_only=completed_only,
    )
    
    return {
        "count": len(predictions),
        "predictions": [p.to_dict() for p in predictions],
    }


@router.get("/accuracy")
async def get_accuracy_metrics(
    league: Optional[str] = None,
    days: Optional[int] = Query(None, ge=1, le=365),
):
    """
    Get model accuracy metrics.
    
    Args:
        league: Filter to specific league
        days: Only consider predictions from last N days
    """
    tracker = get_prediction_tracker()
    metrics = tracker.calculate_accuracy_metrics(league=league, days=days)
    
    return metrics.to_dict()


@router.get("/accuracy/by-league")
async def get_accuracy_by_league():
    """
    Get accuracy metrics broken down by league.
    """
    tracker = get_prediction_tracker()
    return tracker.get_league_performance()


@router.get("/model-adjustments")
async def get_model_adjustments():
    """
    Get suggested model adjustments based on prediction performance.
    
    These adjustments can be applied to improve future predictions.
    """
    tracker = get_prediction_tracker()
    adjustments = tracker.get_model_adjustments()
    metrics = tracker.calculate_accuracy_metrics(days=90)
    
    return {
        "adjustments": adjustments,
        "based_on": {
            "total_predictions": metrics.completed_predictions,
            "recent_accuracy": round(metrics.recent_accuracy, 3),
            "brier_score": round(metrics.brier_score, 4),
        },
    }
