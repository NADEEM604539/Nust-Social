"""
Marketplace Model
Purpose: Manages user stores, products, orders, payments, and shipping addresses
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, ForeignKey, Index, Float, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class PaymentMethod(str, enum.Enum):
    COD = "COD"
    CARD = "CARD"
    EASYPAISA = "EASYPAISA"
    JAZZCASH = "JAZZCASH"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class Store(Base):
    __tablename__ = "stores"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    owner_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    logo_media_id = Column(BigInteger, ForeignKey("media.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User")
    products = relationship("Product", back_populates="store", cascade="all, delete-orphan")
    logo = relationship("Media")

    __table_args__ = (
        Index("idx_owner_id", "owner_id"),
        Index("idx_name", "name"),
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    store_id = Column(BigInteger, ForeignKey("stores.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    store = relationship("Store", back_populates="products")
    media = relationship("ProductMedia", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")

    __table_args__ = (
        Index("idx_store_id", "store_id"),
        Index("idx_name", "name"),
        Index("idx_created_at", "created_at"),
    )


class ProductMedia(Base):
    __tablename__ = "product_media"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    product_id = Column(BigInteger, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    media_id = Column(BigInteger, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)

    product = relationship("Product", back_populates="media")
    media = relationship("Media")

    __table_args__ = (
        Index("idx_product_id", "product_id"),
    )


class Address(Base):
    __tablename__ = "addresses"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    street = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100), nullable=False)
    is_default = Column(Integer, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
    )


class Order(Base):
    __tablename__ = "orders"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    shipping_address_id = Column(BigInteger, ForeignKey("addresses.id", ondelete="SET NULL"))
    total_price = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    shipping_address = relationship("Address")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_status", "status"),
        Index("idx_created_at", "created_at"),
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(BigInteger, ForeignKey("products.id", ondelete="SET NULL"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    __table_args__ = (
        Index("idx_order_id", "order_id"),
    )


class Payment(Base):
    __tablename__ = "payments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    order_id = Column(BigInteger, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    amount = Column(Float, nullable=False)
    transaction_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order = relationship("Order", back_populates="payment")

    __table_args__ = (
        Index("idx_order_id", "order_id"),
        Index("idx_status", "status"),
    )
