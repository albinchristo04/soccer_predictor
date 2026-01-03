"""API v1 router."""

from fastapi import APIRouter

from backend.api.v1.matches import router as matches_router
from backend.api.v1.predictions import router as predictions_router
from backend.api.v1.teams import router as teams_router
from backend.api.v1.leagues import router as leagues_router

router = APIRouter(prefix="/api/v1")

router.include_router(matches_router)
router.include_router(predictions_router)
router.include_router(teams_router)
router.include_router(leagues_router)
