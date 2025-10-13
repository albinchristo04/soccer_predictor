"""
FastAPI backend server with proper error handling and validation.
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import prediction_service as ps
from typing import List, Optional

import os

# Constants
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")

app = FastAPI(title="Soccer Predictor API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models for request validation
class HeadToHeadRequest(BaseModel):
    league: str
    home_team: str
    away_team: str
    
    @validator('league')
    def validate_league(cls, v):
        allowed_leagues = ['premier_league', 'la_liga', 'bundesliga', 
                         'serie_a', 'ligue_1', 'mls', 'ucl', 'uel', 'world_cup']
        if v not in allowed_leagues:
            raise ValueError(f'League must be one of: {", ".join(allowed_leagues)}')
        return v

class CrossLeagueRequest(BaseModel):
    league_a: str
    team_a: str
    league_b: str
    team_b: str
    
    @validator('league_a', 'league_b')
    def validate_leagues(cls, v):
        allowed_leagues = ['premier_league', 'la_liga', 'bundesliga', 
                         'serie_a', 'ligue_1', 'mls', 'ucl', 'uel', 'world_cup']
        if v not in allowed_leagues:
            raise ValueError(f'League must be one of: {", ".join(allowed_leagues)}')
        return v

# Routes with error handling
@app.post("/api/predict/head-to-head")
async def predict_head_to_head(request: HeadToHeadRequest):
    """Predict head-to-head match outcome."""
    try:
        result = ps.predict_head_to_head(
            request.league,
            request.home_team,
            request.away_team
        )
        return {
            "success": True,
            "predictions": result,
            "home_team": request.home_team,
            "away_team": request.away_team
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/predict/cross-league")
async def predict_cross_league(request: CrossLeagueRequest):
    """Predict cross-league match outcome."""
    try:
        result = ps.predict_cross_league(
            request.team_a,
            request.league_a,
            request.team_b,
            request.league_b
        )
        return {
            "success": True,
            "predictions": result,
            "team_a": request.team_a,
            "team_b": request.team_b,
            "league_a": request.league_a,
            "league_b": request.league_b
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/teams/{league}")
async def get_teams(league: str):
    """Get all teams in a league."""
    try:
        teams = ps.get_league_teams(league)
        return {
            "success": True,
            "teams": teams
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# --------------------------
# Analytics Routes
# --------------------------

@app.get("/api/analytics/overview/{league}")
async def get_analytics_overview(league: str):
    try:
        return ps.get_league_stats_overview(league)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/season_trends/{league}")
async def get_analytics_season_trends(league: str):
    try:
        return ps.get_season_trends(league)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/result_distribution/{league}")
async def get_analytics_result_distribution(league: str):
    try:
        return ps.get_result_distribution(league)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/goals_distribution/{league}")
async def get_analytics_goals_distribution(league: str):
    try:
        return ps.get_goals_distribution(league)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)