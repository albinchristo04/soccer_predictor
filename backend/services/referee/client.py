"""
Referee Statistics Service.

Provides referee data and analysis:
- Referee statistics (cards per game, penalties given, etc.)
- Team performance with specific referees
- Historical data for prediction adjustments
"""

from typing import Optional, Dict, List, Any
from dataclasses import dataclass, field
from datetime import datetime
import logging
import httpx

logger = logging.getLogger(__name__)


@dataclass
class RefereeStatistics:
    """Statistics for a referee."""
    matches_officiated: int = 0
    yellow_cards_per_game: float = 0.0
    red_cards_per_game: float = 0.0
    penalties_per_game: float = 0.0
    fouls_per_game: float = 0.0
    home_win_rate: float = 0.0
    draw_rate: float = 0.0
    away_win_rate: float = 0.0
    avg_goals_per_game: float = 0.0
    avg_added_time: float = 0.0
    strictness_rating: float = 0.5  # 0-1 scale, higher = stricter


@dataclass
class TeamRefereePerformance:
    """Team's historical performance with a specific referee."""
    team_name: str
    referee_name: str
    matches: int = 0
    wins: int = 0
    draws: int = 0
    losses: int = 0
    goals_scored: int = 0
    goals_conceded: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    penalties_for: int = 0
    penalties_against: int = 0
    
    @property
    def win_rate(self) -> float:
        return self.wins / self.matches if self.matches > 0 else 0.0
    
    @property
    def cards_per_game(self) -> float:
        return (self.yellow_cards + self.red_cards * 2) / self.matches if self.matches > 0 else 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "team": self.team_name,
            "referee": self.referee_name,
            "matches": self.matches,
            "record": f"{self.wins}W-{self.draws}D-{self.losses}L",
            "winRate": round(self.win_rate, 3),
            "goalsScored": self.goals_scored,
            "goalsConceded": self.goals_conceded,
            "yellowCards": self.yellow_cards,
            "redCards": self.red_cards,
            "cardsPerGame": round(self.cards_per_game, 2),
            "penaltiesFor": self.penalties_for,
            "penaltiesAgainst": self.penalties_against,
        }


@dataclass
class RefereeData:
    """Complete referee data for a match."""
    name: str
    nationality: str = ""
    age: int = 0
    experience_years: int = 0
    statistics: RefereeStatistics = field(default_factory=RefereeStatistics)
    home_team_history: Optional[TeamRefereePerformance] = None
    away_team_history: Optional[TeamRefereePerformance] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "nationality": self.nationality,
            "age": self.age,
            "experienceYears": self.experience_years,
            "statistics": {
                "matchesOfficiated": self.statistics.matches_officiated,
                "yellowCardsPerGame": round(self.statistics.yellow_cards_per_game, 2),
                "redCardsPerGame": round(self.statistics.red_cards_per_game, 2),
                "penaltiesPerGame": round(self.statistics.penalties_per_game, 2),
                "foulsPerGame": round(self.statistics.fouls_per_game, 1),
                "homeWinRate": round(self.statistics.home_win_rate, 3),
                "drawRate": round(self.statistics.draw_rate, 3),
                "awayWinRate": round(self.statistics.away_win_rate, 3),
                "avgGoalsPerGame": round(self.statistics.avg_goals_per_game, 2),
                "strictnessRating": round(self.statistics.strictness_rating, 2),
            },
            "homeTeamHistory": self.home_team_history.to_dict() if self.home_team_history else None,
            "awayTeamHistory": self.away_team_history.to_dict() if self.away_team_history else None,
        }


