"""
Moderation Schemas
Purpose: Pydantic models for reporting content and moderator actions
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReportCreate(BaseModel):
    reported_user_id: Optional[int] = None
    reported_post_id: Optional[int] = None
    reported_comment_id: Optional[int] = None
    reason: str  # INAPPROPRIATE, HARASSMENT, SPAM, MISINFORMATION, HATE_SPEECH, VIOLENCE, OTHER
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    id: int
    reporter_id: int
    reported_user_id: Optional[int]
    reported_post_id: Optional[int]
    reason: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
