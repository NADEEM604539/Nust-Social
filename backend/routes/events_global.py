"""
Global Events Routes
Purpose: Global event endpoints (not tied to specific society)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from database import get_db
from schemas.societies import EventResponse
from services.society_service import SocietyService

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/", response_model=List[EventResponse])
async def list_all_events(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    List all events across all societies
    - Pagination support
    - No authentication required
    - Events are sorted by date (newest first)
    """
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pagination parameters"
        )
    
    events = SocietyService.list_all_events(
        db=db,
        skip=skip,
        limit=limit
    )
    return events


@router.get("/{event_id}", response_model=EventResponse)
async def get_event_details(
    event_id: int,
    db: Session = Depends(get_db)
):
    """
    Get details of a specific event globally
    - No authentication required
    """
    try:
        event = db.execute(
            text("SELECT id, society_id, title, description, location, event_date, created_at, updated_at FROM events WHERE id = :id"),
            {"id": event_id}
        ).fetchone()
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        return {
            "id": event[0],
            "society_id": event[1],
            "title": event[2],
            "description": event[3],
            "location": event[4],
            "event_date": event[5],
            "created_at": event[6],
            "updated_at": event[7]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get event: {str(e)}"
        )
