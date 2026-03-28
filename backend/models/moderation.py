"""
Moderation Model
Purpose: Manages content reports, audit logs, and moderation tracking for platform safety and compliance
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class ReportReason(str, enum.Enum):
    INAPPROPRIATE = "INAPPROPRIATE"
    HARASSMENT = "HARASSMENT"
    SPAM = "SPAM"
    MISINFORMATION = "MISINFORMATION"
    HATE_SPEECH = "HATE_SPEECH"
    VIOLENCE = "VIOLENCE"
    OTHER = "OTHER"


class AuditActionType(str, enum.Enum):
    POST_CREATED = "POST_CREATED"
    POST_DELETED = "POST_DELETED"
    POST_EDITED = "POST_EDITED"
    USER_BANNED = "USER_BANNED"
    USER_SUSPENDED = "USER_SUSPENDED"
    TICKET_SOLD = "TICKET_SOLD"
    ORDER_PLACED = "ORDER_PLACED"
    PAYMENT_PROCESSED = "PAYMENT_PROCESSED"


class Report(Base):
    __tablename__ = "reports"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reporter_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    reported_post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="SET NULL"))
    reported_comment_id = Column(BigInteger, ForeignKey("comments.id", ondelete="SET NULL"))
    reason = Column(Enum(ReportReason), nullable=False)
    description = Column(Text)
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)
    resolved_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    resolution_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime)

    reporter = relationship("User", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])
    reported_post = relationship("Post")
    resolver = relationship("User", foreign_keys=[resolved_by])

    __table_args__ = (
        Index("idx_reporter_id", "reporter_id"),
        Index("idx_status", "status"),
        Index("idx_created_at", "created_at"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    action_type = Column(Enum(AuditActionType), nullable=False)
    actor_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    target_user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    target_post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="SET NULL"))
    target_order_id = Column(BigInteger, ForeignKey("orders.id", ondelete="SET NULL"))
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    actor = relationship("User", foreign_keys=[actor_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
    target_post = relationship("Post")
    target_order = relationship("Order")

    __table_args__ = (
        Index("idx_action_type", "action_type"),
        Index("idx_actor_id", "actor_id"),
        Index("idx_created_at", "created_at"),
    )
