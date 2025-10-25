"""
Prediction service for the Soccer Predictor application.

This module provides functions for loading trained models and data, calculating
team statistics, and making match predictions. It serves as the core logic
behind the API endpoints defined in the main backend server.

The service includes functionalities for:
- Loading serialized machine learning models and processed league data.
- Calculating team statistics based on historical match data.
- Finding teams in the dataset with exact or partial name matching.
- Generating head-to-head and cross-league match predictions.
- Providing various analytics, such as league overviews, season trends, and
  performance distributions.

Functions are designed to be modular and reusable, with clear separation of
concerns for data loading, statistical computation, and prediction generation.
Error handling is incorporated to manage issues like missing files or data.
"""

import os
import joblib
import pandas as pd
from typing import Dict, Tuple, List, Any
from functools import lru_cache
from sklearn.preprocessing import StandardScaler

# Constants
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")


@lru_cache(maxsize=10)
def load_league_model(league: str) -> Dict[str, Any]:
    """
    Load the trained model for a specific league.

    Args:
        league: The name of the league.

    Returns:
        A dictionary containing the trained model and associated metadata.

    Raises:
        FileNotFoundError: If the model file for the league is not found.
    """
    model_path = os.path.join(DATA_DIR, league, "model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model for '{league}' not found")
    return joblib.load(model_path)


@lru_cache(maxsize=10)
def load_league_data(league: str) -> pd.DataFrame:
    """
    Load the processed match data for a specific league.

    Args:
        league: The name of the league.

    Returns:
        A pandas DataFrame with the processed match data.

    Raises:
        FileNotFoundError: If the data file for the league is not found.
    """
    data_path = os.path.join(PROCESSED_DIR, f"{league}_processed.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data for '{league}' not found")
    df = pd.read_csv(data_path, low_memory=False)
    df["total_goals"] = df["home_goals"] + df["away_goals"]
    return df


def get_team_stats(
    df: pd.DataFrame, team_name: str, model_data: Dict[str, Any]
) -> pd.Series:
    """
    Calculate the average statistics for a team based on their matches.

    Args:
        df: The DataFrame containing match data.
        team_name: The name of the team.
        model_data: The model data dictionary, including feature columns.

    Returns:
        A pandas Series with the calculated team statistics.

    Raises:
        ValueError: If the team is not found in the data.
    """
    home_matches = df[df["home_team"].str.lower() == team_name.lower()]
    away_matches = df[df["away_team"].str.lower() == team_name.lower()]

    if home_matches.empty and away_matches.empty:
        raise ValueError(f"Team '{team_name}' not found in data")

    feature_cols = model_data["feature_cols"]

    home_features = (
        home_matches[feature_cols].mean()
        if not home_matches.empty
        else pd.Series(0, index=feature_cols)
    )
    away_features = (
        away_matches[feature_cols].mean()
        if not away_matches.empty
        else pd.Series(0, index=feature_cols)
    )

    combined = home_features * 0.6 + away_features * 0.4
    return combined.fillna(0)


def find_team(team_input: str, df: pd.DataFrame) -> str:
    """
    Find the exact or closest matching team name in the DataFrame.

    Args:
        team_input: The user-provided team name.
        df: The DataFrame containing team names.

    Returns:
        The matched team name.

    Raises:
        ValueError: If no matching team is found.
    """
    team_input = team_input.strip().lower()
    available_teams = sorted(
        set(df["home_team"].unique()) | set(df["away_team"].unique())
    )

    for team in available_teams:
        if team.lower() == team_input:
            return team

    for team in available_teams:
        if team_input in team.lower():
            return team

    raise ValueError(
        f"Team '{team_input}' not found. Available teams: {', '.join(sorted(available_teams)[:10])}..."
    )


def get_league_teams(league: str) -> List[str]:
    """
    Get a list of all unique team names in a league.

    Args:
        league: The name of the league.

    Returns:
        A sorted list of unique team names.
    """
    df = load_league_data(league)
    teams = sorted(set(df["home_team"].unique()) | set(df["away_team"].unique()))
    return [t for t in teams if pd.notna(t)]


