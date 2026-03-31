"""
Post Schemas
Purpose: Pydantic models for creating posts, comments, reactions, and feed responses
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ===== POST SCHEMAS =====
class PostCreate(BaseModel):
    """Create new post"""
    type: str = Field(..., description="RUMOR, CONFESSION, SIMPLE_POST, SOCIETY_POST, ANNOUNCEMENT, MARKETPLACE_POST")
    caption: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None)
    is_anonymous: bool = Field(False, description="Hide user identity")
    media_ids: Optional[List[int]] = Field(None, description="IDs of media to attach")
    tags: Optional[List[str]] = Field(None, description="Tags for categorization")
    
    class Config:
        from_attributes = True


class PostUpdate(BaseModel):
    """Update post (caption/description only)"""
    caption: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None)
    
    class Config:
        from_attributes = True


class MediaResponse(BaseModel):
    """Media attached to post"""
    id: int
    url: str
    type: str  # IMAGE, VIDEO, DOCUMENT
    file_size: Optional[int] = None
    
    class Config:
        from_attributes = True


class PostStats(BaseModel):
    """Post statistics"""
    likes_count: int = 0
    likes_count_weighted: float = 0.0  # Sum of reaction weights for LIKE reactions
    comments_count: int = 0
    views_count: int = 0
    rumor_true_votes: int = 0
    rumor_false_votes: int = 0
    
    @property
    def rumor_total_votes(self) -> int:
        return self.rumor_true_votes + self.rumor_false_votes
    
    @property
    def rumor_true_percentage(self) -> float:
        if self.rumor_total_votes == 0:
            return 0.0
        return (self.rumor_true_votes / self.rumor_total_votes) * 100
    
    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    """Post response with stats and user info"""
    id: int
    user_id: Optional[int] = None
    encrypted_name: Optional[str] = None
    type: str
    caption: Optional[str] = None
    description: Optional[str] = None
    is_anonymous: bool = False
    is_approved: bool = True
    media: List[MediaResponse] = []
    tags: List[str] = []
    stats: Optional[PostStats] = None
    user_reaction: Optional[str] = None  # LIKE, LOVE, etc. or null
    user_rumor_vote: Optional[str] = None  # TRUE, FALSE, or null
    created_at: datetime
    edited_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ===== COMMENT SCHEMAS =====
class CommentCreate(BaseModel):
    """Create comment on post"""
    content: str = Field(..., min_length=1, max_length=2000)
    is_anonymous: bool = Field(False)
    
    class Config:
        from_attributes = True


class CommentUpdate(BaseModel):
    """Update comment content"""
    content: str = Field(..., min_length=1, max_length=2000)
    
    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    """Comment response"""
    id: int
    post_id: int
    user_id: int
    encrypted_name: Optional[str] = None
    content: str
    is_anonymous: bool = False
    created_at: datetime
    edited_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ===== REACTION SCHEMAS =====
class ReactionCreate(BaseModel):
    """React to post"""
    type: str = Field(..., description="LIKE, LOVE, HAHA, WOW, SAD, ANGRY")
    
    class Config:
        from_attributes = True


class ReactionResponse(BaseModel):
    """Reaction response"""
    id: Optional[int] = None
    post_id: int
    user_id: Optional[int] = None
    reaction_type: str = Field(..., description="LIKE, LOVE, HAHA, WOW, SAD, ANGRY")
    reaction_weight: float = 1.0  # User's reaction power based on reputation
    changed: bool = False  # True if changed existing reaction, False if new reaction
    wait_seconds: Optional[int] = None  # If rate limited, how many seconds to wait
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ===== RUMOR VOTE SCHEMAS =====
class RumorVoteCreate(BaseModel):
    """Vote on rumor"""
    vote: str = Field(..., description="TRUE or FALSE")
    
    class Config:
        from_attributes = True


class RumorVoteResponse(BaseModel):
    """Rumor vote response with voting power and weighted votes"""
    post_id: int
    vote: str
    vote_weight: float = Field(..., description="User's voting power (1.0 = normal, max 3.0)")
    
    # Raw vote counts
    total_votes_true: int
    total_votes_false: int
    percentage_true: float
    
    # Weighted vote counts (by user reputation)
    total_votes_true_weighted: float
    total_votes_false_weighted: float
    percentage_true_weighted: float
    
    class Config:
        from_attributes = True


# ===== FEED SCHEMAS =====
class FeedResponse(BaseModel):
    """Feed response with pagination"""
    posts: List[PostResponse]
    total: int
    offset: int
    limit: int
    
    class Config:
        from_attributes = True


# ===== REPORT SCHEMAS =====
class ReportCreate(BaseModel):
    """Report a post"""
    reason: str = Field(..., min_length=10, max_length=500)
    
    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    """Report response"""
    id: int
    post_id: int
    user_id: int
    reason: str
    status: str  # PENDING, REVIEWED, RESOLVED, DISMISSED
    created_at: datetime
    
    class Config:
        from_attributes = True