# Known referee data (would be fetched from API in production)
REFEREE_DATABASE: Dict[str, Dict[str, Any]] = {
    # Premier League referees
    "Michael Oliver": {
        "nationality": "England",
        "experience_years": 14,
        "stats": {
            "matches_officiated": 300,
            "yellow_cards_per_game": 3.8,
            "red_cards_per_game": 0.15,
            "penalties_per_game": 0.32,
            "fouls_per_game": 22.5,
            "home_win_rate": 0.46,
            "draw_rate": 0.24,
            "away_win_rate": 0.30,
            "avg_goals_per_game": 2.78,
            "strictness_rating": 0.65,
        }
    },
    "Anthony Taylor": {
        "nationality": "England",
        "experience_years": 15,
        "stats": {
            "matches_officiated": 320,
            "yellow_cards_per_game": 4.1,
            "red_cards_per_game": 0.18,
            "penalties_per_game": 0.28,
            "fouls_per_game": 24.2,
            "home_win_rate": 0.44,
            "draw_rate": 0.26,
            "away_win_rate": 0.30,
            "avg_goals_per_game": 2.65,
            "strictness_rating": 0.72,
        }
    },
    "Paul Tierney": {
        "nationality": "England",
        "experience_years": 12,
        "stats": {
            "matches_officiated": 180,
            "yellow_cards_per_game": 3.5,
            "red_cards_per_game": 0.12,
            "penalties_per_game": 0.35,
            "fouls_per_game": 21.8,
            "home_win_rate": 0.48,
            "draw_rate": 0.22,
            "away_win_rate": 0.30,
            "avg_goals_per_game": 2.92,
            "strictness_rating": 0.55,
        }
    },
    "Chris Kavanagh": {
        "nationality": "England",
        "experience_years": 10,
        "stats": {
            "matches_officiated": 150,
            "yellow_cards_per_game": 3.9,
            "red_cards_per_game": 0.14,
            "penalties_per_game": 0.30,
            "fouls_per_game": 23.1,
            "home_win_rate": 0.45,
            "draw_rate": 0.25,
            "away_win_rate": 0.30,
            "avg_goals_per_game": 2.72,
            "strictness_rating": 0.60,
        }
    },
    "Simon Hooper": {
        "nationality": "England",
        "experience_years": 8,
        "stats": {
            "matches_officiated": 120,
            "yellow_cards_per_game": 4.2,
            "red_cards_per_game": 0.16,
            "penalties_per_game": 0.25,
            "fouls_per_game": 25.0,
            "home_win_rate": 0.43,
            "draw_rate": 0.27,
            "away_win_rate": 0.30,
            "avg_goals_per_game": 2.58,
            "strictness_rating": 0.70,
        }
    },
    "John Brooks": {
        "nationality": "England",
        "experience_years": 6,
        "stats": {
            "matches_officiated": 80,
            "yellow_cards_per_game": 3.7,
            "red_cards_per_game": 0.11,
            "penalties_per_game": 0.28,
            "fouls_per_game": 22.0,
            "home_win_rate": 0.47,
            "draw_rate": 0.24,
            "away_win_rate": 0.29,
            "avg_goals_per_game": 2.85,
            "strictness_rating": 0.58,
        }
    },
    # La Liga referees
    "Jesús Gil Manzano": {
        "nationality": "Spain",
        "experience_years": 12,
        "stats": {
            "matches_officiated": 200,
            "yellow_cards_per_game": 5.2,
            "red_cards_per_game": 0.22,
            "penalties_per_game": 0.35,
            "fouls_per_game": 28.5,
            "home_win_rate": 0.48,
            "draw_rate": 0.25,
            "away_win_rate": 0.27,
            "avg_goals_per_game": 2.45,
            "strictness_rating": 0.75,
        }
    },
    "Antonio Mateu Lahoz": {
        "nationality": "Spain",
        "experience_years": 15,
        "stats": {
            "matches_officiated": 280,
            "yellow_cards_per_game": 5.5,
            "red_cards_per_game": 0.25,
            "penalties_per_game": 0.32,
            "fouls_per_game": 30.0,
            "home_win_rate": 0.45,
            "draw_rate": 0.28,
            "away_win_rate": 0.27,
            "avg_goals_per_game": 2.35,
            "strictness_rating": 0.80,
        }
    },
    # Serie A referees
    "Daniele Orsato": {
        "nationality": "Italy",
        "experience_years": 18,
        "stats": {
            "matches_officiated": 350,
            "yellow_cards_per_game": 4.8,
            "red_cards_per_game": 0.20,
            "penalties_per_game": 0.30,
            "fouls_per_game": 26.5,
            "home_win_rate": 0.46,
            "draw_rate": 0.26,
            "away_win_rate": 0.28,
            "avg_goals_per_game": 2.55,
            "strictness_rating": 0.68,
        }
    },
    # Bundesliga referees
    "Felix Zwayer": {
        "nationality": "Germany",
        "experience_years": 14,
        "stats": {
            "matches_officiated": 220,
            "yellow_cards_per_game": 3.6,
            "red_cards_per_game": 0.12,
            "penalties_per_game": 0.38,
            "fouls_per_game": 22.0,
            "home_win_rate": 0.44,
            "draw_rate": 0.25,
            "away_win_rate": 0.31,
            "avg_goals_per_game": 3.05,
            "strictness_rating": 0.55,
        }
    },
    # UEFA referees
    "Clément Turpin": {
        "nationality": "France",
        "experience_years": 16,
        "stats": {
            "matches_officiated": 180,
            "yellow_cards_per_game": 4.0,
            "red_cards_per_game": 0.15,
            "penalties_per_game": 0.28,
            "fouls_per_game": 24.0,
            "home_win_rate": 0.42,
            "draw_rate": 0.30,
            "away_win_rate": 0.28,
            "avg_goals_per_game": 2.68,
            "strictness_rating": 0.62,
        }
    },
    "Slavko Vinčić": {
        "nationality": "Slovenia",
        "experience_years": 12,
        "stats": {
            "matches_officiated": 140,
            "yellow_cards_per_game": 4.3,
            "red_cards_per_game": 0.18,
            "penalties_per_game": 0.32,
            "fouls_per_game": 25.5,
            "home_win_rate": 0.43,
            "draw_rate": 0.28,
            "away_win_rate": 0.29,
            "avg_goals_per_game": 2.72,
            "strictness_rating": 0.65,
        }
    },
}