def predict_head_to_head(league: str, home_team: str, away_team: str) -> Dict[str, Any]:
    """
    Make a head-to-head prediction for a match within a single league.

    Args:
        league: The league of the match.
        home_team: The name of the home team.
        away_team: The name of the away team.

    Returns:
        A dictionary with prediction probabilities and team information.
    """
    model_data = load_league_model(league)
    df = load_league_data(league)

    home_team_found = find_team(home_team, df)
    away_team_found = find_team(away_team, df)

    home_stats = get_team_stats(df, home_team_found, model_data)
    away_stats = get_team_stats(df, away_team_found, model_data)

    feature_diff = (home_stats - away_stats).values.reshape(1, -1)

    model = model_data["model"]
    proba = model.predict_proba(feature_diff)[0]
    classes = model_data["classes"]

    return {
        "home_win": float(proba[classes.index("win")]),
        "draw": float(proba[classes.index("draw")]),
        "away_win": float(proba[classes.index("loss")]),
        "home_team": home_team_found,
        "away_team": away_team_found,
    }


def predict_cross_league(
    team_a: str, league_a: str, team_b: str, league_b: str
) -> Dict[str, Any]:
    """
    Make a prediction for a match between teams from two different leagues.

    Args:
        team_a: Name of the first team.
        league_a: League of the first team.
        team_b: Name of the second team.
        league_b: League of the second team.

    Returns:
        A dictionary with prediction probabilities and team information.
    """
    model_data_a = load_league_model(league_a)
    model_data_b = load_league_model(league_b)
    df_a = load_league_data(league_a)
    df_b = load_league_data(league_b)

    team_a_found = find_team(team_a, df_a)
    team_b_found = find_team(team_b, df_b)

    stats_a = get_team_stats(df_a, team_a_found, model_data_a)
    stats_b = get_team_stats(df_b, team_b_found, model_data_b)

    scaler = StandardScaler()
    stats_normalized = scaler.fit_transform([stats_a.values, stats_b.values])
    feature_diff = (stats_normalized[0] - stats_normalized[1]).reshape(1, -1)

    model_a = model_data_a["model"]
    model_b = model_data_b["model"]

    proba_a = model_a.predict_proba(feature_diff)[0]
    proba_b = model_b.predict_proba(feature_diff)[0]

    weight_a = model_data_a["test_accuracy"]
    weight_b = model_data_b["test_accuracy"]

    classes = model_data_a["classes"]
    proba_ensemble = (proba_a * weight_a + proba_b * weight_b) / (weight_a + weight_b)

    return {
        "team_a_win": float(proba_ensemble[classes.index("win")]),
        "draw": float(proba_ensemble[classes.index("draw")]),
        "team_b_win": float(proba_ensemble[classes.index("loss")]),
        "team_a": team_a_found,
        "team_b": team_b_found,
        "league_a": league_a,
        "league_b": league_b,
    }


# --------------------------
# Analytics Functions
# --------------------------


def get_model_metrics(league: str) -> Dict[str, Any]:
    """
    Get model performance metrics for a given league.

    Args:
        league: The name of the league.

    Returns:
        A dictionary with model performance metrics.
    """
    model_data = load_league_model(league)
    metrics = {
        "train_accuracy": model_data.get("train_accuracy"),
        "test_accuracy": model_data.get("test_accuracy"),
        "train_report": model_data.get("train_report"),
        "test_report": model_data.get("test_report"),
        "n_samples": model_data.get("n_samples"),
    }
    return metrics


