"""
Routes Package
Purpose: Contains all API endpoint definitions organized by feature
"""

from fastapi import APIRouter
from routes.auth import router as auth_router
from routes.posts import router as posts_router
from routes.media import router as media_router
from routes.users import router as users_router

# Main router
api_router = APIRouter(prefix="/api/v1")

# Include routers
api_router.include_router(auth_router)
api_router.include_router(posts_router)
api_router.include_router(media_router)
api_router.include_router(users_router)

__all__ = ["api_router"]
