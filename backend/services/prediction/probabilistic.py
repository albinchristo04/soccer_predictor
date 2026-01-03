"""
Probabilistic prediction model using Poisson distribution for goals.
"""

import numpy as np
from scipy import stats
from scipy.special import factorial
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class GoalDistribution:
    """Goal probability distribution for a team."""
    expected_goals: float
    probabilities: np.ndarray  # P(0 goals), P(1 goal), ..., P(max_goals)
    
    def prob(self, goals: int) -> float:
        """Get probability of scoring exactly n goals."""
        if goals < 0 or goals >= len(self.probabilities):
            return 0.0
        return self.probabilities[goals]


@dataclass 
class ScoreMatrix:
    """Probability matrix for all possible scorelines."""
    matrix: np.ndarray  # shape: (max_goals+1, max_goals+1)
    home_expected: float
    away_expected: float
    max_goals: int
    
    def get_prob(self, home: int, away: int) -> float:
        """Get probability of a specific scoreline."""
        if home < 0 or away < 0 or home > self.max_goals or away > self.max_goals:
            return 0.0
        return self.matrix[home, away]
    
    def home_win_prob(self) -> float:
        """Probability of home team winning."""
        total = 0.0
        for h in range(self.max_goals + 1):
            for a in range(h):
                total += self.matrix[h, a]
        return total
    
    def draw_prob(self) -> float:
        """Probability of a draw."""
        return sum(self.matrix[i, i] for i in range(self.max_goals + 1))
    
    def away_win_prob(self) -> float:
        """Probability of away team winning."""
        total = 0.0
        for a in range(self.max_goals + 1):
            for h in range(a):
                total += self.matrix[h, a]
        return total
    
    def over_goals_prob(self, total: float) -> float:
        """Probability of more than N total goals."""
        prob = 0.0
        threshold = int(total)
        for h in range(self.max_goals + 1):
            for a in range(self.max_goals + 1):
                if h + a > threshold:
                    prob += self.matrix[h, a]
        return prob
    
    def btts_prob(self) -> float:
        """Probability of both teams scoring."""
        prob = 0.0
        for h in range(1, self.max_goals + 1):
            for a in range(1, self.max_goals + 1):
                prob += self.matrix[h, a]
        return prob
    
    def most_likely_scores(self, n: int = 5) -> List[Tuple[int, int, float]]:
        """Get N most likely scorelines."""
        scores = []
        for h in range(self.max_goals + 1):
            for a in range(self.max_goals + 1):
                scores.append((h, a, self.matrix[h, a]))
        
        scores.sort(key=lambda x: x[2], reverse=True)
        return scores[:n]


