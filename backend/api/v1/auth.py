"""
Authentication API endpoints.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Body

from backend.models.user import (
    UserCreate,
    UserLogin,
    GoogleAuthRequest,
    Token,
    UserResponse,
    UserPredictionCreate,
    UserPrediction,
    UserStats,
)
from backend.services.auth import (
    get_auth_service,
    get_current_user,
)
from backend.services.auth.jwt import require_auth

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """
    Register a new user with email and password.
    
    Returns the created user profile.
    """
    service = get_auth_service()
    user = await service.create_user(user_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        auth_provider=user.auth_provider,
        created_at=user.created_at,
        favorite_teams=user.favorite_teams,
        favorite_leagues=user.favorite_leagues,
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """
    Login with email and password.
    
    Returns JWT access and refresh tokens.
    """
    service = get_auth_service()
    token = await service.authenticate_email(
        credentials.email,
        credentials.password
    )
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return token


@router.post("/google", response_model=Token)
async def google_auth(request: GoogleAuthRequest):
    """
    Authenticate with Google OAuth.
    
    Creates a new account if the Google account is not linked.
    Returns JWT access and refresh tokens.
    """
    service = get_auth_service()
    token = await service.authenticate_google(request.token)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    return token


@router.post("/refresh", response_model=Token)
async def refresh_token(refresh_token: str = Body(..., embed=True)):
    """
    Refresh access token using refresh token.
    """
    service = get_auth_service()
    token = await service.refresh_tokens(refresh_token)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    return token


@router.post("/logout")
async def logout(user = Depends(require_auth)):
    """
    Logout current user (invalidates refresh token).
    """
    service = get_auth_service()
    await service.logout(user["sub"])
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user = Depends(require_auth)):
    """
    Get current user's profile.
    """
    service = get_auth_service()
    user_data = await service.get_user(user["sub"])
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user_data.id,
        email=user_data.email,
        display_name=user_data.display_name,
        avatar_url=user_data.avatar_url,
        auth_provider=user_data.auth_provider,
        created_at=user_data.created_at,
        favorite_teams=user_data.favorite_teams,
        favorite_leagues=user_data.favorite_leagues,
    )


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    display_name: Optional[str] = Body(None),
    avatar_url: Optional[str] = Body(None),
    favorite_teams: Optional[list] = Body(None),
    favorite_leagues: Optional[list] = Body(None),
    user = Depends(require_auth)
):
    """
    Update current user's profile.
    """
    service = get_auth_service()
    user_data = await service.update_user(
        user["sub"],
        display_name=display_name,
        avatar_url=avatar_url,
        favorite_teams=favorite_teams,
        favorite_leagues=favorite_leagues,
    )
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user_data.id,
        email=user_data.email,
        display_name=user_data.display_name,
        avatar_url=user_data.avatar_url,
        auth_provider=user_data.auth_provider,
        created_at=user_data.created_at,
        favorite_teams=user_data.favorite_teams,
        favorite_leagues=user_data.favorite_leagues,
    )


# ==================== User Predictions ====================


@router.post("/predictions", response_model=UserPrediction)
async def save_prediction(
    prediction: UserPredictionCreate,
    user = Depends(require_auth)
):
    """
    Save a user's prediction for a match.
    """
    service = get_auth_service()
    result = await service.save_prediction(user["sub"], prediction)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to save prediction"
        )
    
    return result


@router.get("/predictions")
async def get_my_predictions(
    limit: int = 50,
    user = Depends(require_auth)
):
    """
    Get current user's predictions.
    """
    service = get_auth_service()
    predictions = await service.get_user_predictions(user["sub"], limit)
    return {"predictions": predictions}


@router.get("/predictions/{match_id}", response_model=Optional[UserPrediction])
async def get_prediction_for_match(
    match_id: int,
    user = Depends(require_auth)
):
    """
    Get user's prediction for a specific match.
    """
    service = get_auth_service()
    prediction = await service.get_prediction_for_match(user["sub"], match_id)
    return prediction


@router.get("/stats", response_model=Optional[UserStats])
async def get_my_stats(user = Depends(require_auth)):
    """
    Get current user's prediction statistics.
    """
    service = get_auth_service()
    stats = await service.get_user_stats(user["sub"])
    return stats


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 20):
    """
    Get top users leaderboard.
    """
    service = get_auth_service()
    leaderboard = await service.get_leaderboard(limit)
    return {"leaderboard": leaderboard}
