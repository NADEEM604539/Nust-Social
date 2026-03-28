"""
Chat Schemas
Purpose: Pydantic models for conversations and real-time messaging
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageCreate(BaseModel):
    content: str
    media_ids: Optional[List[int]] = None
    
    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    participant_ids: List[int]
    title: Optional[str] = None
    is_group: bool = False
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    title: Optional[str]
    is_group: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
