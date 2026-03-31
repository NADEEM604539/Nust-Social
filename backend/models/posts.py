"""
Posts Model
Purpose: Manages posts (confessions, rumors, announcements), comments, reactions, and tags
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, Enum, DateTime, BigInteger, ForeignKey, Index, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum


class PostType(str, enum.Enum):
    RUMOR = "RUMOR"
    CONFESSION = "CONFESSION"
    SIMPLE_POST = "SIMPLE_POST"
    SOCIETY_POST = "SOCIETY_POST"
    ANNOUNCEMENT = "ANNOUNCEMENT"
    MARKETPLACE_POST = "MARKETPLACE_POST"


class ReactionType(str, enum.Enum):
    LIKE = "LIKE"
    LOVE = "LOVE"
    HAHA = "HAHA"
    WOW = "WOW"
    SAD = "SAD"
    ANGRY = "ANGRY"


class RumorVoteType(str, enum.Enum):
    TRUE = "TRUE"
    FALSE = "FALSE"


class Post(Base):
    __tablename__ = "posts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"))
    type = Column(Enum(PostType), nullable=False)
    caption = Column(Text)
    description = Column(Text)
    is_anonymous = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    deleted_at = Column(DateTime, nullable=True)
    edited_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="posts")
    media = relationship("PostMedia", back_populates="post", cascade="all, delete-orphan")
    tags = relationship("PostTag", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    rumor_votes = relationship("RumorVote", back_populates="post", cascade="all, delete-orphan")
    stats = relationship("PostStats", back_populates="post", uselist=False, cascade="all, delete-orphan")
    views = relationship("PostView", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_type", "type"),
        Index("idx_created_at", "created_at"),
        Index("idx_deleted_at", "deleted_at"),
        Index("idx_approved", "is_approved"),
    )


class PostMedia(Base):
    __tablename__ = "post_media"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    media_id = Column(BigInteger, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="media")
    media = relationship("Media")

    __table_args__ = (
        Index("idx_post_id", "post_id"),
        Index("idx_media_id", "media_id"),
    )


class PostTag(Base):
    __tablename__ = "post_tags"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="tags")

    __table_args__ = (
        Index("idx_post_id", "post_id"),
        Index("idx_tag", "tag"),
    )


class Comment(Base):
    __tablename__ = "comments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)
    edited_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="comments")
    user = relationship("User")

    __table_args__ = (
        Index("idx_post_id", "post_id"),
        Index("idx_user_id", "user_id"),
        Index("idx_created_at", "created_at"),
    )


class Reaction(Base):
    __tablename__ = "reactions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(BigInteger, nullable=False)  # ID of post or comment
    target_type = Column(String(50), nullable=False)  # 'POST' or 'COMMENT'
    reaction_type = Column(Enum(ReactionType), nullable=False)  # Type of reaction (LIKE, LOVE, etc)
    reaction_weight = Column(Float, default=1.0, nullable=False)  # Weight based on user reputation (1.0 = normal)
    last_changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)  # Track when user last changed reaction
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    # Removed post relationship since reactions now support both posts and comments
    # Use: reactions = relationship("Reaction", ...) if needed in Post model
    user = relationship("User")
    reaction_history = relationship("ReactionHistory", back_populates="reaction", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_target", "target_id", "target_type"),
        Index("idx_user_id", "user_id"),
        Index("idx_last_changed", "last_changed_at"),
        UniqueConstraint("target_id", "target_type", "user_id", name="uq_user_target_reaction"),
    )


class RumorVote(Base):
    __tablename__ = "rumor_votes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vote = Column(Enum(RumorVoteType), nullable=False)
    vote_weight = Column(Float, default=1.0, nullable=False)  # Weight based on user reputation (1.0 = normal)
    last_changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="rumor_votes")
    user = relationship("User")
    vote_history = relationship("RumorVoteHistory", back_populates="rumor_vote", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_post_id", "post_id"),
        Index("idx_user_id", "user_id"),
        Index("idx_post_user", "post_id", "user_id"),
        Index("idx_last_changed", "last_changed_at"),
        UniqueConstraint("post_id", "user_id", name="uq_user_post_rumor_vote"),
    )


class RumorVoteHistory(Base):
    """Audit trail for vote changes - track all vote modifications"""
    __tablename__ = "rumor_vote_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    rumor_vote_id = Column(BigInteger, ForeignKey("rumor_votes.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_vote = Column(Enum(RumorVoteType), nullable=True)  # NULL if this was first vote
    new_vote = Column(Enum(RumorVoteType), nullable=False)
    old_weight = Column(Float, nullable=True)
    new_weight = Column(Float, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(String(255), nullable=True)  # "user_changed", "weight_updated", "deleted"

    rumor_vote = relationship("RumorVote", back_populates="vote_history")

    __table_args__ = (
        Index("idx_rumor_vote_id", "rumor_vote_id"),
        Index("idx_post_id", "post_id"),
        Index("idx_user_id", "user_id"),
        Index("idx_changed_at", "changed_at"),
    )


class ReactionHistory(Base):
    """Audit trail for reaction changes - track all reaction modifications"""
    __tablename__ = "reaction_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    reaction_id = Column(BigInteger, ForeignKey("reactions.id", ondelete="CASCADE"), nullable=False)
    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_reaction = Column(Enum(ReactionType), nullable=True)  # NULL if this was first reaction
    new_reaction = Column(Enum(ReactionType), nullable=False)
    old_weight = Column(Float, nullable=True)
    new_weight = Column(Float, nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    reason = Column(String(255), nullable=True)  # "user_changed", "weight_updated", "deleted"

    reaction = relationship("Reaction", back_populates="reaction_history")

    __table_args__ = (
        Index("idx_reaction_id", "reaction_id"),
        Index("idx_post_id", "post_id"),
        Index("idx_user_id", "user_id"),
        Index("idx_changed_at", "changed_at"),
    )


class PostStats(Base):
    __tablename__ = "post_stats"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), unique=True, nullable=False)
    likes_count = Column(Integer, default=0)
    likes_count_weighted = Column(Float, default=0.0)  # Sum of reaction_weight for LIKE reactions
    comments_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    
    # Rumor voting - raw vote counts
    rumor_true_votes = Column(Integer, default=0)
    rumor_false_votes = Column(Integer, default=0)
    
    # Rumor voting - weighted vote counts (by user reputation)
    rumor_true_votes_weighted = Column(Float, default=0.0)
    rumor_false_votes_weighted = Column(Float, default=0.0)
    
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    post = relationship("Post", back_populates="stats")

    __table_args__ = (
        Index("idx_post_id", "post_id"),
    )


class PostView(Base):
    __tablename__ = "post_views"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    post_id = Column(BigInteger, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    viewed_at = Column(DateTime, default=datetime.utcnow)

    post = relationship("Post", back_populates="views")

    __table_args__ = (
        Index("idx_post_id", "post_id"),
        Index("idx_user_id", "user_id"),
        Index("idx_viewed_at", "viewed_at"),
        UniqueConstraint("post_id", "user_id", name="uq_post_user_view"),
    )
