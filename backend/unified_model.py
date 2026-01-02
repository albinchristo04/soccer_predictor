"""
Unified Model Service for Soccer Predictor.

This module provides a single, unified model architecture trained on all leagues
for more accurate cross-league predictions and consistent performance evaluation.

Features:
- Single model trained on normalized data from all leagues
- Real-time feature updates based on current season performance
- League strength coefficients for cross-league comparisons
- ELO-style rating system for teams
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from functools import lru_cache
from datetime import datetime, timedelta
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

# Constants
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "fbref_data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
MODEL_PATH = os.path.join(DATA_DIR, "unified_model.pkl")

# League strength coefficients (based on UEFA rankings and historical performance)
LEAGUE_COEFFICIENTS = {
    "premier_league": 1.0,
    "la_liga": 0.95,
    "bundesliga": 0.90,
    "serie_a": 0.88,
    "ligue_1": 0.82,
    "ucl": 1.05,  # Champions League teams are elite
    "uel": 0.85,
    "mls": 0.70,
    "world_cup": 1.0,  # National teams - different scale
}

# Initial ELO ratings for teams (default starting point)
DEFAULT_ELO = 1500
K_FACTOR = 32  # How quickly ratings change


class TeamRatingSystem:
    """ELO-style rating system for teams."""
    
    def __init__(self):
        self.ratings: Dict[str, float] = {}
        self.form: Dict[str, List[str]] = {}  # Last 5 results
        self.goals_scored: Dict[str, List[int]] = {}
        self.goals_conceded: Dict[str, List[int]] = {}
    
    def get_rating(self, team: str, league: str) -> float:
        """Get team rating with league coefficient applied."""
        key = f"{league}:{team.lower()}"
        base_rating = self.ratings.get(key, DEFAULT_ELO)
        coefficient = LEAGUE_COEFFICIENTS.get(league, 0.8)
        return base_rating * coefficient
    
    def update_rating(self, team: str, league: str, result: str, 
                     goals_for: int, goals_against: int, opponent_rating: float):
        """Update team rating after a match."""
        key = f"{league}:{team.lower()}"
        current = self.ratings.get(key, DEFAULT_ELO)
        
        # Expected score based on rating difference
        expected = 1 / (1 + 10 ** ((opponent_rating - current) / 400))
        
        # Actual score
        if result == 'W':
            actual = 1.0
        elif result == 'D':
            actual = 0.5
        else:
            actual = 0.0
        
        # Goal difference bonus
        gd = goals_for - goals_against
        gd_multiplier = 1 + (abs(gd) * 0.1) if gd != 0 else 1
        
        # Update rating
        new_rating = current + K_FACTOR * gd_multiplier * (actual - expected)
        self.ratings[key] = max(1000, min(2500, new_rating))  # Clamp between 1000-2500
        
        # Update form
        if key not in self.form:
            self.form[key] = []
        self.form[key].insert(0, result)
        self.form[key] = self.form[key][:10]  # Keep last 10
        
        # Update goals
        if key not in self.goals_scored:
            self.goals_scored[key] = []
            self.goals_conceded[key] = []
        self.goals_scored[key].insert(0, goals_for)
        self.goals_conceded[key].insert(0, goals_against)
        self.goals_scored[key] = self.goals_scored[key][:10]
        self.goals_conceded[key] = self.goals_conceded[key][:10]
    
    def get_form_score(self, team: str, league: str) -> float:
        """Get form score (0-1) based on recent results."""
        key = f"{league}:{team.lower()}"
        form = self.form.get(key, [])
        if not form:
            return 0.5
        
        points = sum(3 if r == 'W' else 1 if r == 'D' else 0 for r in form[:5])
        return points / 15  # Max 15 points from 5 games
    
    def get_avg_goals(self, team: str, league: str) -> Tuple[float, float]:
        """Get average goals scored and conceded."""
        key = f"{league}:{team.lower()}"
        scored = self.goals_scored.get(key, [])
        conceded = self.goals_conceded.get(key, [])
        
        avg_scored = np.mean(scored) if scored else 1.5
        avg_conceded = np.mean(conceded) if conceded else 1.5
        return avg_scored, avg_conceded
    
    def to_dict(self) -> Dict:
        """Serialize to dictionary."""
        return {
            'ratings': self.ratings,
            'form': self.form,
            'goals_scored': self.goals_scored,
            'goals_conceded': self.goals_conceded,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'TeamRatingSystem':
        """Deserialize from dictionary."""
        system = cls()
        system.ratings = data.get('ratings', {})
        system.form = data.get('form', {})
        system.goals_scored = data.get('goals_scored', {})
        system.goals_conceded = data.get('goals_conceded', {})
        return system


class UnifiedPredictor:
    """Unified prediction model for all leagues."""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.rating_system = TeamRatingSystem()
        self.feature_cols = [
            'home_rating', 'away_rating', 'rating_diff',
            'home_form', 'away_form', 'form_diff',
            'home_avg_scored', 'home_avg_conceded',
            'away_avg_scored', 'away_avg_conceded',
            'league_coefficient', 'is_home_advantage',
        ]
        self.is_trained = False
    
    def load_all_league_data(self) -> pd.DataFrame:
        """Load and combine data from all leagues."""
        all_data = []
        
        leagues = ['premier_league', 'la_liga', 'bundesliga', 'serie_a', 
                   'ligue_1', 'mls', 'ucl', 'uel']
        
        for league in leagues:
            try:
                path = os.path.join(PROCESSED_DIR, f"{league}_processed.csv")
                if os.path.exists(path):
                    df = pd.read_csv(path, low_memory=False)
                    df['league'] = league
                    # Only keep played matches with valid results
                    df = df[df['status'] == 'played'].copy()
                    df = df.dropna(subset=['home_goals', 'away_goals', 'result'])
                    all_data.append(df)
                    print(f"Loaded {len(df)} matches from {league}")
            except Exception as e:
                print(f"Error loading {league}: {e}")
                continue
        
        if not all_data:
            raise ValueError("No league data found")
        
        combined = pd.concat(all_data, ignore_index=True)
        print(f"Total matches loaded: {len(combined)}")
        return combined
    
    def build_team_ratings(self, df: pd.DataFrame):
        """Build team ratings from historical data."""
        # Sort by date
        df = df.copy()
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        df = df.dropna(subset=['date'])
        df = df.sort_values('date')
        
        print("Building team ratings from historical matches...")
        
        for _, row in df.iterrows():
            league = row['league']
            home_team = row['home_team']
            away_team = row['away_team']
            home_goals = int(row['home_goals'])
            away_goals = int(row['away_goals'])
            
            # Get current ratings before update
            home_rating = self.rating_system.get_rating(home_team, league)
            away_rating = self.rating_system.get_rating(away_team, league)
            
            # Determine results
            if home_goals > away_goals:
                home_result, away_result = 'W', 'L'
            elif home_goals < away_goals:
                home_result, away_result = 'L', 'W'
            else:
                home_result, away_result = 'D', 'D'
            
            # Update ratings
            self.rating_system.update_rating(
                home_team, league, home_result, home_goals, away_goals, away_rating
            )
            self.rating_system.update_rating(
                away_team, league, away_result, away_goals, home_goals, home_rating
            )
        
        print(f"Built ratings for {len(self.rating_system.ratings)} teams")
    
    def extract_features(self, home_team: str, away_team: str, 
                        league: str, home_league: str = None, 
                        away_league: str = None) -> np.ndarray:
        """Extract features for a match prediction."""
        if home_league is None:
            home_league = league
        if away_league is None:
            away_league = league
        
        # Get ratings
        home_rating = self.rating_system.get_rating(home_team, home_league)
        away_rating = self.rating_system.get_rating(away_team, away_league)
        
        # Get form
        home_form = self.rating_system.get_form_score(home_team, home_league)
        away_form = self.rating_system.get_form_score(away_team, away_league)
        
        # Get goal averages
        home_avg_scored, home_avg_conceded = self.rating_system.get_avg_goals(home_team, home_league)
        away_avg_scored, away_avg_conceded = self.rating_system.get_avg_goals(away_team, away_league)
        
        # League coefficient
        league_coef = LEAGUE_COEFFICIENTS.get(league, 0.8)
        
        features = np.array([
            home_rating,
            away_rating,
            home_rating - away_rating,
            home_form,
            away_form,
            home_form - away_form,
            home_avg_scored,
            home_avg_conceded,
            away_avg_scored,
            away_avg_conceded,
            league_coef,
            1.0,  # Home advantage factor
        ]).reshape(1, -1)
        
        return features
    
    def train(self, force_retrain: bool = False):
        """Train the unified model on all league data."""
        # Check if model already exists
        if os.path.exists(MODEL_PATH) and not force_retrain:
            print("Loading existing unified model...")
            self.load()
            return
        
        print("Training unified model on all leagues...")
        
        # Load all data
        df = self.load_all_league_data()
        
        # Build ratings from historical data
        self.build_team_ratings(df)
        
        # Now extract features for training
        # Use recent seasons only for training (last 5 years)
        df['date'] = pd.to_datetime(df['date'], errors='coerce')
        cutoff_date = datetime.now() - timedelta(days=5*365)
        recent_df = df[df['date'] >= cutoff_date].copy()
        
        if len(recent_df) < 1000:
            recent_df = df.tail(50000)  # Use last 50k matches if not enough recent
        
        print(f"Training on {len(recent_df)} recent matches")
        
        X = []
        y = []
        
        for _, row in recent_df.iterrows():
            try:
                features = self.extract_features(
                    row['home_team'], row['away_team'], row['league']
                )
                X.append(features.flatten())
                y.append(row['result'])
            except Exception:
                continue
        
        X = np.array(X)
        y = np.array(y)
        
        # Train model
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train gradient boosting classifier
        self.model = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_acc = self.model.score(X_train_scaled, y_train)
        test_acc = self.model.score(X_test_scaled, y_test)
        print(f"Training accuracy: {train_acc:.3f}")
        print(f"Test accuracy: {test_acc:.3f}")
        
        self.is_trained = True
        self.save()
    
    def predict(self, home_team: str, away_team: str, league: str,
               home_league: str = None, away_league: str = None) -> Dict[str, Any]:
        """Make a prediction for a match."""
        if not self.is_trained:
            self.train()
        
        features = self.extract_features(
            home_team, away_team, league, home_league, away_league
        )
        features_scaled = self.scaler.transform(features)
        
        # Get probabilities
        probs = self.model.predict_proba(features_scaled)[0]
        classes = self.model.classes_
        
        prob_dict = {}
        for cls, prob in zip(classes, probs):
            prob_dict[cls] = float(prob)
        
        # Predict scoreline based on team averages and probabilities
        home_avg_scored, home_avg_conceded = self.rating_system.get_avg_goals(
            home_team, home_league or league
        )
        away_avg_scored, away_avg_conceded = self.rating_system.get_avg_goals(
            away_team, away_league or league
        )
        
        # Expected goals based on attack vs defense matchup
        home_xg = (home_avg_scored + away_avg_conceded) / 2
        away_xg = (away_avg_scored + home_avg_conceded) / 2
        
        # Adjust based on win probability
        home_win_prob = prob_dict.get('win', 0.33)
        away_win_prob = prob_dict.get('loss', 0.33)
        
        if home_win_prob > away_win_prob:
            home_xg *= 1.1
            away_xg *= 0.9
        elif away_win_prob > home_win_prob:
            home_xg *= 0.9
            away_xg *= 1.1
        
        # Get team ratings for confidence
        home_rating = self.rating_system.get_rating(home_team, home_league or league)
        away_rating = self.rating_system.get_rating(away_team, away_league or league)
        
        return {
            'home_win': prob_dict.get('win', 0.33),
            'draw': prob_dict.get('draw', 0.33),
            'away_win': prob_dict.get('loss', 0.33),
            'predicted_home_goals': round(home_xg, 1),
            'predicted_away_goals': round(away_xg, 1),
            'home_team': home_team,
            'away_team': away_team,
            'home_rating': home_rating,
            'away_rating': away_rating,
            'home_form': self.rating_system.get_form_score(home_team, home_league or league),
            'away_form': self.rating_system.get_form_score(away_team, away_league or league),
            'confidence': max(probs),
        }
    
    def update_with_result(self, home_team: str, away_team: str, league: str,
                          home_goals: int, away_goals: int):
        """Update model with a new match result (for real-time updates)."""
        home_rating = self.rating_system.get_rating(home_team, league)
        away_rating = self.rating_system.get_rating(away_team, league)
        
        if home_goals > away_goals:
            home_result, away_result = 'W', 'L'
        elif home_goals < away_goals:
            home_result, away_result = 'L', 'W'
        else:
            home_result, away_result = 'D', 'D'
        
        self.rating_system.update_rating(
            home_team, league, home_result, home_goals, away_goals, away_rating
        )
        self.rating_system.update_rating(
            away_team, league, away_result, away_goals, home_goals, home_rating
        )
    
    def save(self):
        """Save the model to disk."""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'rating_system': self.rating_system.to_dict(),
            'feature_cols': self.feature_cols,
            'is_trained': self.is_trained,
        }
        joblib.dump(model_data, MODEL_PATH)
        print(f"Model saved to {MODEL_PATH}")
    
    def load(self):
        """Load the model from disk."""
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError("Unified model not found. Train first.")
        
        model_data = joblib.load(MODEL_PATH)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.rating_system = TeamRatingSystem.from_dict(model_data['rating_system'])
        self.feature_cols = model_data['feature_cols']
        self.is_trained = model_data['is_trained']
        print("Unified model loaded successfully")
    
    def get_team_info(self, team: str, league: str) -> Dict[str, Any]:
        """Get detailed team information."""
        rating = self.rating_system.get_rating(team, league)
        form = self.rating_system.get_form_score(team, league)
        avg_scored, avg_conceded = self.rating_system.get_avg_goals(team, league)
        
        key = f"{league}:{team.lower()}"
        recent_form = self.rating_system.form.get(key, [])[:5]
        
        return {
            'team': team,
            'league': league,
            'rating': rating,
            'form_score': form,
            'recent_form': recent_form,
            'avg_goals_scored': avg_scored,
            'avg_goals_conceded': avg_conceded,
            'rating_tier': self._get_rating_tier(rating),
        }
    
    def _get_rating_tier(self, rating: float) -> str:
        """Get tier description based on rating."""
        if rating >= 2000:
            return "Elite"
        elif rating >= 1800:
            return "Top Tier"
        elif rating >= 1600:
            return "Strong"
        elif rating >= 1400:
            return "Average"
        elif rating >= 1200:
            return "Below Average"
        else:
            return "Weak"


# Global instance
_unified_predictor: Optional[UnifiedPredictor] = None


def get_unified_predictor() -> UnifiedPredictor:
    """Get or create the unified predictor instance."""
    global _unified_predictor
    if _unified_predictor is None:
        _unified_predictor = UnifiedPredictor()
        try:
            _unified_predictor.load()
        except FileNotFoundError:
            print("Training unified model for first time...")
            _unified_predictor.train()
    return _unified_predictor


def predict_match(home_team: str, away_team: str, league: str,
                 home_league: str = None, away_league: str = None) -> Dict[str, Any]:
    """Convenience function to predict a match."""
    predictor = get_unified_predictor()
    return predictor.predict(home_team, away_team, league, home_league, away_league)
