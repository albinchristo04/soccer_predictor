"""
Authentication service for user management.
"""

import uuid
import os
from typing import Optional, Dict, List, Any
from datetime import datetime
import logging
import httpx

from backend.models.user import (
    User,
    UserCreate,
    UserInDB,
    UserPrediction,
    UserPredictionCreate,
    UserStats,
    AuthProvider,
    Token,
)
from backend.services.auth.password import hash_password, verify_password
from backend.services.auth.jwt import (
    create_access_token,
    create_refresh_token,
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

logger = logging.getLogger(__name__)

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo"


class AuthService:
    """
    Authentication and user management service.
    
    Uses in-memory storage for simplicity. In production,
    replace with a proper database (PostgreSQL, MongoDB, etc.)
    """
    
    def __init__(self):
        # In-memory storage (replace with database in production)
        self._users: Dict[str, UserInDB] = {}
        self._users_by_email: Dict[str, str] = {}  # email -> user_id
        self._users_by_google_id: Dict[str, str] = {}  # google_id -> user_id
        
        # User predictions storage
        self._predictions: Dict[str, Dict[int, UserPrediction]] = {}  # user_id -> {match_id -> prediction}
        
        # User stats storage
        self._stats: Dict[str, UserStats] = {}
    
    # ==================== User Management ====================
    
    async def create_user(self, user_data: UserCreate) -> Optional[User]:
        """
        Create a new user with email/password.
        
        Returns None if email already exists.
        """
        email = user_data.email.lower()
        
        if email in self._users_by_email:
            logger.warning(f"Email already registered: {email}")
            return None
        
        user_id = str(uuid.uuid4())
        hashed_pw = hash_password(user_data.password)
        
        user = UserInDB(
            id=user_id,
            email=email,
            display_name=user_data.display_name or email.split('@')[0],
            avatar_url=user_data.avatar_url,
            hashed_password=hashed_pw,
            auth_provider=AuthProvider.EMAIL,
            created_at=datetime.utcnow(),
        )
        
        self._users[user_id] = user
        self._users_by_email[email] = user_id
        
        # Initialize stats
        self._stats[user_id] = UserStats(user_id=user_id)
        
        logger.info(f"Created new user: {user_id}")
        return User(**user.model_dump(exclude={"hashed_password", "google_id", "refresh_token"}))
    
    async def authenticate_email(self, email: str, password: str) -> Optional[Token]:
        """
        Authenticate user with email and password.
        
        Returns Token if successful, None otherwise.
        """
        email = email.lower()
        user_id = self._users_by_email.get(email)
        
        if not user_id:
            logger.warning(f"User not found: {email}")
            return None
        
        user = self._users.get(user_id)
        if not user or not user.hashed_password:
            return None
        
        if not verify_password(password, user.hashed_password):
            logger.warning(f"Invalid password for: {email}")
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Generate tokens
        access_token = create_access_token(user.id, user.email)
        refresh_token = create_refresh_token(user.id, user.email)
        
        # Store refresh token
        user.refresh_token = refresh_token
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    
    async def authenticate_google(self, google_token: str) -> Optional[Token]:
        """
        Authenticate user with Google OAuth token.
        
        Creates a new user if one doesn't exist for this Google account.
        """
        try:
            # Verify token with Google
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    GOOGLE_TOKEN_INFO_URL,
                    params={"id_token": google_token}
                )
                
                if response.status_code != 200:
                    logger.warning("Invalid Google token")
                    return None
                
                token_info = response.json()
        except Exception as e:
            logger.error(f"Google token verification failed: {e}")
            return None
        
        # Extract user info
        google_id = token_info.get("sub")
        email = token_info.get("email", "").lower()
        name = token_info.get("name")
        picture = token_info.get("picture")
        
        if not google_id or not email:
            logger.warning("Missing required fields in Google token")
            return None
        
        # Check if user exists by Google ID
        user_id = self._users_by_google_id.get(google_id)
        
        if not user_id:
            # Check if user exists by email
            user_id = self._users_by_email.get(email)
            
            if user_id:
                # Link Google to existing account
                user = self._users[user_id]
                user.google_id = google_id
                user.auth_provider = AuthProvider.GOOGLE
                self._users_by_google_id[google_id] = user_id
            else:
                # Create new user
                user_id = str(uuid.uuid4())
                user = UserInDB(
                    id=user_id,
                    email=email,
                    display_name=name or email.split('@')[0],
                    avatar_url=picture,
                    google_id=google_id,
                    auth_provider=AuthProvider.GOOGLE,
                    created_at=datetime.utcnow(),
                )
                
                self._users[user_id] = user
                self._users_by_email[email] = user_id
                self._users_by_google_id[google_id] = user_id
                
                # Initialize stats
                self._stats[user_id] = UserStats(user_id=user_id)
                
                logger.info(f"Created new Google user: {user_id}")
        
        user = self._users[user_id]
        user.last_login = datetime.utcnow()
        
        # Generate tokens
        access_token = create_access_token(user.id, user.email)
        refresh_token = create_refresh_token(user.id, user.email)
        
        user.refresh_token = refresh_token
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    
    async def refresh_tokens(self, refresh_token: str) -> Optional[Token]:
        """Refresh access token using refresh token."""
        payload = verify_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            return None
        
        user_id = payload.get("sub")
        user = self._users.get(user_id)
        
        if not user or user.refresh_token != refresh_token:
            return None
        
        # Generate new tokens
        access_token = create_access_token(user.id, user.email)
        new_refresh_token = create_refresh_token(user.id, user.email)
        
        user.refresh_token = new_refresh_token
        
        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    
    async def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        user = self._users.get(user_id)
        if user:
            return User(**user.model_dump(exclude={"hashed_password", "google_id", "refresh_token"}))
        return None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        email = email.lower()
        user_id = self._users_by_email.get(email)
        if user_id:
            return await self.get_user(user_id)
        return None
    
    async def update_user(
        self,
        user_id: str,
        display_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
        favorite_teams: Optional[List[int]] = None,
        favorite_leagues: Optional[List[str]] = None,
    ) -> Optional[User]:
        """Update user profile."""
        user = self._users.get(user_id)
        if not user:
            return None
        
        if display_name is not None:
            user.display_name = display_name
        if avatar_url is not None:
            user.avatar_url = avatar_url
        if favorite_teams is not None:
            user.favorite_teams = favorite_teams
        if favorite_leagues is not None:
            user.favorite_leagues = favorite_leagues
        
        return User(**user.model_dump(exclude={"hashed_password", "google_id", "refresh_token"}))
    
    async def logout(self, user_id: str) -> bool:
        """Logout user (invalidate refresh token)."""
        user = self._users.get(user_id)
        if user:
            user.refresh_token = None
            return True
        return False
    
    # ==================== User Predictions ====================
    
    async def save_prediction(
        self,
        user_id: str,
        prediction_data: UserPredictionCreate
    ) -> Optional[UserPrediction]:
        """Save or update a user's prediction for a match."""
        if user_id not in self._users:
            return None
        
        if user_id not in self._predictions:
            self._predictions[user_id] = {}
        
        prediction_id = str(uuid.uuid4())
        
        prediction = UserPrediction(
            id=prediction_id,
            user_id=user_id,
            match_id=prediction_data.match_id,
            predicted_outcome=prediction_data.predicted_outcome,
            predicted_home_score=prediction_data.predicted_home_score,
            predicted_away_score=prediction_data.predicted_away_score,
            confidence=prediction_data.confidence,
            home_team=prediction_data.home_team,
            away_team=prediction_data.away_team,
            league=prediction_data.league,
            match_date=prediction_data.match_date,
            created_at=datetime.utcnow(),
        )
        
        self._predictions[user_id][prediction_data.match_id] = prediction
        
        # Update stats
        stats = self._stats.get(user_id)
        if stats:
            stats.total_predictions += 1
        
        logger.info(f"Saved prediction for user {user_id}, match {prediction_data.match_id}")
        return prediction
    
    async def get_user_predictions(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[UserPrediction]:
        """Get user's predictions, most recent first."""
        if user_id not in self._predictions:
            return []
        
        predictions = list(self._predictions[user_id].values())
        predictions.sort(key=lambda x: x.created_at, reverse=True)
        return predictions[:limit]
    
    async def get_prediction_for_match(
        self,
        user_id: str,
        match_id: int
    ) -> Optional[UserPrediction]:
        """Get user's prediction for a specific match."""
        if user_id not in self._predictions:
            return None
        return self._predictions[user_id].get(match_id)
    
    async def update_prediction_result(
        self,
        user_id: str,
        match_id: int,
        is_correct: bool,
        points: int = 0
    ) -> Optional[UserPrediction]:
        """Update prediction with actual result."""
        if user_id not in self._predictions:
            return None
        
        prediction = self._predictions[user_id].get(match_id)
        if not prediction:
            return None
        
        prediction.is_correct = is_correct
        prediction.points_earned = points
        
        # Update stats
        stats = self._stats.get(user_id)
        if stats:
            if is_correct:
                stats.correct_predictions += 1
                stats.current_streak += 1
                stats.best_streak = max(stats.best_streak, stats.current_streak)
            else:
                stats.current_streak = 0
            
            stats.total_points += points
            stats.accuracy = stats.correct_predictions / stats.total_predictions if stats.total_predictions > 0 else 0.0
            
            # Update recent results
            stats.recent_results.append(is_correct)
            if len(stats.recent_results) > 10:
                stats.recent_results = stats.recent_results[-10:]
        
        return prediction
    
    async def get_user_stats(self, user_id: str) -> Optional[UserStats]:
        """Get user's prediction statistics."""
        return self._stats.get(user_id)
    
    async def get_leaderboard(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get top users by points."""
        users_with_stats = []
        
        for user_id, stats in self._stats.items():
            user = self._users.get(user_id)
            if user and stats.total_predictions > 0:
                users_with_stats.append({
                    "user_id": user_id,
                    "display_name": user.display_name,
                    "avatar_url": user.avatar_url,
                    "total_points": stats.total_points,
                    "accuracy": stats.accuracy,
                    "total_predictions": stats.total_predictions,
                })
        
        # Sort by points descending
        users_with_stats.sort(key=lambda x: x["total_points"], reverse=True)
        
        # Add ranks
        for i, entry in enumerate(users_with_stats[:limit]):
            entry["rank"] = i + 1
        
        return users_with_stats[:limit]


# Singleton instance
_service: Optional[AuthService] = None


def get_auth_service() -> AuthService:
    """Get or create auth service singleton."""
    global _service
    if _service is None:
        _service = AuthService()
    return _service
