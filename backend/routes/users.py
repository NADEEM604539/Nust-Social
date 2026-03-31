"""
Users Routes
Purpose: API endpoints for user registration, authentication, profile management, and follow system
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from database import SessionLocal
from schemas.users import (
    UserCreate, UserResponse, UserProfileUpdate, UserProfileResponse,
    FollowCreate, FollowResponse, UserFollowStats
)
from services.user_service import UserService
from utils.security import JWTManager

router = APIRouter(prefix="/users", tags=["users"])


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> int:
    """Extract user_id from JWT token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    token = parts[1]
    user_id = JWTManager.get_user_id_from_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user_id


@router.get("/profile/{user_id}", response_model=UserProfileResponse)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get user profile by ID (includes email)"""
    try:
        # Get profile from database with username and email from users table
        profile = db.execute(
            text("""
                SELECT p.user_id, p.name, p.bio, p.batch_year, p.department, 
                       p.created_at, p.updated_at, u.email, u.username
                FROM user_profiles p
                LEFT JOIN users u ON p.user_id = u.id
                WHERE p.user_id = :user_id
            """),
            {"user_id": user_id}
        ).fetchone()
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return {
            "user_id": profile[0],
            "username": profile[8],
            "name": profile[1],
            "bio": profile[2],
            "batch_year": profile[3],
            "department": profile[4],
            "created_at": profile[5],
            "updated_at": profile[6],
            "email": profile[7]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve profile: {str(e)}"
        )


@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile_current(
    profile_update: UserProfileUpdate, 
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    success, message, data = UserService.update_user_profile(
        db=db,
        user_id=current_user,
        profile_data=profile_update
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "user_id": data["user_id"],
        "username": data["username"],
        "name": data["name"],
        "bio": data["bio"],
        "batch_year": data["batch_year"],
        "department": data["department"],
        "email": data.get("email"),
        "created_at": data["created_at"],
        "updated_at": data["updated_at"]
    }


@router.put("/profile/{user_id}", response_model=UserProfileResponse)
async def update_user_profile(
    user_id: int, 
    profile_update: UserProfileUpdate, 
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile (only owner can update)"""
    # Check if user is updating their own profile
    if current_user != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    success, message, data = UserService.update_user_profile(
        db=db,
        user_id=user_id,
        profile_data=profile_update
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "user_id": data["user_id"],
        "username": data["username"],
        "name": data["name"],
        "bio": data["bio"],
        "batch_year": data["batch_year"],
        "department": data["department"],
        "email": data.get("email"),
        "created_at": data["created_at"],
        "updated_at": data["updated_at"]
    }


# ===== FOLLOW ENDPOINTS =====

@router.post("/{user_id}/follow", response_model=dict, status_code=status.HTTP_201_CREATED)
async def follow_user(
    user_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Follow a user"""
    success, message, data = UserService.follow_user(
        db=db,
        follower_id=current_user,
        following_id=user_id
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "follower_id": data["follower_id"],
        "following_id": data["following_id"]
    }


@router.delete("/{user_id}/follow", response_model=dict)
async def unfollow_user(
    user_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user"""
    success, message = UserService.unfollow_user(
        db=db,
        follower_id=current_user,
        following_id=user_id
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "user_id": user_id
    }


@router.get("/{user_id}/followers", response_model=dict)
async def get_followers(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get followers of a user"""
    # Extract current user ID from token if provided
    current_user_id = None
    if authorization:
        try:
            parts = authorization.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
                current_user_id = JWTManager.get_user_id_from_token(token)
        except:
            pass
    
    success, message, data = UserService.get_followers(
        db=db,
        user_id=user_id,
        limit=limit,
        offset=offset,
        current_user_id=current_user_id
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
    
    return {
        "message": message,
        "followers": data
    }


@router.get("/{user_id}/following", response_model=dict)
async def get_following(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get users that a user is following"""
    # Extract current user ID from token if provided
    current_user_id = None
    if authorization:
        try:
            parts = authorization.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
                current_user_id = JWTManager.get_user_id_from_token(token)
        except:
            pass
    
    success, message, data = UserService.get_following(
        db=db,
        user_id=user_id,
        limit=limit,
        offset=offset,
        current_user_id=current_user_id
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
    
    return {
        "message": message,
        "following": data
    }


@router.get("/{user_id}/stats", response_model=dict)
async def get_follow_stats(
    user_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get follow statistics for a user"""
    success, message, data = UserService.get_follow_stats(
        db=db,
        user_id=user_id,
        current_user_id=current_user
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=message)
    
    return {
        "message": message,
        "stats": data
    }


@router.get("/{user_id}/mutuals", response_model=dict)
async def get_mutual_followers(
    user_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Get mutual followers (users that both follow each other) - Instagram style"""
    current_user_id = current_user
    
    # Verify target user exists
    user_check = db.execute(
        text("SELECT id FROM users WHERE id = :user_id"),
        {"user_id": user_id}
    ).fetchone()
    
    if not user_check:
        raise HTTPException(status_code=404, detail="User not found")
    
    success, message, data = UserService.get_mutual_followers(
        db,
        user_id=user_id,
        current_user_id=current_user_id,
        limit=limit,
        offset=offset
    )
    
    if not success:
        raise HTTPException(status_code=500, detail=message)
    
    # Get total count
    count_success, _, mutual_count = UserService.get_mutual_count(
        db,
        user_id=user_id,
        current_user_id=current_user_id
    )
    
    mutual_count = mutual_count if count_success else 0
    
    return {
        "message": "Mutual followers retrieved",
        "data": data,
        "pagination": {
            "limit": limit,
            "offset": offset,
            "total": mutual_count
        }
    }


@router.get("/tickets/purchases", response_model=List)
async def get_my_ticket_purchases(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    """Get current user's purchased event tickets with full details"""
    purchases = UserService.get_user_ticket_purchases(
        db=db,
        user_id=current_user,
        skip=skip,
        limit=limit
    )
    return purchases


# ===== GET SUGGESTED USERS =====
@router.get("/suggestions/recommended", response_model=dict)
async def get_suggested_users(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get suggested users for the current user based on:
    - Same batch/department (higher priority)
    - Not already followed
    - Not the current user
    """
    try:
        success, message, data = UserService.get_suggested_users(
            db=db,
            user_id=current_user,
            limit=limit,
            offset=offset
        )
        
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
        
        return {
            "message": message,
            "data": data,
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": len(data)
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch suggestions: {str(e)}"
        )

