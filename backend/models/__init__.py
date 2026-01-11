"""Backend models package."""

from backend.models.match import (
    Match,
    MatchSummary,
    MatchEvent,
    MatchStats,
    MatchStatus,
    TeamInfo,
    LeagueInfo,
    TeamLineup,
    PlayerLineup,
    HeadToHead,
    H2HMatch,
    LiveMatchUpdate,
    MatchDay,
)

from backend.models.prediction import (
    MatchPrediction,
    OutcomeProbabilities,
    GoalsPrediction,
    ScorelinePrediction,
    PredictionFactors,
    ConfidenceBreakdown,
    TeamPredictionContext,
    InjuryInfo,
    PredictionResult,
    AccuracyStats,
)

from backend.models.team import (
    Team,
    TeamOverview,
    TeamSquad,
    TeamSeasonStats,
    TeamForm,
    TeamRating,
    TeamFixture,
    PlayerBasic,
    StandingsRow,
    LeagueStandings,
)

from backend.models.user import (
    User,
    UserCreate,
    UserLogin,
    UserInDB,
    UserResponse,
    UserPrediction,
    UserPredictionCreate,
    UserStats,
    Token,
    TokenData,
    AuthProvider,
    GoogleAuthRequest,
    LeaderboardEntry,
)

__all__ = [
    # Match models
    "Match",
    "MatchSummary",
    "MatchEvent",
    "MatchStats",
    "MatchStatus",
    "TeamInfo",
    "LeagueInfo",
    "TeamLineup",
    "PlayerLineup",
    "HeadToHead",
    "H2HMatch",
    "LiveMatchUpdate",
    "MatchDay",
    
    # Prediction models
    "MatchPrediction",
    "OutcomeProbabilities",
    "GoalsPrediction",
    "ScorelinePrediction",
    "PredictionFactors",
    "ConfidenceBreakdown",
    "TeamPredictionContext",
    "InjuryInfo",
    "PredictionResult",
    "AccuracyStats",
    
    # Team models
    "Team",
    "TeamOverview",
    "TeamSquad",
    "TeamSeasonStats",
    "TeamForm",
    "TeamRating",
    "TeamFixture",
    "PlayerBasic",
    "StandingsRow",
    "LeagueStandings",
    
    # User models
    "User",
    "UserCreate",
    "UserLogin",
    "UserInDB",
    "UserResponse",
    "UserPrediction",
    "UserPredictionCreate",
    "UserStats",
    "Token",
    "TokenData",
    "AuthProvider",
    "GoogleAuthRequest",
    "LeaderboardEntry",
]