# Simulated team-referee history data
TEAM_REFEREE_HISTORY: Dict[str, Dict[str, Dict[str, Any]]] = {
    "Manchester United": {
        "Michael Oliver": {"matches": 15, "wins": 7, "draws": 4, "losses": 4, "yellows": 42, "reds": 2, "pen_for": 3, "pen_against": 4},
        "Anthony Taylor": {"matches": 12, "wins": 4, "draws": 3, "losses": 5, "yellows": 38, "reds": 3, "pen_for": 2, "pen_against": 2},
    },
    "Arsenal": {
        "Michael Oliver": {"matches": 18, "wins": 10, "draws": 5, "losses": 3, "yellows": 48, "reds": 1, "pen_for": 5, "pen_against": 3},
        "Anthony Taylor": {"matches": 14, "wins": 8, "draws": 3, "losses": 3, "yellows": 35, "reds": 1, "pen_for": 3, "pen_against": 2},
    },
    "Liverpool": {
        "Michael Oliver": {"matches": 16, "wins": 9, "draws": 4, "losses": 3, "yellows": 38, "reds": 2, "pen_for": 4, "pen_against": 3},
        "Paul Tierney": {"matches": 10, "wins": 6, "draws": 2, "losses": 2, "yellows": 25, "reds": 0, "pen_for": 3, "pen_against": 1},
    },
    "Manchester City": {
        "Michael Oliver": {"matches": 20, "wins": 14, "draws": 4, "losses": 2, "yellows": 45, "reds": 1, "pen_for": 6, "pen_against": 2},
        "Anthony Taylor": {"matches": 15, "wins": 10, "draws": 3, "losses": 2, "yellows": 32, "reds": 0, "pen_for": 4, "pen_against": 1},
    },
    "Chelsea": {
        "Michael Oliver": {"matches": 17, "wins": 8, "draws": 5, "losses": 4, "yellows": 50, "reds": 3, "pen_for": 3, "pen_against": 4},
        "Chris Kavanagh": {"matches": 11, "wins": 6, "draws": 3, "losses": 2, "yellows": 28, "reds": 1, "pen_for": 2, "pen_against": 2},
    },
    "Tottenham": {
        "Michael Oliver": {"matches": 14, "wins": 6, "draws": 4, "losses": 4, "yellows": 40, "reds": 2, "pen_for": 3, "pen_against": 3},
        "Anthony Taylor": {"matches": 13, "wins": 5, "draws": 4, "losses": 4, "yellows": 35, "reds": 1, "pen_for": 2, "pen_against": 3},
    },
    "Real Madrid": {
        "Jesús Gil Manzano": {"matches": 25, "wins": 16, "draws": 6, "losses": 3, "yellows": 65, "reds": 2, "pen_for": 8, "pen_against": 4},
        "Antonio Mateu Lahoz": {"matches": 22, "wins": 14, "draws": 5, "losses": 3, "yellows": 72, "reds": 3, "pen_for": 6, "pen_against": 3},
    },
    "Barcelona": {
        "Jesús Gil Manzano": {"matches": 23, "wins": 15, "draws": 5, "losses": 3, "yellows": 58, "reds": 1, "pen_for": 7, "pen_against": 3},
        "Antonio Mateu Lahoz": {"matches": 20, "wins": 12, "draws": 5, "losses": 3, "yellows": 62, "reds": 2, "pen_for": 5, "pen_against": 4},
    },
}


