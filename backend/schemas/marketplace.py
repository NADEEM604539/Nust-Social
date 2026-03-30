"""
Marketplace Schemas
Purpose: Pydantic models for stores, products, orders, and payment management
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class StoreCreate(BaseModel):
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class StoreResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    stock: int
    media_ids: Optional[List[int]] = None
    
    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    store_id: int
    title: str
    description: Optional[str]
    price: float
    stock: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    
    class Config:
        from_attributes = True


class AddressCreate(BaseModel):
    address: str
    city: str
    phone: str
    
    class Config:
        from_attributes = True


class AddressResponse(BaseModel):
    id: int
    order_id: int
    address: str
    city: str
    phone: str
    
    class Config:
        from_attributes = True


class PaymentMethodEnum(str, Enum):
    """Valid payment methods for orders"""
    COD = "COD"
    CARD = "CARD"
    EASYPAISA = "EASYPaisa"
    JAZZCASH = "JAZZCASH"


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    address: str
    city: str
    phone: str
    payment_method: PaymentMethodEnum
    
    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    buyer_id: int
    total_amount: float
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    method: str
    status: str
    transaction_ref: Optional[str]
    refund_amount: Optional[float]
    refund_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class OrderStatusEnum(str, Enum):
    """Valid order statuses for Marketplace"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class OrderStatusUpdate(BaseModel):
    """Request body for updating order status"""
    status: OrderStatusEnum
    
    class Config:
        from_attributes = True
