"""
Events Model
Purpose: Manages society events, ticket types, and ticket purchases
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, ForeignKey, Index, Float, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class TicketType(str, enum.Enum):
    VIP = "VIP"
    REGULAR = "REGULAR"
    STUDENT = "STUDENT"
    FREE = "FREE"


class PurchaseStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class Event(Base):
    __tablename__ = "events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    society_id = Column(BigInteger, ForeignKey("societies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    location = Column(String(200))
    event_date = Column(DateTime, nullable=False)
    cover_media_id = Column(BigInteger, ForeignKey("media.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    society = relationship("Society", back_populates="events")
    tickets = relationship("EventTicket", back_populates="event", cascade="all, delete-orphan")
    purchases = relationship("EventTicketPurchase", back_populates="event", cascade="all, delete-orphan")
    cover = relationship("Media")

    __table_args__ = (
        Index("idx_society_id", "society_id"),
        Index("idx_event_date", "event_date"),
        Index("idx_created_at", "created_at"),
    )


class EventTicket(Base):
    __tablename__ = "event_tickets"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_id = Column(BigInteger, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(TicketType), nullable=False)
    price = Column(Float, default=0.0)
    total_stock = Column(Integer, nullable=False)
    sold_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="tickets")
    purchases = relationship("EventTicketPurchase", back_populates="ticket", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_event_id", "event_id"),
        Index("idx_type", "type"),
    )


class EventTicketPurchase(Base):
    __tablename__ = "event_ticket_purchases"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    event_id = Column(BigInteger, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    ticket_id = Column(BigInteger, ForeignKey("event_tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    total_price = Column(Float, nullable=False)
    status = Column(Enum(PurchaseStatus), default=PurchaseStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    event = relationship("Event", back_populates="purchases")
    ticket = relationship("EventTicket", back_populates="purchases")
    user = relationship("User")

    __table_args__ = (
        Index("idx_event_id", "event_id"),
        Index("idx_user_id", "user_id"),
        Index("idx_status", "status"),
    )
