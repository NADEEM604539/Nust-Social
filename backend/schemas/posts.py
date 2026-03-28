"""
Post Schemas
Purpose: Pydantic models for creating posts, comments, reactions, and feed responses
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PostCreate(BaseModel):
    type: str  # RUMOR, CONFESSION, SOCIETY_POST, ANNOUNCEMENT, MARKETPLACE_POST
    caption: Optional[str] = None
    description: Optional[str] = None
    is_anonymous: bool = False
    media_ids: Optional[List[int]] = None
    tags: Optional[List[str]] = None
    
    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: int
    user_id: Optional[int]
    type: str
    caption: Optional[str]
    description: Optional[str]
    is_anonymous: bool
    is_approved: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    content: str
    is_anonymous: bool = False
    
    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    content: str
    is_anonymous: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReactionCreate(BaseModel):
    type: str  # LIKE, LOVE, HAHA, WOW, SAD, ANGRY
    
    class Config:
        from_attributes = True
