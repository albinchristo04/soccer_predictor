"""
FastAPI backend server for the Soccer Predictor application.

This module defines the FastAPI application, including API endpoints for match
predictions, team data retrieval, and analytics. It uses a prediction service
to perform the actual calculations and data lookups.

The API includes the following main functionalities:
- Head-to-head match prediction within a single league.
- Cross-league match prediction between two teams from different leagues.
- Retrieval of teams for a given league.
- A suite of analytics endpoints to provide statistics and trends for each league.

The application is configured with CORS middleware to allow requests from the
frontend development server. Error handling is implemented to return appropriate
HTTP status codes and details for various issues, such as file not found or
invalid input.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, validator
from typing import Dict, List, Any, Optional
import os
import traceback
import pandas as pd
from datetime import datetime, timedelta

from backend import prediction_service as ps
from backend import fotmob_service as fm
from backend import live_score_service as lss
from backend import unified_model as um

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


# Simple health check endpoint
@app.get("/api/health")
async def health_check():
    """Simple health check to verify the API is running."""
    return {"status": "healthy", "message": "Soccer Predictor API is running"}


# Models for request validation
class HeadToHeadRequest(BaseModel):
    """
    Request model for head-to-head predictions.

    Attributes:
        league: The league in which the match is played.
        home_team: The name of the home team.
        away_team: The name of the away team.
    """

    league: str
    home_team: str
    away_team: str

    @validator("league")
    def validate_league(cls, v: str) -> str:
        """
        Validate that the league is one of the allowed leagues.
        """
        allowed_leagues = [
            "premier_league",
            "la_liga",
            "bundesliga",
            "serie_a",
            "ligue_1",
            "mls",
            "ucl",
            "uel",
            "world_cup",
        ]
        if v not in allowed_leagues:
            raise ValueError(f'League must be one of: {", ".join(allowed_leagues)}')
        return v


class CrossLeagueRequest(BaseModel):
    """
    Request model for cross-league predictions.

    Attributes:
        league_a: The league of the first team.
        team_a: The name of the first team.
        league_b: The league of the second team.
        team_b: The name of the second team.
    """

    league_a: str
    team_a: str
    league_b: str
    team_b: str

    @validator("league_a", "league_b")
    def validate_leagues(cls, v: str) -> str:
        """
        Validate that the leagues are one of the allowed leagues.
        """
        allowed_leagues = [
            "premier_league",
            "la_liga",
            "bundesliga",
            "serie_a",
            "ligue_1",
            "mls",
            "ucl",
            "uel",
            "world_cup",
        ]
        if v not in allowed_leagues:
            raise ValueError(f'League must be one of: {", ".join(allowed_leagues)}')
        return v


# Routes with error handling
@app.post("/api/predict/head-to-head")
async def predict_head_to_head(request: HeadToHeadRequest) -> Dict[str, Any]:
    """
    Predict the outcome of a head-to-head match within a league.

    Args:
        request: A HeadToHeadRequest object containing the league, home team,
                 and away team.

    Returns:
        A dictionary with the prediction results, including win/draw/loss
        probabilities and team names.
    """
    print(f"Received head-to-head prediction request for league: {request.league}, home: {request.home_team}, away: {request.away_team}")
    try:
        result = ps.predict_head_to_head(
            request.league, request.home_team, request.away_team
        )
        # Extract scoreline and probabilities from result
        return {
            "success": True,
            "predictions": {
                "home_win": result["home_win"],
                "draw": result["draw"],
                "away_win": result["away_win"],
            },
            "predicted_home_goals": result.get("predicted_home_goals"),
            "predicted_away_goals": result.get("predicted_away_goals"),
            "home_team": result.get("home_team", request.home_team),
            "away_team": result.get("away_team", request.away_team),
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unhandled exception in predict_head_to_head: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/predict/cross-league")
async def predict_cross_league(request: CrossLeagueRequest) -> Dict[str, Any]:
    """
    Predict the outcome of a match between two teams from different leagues.

    Args:
        request: A CrossLeagueRequest object containing the leagues and names
                 of the two teams.

    Returns:
        A dictionary with the prediction results, including win probabilities
        for each team and draw probability.
    """
    try:
        result = ps.predict_cross_league(
            request.team_a, request.league_a, request.team_b, request.league_b
        )
        # Extract scoreline and probabilities from result
        return {
            "success": True,
            "predictions": {
                "team_a_win": result["team_a_win"],
                "draw": result["draw"],
                "team_b_win": result["team_b_win"],
            },
            "predicted_team_a_goals": result.get("predicted_team_a_goals"),
            "predicted_team_b_goals": result.get("predicted_team_b_goals"),
            "team_a": result.get("team_a", request.team_a),
            "team_b": result.get("team_b", request.team_b),
            "league_a": request.league_a,
            "league_b": request.league_b,
        }
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Unhandled exception in predict_cross_league: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/teams/{league}")
async def get_teams(league: str) -> Dict[str, Any]:
    """
    Get a list of all teams in a specific league.

    Args:
        league: The name of the league.

    Returns:
        A dictionary containing a list of team names.
    """
    try:
        teams = ps.get_league_teams(league)
        return {"success": True, "teams": teams}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Unhandled exception in get_teams: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/analytics/image")
async def get_analytics_image(league: str, image_name: str):
    print(f"Attempting to get image: league={league}, image_name={image_name}")
    image_path = os.path.join(DATA_DIR, league, "visualizations", image_name)
    print(f"Constructed image path: {image_path}")
    if not os.path.exists(image_path):
        print(f"Image file not found at: {image_path}")
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(image_path)


@app.get("/api/analytics/model_metrics/{league}")
async def get_analytics_model_metrics(league: str) -> Dict[str, Any]:
    """
    Get model performance metrics for a league.

    Args:
        league: The name of the league.

    Returns:
        A dictionary with model performance metrics.
    """
    try:
        return ps.get_model_metrics(league)
    except Exception as e:
        print(f"Unhandled exception in get_model_metrics: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/overview/{league}")
async def get_analytics_overview(league: str) -> Dict[str, Any]:
    """
    Get an overview of league statistics.

    Args:
        league: The name of the league.

    Returns:
        A dictionary with overall league statistics.
    """
    try:
        return ps.get_league_stats_overview(league)
    except Exception as e:
        print(f"Unhandled exception in get_league_stats_overview: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/analytics/season_trends/{league}")
async def get_analytics_season_trends(league: str) -> List[Dict[str, Any]]:
    """
    Get season trends for average goals in a league.

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries with season-by-season trend data.
    """
    try:
        return ps.get_season_trends(league)
    except Exception as e:
        print(f"Unhandled exception in get_season_trends: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/analytics/result_distribution/{league}")
async def get_analytics_result_distribution(league: str) -> List[Dict[str, Any]]:
    """
    Get the distribution of match results (win/draw/loss) for a league.

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries representing the result distribution.
    """
    try:
        return ps.get_result_distribution(league)
    except Exception as e:
        print(f"Unhandled exception in get_result_distribution: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/analytics/home_away_performance/{league}")
async def get_analytics_home_away_performance(league: str) -> List[Dict[str, Any]]:
    """
    Get home vs. away performance statistics for a league.

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries with home/away performance data.
    """
    try:
        return ps.get_home_away_performance(league)
    except Exception as e:
        print(f"Unhandled exception in get_home_away_performance: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/analytics/goals_distribution/{league}")
async def get_analytics_goals_distribution(league: str) -> List[Dict[str, Any]]:
    """
    Get the distribution of total goals per match for a league.

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries representing the goals distribution.
    """
    try:
        return ps.get_goals_distribution(league)
    except Exception as e:
        print(f"Unhandled exception in get_goals_distribution: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/upcoming_matches/{league}")
async def get_upcoming_matches(league: str) -> List[Dict[str, Any]]:
    """
    Get upcoming matches for a league with predictions.
    Tries FotMob API first, falls back to CSV data if unavailable.
    """
    try:
        # Try FotMob API first for real-time data
        try:
            matches = fm.get_upcoming_fixtures(league, days_ahead=30)
            if matches:
                print(f"Got {len(matches)} upcoming matches from FotMob for {league}")
                # Add predictions using our model
                result = []
                for match in matches:
                    try:
                        pred = ps.predict_head_to_head(league, match["home_team"], match["away_team"])
                        result.append({
                            "date": match["date"],
                            "home_team": match["home_team"],
                            "away_team": match["away_team"],
                            "predicted_home_win": pred.get("home_win", 0.33),
                            "predicted_draw": pred.get("draw", 0.33),
                            "predicted_away_win": pred.get("away_win", 0.33),
                            "predicted_home_goals": pred.get("predicted_home_goals", 1),
                            "predicted_away_goals": pred.get("predicted_away_goals", 1),
                            "status": match.get("status", "scheduled"),
                        })
                    except Exception as pred_err:
                        print(f"Prediction error for {match['home_team']} vs {match['away_team']}: {pred_err}")
                        # Include match without prediction
                        result.append({
                            "date": match["date"],
                            "home_team": match["home_team"],
                            "away_team": match["away_team"],
                            "predicted_home_win": 0.33,
                            "predicted_draw": 0.34,
                            "predicted_away_win": 0.33,
                            "status": match.get("status", "scheduled"),
                        })
                return result
        except Exception as fm_err:
            print(f"FotMob API error, falling back to CSV: {fm_err}")
        
        # Fallback to CSV data
        return ps.get_upcoming_matches(league)
    except Exception as e:
        print(f"Unhandled exception in get_upcoming_matches: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/recent_results/{league}")
async def get_recent_results(league: str) -> List[Dict[str, Any]]:
    """
    Get recent match results for a league.
    Tries FotMob API first, falls back to CSV data if unavailable.
    """
    try:
        # Try FotMob API first for real-time data
        try:
            results = fm.get_recent_results(league, days_back=30)
            if results:
                print(f"Got {len(results)} recent results from FotMob for {league}")
                formatted = []
                for match in results:
                    home_goals = match.get("home_goals", 0) or 0
                    away_goals = match.get("away_goals", 0) or 0
                    
                    if home_goals > away_goals:
                        result = "win"
                    elif away_goals > home_goals:
                        result = "loss"
                    else:
                        result = "draw"
                    
                    formatted.append({
                        "date": match["date"],
                        "home_team": match["home_team"],
                        "away_team": match["away_team"],
                        "home_goals": home_goals,
                        "away_goals": away_goals,
                        "result": result,
                    })
                return formatted
        except Exception as fm_err:
            print(f"FotMob API error for results, falling back to CSV: {fm_err}")
        
        # Fallback to CSV data - get played matches
        import pandas as pd
        from datetime import datetime, timedelta
        
        df = ps.load_league_data(league)
        played = df[df["status"] == "played"].copy()
        
        if played.empty:
            return []
        
        played["date"] = pd.to_datetime(played["date"], errors='coerce')
        # Get unique matches by date, home_team, away_team
        played = played.drop_duplicates(subset=["date", "home_team", "away_team"])
        played = played.sort_values("date", ascending=False).head(50)
        
        results = []
        for _, match in played.iterrows():
            home_goals = int(match.get("home_goals", 0) or 0)
            away_goals = int(match.get("away_goals", 0) or 0)
            
            if home_goals > away_goals:
                result = "win"
            elif away_goals > home_goals:
                result = "loss"
            else:
                result = "draw"
            
            results.append({
                "date": match["date"].isoformat() if pd.notna(match["date"]) else "",
                "home_team": match["home_team"],
                "away_team": match["away_team"],
                "home_goals": home_goals,
                "away_goals": away_goals,
                "result": result,
            })
        
        return results
    except Exception as e:
        print(f"Unhandled exception in get_recent_results: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/live_matches/{league}")
async def get_live_matches(league: str) -> Dict[str, Any]:
    """
    Get all matches (live, upcoming, and recent results) for display.
    Uses FotMob API for real-time data.
    """
    try:
        data = fm.get_all_matches_for_display(league, days_range=30)
        return {
            "live": data.get("live", []),
            "upcoming": data.get("upcoming", []),
            "results": data.get("results", []),
        }
    except Exception as e:
        print(f"Error getting live matches: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/team_form/{league}/{team}")
async def get_team_form(league: str, team: str) -> Dict[str, Any]:
    """
    Get real-time team form and statistics from FotMob.
    """
    try:
        import urllib.parse
        team_name = urllib.parse.unquote(team)
        
        # Try FotMob first
        try:
            stats = fm.get_team_season_stats(team_name, league)
            if stats and stats.get("matches_played", 0) > 0:
                return stats
        except Exception as fm_err:
            print(f"FotMob error for team form: {fm_err}")
        
        # Fallback to CSV data - FILTER BY CURRENT SEASON
        df = ps.load_league_data(league)
        model_data = ps.load_league_model(league)
        
        # Filter to current season only (2025-2026)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        current_season_start = pd.Timestamp('2025-08-01')  # Season typically starts in August
        df = df[df['date'] >= current_season_start]
        
        # Remove duplicate matches
        df = df.drop_duplicates(subset=['home_team', 'away_team', 'date'])
        
        # Calculate stats from CSV
        team_lower = team_name.lower()
        home_matches = df[(df["home_team"].str.lower() == team_lower) & (df["status"] == "played")]
        away_matches = df[(df["away_team"].str.lower() == team_lower) & (df["status"] == "played")]
        
        # Also deduplicate the results
        home_matches = home_matches.drop_duplicates(subset=['home_team', 'away_team', 'date'])
        away_matches = away_matches.drop_duplicates(subset=['home_team', 'away_team', 'date'])
        
        matches_played = len(home_matches) + len(away_matches)
        if matches_played == 0:
            raise HTTPException(status_code=404, detail=f"Team '{team_name}' not found")
        
        # Calculate wins, draws, losses
        home_wins = len(home_matches[home_matches["result"] == "win"])
        home_draws = len(home_matches[home_matches["result"] == "draw"])
        home_losses = len(home_matches[home_matches["result"] == "loss"])
        
        away_wins = len(away_matches[away_matches["result"] == "loss"])  # Away win = home loss
        away_draws = len(away_matches[away_matches["result"] == "draw"])
        away_losses = len(away_matches[away_matches["result"] == "win"])  # Away loss = home win
        
        wins = home_wins + away_wins
        draws = home_draws + away_draws
        losses = home_losses + away_losses
        
        # Goals
        home_scored = home_matches["home_goals"].sum()
        home_conceded = home_matches["away_goals"].sum()
        away_scored = away_matches["away_goals"].sum()
        away_conceded = away_matches["home_goals"].sum()
        
        goals_scored = home_scored + away_scored
        goals_conceded = home_conceded + away_conceded
        
        # Recent form - get last 5 matches
        all_matches = pd.concat([
            home_matches.assign(is_home=True),
            away_matches.assign(is_home=False)
        ])
        all_matches = all_matches.sort_values("date", ascending=False).head(5)
        
        recent_form = []
        for _, m in all_matches.iterrows():
            if m["is_home"]:
                if m["result"] == "win":
                    recent_form.append("W")
                elif m["result"] == "draw":
                    recent_form.append("D")
                else:
                    recent_form.append("L")
            else:
                if m["result"] == "loss":  # Away team won
                    recent_form.append("W")
                elif m["result"] == "draw":
                    recent_form.append("D")
                else:
                    recent_form.append("L")
        
        return {
            "matches_played": matches_played,
            "wins": wins,
            "draws": draws,
            "losses": losses,
            "goals_scored": int(goals_scored),
            "goals_conceded": int(goals_conceded),
            "win_rate": wins / matches_played if matches_played > 0 else 0,
            "avg_goals_scored": goals_scored / matches_played if matches_played > 0 else 0,
            "avg_goals_conceded": goals_conceded / matches_played if matches_played > 0 else 0,
            "home_win_rate": home_wins / len(home_matches) if len(home_matches) > 0 else 0,
            "away_win_rate": away_wins / len(away_matches) if len(away_matches) > 0 else 0,
            "recent_form": recent_form,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting team form: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/upcoming_matches_debug/{league}")
async def get_upcoming_matches_debug(league: str) -> List[Dict[str, Any]]:
    """
    DEBUG endpoint: Get upcoming matches WITHOUT predictions for testing.
    """
    try:
        from datetime import datetime, timedelta
        import pandas as pd
        
        df = ps.load_league_data(league)
        upcoming = df[df["status"] == "scheduled"].copy()
        
        if upcoming.empty:
            return []
        
        upcoming["date"] = pd.to_datetime(upcoming["date"], errors='coerce')
        today = pd.Timestamp.now().normalize()
        end_date = today + timedelta(days=7)
        upcoming = upcoming[(upcoming["date"] >= today) & (upcoming["date"] <= end_date)]
        
        if upcoming.empty:
            return []
        
        upcoming = upcoming.sort_values('date').head(20)
        
        results = []
        for idx, match in upcoming.iterrows():
            results.append({
                "date": match["date"].isoformat(),
                "home_team": match["home_team"],
                "away_team": match["away_team"],
            })
        
        return results
    except Exception as e:
        print(f"Debug endpoint error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ==================== LIVE SCORES API ====================

@app.get("/api/live_scores")
async def get_live_scores(league: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get live match scores across all leagues or for a specific league.
    Updates in real-time from FotMob.
    """
    try:
        return lss.get_live_scores(league)
    except Exception as e:
        print(f"Error getting live scores: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/api/todays_matches")
