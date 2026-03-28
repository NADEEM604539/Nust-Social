"""
Users Routes
Purpose: API endpoints for user registration, authentication, profile management, and follow system
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal
from schemas.users import UserCreate, UserResponse, UserProfileUpdate, UserProfileResponse

router = APIRouter(prefix="/users", tags=["users"])


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # TODO: Implement user registration
    pass


@router.get("/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get user profile by ID"""
    # TODO: Implement get profile
    pass


@router.put("/profile/{user_id}", response_model=UserProfileResponse)
async def update_user_profile(user_id: int, profile_update: UserProfileUpdate, db: Session = Depends(get_db)):
    """Update user profile"""
    # TODO: Implement profile update
    pass


@router.post("/follow/{user_id}")
async def follow_user(user_id: int, db: Session = Depends(get_db)):
    """Follow a user"""
    # TODO: Implement follow logic
    pass


@router.delete("/follow/{user_id}")
async def unfollow_user(user_id: int, db: Session = Depends(get_db)):
    """Unfollow a user"""
    # TODO: Implement unfollow logic
    pass


@router.get("/{user_id}/followers", response_model=List[UserResponse])
async def get_followers(user_id: int, db: Session = Depends(get_db)):
    """Get user's followers"""
    # TODO: Implement get followers
    pass


@router.get("/{user_id}/following", response_model=List[UserResponse])
async def get_following(user_id: int, db: Session = Depends(get_db)):
    """Get users that user is following"""
    # TODO: Implement get following
    pass
