"""
Media Service
Purpose: Business logic for media uploads, retrieval, and deletion
Handles file storage and metadata management
"""

import os
import uuid
from datetime import datetime
from typing import Optional, Tuple, Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import UploadFile
from config import API_BASE_URL


class MediaService:
    """Handle media file upload, storage, and management"""
    
    # Configuration
    UPLOAD_DIR = "uploads"
    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
    ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
    ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
    ALLOWED_DOCUMENT_TYPES = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
    
    @staticmethod
    def create_upload_directory():
        """Create uploads directory if it doesn't exist"""
        if not os.path.exists(MediaService.UPLOAD_DIR):
            os.makedirs(MediaService.UPLOAD_DIR)
    
    @staticmethod
    def determine_media_type(content_type: str) -> Optional[str]:
        """
        Determine media type from content type
        Returns: 'IMAGE', 'VIDEO', 'DOCUMENT', or None
        """
        if content_type in MediaService.ALLOWED_IMAGE_TYPES:
            return "IMAGE"
        elif content_type in MediaService.ALLOWED_VIDEO_TYPES:
            return "VIDEO"
        elif content_type in MediaService.ALLOWED_DOCUMENT_TYPES:
            return "DOCUMENT"
        return None
    
    @staticmethod
    def register_media(
        db: Session,
        url: str,
        file_type: str
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Register media in database (frontend already saved the file)
        Frontend stores file at /uploads/{filename}
        Frontend sends the /uploads/{filename} URL and MIME type
        Backend converts MIME type to category and stores in database
        Returns: (success, message, media_data)
        """
        try:
            # Convert MIME type to category (shorter for database storage)
            media_category = "IMAGE"  # Default
            if file_type.startswith("video"):
                media_category = "VIDEO"
            elif file_type.startswith("application/pdf"):
                media_category = "DOCUMENT"
            elif file_type.startswith("application"):
                media_category = "DOCUMENT"
            
            print(f"DEBUG: Converting MIME type '{file_type}' to category '{media_category}'")
            
            # Store metadata in database
            db.execute(
                text("""
                    INSERT INTO media (url, type, processing_status, file_size, created_at)
                    VALUES (:url, :type, 'READY', 0, NOW())
                """),
                {
                    "url": url,
                    "type": media_category,
                }
            )
            db.flush()
            
            # Get inserted media ID
            media_result = db.execute(
                text("SELECT id FROM media WHERE url = :url"),
                {"url": url}
            ).fetchone()
            
            db.commit()
            media_id = media_result[0]
            
            print(f"DEBUG: Registered media {url} with ID {media_id}")
            
            return True, "Media registered successfully", {
                "id": media_id,
                "url": url,
                "type": media_category,
            }
        except Exception as e:
            db.rollback()
            print(f"DEBUG: Error registering media: {str(e)}")
            return False, f"Media registration failed: {str(e)}", None
    
    @staticmethod
    async def upload_media(
        db: Session,
        file: UploadFile
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Upload media file and store metadata in database
        Returns: (success, message, media_data)
        """
        try:
            MediaService.create_upload_directory()
            
            # Validate file type
            media_type = MediaService.determine_media_type(file.content_type)
            if not media_type:
                return False, f"Unsupported file type: {file.content_type}", None
            
            # Read file content
            file_content = await file.read()
            file_size = len(file_content)
            
            # Validate file size
            if file_size > MediaService.MAX_FILE_SIZE:
                return False, f"File size exceeds maximum limit of {MediaService.MAX_FILE_SIZE} bytes", None
            
            # Generate unique filename
            file_extension = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(MediaService.UPLOAD_DIR, unique_filename)
            
            # Save file to disk
            with open(file_path, "wb") as f:
                f.write(file_content)
            
            # Generate absolute URL
            url = f"{API_BASE_URL}/uploads/{unique_filename}"
            
            # Store metadata in database (store MIME type, not just category)
            db.execute(
                text("""
                    INSERT INTO media (url, type, processing_status, file_size, created_at)
                    VALUES (:url, :type, 'READY', :file_size, NOW())
                """),
                {
                    "url": url,
                    "type": file.content_type,
                    "file_size": file_size
                }
            )
            db.flush()
            
            # Get inserted media ID
            media_result = db.execute(
                text("SELECT id FROM media WHERE url = :url"),
                {"url": url}
            ).fetchone()
            
            db.commit()
            media_id = media_result[0]
            
            return True, "Media uploaded successfully", {
                "id": media_id,
                "url": url,
                "type": file.content_type,
                "file_size": file_size
            }
        except Exception as e:
            db.rollback()
            return False, f"Media upload failed: {str(e)}", None
    
    @staticmethod
    def get_media(db: Session, media_id: int) -> Tuple[bool, str, Optional[dict]]:
        """
        Retrieve media metadata by ID
        Returns: (success, message, media_data)
        """
        try:
            result = db.execute(
                text("""
                    SELECT id, url, type, processing_status, file_size, created_at
                    FROM media
                    WHERE id = :id
                """),
                {"id": media_id}
            ).fetchone()
            
            if not result:
                return False, "Media not found", None
            
            media_id, url, media_type, status, file_size, created_at = result
            
            return True, "Media retrieved", {
                "id": media_id,
                "url": url,
                "type": media_type,
                "processing_status": status,
                "file_size": file_size,
                "created_at": created_at
            }
        except Exception as e:
            return False, f"Failed to retrieve media: {str(e)}", None
    
    @staticmethod
    def delete_media(db: Session, media_id: int) -> Tuple[bool, str]:
        """
        Delete media file and metadata
        Returns: (success, message)
        """
        try:
            # Get media details
            result = db.execute(
                text("SELECT url FROM media WHERE id = :id"),
                {"id": media_id}
            ).fetchone()
            
            if not result:
                return False, "Media not found"
            
            url = result[0]
            
            # Delete file from disk
            file_path = os.path.join(".", url)  # url is relative, e.g., /uploads/filename
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Delete from database
            db.execute(
                text("DELETE FROM media WHERE id = :id"),
                {"id": media_id}
            )
            
            db.commit()
            
            return True, "Media deleted successfully"
        except Exception as e:
            db.rollback()
            return False, f"Failed to delete media: {str(e)}"
    
    @staticmethod
    def list_media(
        db: Session,
        media_type: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        List media files with optional filtering by type
        Returns: (success, message, list_data)
        """
        try:
            # Build query
            where_clause = "WHERE 1=1"
            params = {}
            
            if media_type:
                where_clause += " AND type = :type"
                params["type"] = media_type
            
            # Get total count
            count_result = db.execute(
                text(f"SELECT COUNT(*) FROM media {where_clause}"),
                params
            ).fetchone()
            total = count_result[0]
            
            # Get paginated results
            params["limit"] = limit
            params["offset"] = offset
            
            results = db.execute(
                text(f"""
                    SELECT id, url, type, processing_status, file_size, created_at
                    FROM media
                    {where_clause}
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                params
            ).fetchall()
            
            media_list = []
            for row in results:
                media_list.append({
                    "id": row[0],
                    "url": row[1],
                    "type": row[2],
                    "processing_status": row[3],
                    "file_size": row[4],
                    "created_at": row[5]
                })
            
            return True, "Media list retrieved", {
                "media": media_list,
                "total": total,
                "limit": limit,
                "offset": offset
            }
        except Exception as e:
            return False, f"Failed to retrieve media list: {str(e)}", None
