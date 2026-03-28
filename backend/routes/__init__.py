"""
Routes Package
Purpose: Contains all API endpoint definitions organized by feature
"""

from fastapi import APIRouter
from routes.auth import router as auth_router

# Main router
api_router = APIRouter(prefix="/api/v1")

# Include auth routes
api_router.include_router(auth_router)

__all__ = ["api_router"]
