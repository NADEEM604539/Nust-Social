"""
Notifications Model
Purpose: Manages user notifications for follows, comments, likes, orders, and events
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, ForeignKey, Index, Boolean, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class NotificationType(str, enum.Enum):
    NEW_FOLLOWER = "NEW_FOLLOWER"
    NEW_COMMENT = "NEW_COMMENT"
    NEW_LIKE = "NEW_LIKE"
    ORDER_UPDATE = "ORDER_UPDATE"
    EVENT_REMINDER = "EVENT_REMINDER"
    SOCIETY_ANNOUNCEMENT = "SOCIETY_ANNOUNCEMENT"
    MESSAGE = "MESSAGE"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text)
    related_user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    related_post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="SET NULL"))
    related_order_id = Column(BigInteger, ForeignKey("orders.id", ondelete="SET NULL"))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    related_user = relationship("User", foreign_keys=[related_user_id])
    related_post = relationship("Post")
    related_order = relationship("Order")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_type", "type"),
        Index("idx_is_read", "is_read"),
        Index("idx_created_at", "created_at"),
    )
