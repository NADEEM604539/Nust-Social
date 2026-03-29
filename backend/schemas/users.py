"""
User Schemas
Purpose: Pydantic models for user registration, profile, and response validation
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    encrypted_name: str
    
    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    bio: Optional[str] = None
    batch_year: Optional[int] = None
    
    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    user_id: int
    username: str
    name: Optional[str]
    bio: Optional[str]
    batch_year: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    email: str
    is_verified: bool
    status: str
    created_at: datetime
    profile: Optional[UserProfileResponse]
    
    class Config:
        from_attributes = True


class FollowCreate(BaseModel):
    """Follow request"""
    following_id: int = None  # Optional, can be passed in URL
    
    class Config:
        from_attributes = True


class FollowResponse(BaseModel):
    """Follow response"""
    follower_id: int
    following_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserFollowStats(BaseModel):
    """User follow statistics"""
    user_id: int
    followers_count: int
    following_count: int
    is_following: bool
    
    class Config:
        from_attributes = True