class RefereeService:
    """Service for referee data and statistics."""
    
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client
    
    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
    
    def get_referee_by_name(self, name: str) -> Optional[RefereeData]:
        """Get referee data by name."""
        if name not in REFEREE_DATABASE:
            # Try partial match
            for ref_name in REFEREE_DATABASE:
                if name.lower() in ref_name.lower() or ref_name.lower() in name.lower():
                    name = ref_name
                    break
            else:
                return None
        
        ref_info = REFEREE_DATABASE[name]
        stats_data = ref_info["stats"]
        
        statistics = RefereeStatistics(
            matches_officiated=stats_data["matches_officiated"],
            yellow_cards_per_game=stats_data["yellow_cards_per_game"],
            red_cards_per_game=stats_data["red_cards_per_game"],
            penalties_per_game=stats_data["penalties_per_game"],
            fouls_per_game=stats_data["fouls_per_game"],
            home_win_rate=stats_data["home_win_rate"],
            draw_rate=stats_data["draw_rate"],
            away_win_rate=stats_data["away_win_rate"],
            avg_goals_per_game=stats_data["avg_goals_per_game"],
            strictness_rating=stats_data["strictness_rating"],
        )
        
        return RefereeData(
            name=name,
            nationality=ref_info["nationality"],
            experience_years=ref_info["experience_years"],
            statistics=statistics,
        )
    
    def get_team_referee_history(
        self,
        team_name: str,
        referee_name: str
    ) -> Optional[TeamRefereePerformance]:
        """Get a team's historical performance with a specific referee."""
        # Normalize team name
        team_key = None
        for t in TEAM_REFEREE_HISTORY:
            if team_name.lower() in t.lower() or t.lower() in team_name.lower():
                team_key = t
                break
        
        if not team_key:
            return None
        
        team_history = TEAM_REFEREE_HISTORY.get(team_key, {})
        
        # Find referee
        ref_key = None
        for r in team_history:
            if referee_name.lower() in r.lower() or r.lower() in referee_name.lower():
                ref_key = r
                break
        
        if not ref_key:
            return None
        
        history = team_history[ref_key]
        
        return TeamRefereePerformance(
            team_name=team_key,
            referee_name=ref_key,
            matches=history["matches"],
            wins=history["wins"],
            draws=history["draws"],
            losses=history["losses"],
            goals_scored=history.get("goals_scored", history["wins"] * 2 + history["draws"]),
            goals_conceded=history.get("goals_conceded", history["losses"] * 2 + history["draws"]),
            yellow_cards=history["yellows"],
            red_cards=history["reds"],
            penalties_for=history["pen_for"],
            penalties_against=history["pen_against"],
        )
    
    async def get_match_referee_data(
        self,
        referee_name: str,
        home_team: str,
        away_team: str
    ) -> Optional[RefereeData]:
        """
        Get complete referee data for a match including team histories.
        
        Args:
            referee_name: Name of the referee
            home_team: Home team name
            away_team: Away team name
        
        Returns:
            RefereeData with team histories populated
        """
        referee = self.get_referee_by_name(referee_name)
        
        if not referee:
            return None
        
        # Add team histories
        referee.home_team_history = self.get_team_referee_history(home_team, referee_name)
        referee.away_team_history = self.get_team_referee_history(away_team, referee_name)
        
        return referee
    
    def calculate_referee_adjustment(
        self,
        referee: RefereeData,
        home_team: str,
        away_team: str
    ) -> Dict[str, float]:
        """
        Calculate prediction adjustments based on referee factors.
        
        Returns adjustments for:
        - card_factor: Expected cards modifier
        - penalty_factor: Penalty likelihood modifier
        - home_advantage_adjust: Referee's home bias adjustment
        - goal_factor: Goals expectation modifier
        """
        adjustments = {
            "card_factor": 1.0,
            "penalty_factor": 1.0,
            "home_advantage_adjust": 0.0,
            "goal_factor": 1.0,
            "foul_factor": 1.0,
        }
        
        stats = referee.statistics
        
        # Card factor based on strictness
        if stats.strictness_rating > 0.7:
            adjustments["card_factor"] = 1.2
            adjustments["foul_factor"] = 1.1
        elif stats.strictness_rating < 0.5:
            adjustments["card_factor"] = 0.85
            adjustments["foul_factor"] = 0.9
        
        # Penalty factor
        avg_penalties = 0.28  # League average
        if stats.penalties_per_game > avg_penalties * 1.2:
            adjustments["penalty_factor"] = 1.15
        elif stats.penalties_per_game < avg_penalties * 0.8:
            adjustments["penalty_factor"] = 0.85
        
        # Home advantage from referee tendencies
        if stats.home_win_rate > 0.48:
            adjustments["home_advantage_adjust"] = 0.02
        elif stats.home_win_rate < 0.42:
            adjustments["home_advantage_adjust"] = -0.02
        
        # Goals factor
        avg_goals = 2.7  # League average
        if stats.avg_goals_per_game > avg_goals * 1.1:
            adjustments["goal_factor"] = 1.05
        elif stats.avg_goals_per_game < avg_goals * 0.9:
            adjustments["goal_factor"] = 0.95
        
        # Team-specific adjustments
        if referee.home_team_history:
            home_history = referee.home_team_history
            if home_history.win_rate > 0.6:
                adjustments["home_advantage_adjust"] += 0.015
            elif home_history.win_rate < 0.35:
                adjustments["home_advantage_adjust"] -= 0.015
        
        if referee.away_team_history:
            away_history = referee.away_team_history
            if away_history.win_rate > 0.55:
                adjustments["home_advantage_adjust"] -= 0.01
            elif away_history.win_rate < 0.3:
                adjustments["home_advantage_adjust"] += 0.01
        
        return adjustments
    
    def list_available_referees(self, league: Optional[str] = None) -> List[str]:
        """List available referees, optionally filtered by league."""
        nationality_to_league = {
            "England": "premier_league",
            "Spain": "la_liga",
            "Italy": "serie_a",
            "Germany": "bundesliga",
            "France": "ligue_1",
            "Slovenia": "champions_league",
        }
        
        referees = []
        for name, info in REFEREE_DATABASE.items():
            if league:
                ref_league = nationality_to_league.get(info["nationality"], "unknown")
                if league.lower() == ref_league or league.lower() == "champions_league":
                    referees.append(name)
            else:
                referees.append(name)
        
        return sorted(referees)


# Singleton instance
_referee_service: Optional[RefereeService] = None


def get_referee_service() -> RefereeService:
    """Get or create referee service singleton."""
    global _referee_service
    if _referee_service is None:
        _referee_service = RefereeService()
    return _referee_service


async def cleanup_referee_service():
    """Cleanup referee service resources."""
    global _referee_service
    if _referee_service:
        await _referee_service.close()
        _referee_service = None
