"""
User models for authentication and data persistence.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from enum import Enum


class AuthProvider(str, Enum):
    """Authentication provider types."""
    EMAIL = "email"
    GOOGLE = "google"


class UserBase(BaseModel):
    """Base user model with common fields."""
    email: EmailStr
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    """Model for creating a new user with email/password."""
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    """Model for user login."""
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    """Model for Google OAuth authentication."""
    token: str
    

class User(UserBase):
    """Complete user model."""
    id: str
    auth_provider: AuthProvider = AuthProvider.EMAIL
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True
    
    # User preferences
    favorite_teams: List[int] = Field(default_factory=list)
    favorite_leagues: List[str] = Field(default_factory=list)
    
    class Config:
        from_attributes = True


class UserInDB(User):
    """User model with hashed password for database storage."""
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
    refresh_token: Optional[str] = None


class TokenData(BaseModel):
    """JWT token payload data."""
    sub: str  # user ID
    email: str
    exp: datetime


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """User response model (excludes sensitive data)."""
    id: str
    email: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    auth_provider: AuthProvider
    created_at: datetime
    favorite_teams: List[int]
    favorite_leagues: List[str]


# ==================== User Predictions Models ====================

class UserPrediction(BaseModel):
    """User's prediction for a match."""
    id: Optional[str] = None
    user_id: str
    match_id: int
    
    # Prediction details
    predicted_outcome: str  # "home_win", "draw", "away_win"
    predicted_home_score: Optional[int] = None
    predicted_away_score: Optional[int] = None
    confidence: Optional[float] = None
    
    # Match info for display
    home_team: str
    away_team: str
    league: str
    match_date: datetime
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    # Result tracking
    is_correct: Optional[bool] = None
    points_earned: int = 0  # For gamification


class UserPredictionCreate(BaseModel):
    """Model for creating a user prediction."""
    match_id: int
    predicted_outcome: str
    predicted_home_score: Optional[int] = None
    predicted_away_score: Optional[int] = None
    confidence: Optional[float] = None
    
    # Match info
    home_team: str
    away_team: str
    league: str
    match_date: datetime


class UserStats(BaseModel):
    """User's prediction statistics."""
    user_id: str
    total_predictions: int = 0
    correct_predictions: int = 0
    accuracy: float = 0.0
    total_points: int = 0
    
    # Streak tracking
    current_streak: int = 0
    best_streak: int = 0
    
    # By league breakdown
    league_stats: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    
    # Recent form
    recent_results: List[bool] = Field(default_factory=list)  # Last 10


class LeaderboardEntry(BaseModel):
    """Entry in the leaderboard."""
    rank: int
    user_id: str
    display_name: str
    avatar_url: Optional[str]
    total_points: int
    accuracy: float
    total_predictions: int