def get_upcoming_matches(league: str) -> List[Dict[str, Any]]:
    """
    Get upcoming matches for a given league with predictions.

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries with upcoming match data and predictions.
    """
    try:
        # Load fixture data from the seasons_links.json
        with open(os.path.join(DATA_DIR, "seasons_links.json"), "r") as f:
            seasons_data = json.load(f)
            
        league_data = next((data for data in seasons_data if data["league"] == league), None)
        if not league_data:
            return []
            
        # Load the processed data
        df = pd.read_csv(os.path.join(DATA_DIR, "processed", f"{league}_matches.csv"))
        upcoming = df[df["status"] == "scheduled"].copy()
        
        # Load the model for predictions
        model_data = load_league_model(league)
        if not model_data or "model" not in model_data:
            return []
            
        model = model_data["model"]
        features = model_data.get("features", [])
        
        predictions = []
        for _, match in upcoming.iterrows():
            try:
                # Prepare features for prediction
                X = prepare_features(match, features)
                if X is not None:
                    # Get prediction probabilities
                    probs = model.predict_proba(X)[0]
                    match_dict = {
                        "date": match["date"],
                        "home_team": match["home_team"],
                        "away_team": match["away_team"],
                        "predicted_home_win": float(probs[2]),  # Win
                        "predicted_draw": float(probs[1]),      # Draw
                        "predicted_away_win": float(probs[0])   # Loss
                    }
                    predictions.append(match_dict)
            except Exception as e:
                print(f"Error predicting match {match['home_team']} vs {match['away_team']}: {str(e)}")
                continue
                
        # Sort matches by date
        predictions.sort(key=lambda x: x["date"])
        return predictions
        
    except Exception as e:
        print(f"Error getting upcoming matches for league {league}: {str(e)}")
        return []


def get_league_stats_overview(league: str) -> Dict[str, Any]:
    """
    Get an overview of statistics for a given league.

    Args:
        league: The name of the league.

    Returns:
        A dictionary of aggregated league statistics.
    """
    df = load_league_data(league)
    total_matches = len(df)
    avg_goals = df["total_goals"].mean()
    home_win_pct = (df["result"] == "win").mean()
    draw_pct = (df["result"] == "draw").mean()
    loss_pct = (df["result"] == "loss").mean()
    return {
        "total_matches": total_matches,
        "avg_goals_per_match": round(avg_goals, 2),
        "home_win_percentage": round(home_win_pct * 100, 1),
        "draw_percentage": round(draw_pct * 100, 1),
        "away_win_percentage": round(loss_pct * 100, 1),
    }


def get_season_trends(league: str) -> List[Dict[str, Any]]:
    """
    Get season-by-season trends for average goals.

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries with season and total_goals data.
    """
    df = load_league_data(league)
    df.dropna(subset=["season"], inplace=True)
    if df.empty:
        return []
    trends = df.groupby("season")["total_goals"].mean().round(2).reset_index()
    trends.columns = ["season", "total_goals"]
    return trends.to_dict(orient="records")


def get_result_distribution(league: str) -> List[Dict[str, Any]]:
    """
    Get the distribution of match results (win, draw, loss).

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries representing the result distribution.
    """
    df = load_league_data(league)
    dist = df["result"].value_counts().reset_index()
    dist.columns = ["name", "value"]
    return dist.to_dict(orient="records")


def get_home_away_performance(league: str) -> List[Dict[str, Any]]:
    """
    Get home vs. away performance statistics.

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries with home wins, away wins, and draws.
    """
    df = load_league_data(league)
    home_wins = len(df[df["result"] == "win"])
    away_wins = len(df[df["result"] == "loss"])
    draws = len(df[df["result"] == "draw"])
    return [
        {"name": "Home Wins", "value": home_wins},
        {"name": "Away Wins", "value": away_wins},
        {"name": "Draws", "value": draws},
    ]


def get_goals_distribution(league: str) -> List[Dict[str, Any]]:
    """
    Get the distribution of total goals per match.

    Args:
        league: The name of the league.

    Returns:
        A list of dictionaries representing the goals distribution.
    """
    df = load_league_data(league)
    df.dropna(subset=["total_goals"], inplace=True)
    if df.empty:
        return []
    dist = df["total_goals"].value_counts().sort_index().reset_index()
    dist.columns = ["name", "value"]
    return dist.to_dict(orient="records")