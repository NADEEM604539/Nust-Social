"""
Media Schemas
Purpose: Request/Response validation for media operations (upload, retrieve, delete)
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class MediaType(str, Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    DOCUMENT = "DOCUMENT"


class ProcessingStatus(str, Enum):
    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class MediaUploadResponse(BaseModel):
    """Response when media is uploaded"""
    id: int = Field(..., description="Media ID")
    url: str = Field(..., description="Media file URL")
    type: MediaType = Field(..., description="Media type (IMAGE, VIDEO, DOCUMENT)")
    processing_status: ProcessingStatus = Field(..., description="Processing status")
    file_size: int = Field(..., description="File size in bytes")
    created_at: datetime = Field(..., description="Upload timestamp")

    class Config:
        from_attributes = True


class MediaResponse(BaseModel):
    """Response for media retrieval"""
    id: int = Field(..., description="Media ID")
    url: str = Field(..., description="Media file URL")
    type: MediaType = Field(..., description="Media type (IMAGE, VIDEO, DOCUMENT)")
    processing_status: ProcessingStatus = Field(..., description="Processing status")
    file_size: int = Field(..., description="File size in bytes")
    created_at: datetime = Field(..., description="Upload timestamp")

    class Config:
        from_attributes = True


class MediaListResponse(BaseModel):
    """Response for media list"""
    media: list[MediaResponse] = Field(..., description="List of media files")
    total: int = Field(..., description="Total count of media files")
    limit: int = Field(..., description="Limit per page")
    offset: int = Field(..., description="Offset from start")

    class Config:
        from_attributes = True


class MediaDeleteResponse(BaseModel):
    """Response when media is deleted"""
    message: str = Field(..., description="Deletion status message")
    media_id: int = Field(..., description="Deleted media ID")