async def get_todays_matches(league: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all matches for today grouped by status (live, upcoming, completed).
    """
    try:
        return lss.get_todays_matches(league)
    except Exception as e:
        print(f"Error getting today's matches: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ==================== UNIFIED MODEL API ====================

@app.post("/api/predict/unified")
async def predict_unified(request: Dict[str, Any]) -> Dict[str, Any]:
    """
    Make a prediction using the unified model trained on all leagues.
    Provides more accurate predictions with real-time stats.
    """
    try:
        home_team = request.get("home_team")
        away_team = request.get("away_team")
        league = request.get("league")
        home_league = request.get("home_league", league)
        away_league = request.get("away_league", league)
        
        if not all([home_team, away_team, league]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        result = um.predict_match(home_team, away_team, league, home_league, away_league)
        return {
            "success": True,
            **result
        }
    except Exception as e:
        print(f"Unified prediction error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/api/team_rating/{league}/{team}")
async def get_team_rating(league: str, team: str) -> Dict[str, Any]:
    """
    Get detailed team rating and performance info from unified model.
    """
    try:
        import urllib.parse
        team_name = urllib.parse.unquote(team)
        predictor = um.get_unified_predictor()
        return predictor.get_team_info(team_name, league)
    except Exception as e:
        print(f"Error getting team rating: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ==================== CALENDAR API ====================

@app.get("/api/calendar/{league}")
async def get_calendar_data(league: str, year: int = None, month: int = None) -> Dict[str, Any]:
    """
    Get match data organized by calendar for a specific league.
    Returns matches grouped by date with predictions vs actual outcomes.
    """
    try:
        import pandas as pd
        
        if year is None:
            year = datetime.now().year
        if month is None:
            month = datetime.now().month
        
        # Current date for determining if matches are completed
        current_date = datetime.now().date()
        
        # Get start and end of month
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(days=1)
        
        # Load league data
        df = ps.load_league_data(league)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        # Filter to month range
        mask = (df['date'] >= start_date) & (df['date'] <= end_date)
        month_matches = df[mask].copy()
        
        # Remove duplicates
        month_matches = month_matches.drop_duplicates(subset=['date', 'home_team', 'away_team'])
        
        # Group by date
        calendar_data = {}
        
        for _, row in month_matches.iterrows():
            date_key = row['date'].strftime('%Y-%m-%d')
            match_date = row['date'].date()
            
            if date_key not in calendar_data:
                calendar_data[date_key] = {
                    'date': date_key,
                    'day': row['date'].day,
                    'matches': [],
                    'match_count': 0,
                }
            
            # Determine actual status based on current date
            # If the match date is before today, it should be marked as played
            if row['status'] == 'played':
                actual_status = 'played'
            elif match_date < current_date:
                actual_status = 'played'  # Past matches should be considered played
            else:
                actual_status = 'scheduled'
            
            match_data = {
                'home_team': row['home_team'],
                'away_team': row['away_team'],
                'status': actual_status,
                'actual_home_goals': int(row['home_goals']) if pd.notna(row['home_goals']) else None,
                'actual_away_goals': int(row['away_goals']) if pd.notna(row['away_goals']) else None,
                'result': row['result'] if pd.notna(row.get('result')) else None,
            }
            
            # Add prediction for this match
            try:
                predictor = um.get_unified_predictor()
                pred = predictor.predict(row['home_team'], row['away_team'], league)
                match_data['predicted_home_win'] = pred['home_win']
                match_data['predicted_draw'] = pred['draw']
                match_data['predicted_away_win'] = pred['away_win']
                match_data['predicted_home_goals'] = pred['predicted_home_goals']
                match_data['predicted_away_goals'] = pred['predicted_away_goals']
                
                # For completed matches, check if prediction was correct
                if row['status'] == 'played' and match_data['actual_home_goals'] is not None:
                    actual_result = row['result']
                    predicted_result = 'win' if pred['home_win'] > pred['away_win'] and pred['home_win'] > pred['draw'] else \
                                      'loss' if pred['away_win'] > pred['home_win'] and pred['away_win'] > pred['draw'] else 'draw'
                    match_data['prediction_correct'] = actual_result == predicted_result
                    match_data['predicted_result'] = predicted_result
            except Exception as pred_err:
                print(f"Prediction error: {pred_err}")
            
            calendar_data[date_key]['matches'].append(match_data)
            calendar_data[date_key]['match_count'] += 1
        
        # Build calendar grid (6 weeks x 7 days)
        import calendar
        cal = calendar.Calendar(firstweekday=6)  # Start on Sunday
        month_days = list(cal.itermonthdays(year, month))
        
        weeks = []
        for i in range(0, len(month_days), 7):
            week = []
            for day in month_days[i:i+7]:
                if day == 0:
                    week.append(None)
                else:
                    date_key = f"{year}-{month:02d}-{day:02d}"
                    week.append({
                        'day': day,
                        'date': date_key,
                        'matches': calendar_data.get(date_key, {}).get('matches', []),
                        'match_count': calendar_data.get(date_key, {}).get('match_count', 0),
                        'is_today': date_key == datetime.now().strftime('%Y-%m-%d'),
                    })
            weeks.append(week)
        
        return {
            'year': year,
            'month': month,
            'month_name': datetime(year, month, 1).strftime('%B'),
            'weeks': weeks,
            'total_matches': sum(d['match_count'] for d in calendar_data.values()),
        }
    except Exception as e:
        print(f"Calendar error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/api/matches_by_date/{league}/{date}")
async def get_matches_by_date(league: str, date: str) -> List[Dict[str, Any]]:
    """
    Get all matches for a specific date with predictions and actual outcomes.
    """
    try:
        import pandas as pd
        
        # Current date for determining if matches are completed
        current_date = datetime.now().date()
        
        df = ps.load_league_data(league)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        
        target_date = pd.to_datetime(date)
        match_date = target_date.date()
        matches = df[df['date'].dt.date == match_date].copy()
        matches = matches.drop_duplicates(subset=['home_team', 'away_team'])
        
        results = []
        predictor = um.get_unified_predictor()
        
        for _, row in matches.iterrows():
            # Determine actual status based on current date
            if row['status'] == 'played':
                actual_status = 'played'
            elif match_date < current_date:
                actual_status = 'played'  # Past matches should be considered played
            else:
                actual_status = 'scheduled'
            
            match_data = {
                'home_team': row['home_team'],
                'away_team': row['away_team'],
                'date': row['date'].isoformat(),
                'status': actual_status,
                'venue': row.get('venue', ''),
            }
            
            # Actual outcome
            if actual_status == 'played':
                match_data['actual_home_goals'] = int(row['home_goals']) if pd.notna(row['home_goals']) else None
                match_data['actual_away_goals'] = int(row['away_goals']) if pd.notna(row['away_goals']) else None
                match_data['actual_result'] = row.get('result')
            
            # Prediction
            try:
                pred = predictor.predict(row['home_team'], row['away_team'], league)
                match_data['predicted_home_win'] = pred['home_win']
                match_data['predicted_draw'] = pred['draw']
                match_data['predicted_away_win'] = pred['away_win']
                match_data['predicted_home_goals'] = pred['predicted_home_goals']
                match_data['predicted_away_goals'] = pred['predicted_away_goals']
                match_data['home_rating'] = pred['home_rating']
                match_data['away_rating'] = pred['away_rating']
                match_data['confidence'] = pred['confidence']
                
                # Determine predicted outcome
                if pred['home_win'] > pred['away_win'] and pred['home_win'] > pred['draw']:
                    match_data['predicted_result'] = 'win'
                elif pred['away_win'] > pred['home_win'] and pred['away_win'] > pred['draw']:
                    match_data['predicted_result'] = 'loss'
                else:
                    match_data['predicted_result'] = 'draw'
                
                # Check if prediction was correct
                if row['status'] == 'played':
                    match_data['prediction_correct'] = match_data.get('actual_result') == match_data['predicted_result']
            except Exception:
                pass
            
            results.append(match_data)
        
        return sorted(results, key=lambda x: x.get('date', ''))
    except Exception as e:
        print(f"Matches by date error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
