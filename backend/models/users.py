"""
Users Model
Purpose: Manages user accounts, profiles, roles, follow relationships, and authentication
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, DateTime, BigInteger, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    BANNED = "BANNED"


class RoleName(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    email = Column(String(150), unique=True, nullable=False)
    encrypted_name = Column(String(255), nullable=False)
    password_hash = Column(String(255))
    is_verified = Column(Boolean, default=False)
    status = Column(Enum(UserStatus), default=UserStatus.ACTIVE)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    roles = relationship("Role", secondary="user_roles", back_populates="users")
    posts = relationship("Post", back_populates="user")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    otps = relationship("OTP", back_populates="user", cascade="all, delete-orphan")
    password_history = relationship("PasswordHistory", back_populates="user", cascade="all, delete-orphan")
    followers = relationship(
        "User",
        secondary="follows",
        primaryjoin="User.id == foreign(follows.c.following_id)",
        secondaryjoin="User.id == foreign(follows.c.follower_id)",
        viewonly=True,
    )
    following = relationship(
        "User",
        secondary="follows",
        primaryjoin="User.id == foreign(follows.c.follower_id)",
        secondaryjoin="User.id == foreign(follows.c.following_id)",
        viewonly=True,
    )

    __table_args__ = (
        Index("idx_email", "email"),
        Index("idx_status", "status"),
        Index("idx_created_at", "created_at"),
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    name = Column(String(100))
    bio = Column(Text)
    avatar_media_id = Column(BigInteger, ForeignKey("media.id", ondelete="SET NULL"))
    email_verified_domain = Column(String(50))
    batch_year = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")
    avatar = relationship("Media")

    __table_args__ = (
        Index("idx_username", "username"),
    )


class Role(Base):
    __tablename__ = "roles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(Enum(RoleName), unique=True, nullable=False)

    users = relationship("User", secondary="user_roles", back_populates="roles")


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(BigInteger, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)

    __table_args__ = (
        Index("idx_user_id", "user_id"),
    )


class Follow(Base):
    __tablename__ = "follows"

    follower_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    following_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_follower_id", "follower_id"),
        Index("idx_following_id", "following_id"),
    )


class UserSession(Base):
    """User session management for authentication"""
    __tablename__ = "user_sessions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    refresh_token = Column(String(500), unique=True)
    expires_at = Column(DateTime, nullable=False)
    refresh_expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    ip_address = Column(String(50))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_token", "token"),
        Index("idx_expires_at", "expires_at"),
        Index("idx_is_active", "is_active"),
    )


class OTPPurpose(str, enum.Enum):
    LOGIN = "LOGIN"
    PASSWORD_RESET = "PASSWORD_RESET"
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"


class OTP(Base):
    """One-Time Password for login and password reset"""
    __tablename__ = "otps"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(150), nullable=False)
    otp_code = Column(String(6), nullable=False)
    purpose = Column(Enum(OTPPurpose), nullable=False)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="otps")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_email", "email"),
        Index("idx_expires_at", "expires_at"),
        Index("idx_purpose", "purpose"),
    )


class PasswordHistory(Base):
    """Track password changes for security"""
    __tablename__ = "password_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_password_hash = Column(String(255), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="password_history")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
    )
