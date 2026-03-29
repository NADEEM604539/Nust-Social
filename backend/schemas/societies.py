"""
Society & Event Schemas
Purpose: Pydantic models for societies, events, and ticket management
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# ==================== SOCIETY SCHEMAS ====================

class SocietyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    
    class Config:
        from_attributes = True


class SocietyResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SocietyDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    member_count: int = 0
    
    class Config:
        from_attributes = True


# ==================== SOCIETY MEMBER SCHEMAS ====================

class SocietyMemberResponse(BaseModel):
    id: int
    user_id: int
    society_id: int
    role: str  # ADMIN, MODERATOR, MEMBER
    joined_at: datetime
    
    class Config:
        from_attributes = True


class SocietyMemberDetailResponse(BaseModel):
    id: int
    user_id: int
    username: Optional[str] = None
    role: str
    joined_at: datetime
    
    class Config:
        from_attributes = True


class UpdateMemberRoleRequest(BaseModel):
    role: str = Field(..., pattern="^(ADMIN|MODERATOR|MEMBER)$")
    
    class Config:
        from_attributes = True


# ==================== SOCIETY POST SCHEMAS ====================

class SocietyPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    
    class Config:
        from_attributes = True


class SocietyPostResponse(BaseModel):
    id: int
    society_id: int
    title: str
    content: str
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ==================== EVENT SCHEMAS ====================

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, max_length=200)
    event_date: datetime
    
    class Config:
        from_attributes = True


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    location: Optional[str] = Field(None, max_length=200)
    event_date: Optional[datetime] = None
    
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
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EventDetailResponse(BaseModel):
    id: int
    society_id: int
    title: str
    description: Optional[str]
    location: Optional[str]
    event_date: datetime
    created_at: datetime
    updated_at: datetime
    tickets: List['EventTicketResponse'] = []
    total_tickets_sold: int = 0
    
    class Config:
        from_attributes = True


# ==================== TICKET SCHEMAS ====================

class EventTicketCreate(BaseModel):
    type: str = Field(..., pattern="^(VIP|REGULAR|STUDENT|FREE)$")
    price: float = Field(..., ge=0)
    total_stock: int = Field(..., gt=0)
    
    class Config:
        from_attributes = True


class EventTicketResponse(BaseModel):
    id: int
    event_id: int
    type: str
    price: float
    total_stock: int
    sold_count: int
    available_stock: int = 0
    
    class Config:
        from_attributes = True
    
    @property
    def available_stock(self):
        return self.total_stock - self.sold_count


class EventTicketPurchaseCreate(BaseModel):
    ticket_id: int
    quantity: int = Field(..., gt=0, le=10)
    
    class Config:
        from_attributes = True


class EventTicketPurchaseResponse(BaseModel):
    id: int
    event_id: int
    ticket_id: int
    user_id: int
    quantity: int
    total_price: float
    status: str  # PENDING, CONFIRMED, CANCELLED, COMPLETED
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Update forward references
EventDetailResponse.update_forward_refs()
