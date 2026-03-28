"""
Societies Model
Purpose: Manages university societies, their members, and society-related posts
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class MemberRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"
    MEMBER = "MEMBER"


class Society(Base):
    __tablename__ = "societies"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    logo_media_id = Column(BigInteger, ForeignKey("media.id", ondelete="SET NULL"))
    created_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("SocietyMember", back_populates="society", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="society", cascade="all, delete-orphan")
    posts = relationship("SocietyPost", back_populates="society", cascade="all, delete-orphan")
    logo = relationship("Media")
    creator = relationship("User")

    __table_args__ = (
        Index("idx_name", "name"),
        Index("idx_created_at", "created_at"),
    )


class SocietyMember(Base):
    __tablename__ = "society_members"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    society_id = Column(BigInteger, ForeignKey("societies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(MemberRole), default=MemberRole.MEMBER)
    joined_at = Column(DateTime, default=datetime.utcnow)

    society = relationship("Society", back_populates="members")
    user = relationship("User")

    __table_args__ = (
        Index("idx_society_id", "society_id"),
        Index("idx_user_id", "user_id"),
    )


class SocietyPost(Base):
    __tablename__ = "society_posts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    society_id = Column(BigInteger, ForeignKey("societies.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    created_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    society = relationship("Society", back_populates="posts")
    creator = relationship("User")

    __table_args__ = (
        Index("idx_society_id", "society_id"),
        Index("idx_created_at", "created_at"),
    )