class PoissonModel:
    """
    Poisson-based goal prediction model.
    
    Uses Poisson distribution to model the number of goals
    scored by each team, assuming goals are independent events.
    """
    
    def __init__(self, max_goals: int = 10):
        self.max_goals = max_goals
    
    def calculate_expected_goals(
        self,
        attack_strength: float,
        defense_weakness: float,
        league_avg_goals: float = 1.35,
        home_advantage: float = 0.25
    ) -> float:
        """
        Calculate expected goals for a team.
        
        Args:
            attack_strength: Team's attacking strength relative to league avg (>1 = better)
            defense_weakness: Opponent's defensive weakness relative to league avg (>1 = weaker)
            league_avg_goals: Average goals per team per game in league
            home_advantage: Goals boost for home team
        
        Returns:
            Expected goals (lambda for Poisson)
        """
        xG = attack_strength * defense_weakness * league_avg_goals + home_advantage
        return max(0.3, min(5.0, xG))  # Clamp to reasonable range
    
    def goal_distribution(self, expected_goals: float) -> GoalDistribution:
        """Get probability distribution for goals."""
        probs = np.zeros(self.max_goals + 1)
        
        for k in range(self.max_goals + 1):
            probs[k] = stats.poisson.pmf(k, expected_goals)
        
        # Normalize to ensure probabilities sum to 1
        probs = probs / probs.sum()
        
        return GoalDistribution(
            expected_goals=expected_goals,
            probabilities=probs
        )
    
    def score_matrix(
        self,
        home_xG: float,
        away_xG: float
    ) -> ScoreMatrix:
        """
        Calculate probability matrix for all scorelines.
        
        Assumes home and away goals are independent (bivariate Poisson).
        """
        matrix = np.zeros((self.max_goals + 1, self.max_goals + 1))
        
        home_dist = self.goal_distribution(home_xG)
        away_dist = self.goal_distribution(away_xG)
        
        for h in range(self.max_goals + 1):
            for a in range(self.max_goals + 1):
                matrix[h, a] = home_dist.probabilities[h] * away_dist.probabilities[a]
        
        return ScoreMatrix(
            matrix=matrix,
            home_expected=home_xG,
            away_expected=away_xG,
            max_goals=self.max_goals
        )
    
    def predict_match(
        self,
        home_attack: float,
        home_defense: float,
        away_attack: float,
        away_defense: float,
        league_avg_goals: float = 1.35,
        home_advantage: float = 0.25
    ) -> Dict:
        """
        Make a complete match prediction.
        
        Args:
            home_attack: Home team attack strength (relative to league avg)
            home_defense: Home team defense strength (relative to league avg, higher = better)
            away_attack: Away team attack strength
            away_defense: Away team defense strength
            league_avg_goals: League average goals per team per game
            home_advantage: Home goals advantage
        
        Returns:
            Dict with outcome probabilities, expected goals, and scoreline predictions
        """
        # Calculate expected goals
        # Home xG = home_attack * away_defense_weakness * avg + home_bonus
        # away_defense_weakness = 1 / away_defense (lower defense = higher weakness)
        home_xG = self.calculate_expected_goals(
            home_attack,
            1 / away_defense if away_defense > 0 else 1.0,
            league_avg_goals,
            home_advantage
        )
        
        # Away has no home advantage
        away_xG = self.calculate_expected_goals(
            away_attack,
            1 / home_defense if home_defense > 0 else 1.0,
            league_avg_goals,
            0.0
        )
        
        # Generate score matrix
        matrix = self.score_matrix(home_xG, away_xG)
        
        # Get probabilities
        home_win = matrix.home_win_prob()
        draw = matrix.draw_prob()
        away_win = matrix.away_win_prob()
        
        # Normalize
        total = home_win + draw + away_win
        home_win /= total
        draw /= total
        away_win /= total
        
        # Most likely scores
        likely_scores = matrix.most_likely_scores(5)
        
        return {
            "outcome": {
                "home_win": round(home_win, 4),
                "draw": round(draw, 4),
                "away_win": round(away_win, 4),
            },
            "goals": {
                "home_xG": round(home_xG, 2),
                "away_xG": round(away_xG, 2),
                "total_xG": round(home_xG + away_xG, 2),
                "over_1_5": round(matrix.over_goals_prob(1.5), 4),
                "over_2_5": round(matrix.over_goals_prob(2.5), 4),
                "over_3_5": round(matrix.over_goals_prob(3.5), 4),
                "btts": round(matrix.btts_prob(), 4),
            },
            "scorelines": [
                {"score": f"{s[0]}-{s[1]}", "probability": round(s[2], 4)}
                for s in likely_scores
            ],
            "matrix": matrix,
        }


