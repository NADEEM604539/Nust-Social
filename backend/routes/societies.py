"""
Societies Routes
Purpose: API endpoints for society management, membership, and society posts
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal
from schemas.societies import (
    SocietyCreate, SocietyResponse, SocietyMemberResponse, 
    UpdateMemberRoleRequest, SocietyPostCreate, SocietyPostResponse
)
from services.society_service import SocietyService
from utils.security import get_current_user

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
    SocietyService.add_member(
        db=db,
        society_id=society_id,
        user_id=current_user_id,
        role="MEMBER"
    )


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
    - Only society members can create posts
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
