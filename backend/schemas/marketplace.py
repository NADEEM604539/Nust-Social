"""
Marketplace Schemas
Purpose: Pydantic models for stores, products, orders, and payment management
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AddressCreate(BaseModel):
    street: str
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    is_default: bool = False
    
    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    media_ids: Optional[List[int]] = None
    
    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    store_id: int
    name: str
    description: Optional[str]
    price: float
    stock: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_address_id: int
    payment_method: str  # COD, CARD, EASYPAISA, JAZZCASH
    
    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_price: float
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
