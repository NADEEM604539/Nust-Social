"""
Notification Schemas
Purpose: Pydantic models for notification responses and user engagement tracking
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: Optional[str]
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
