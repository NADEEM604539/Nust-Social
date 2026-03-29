"""
Societies Routes
Purpose: API endpoints for society management, membership, and society posts
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal
from schemas.societies import (
    SocietyCreate, SocietyResponse, SocietyMemberResponse, 
    UpdateMemberRoleRequest, SocietyPostCreate, SocietyPostResponse,
    EventCreate, EventResponse, EventTicketResponse, EventUpdate,
    EventTicketCreate, EventTicketPurchaseCreate, EventTicketPurchaseResponse,
    EventTicketPurchaseStatusUpdate
)
from services.society_service import SocietyService
from routes.auth import get_current_user

router = APIRouter(prefix="/societies", tags=["societies"])


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=SocietyResponse, status_code=status.HTTP_201_CREATED)
async def create_society(
    society: SocietyCreate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new society
    - Requires authentication
    - Creator becomes ADMIN
    """
    created_society = SocietyService.create_society(
        db=db,
        creator_id=current_user_id,
        society_data=society
    )
    return created_society


@router.get("/", response_model=List[SocietyResponse])
async def list_societies(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    List all societies
    - No authentication required
    - Pagination support
    """
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pagination parameters"
        )
    
    societies = SocietyService.list_societies(
        db=db,
        skip=skip,
        limit=limit
    )
    return societies


@router.get("/{society_id}", response_model=SocietyResponse)
async def get_society(society_id: int, db: Session = Depends(get_db)):
    """
    Get society details
    - No authentication required
    """
    society = SocietyService.get_society_by_id(db=db, society_id=society_id)
    return society


@router.put("/{society_id}", response_model=SocietyResponse)
async def update_society(
    society_id: int,
    society_update: SocietyCreate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update society details
    - Requires authentication
    - Only society admins can update
    """
    updated_society = SocietyService.update_society(
        db=db,
        society_id=society_id,
        current_user_id=current_user_id,
        society_data=society_update
    )
    return updated_society


@router.delete("/{society_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_society(
    society_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a society
    - Requires authentication
    - Only society admins can delete
    """
    SocietyService.delete_society(
        db=db,
        society_id=society_id,
        current_user_id=current_user_id
    )


@router.post("/{society_id}/join", status_code=status.HTTP_201_CREATED)
async def join_society(
    society_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Join a society
    - Requires authentication
    """
    member = SocietyService.add_member(
        db=db,
        society_id=society_id,
        user_id=current_user_id,
        role="MEMBER"
    )
    return member


@router.delete("/{society_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_society(
    society_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Leave a society
    - Requires authentication
    """
    SocietyService.remove_member(
        db=db,
        society_id=society_id,
        user_id=current_user_id,
        current_user_id=current_user_id
    )


@router.get("/{society_id}/members", response_model=List[SocietyMemberResponse])
async def get_society_members(
    society_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all members of a society
    - No authentication required
    """
    if skip < 0 or limit < 1 or limit > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pagination parameters"
        )
    
    members = SocietyService.get_members(
        db=db,
        society_id=society_id,
        skip=skip,
        limit=limit
    )
    return members


@router.put("/{society_id}/members/{user_id}/role", response_model=SocietyMemberResponse)
async def update_member_role(
    society_id: int,
    user_id: int,
    role_update: UpdateMemberRoleRequest,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update member role
    - Requires authentication
    - Only society admins can update roles
    """
    member = SocietyService.update_member_role(
        db=db,
        society_id=society_id,
        user_id=user_id,
        new_role=role_update.role,
        current_user_id=current_user_id
    )
    return member


@router.delete("/{society_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    society_id: int,
    user_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a member from society
    - Requires authentication
    - Admins can remove anyone, users can only remove themselves
    """
    SocietyService.remove_member(
        db=db,
        society_id=society_id,
        user_id=user_id,
        current_user_id=current_user_id
    )
    return None


# ==================== SOCIETY POSTS ====================

@router.post("/{society_id}/posts", response_model=SocietyPostResponse, status_code=status.HTTP_201_CREATED)
async def create_society_post(
    society_id: int,
    post: SocietyPostCreate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a society post/announcement
    - Requires authentication
    - Only society admins and moderators can create posts
    """
    created_post = SocietyService.create_society_post(
        db=db,
        society_id=society_id,
        created_by_id=current_user_id,
        caption=post.title,
        description=post.content
    )
    return created_post


@router.get("/{society_id}/posts", response_model=List[SocietyPostResponse])
async def get_society_posts(
    society_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get all posts from a society
    - No authentication required
    """
    if skip < 0 or limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid pagination parameters"
        )
    
    posts = SocietyService.get_society_posts(
        db=db,
        society_id=society_id,
        skip=skip,
        limit=limit
    )
    return posts


@router.delete("/{society_id}/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_society_post(
    society_id: int,
    post_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a society post
    - Requires authentication
    - Only post creator or society admin can delete
    """
    SocietyService.delete_society_post(
        db=db,
        society_id=society_id,
        post_id=post_id,
        current_user_id=current_user_id
    )


# ==================== SOCIETY EVENTS ====================

@router.post("/{society_id}/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    society_id: int,
    event: EventCreate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new event for a society"""
    created_event = SocietyService.create_event(
        db=db,
        society_id=society_id,
        event_data=event,
        current_user_id=current_user_id
    )
    return created_event


@router.get("/{society_id}/events", response_model=List[EventResponse])
async def list_events(
    society_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List all upcoming events for a society"""
    events = SocietyService.list_events_for_society(
        db=db,
        society_id=society_id,
        skip=skip,
        limit=limit
    )
    return events


@router.get("/{society_id}/events/{event_id}", response_model=EventResponse)
async def get_event(
    society_id: int,
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get event details"""
    event = SocietyService.get_event_by_id(
        db=db,
        society_id=society_id,
        event_id=event_id
    )
    return event


@router.put("/{society_id}/events/{event_id}", response_model=EventResponse)
async def update_event(
    society_id: int,
    event_id: int,
    event_update: EventUpdate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update event details"""
    updated_event = SocietyService.update_event(
        db=db,
        society_id=society_id,
        event_id=event_id,
        event_data=event_update,
        current_user_id=current_user_id
    )
    return updated_event


@router.delete("/{society_id}/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    society_id: int,
    event_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an event"""
    SocietyService.delete_event(
        db=db,
        society_id=society_id,
        event_id=event_id,
        current_user_id=current_user_id
    )


@router.get("/{society_id}/events/{event_id}/tickets", response_model=List[EventTicketResponse])
async def get_event_tickets(
    society_id: int,
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get all ticket types for an event"""
    tickets = SocietyService.list_event_tickets(
        db=db,
        society_id=society_id,
        event_id=event_id
    )
    return tickets


@router.post("/{society_id}/events/{event_id}/tickets", response_model=EventTicketResponse, status_code=status.HTTP_201_CREATED)
async def create_event_ticket(
    society_id: int,
    event_id: int,
    ticket: EventTicketCreate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a ticket type for an event"""
    created_ticket = SocietyService.create_event_ticket(
        db=db,
        society_id=society_id,
        event_id=event_id,
        ticket_data=ticket,
        current_user_id=current_user_id
    )
    return created_ticket


@router.put("/{society_id}/events/{event_id}/tickets/{ticket_id}", response_model=EventTicketResponse)
async def update_event_ticket(
    society_id: int,
    event_id: int,
    ticket_id: int,
    ticket: EventTicketCreate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a ticket type for an event"""
    updated_ticket = SocietyService.update_event_ticket(
        db=db,
        society_id=society_id,
        event_id=event_id,
        ticket_id=ticket_id,
        ticket_data=ticket,
        current_user_id=current_user_id
    )
    return updated_ticket


@router.delete("/{society_id}/events/{event_id}/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event_ticket(
    society_id: int,
    event_id: int,
    ticket_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a ticket type from an event"""
    SocietyService.delete_event_ticket(
        db=db,
        society_id=society_id,
        event_id=event_id,
        ticket_id=ticket_id,
        current_user_id=current_user_id
    )


@router.post("/{society_id}/events/{event_id}/tickets/purchase", response_model=EventTicketPurchaseResponse, status_code=status.HTTP_201_CREATED)
async def purchase_ticket(
    society_id: int,
    event_id: int,
    purchase: EventTicketPurchaseCreate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Purchase tickets for an event"""
    purchase_record = SocietyService.purchase_event_ticket(
        db=db,
        event_id=event_id,
        ticket_id=purchase.ticket_id,
        user_id=current_user_id,
        quantity=purchase.quantity
    )
    return purchase_record


@router.get("/{society_id}/events/{event_id}/attendees", response_model=List)
async def get_event_attendees(
    society_id: int,
    event_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of event attendees (users with confirmed/completed ticket purchases)"""
    attendees = SocietyService.get_event_attendees(
        db=db,
        society_id=society_id,
        event_id=event_id
    )
    return attendees


@router.get("/{society_id}/events/{event_id}/tickets/purchases", response_model=List)
async def get_event_ticket_purchases(
    society_id: int,
    event_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all ticket purchases for an event with full details (admin/moderator only)"""
    purchases = SocietyService.get_event_ticket_purchases(
        db=db,
        society_id=society_id,
        event_id=event_id,
        current_user_id=current_user_id,
        skip=skip,
        limit=limit
    )
    return purchases


@router.put("/{society_id}/events/{event_id}/tickets/purchase/{purchase_id}/approve", response_model=EventTicketPurchaseResponse)
async def approve_ticket_purchase(
    society_id: int,
    event_id: int,
    purchase_id: int,
    status_update: EventTicketPurchaseStatusUpdate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Approve or change ticket purchase status (admin/moderator only)"""
    purchase = SocietyService.update_ticket_purchase_status(
        db=db,
        society_id=society_id,
        event_id=event_id,
        purchase_id=purchase_id,
        new_status=status_update.new_status,
        current_user_id=current_user_id
    )
    return purchase
