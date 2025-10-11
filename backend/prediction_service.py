"""
Prediction service handling model loading and predictions.
"""
import os
import joblib
import pandas as pd
from typing import Dict, Tuple, List
from functools import lru_cache

# Constants
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")

@lru_cache(maxsize=10)  # Cache up to 10 loaded models
def load_league_model(league: str) -> Dict:
    """Load trained model with caching."""
    model_path = os.path.join(DATA_DIR, league, "model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model for '{league}' not found")
    return joblib.load(model_path)

@lru_cache(maxsize=10)  # Cache processed data
def load_league_data(league: str) -> pd.DataFrame:
    """Load processed match data with caching."""
    data_path = os.path.join(PROCESSED_DIR, f"{league}_processed.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data for '{league}' not found")
    return pd.read_csv(data_path, low_memory=False)

def get_team_stats(df: pd.DataFrame, team_name: str, model_data: Dict) -> pd.Series:
    """Calculate team statistics."""
    home_matches = df[df['home_team'].str.lower() == team_name.lower()]
    away_matches = df[df['away_team'].str.lower() == team_name.lower()]
    
    if home_matches.empty and away_matches.empty:
        raise ValueError(f"Team '{team_name}' not found in data")
    
    feature_cols = model_data['feature_cols']
    
    # Get home and away stats
    home_features = home_matches[feature_cols].mean() if not home_matches.empty else pd.Series(0, index=feature_cols)
    away_features = away_matches[feature_cols].mean() if not away_matches.empty else pd.Series(0, index=feature_cols)
    
    # Weight home performance more heavily
    combined = (home_features * 0.6 + away_features * 0.4)
    return combined.fillna(0)

def find_team(team_input: str, df: pd.DataFrame) -> str:
    """Find exact or closest matching team name."""
    team_input = team_input.strip().lower()
    available_teams = sorted(set(df['home_team'].unique()) | set(df['away_team'].unique()))
    
    # Try exact match first
    for team in available_teams:
        if team.lower() == team_input:
            return team
            
    # Try partial match
    for team in available_teams:
        if team_input in team.lower():
            return team
            
    raise ValueError(f"Team '{team_input}' not found. Available teams: {', '.join(sorted(available_teams)[:10])}...")

def get_league_teams(league: str) -> List[str]:
    """Get all teams in a league."""
    df = load_league_data(league)
    teams = sorted(set(df['home_team'].unique()) | set(df['away_team'].unique()))
    return [t for t in teams if pd.notna(t)]

def predict_head_to_head(league: str, home_team: str, away_team: str) -> Dict[str, float]:
    """Make head-to-head prediction."""
    model_data = load_league_model(league)
    df = load_league_data(league)
    
    # Find teams
    home_team = find_team(home_team, df)
    away_team = find_team(away_team, df)
    
    # Get team stats
    home_stats = get_team_stats(df, home_team, model_data)
    away_stats = get_team_stats(df, away_team, model_data)
    
    # Calculate feature differences
    feature_diff = (home_stats - away_stats).values.reshape(1, -1)
    
    # Predict
    model = model_data['model']
    proba = model.predict_proba(feature_diff)[0]
    classes = model_data['classes']
    
    return {
        'home_win': float(proba[classes.index('win')]),
        'draw': float(proba[classes.index('draw')]),
        'away_win': float(proba[classes.index('loss')]),
        'home_team': home_team,
        'away_team': away_team
    }

def predict_cross_league(team_a: str, league_a: str, team_b: str, league_b: str) -> Dict[str, float]:
    """Make cross-league prediction."""
    # Load models and data
    model_data_a = load_league_model(league_a)
    model_data_b = load_league_model(league_b)
    df_a = load_league_data(league_a)
    df_b = load_league_data(league_b)
    
    # Find teams
    team_a = find_team(team_a, df_a)
    team_b = find_team(team_b, df_b)
    
    # Get stats
    stats_a = get_team_stats(df_a, team_a, model_data_a)
    stats_b = get_team_stats(df_b, team_b, model_data_b)
    
    # Normalize stats
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    stats_normalized = scaler.fit_transform([stats_a.values, stats_b.values])
    feature_diff = (stats_normalized[0] - stats_normalized[1]).reshape(1, -1)
    
    # Ensemble prediction using both models
    model_a = model_data_a['model']
    model_b = model_data_b['model']
    
    proba_a = model_a.predict_proba(feature_diff)[0]
    proba_b = model_b.predict_proba(feature_diff)[0]
    
    # Weight by model accuracy
    weight_a = model_data_a['test_accuracy']
    weight_b = model_data_b['test_accuracy']
    
    classes = model_data_a['classes']
    proba_ensemble = (proba_a * weight_a + proba_b * weight_b) / (weight_a + weight_b)
    
    return {
        'team_a_win': float(proba_ensemble[classes.index('win')]),
        'draw': float(proba_ensemble[classes.index('draw')]),
        'team_b_win': float(proba_ensemble[classes.index('loss')]),
        'team_a': team_a,
        'team_b': team_b,
        'league_a': league_a,
        'league_b': league_b
    }