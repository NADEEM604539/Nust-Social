"""
Chat Model
Purpose: Manages conversations, participants, messages, and message media for real-time communication
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(200))
    is_group = Column(Boolean, default=False)
    created_by = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    creator = relationship("User")

    __table_args__ = (
        Index("idx_created_at", "created_at"),
    )


class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    conversation_id = Column(BigInteger, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    last_read_at = Column(DateTime)
    joined_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")

    __table_args__ = (
        Index("idx_conversation_id", "conversation_id"),
        Index("idx_user_id", "user_id"),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    conversation_id = Column(BigInteger, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    edited_at = Column(DateTime)
    deleted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")
    media = relationship("MessageMedia", back_populates="message", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_conversation_id", "conversation_id"),
        Index("idx_sender_id", "sender_id"),
        Index("idx_created_at", "created_at"),
    )


class MessageMedia(Base):
    __tablename__ = "message_media"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    message_id = Column(BigInteger, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    media_id = Column(BigInteger, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)

    message = relationship("Message", back_populates="media")
    media = relationship("Media")

    __table_args__ = (
        Index("idx_message_id", "message_id"),
    )
