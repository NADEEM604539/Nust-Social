"""
Media Routes
Purpose: API endpoints for media upload, retrieval, deletion, and listing
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from schemas.media import MediaUploadResponse, MediaResponse, MediaListResponse, MediaDeleteResponse
from services.media_service import MediaService

router = APIRouter(prefix="/media", tags=["Media"])


@router.post("", response_model=dict, status_code=201)
async def upload_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload media file (image, video, or document)
    
    Supported types:
    - IMAGE: JPEG, PNG, GIF, WebP
    - VIDEO: MP4, WebM, MOV
    - DOCUMENT: PDF, DOC, DOCX
    
    Max file size: 50 MB
    """
    success, message, data = await MediaService.upload_media(db, file)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {
        "message": message,
        "id": data["id"],
        "url": data["url"],
        "type": data["type"],
        "file_size": data["file_size"]
    }


@router.get("/{media_id}", response_model=dict)
async def get_media(
    media_id: int,
    db: Session = Depends(get_db)
):
    """
    Retrieve media details by ID
    """
    success, message, data = MediaService.get_media(db, media_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=message)
    
    return {
        "message": message,
        "data": data
    }


@router.delete("/{media_id}", response_model=dict)
async def delete_media(
    media_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete media file and metadata
    """
    success, message = MediaService.delete_media(db, media_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=message)
    
    return {
        "message": message,
        "media_id": media_id
    }


@router.get("", response_model=dict)
async def list_media(
    media_type: Optional[str] = Query(None, description="Filter by media type (IMAGE, VIDEO, DOCUMENT)"),
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    offset: int = Query(0, ge=0, description="Offset from start"),
    db: Session = Depends(get_db)
):
    """
    List all media files with optional filtering
    
    Query Parameters:
    - media_type: Filter by IMAGE, VIDEO, or DOCUMENT
    - limit: Results per page (1-100, default: 20)
    - offset: Pagination offset (default: 0)
    """
    success, message, data = MediaService.list_media(db, media_type, limit, offset)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {
        "message": message,
        "data": data
    }