class HybridPredictionModel:
    """
    Combines ML classifier with Poisson model for comprehensive predictions.
    
    Uses:
    1. XGBoost/GradientBoosting for outcome classification
    2. Poisson model for goal predictions and scorelines
    3. ELO ratings for team strength estimation
    """
    
    def __init__(
        self,
        outcome_model=None,
        poisson_model: Optional[PoissonModel] = None,
        league_avg_goals: float = 1.35,
        home_advantage: float = 0.25
    ):
        self.outcome_model = outcome_model
        self.poisson = poisson_model or PoissonModel()
        self.league_avg_goals = league_avg_goals
        self.home_advantage = home_advantage
    
    def elo_to_attack_defense(
        self,
        elo: float,
        goals_per_game: float,
        conceded_per_game: float
    ) -> Tuple[float, float]:
        """
        Convert ELO and stats to attack/defense strength.
        
        Attack strength: relative to league average (1.0 = average)
        Defense strength: relative to league average (>1 = better defense)
        """
        elo_factor = (elo - 1500) / 400  # -1 to 1 for typical ELO range
        
        # Attack strength based on goals and ELO
        attack = (goals_per_game / self.league_avg_goals) * (1 + elo_factor * 0.2)
        attack = max(0.5, min(2.0, attack))
        
        # Defense strength (higher = better, concedes less)
        if conceded_per_game > 0:
            defense = self.league_avg_goals / conceded_per_game
        else:
            defense = 1.5
        defense = defense * (1 + elo_factor * 0.1)
        defense = max(0.5, min(2.0, defense))
        
        return attack, defense
    
    def predict(
        self,
        home_elo: float,
        away_elo: float,
        home_goals_pg: float,
        home_conceded_pg: float,
        away_goals_pg: float,
        away_conceded_pg: float,
        features: Optional[np.ndarray] = None
    ) -> Dict:
        """
        Make a complete match prediction.
        """
        # Get attack/defense strengths
        home_attack, home_defense = self.elo_to_attack_defense(
            home_elo, home_goals_pg, home_conceded_pg
        )
        away_attack, away_defense = self.elo_to_attack_defense(
            away_elo, away_goals_pg, away_conceded_pg
        )
        
        # Poisson predictions for goals
        poisson_pred = self.poisson.predict_match(
            home_attack, home_defense,
            away_attack, away_defense,
            self.league_avg_goals,
            self.home_advantage
        )
        
        # If we have an ML model and features, use it for outcome
        if self.outcome_model is not None and features is not None:
            try:
                ml_probs = self.outcome_model.predict_proba(features.reshape(1, -1))[0]
                
                # Blend ML and Poisson predictions (60% ML, 40% Poisson)
                poisson_probs = [
                    poisson_pred["outcome"]["home_win"],
                    poisson_pred["outcome"]["draw"],
                    poisson_pred["outcome"]["away_win"]
                ]
                
                blended = [
                    0.6 * ml_probs[i] + 0.4 * poisson_probs[i]
                    for i in range(3)
                ]
                
                # Normalize
                total = sum(blended)
                poisson_pred["outcome"]["home_win"] = round(blended[0] / total, 4)
                poisson_pred["outcome"]["draw"] = round(blended[1] / total, 4)
                poisson_pred["outcome"]["away_win"] = round(blended[2] / total, 4)
                
            except Exception:
                pass  # Fall back to Poisson-only
        
        # Calculate confidence
        probs = [
            poisson_pred["outcome"]["home_win"],
            poisson_pred["outcome"]["draw"],
            poisson_pred["outcome"]["away_win"]
        ]
        max_prob = max(probs)
        entropy = -sum(p * np.log(p + 1e-10) for p in probs)
        max_entropy = -3 * (1/3) * np.log(1/3)  # Entropy of uniform distribution
        confidence = 1 - (entropy / max_entropy)
        
        poisson_pred["outcome"]["confidence"] = round(confidence, 4)
        
        # Remove the matrix from output (too large for JSON)
        del poisson_pred["matrix"]
        
        return poisson_pred


# Monte Carlo simulation for more detailed scoreline predictions
def monte_carlo_simulation(
    home_xG: float,
    away_xG: float,
    n_simulations: int = 10000
) -> Dict:
    """
    Run Monte Carlo simulation for match outcome.
    
    Returns detailed statistics from simulated matches.
    """
    home_goals = np.random.poisson(home_xG, n_simulations)
    away_goals = np.random.poisson(away_xG, n_simulations)
    
    home_wins = np.sum(home_goals > away_goals)
    draws = np.sum(home_goals == away_goals)
    away_wins = np.sum(home_goals < away_goals)
    
    # Most common scorelines
    from collections import Counter
    scores = Counter(zip(home_goals, away_goals))
    most_common = scores.most_common(10)
    
    return {
        "n_simulations": n_simulations,
        "home_win_prob": home_wins / n_simulations,
        "draw_prob": draws / n_simulations,
        "away_win_prob": away_wins / n_simulations,
        "avg_home_goals": home_goals.mean(),
        "avg_away_goals": away_goals.mean(),
        "avg_total_goals": (home_goals + away_goals).mean(),
        "most_common_scores": [
            {"score": f"{s[0]}-{s[1]}", "count": c, "probability": c / n_simulations}
            for (s, c) in most_common
        ],
        "over_2_5_prob": np.sum(home_goals + away_goals > 2.5) / n_simulations,
        "btts_prob": np.sum((home_goals > 0) & (away_goals > 0)) / n_simulations,
    }
