"""
Posts Routes
Purpose: API endpoints for creating posts, comments, reactions, and feed management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from schemas.posts import (
    PostCreate, PostUpdate, PostResponse, 
    CommentCreate, CommentUpdate, CommentResponse,
    ReactionCreate, ReactionResponse,
    RumorVoteCreate, RumorVoteResponse,
    ReportCreate, ReportResponse
)
from services.post_service import PostService
from utils.security import JWTManager

router = APIRouter(prefix="/posts", tags=["Posts"])


def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> int:
    """Extract user_id from JWT token"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    token = parts[1]
    user_id = JWTManager.get_user_id_from_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user_id


def get_current_user_optional(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> Optional[int]:
    """Extract user_id from JWT token (optional - returns None if not provided)"""
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    token = parts[1]
    user_id = JWTManager.get_user_id_from_token(token)
    
    return user_id


# ===== CREATE POST =====
@router.post("", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_post(
    request: PostCreate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new post"""
    success, message, data = PostService.create_post(
        db=db,
        user_id=current_user,
        post_type=request.type,
        caption=request.caption,
        description=request.description,
        is_anonymous=request.is_anonymous,
        media_ids=request.media_ids,
        tags=request.tags
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "post_id": data["post_id"],
        "type": data["type"],
        "is_anonymous": data["is_anonymous"]
    }


# ===== GET ALL POSTS FEED =====
@router.get("", response_model=dict)
async def get_all_posts(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    post_type: Optional[str] = Query(None),
    current_user: Optional[int] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get all posts with pagination (authentication optional)"""
    success, message, data = PostService.get_all_posts(
        db=db,
        user_id=current_user,
        limit=limit,
        offset=offset,
        post_type=post_type
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=message)
    
    return {
        "message": message,
        "data": data
    }


# ===== GET POST =====
@router.get("/{post_id}", response_model=dict)
async def get_post(
    post_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get single post by ID with comments (marks as viewed if authenticated)"""
    # Extract user_id from token if provided
    user_id = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            user_id = JWTManager.get_user_id_from_token(parts[1])
    
    success, message, data = PostService.get_post(
        db=db,
        post_id=post_id,
        user_id=user_id
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)
    
    return data


# ===== ADD COMMENT =====
@router.post("/{post_id}/comment", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_comment(
    post_id: int,
    request: CommentCreate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add comment to post
    Requires JWT authentication
    """
    success, message, data = PostService.add_comment(
        db=db,
        post_id=post_id,
        user_id=current_user,
        content=request.content,
        is_anonymous=request.is_anonymous
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "comment_id": data["comment_id"],
        "post_id": data["post_id"],
        "user_id": data["user_id"],
        "content": data["content"]
    }


# ===== DELETE COMMENT =====
@router.delete("/{post_id}/comment/{comment_id}", response_model=dict)
async def delete_comment(
    post_id: int,
    comment_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a comment (owner only)
    Requires JWT authentication
    """
    success, message = PostService.delete_comment(
        db=db,
        comment_id=comment_id,
        user_id=current_user
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "comment_id": comment_id,
        "post_id": post_id
    }


# ===== REACT TO POST =====
@router.post("/{post_id}/react", response_model=dict, status_code=status.HTTP_201_CREATED)
async def react_to_post(
    post_id: int,
    request: ReactionCreate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """React to post (LIKE, LOVE, HAHA, WOW, SAD, ANGRY) with reaction power tracking"""
    success, message, data = PostService.react_to_post(
        db=db,
        post_id=post_id,
        user_id=current_user,
        reaction_type=request.type
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "reaction_type": data["reaction_type"],
        "post_id": data["post_id"],
        "reaction_weight": data["reaction_weight"],
        "changed": data["changed"]
    }


# ===== UNREACT FROM POST =====
@router.delete("/{post_id}/react", response_model=dict)
async def unreact_from_post(
    post_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove reaction from post"""
    success, message = PostService.unreact_from_post(
        db=db,
        post_id=post_id,
        user_id=current_user
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "post_id": post_id
    }


# ===== VOTE ON RUMOR =====
@router.post("/{post_id}/vote", response_model=dict, status_code=status.HTTP_201_CREATED)
async def vote_on_rumor(
    post_id: int,
    request: RumorVoteCreate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vote TRUE or FALSE on a rumor post with voting power tracking"""
    success, message, data = PostService.vote_on_rumor(
        db=db,
        post_id=post_id,
        user_id=current_user,
        vote=request.vote
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "vote": data["vote"],
        "vote_weight": data["vote_weight"],
        "total_votes_true": data["total_votes_true"],
        "total_votes_false": data["total_votes_false"],
        "percentage_true": data["percentage_true"],
        "total_votes_true_weighted": data["total_votes_true_weighted"],
        "total_votes_false_weighted": data["total_votes_false_weighted"],
        "percentage_true_weighted": data["percentage_true_weighted"]
    }


# ===== DELETE VOTE =====
@router.delete("/{post_id}/vote", response_model=dict)
async def delete_vote(
    post_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove vote from a rumor post with history tracking"""
    success, message, data = PostService.delete_vote(
        db=db,
        post_id=post_id,
        user_id=current_user
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "post_id": data["post_id"],
        "removed_vote": data["removed_vote"],
        "total_votes_true": data["total_votes_true"],
        "total_votes_false": data["total_votes_false"],
        "percentage_true": data["percentage_true"],
        "total_votes_true_weighted": data["total_votes_true_weighted"],
        "total_votes_false_weighted": data["total_votes_false_weighted"],
        "percentage_true_weighted": data["percentage_true_weighted"]
    }


# ===== UPDATE POST =====
@router.put("/{post_id}", response_model=dict)
async def update_post(
    post_id: int,
    request: PostUpdate,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update post (caption/description only, owner only)"""
    success, message, data = PostService.update_post(
        db=db,
        post_id=post_id,
        user_id=current_user,
        caption=request.caption,
        description=request.description
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {
        "message": message,
        "post_id": data["post_id"]
    }


# ===== DELETE POST =====
@router.delete("/{post_id}", response_model=dict)
async def delete_post(
    post_id: int,
    current_user: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete post (soft delete, owner only)"""
    success, message, _ = PostService.delete_post(
        db=db,
        post_id=post_id,
        user_id=current_user
    )
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    return {"message": message}
