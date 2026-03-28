"""
Society & Event Schemas
Purpose: Pydantic models for societies, events, and ticket management
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class SocietyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class SocietyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_date: datetime
    
    class Config:
        from_attributes = True


class EventResponse(BaseModel):
    id: int
    society_id: int
    title: str
    description: Optional[str]
    location: Optional[str]
    event_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class TicketCreate(BaseModel):
    type: str  # VIP, REGULAR, STUDENT, FREE
    price: float
    total_stock: int
    
    class Config:
        from_attributes = True


class TicketResponse(BaseModel):
    id: int
    event_id: int
    type: str
    price: float
    total_stock: int
    sold_count: int
    
    class Config:
        from_attributes = True
