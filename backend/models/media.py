"""
Media Model
Purpose: Stores media files (images, videos, documents) used across the platform
"""

from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, BigInteger, Index
from database import Base
from datetime import datetime
import enum


class MediaType(str, enum.Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    DOCUMENT = "DOCUMENT"


class ProcessingStatus(str, enum.Enum):
    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class Media(Base):
    __tablename__ = "media"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    url = Column(Text, nullable=False)
    type = Column(Enum(MediaType), nullable=False)
    processing_status = Column(Enum(ProcessingStatus), default=ProcessingStatus.READY)
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_type", "type"),
        Index("idx_status", "processing_status"),
    )
