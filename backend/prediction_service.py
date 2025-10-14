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

def load_league_model(league: str) -> Dict:
    """Load trained model."""
    model_path = os.path.join(DATA_DIR, league, "model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model for '{league}' not found")
    return joblib.load(model_path)

def load_league_data(league: str) -> pd.DataFrame:
    """Load processed match data."""
    data_path = os.path.join(PROCESSED_DIR, f"{league}_processed.csv")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Data for '{league}' not found")
    df = pd.read_csv(data_path, low_memory=False)
    df['total_goals'] = df['home_goals'] + df['away_goals']
    return df

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

# --------------------------
# Analytics Functions
# --------------------------

def get_league_stats_overview(league: str) -> Dict:
    """Get overall league statistics."""
    df = load_league_data(league)
    total_matches = len(df)
    avg_goals = df['total_goals'].mean()
    home_win_pct = (df['result'] == 'win').mean()
    draw_pct = (df['result'] == 'draw').mean()
    loss_pct = (df['result'] == 'loss').mean()
    return {
        'total_matches': total_matches,
        'avg_goals_per_match': round(avg_goals, 2),
        'home_win_percentage': round(home_win_pct * 100, 1),
        'draw_percentage': round(draw_pct * 100, 1),
        'away_win_percentage': round(loss_pct * 100, 1),
    }

def get_season_trends(league: str) -> List[Dict]:
    """Get season trends for average goals."""
    try:
        df = load_league_data(league)
        
        # -- Debugging --
        print(f"--- Debugging get_season_trends for {league} ---")
        print(f"DataFrame shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        
        if 'season' not in df.columns:
            print("Error: 'season' column not found!")
            return []
            
        print(f"Season column data type: {df['season'].dtype}")
        print(f"Total goals column data type: {df['total_goals'].dtype}")
        
        print(f"Unique seasons found: {df['season'].unique()}")
        print(f"NaNs in season column: {df['season'].isnull().sum()}")

        # Drop rows where season is NaN
        df.dropna(subset=['season'], inplace=True)

        if df.empty:
            print("DataFrame is empty after dropping NaNs in 'season'.")
            return []

        trends = df.groupby('season')['total_goals'].mean().round(2).reset_index()
        trends.columns = ['season', 'total_goals'] # Rename for consistency
        
        print("Successfully calculated trends:")
        print(trends)
        
        return trends.to_dict(orient='records')

    except Exception as e:
        print(f"An error occurred in get_season_trends: {e}")
        return []

def get_result_distribution(league: str) -> List[Dict]:

    """Get distribution of match results."""

    df = load_league_data(league)

    dist = df['result'].value_counts().reset_index()

    dist.columns = ['name', 'value']

    return dist.to_dict(orient='records')



def get_home_away_performance(league: str) -> List[Dict]:

    """Get home vs away performance."""

    df = load_league_data(league)

    home_wins = len(df[df['result'] == 'win'])

    away_wins = len(df[df['result'] == 'loss'])

    draws = len(df[df['result'] == 'draw'])

    return [

        {"name": "Home Wins", "value": home_wins},

        {"name": "Away Wins", "value": away_wins},

        {"name": "Draws", "value": draws}

    ]



def get_goals_distribution(league: str) -> List[Dict]:
    """Get distribution of total goals per match."""
    try:
        df = load_league_data(league)
        
        # -- Debugging --
        print(f"--- Debugging get_goals_distribution for {league} ---")
        print(f"DataFrame shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        
        if 'total_goals' not in df.columns:
            print("Error: 'total_goals' column not found!")
            return []
            
        print(f"Total goals column data type: {df['total_goals'].dtype}")
        print(f"NaNs in total_goals column: {df['total_goals'].isnull().sum()}")

        # Drop rows where total_goals is NaN
        df.dropna(subset=['total_goals'], inplace=True)

        if df.empty:
            print("DataFrame is empty after dropping NaNs in 'total_goals'.")
            return []

        dist = df['total_goals'].value_counts().sort_index().reset_index()
        dist.columns = ['name', 'value']
        
        print("Successfully calculated distribution:")
        print(dist)
        
        return dist.to_dict(orient='records')

    except Exception as e:
        print(f"An error occurred in get_goals_distribution: {e}")
        return []
