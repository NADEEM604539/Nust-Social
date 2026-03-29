"""
Society Service
Purpose: Business logic for society management, memberships, and society-specific features
Uses raw MySQL queries with SQLAlchemy's text() for direct SQL execution
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from schemas.societies import SocietyCreate
from fastapi import HTTPException, status


class SocietyService:
    """Service for society-related operations"""
    
    @staticmethod
    def create_society(db: Session, creator_id: int, society_data: SocietyCreate) -> dict:
        """Create a new society and return society data"""
        try:
            # Check if society name already exists
            existing = db.execute(
                text("SELECT id FROM societies WHERE name = :name"),
                {"name": society_data.name}
            ).fetchone()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Society with this name already exists"
                )
            
            # Create new society
            db.execute(
                text("""
                    INSERT INTO societies (name, description, created_by, created_at)
                    VALUES (:name, :description, :created_by, NOW())
                """),
                {
                    "name": society_data.name,
                    "description": society_data.description,
                    "created_by": creator_id
                }
            )
            db.flush()
            
            # Get the created society ID
            society_result = db.execute(
                text("SELECT id FROM societies WHERE name = :name"),
                {"name": society_data.name}
            ).fetchone()
            
            society_id = society_result[0]
            
            # Add creator as ADMIN member
            db.execute(
                text("""
                    INSERT INTO society_members (society_id, user_id, role, joined_at)
                    VALUES (:society_id, :user_id, :role, NOW())
                """),
                {
                    "society_id": society_id,
                    "user_id": creator_id,
                    "role": "ADMIN"
                }
            )
            db.commit()
            
            # Return society data
            return {
                "id": society_id,
                "name": society_data.name,
                "description": society_data.description,
                "created_by": creator_id
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create society: {str(e)}"
            )
    
    @staticmethod
    def get_society_by_id(db: Session, society_id: int) -> dict:
        """Get society by ID and return as dict"""
        try:
            society = db.execute(
                text("SELECT id, name, description, created_by, created_at FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            return {
                "id": society[0],
                "name": society[1],
                "description": society[2],
                "created_by": society[3],
                "created_at": society[4]
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get society: {str(e)}"
            )
    
    @staticmethod
    def list_societies(db: Session, skip: int = 0, limit: int = 20) -> list:
        """List all societies with pagination"""
        try:
            societies = db.execute(
                text("""
                    SELECT id, name, description, created_by, created_at 
                    FROM societies 
                    ORDER BY created_at DESC
                    LIMIT :limit OFFSET :skip
                """),
                {"limit": limit, "skip": skip}
            ).fetchall()
            
            return [
                {
                    "id": s[0],
                    "name": s[1],
                    "description": s[2],
                    "created_by": s[3],
                    "created_at": s[4]
                }
                for s in societies
            ]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list societies: {str(e)}"
            )
    
    @staticmethod
    def update_society(db: Session, society_id: int, current_user_id: int, society_data: SocietyCreate) -> dict:
        """Update society details (admin only)"""
        try:
            # Check if user is admin
            is_admin = SocietyService._is_admin(db, society_id, current_user_id)
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins can update society details"
                )
            
            # Check if new name already exists (if different from current)
            current_name = db.execute(
                text("SELECT name FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not current_name:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            if society_data.name != current_name[0]:
                existing = db.execute(
                    text("SELECT id FROM societies WHERE name = :name"),
                    {"name": society_data.name}
                ).fetchone()
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Society with this name already exists"
                    )
            
            # Update society
            db.execute(
                text("""
                    UPDATE societies 
                    SET name = :name, description = :description, updated_at = NOW()
                    WHERE id = :id
                """),
                {
                    "name": society_data.name,
                    "description": society_data.description,
                    "id": society_id
                }
            )
            db.commit()
            
            return SocietyService.get_society_by_id(db, society_id)
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update society: {str(e)}"
            )
    
    @staticmethod
    def delete_society(db: Session, society_id: int, current_user_id: int) -> bool:
        """Delete a society (admin only)"""
        try:
            # Check if user is admin
            is_admin = SocietyService._is_admin(db, society_id, current_user_id)
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins can delete society"
                )
            
            # Delete society (cascade delete handled by database constraints)
            db.execute(
                text("DELETE FROM societies WHERE id = :id"),
                {"id": society_id}
            )
            db.commit()
            return True
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete society: {str(e)}"
            )
    
    @staticmethod
    def add_member(db: Session, society_id: int, user_id: int, role: str = "MEMBER") -> dict:
        """Add member to society"""
        try:
            # Verify society exists
            society_check = db.execute(
                text("SELECT id FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            # Verify user exists
            user_check = db.execute(
                text("SELECT id FROM users WHERE id = :id"),
                {"id": user_id}
            ).fetchone()
            
            if not user_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Check if already a member
            existing = db.execute(
                text("""
                    SELECT id FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User is already a member of this society"
                )
            
            # Validate role
            valid_roles = ["ADMIN", "MODERATOR", "MEMBER"]
            if role not in valid_roles:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role. Must be ADMIN, MODERATOR, or MEMBER"
                )
            
            # Create membership
            db.execute(
                text("""
                    INSERT INTO society_members (society_id, user_id, role, joined_at)
                    VALUES (:society_id, :user_id, :role, NOW())
                """),
                {
                    "society_id": society_id,
                    "user_id": user_id,
                    "role": role
                }
            )
            db.commit()
            
            return {
                "society_id": society_id,
                "user_id": user_id,
                "role": role
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to add member: {str(e)}"
            )
    
    @staticmethod
    def remove_member(db: Session, society_id: int, user_id: int, current_user_id: int) -> bool:
        """Remove member from society"""
        try:
            # Verify society exists
            society_check = db.execute(
                text("SELECT id FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            # Get the member
            member = db.execute(
                text("""
                    SELECT id FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            if not member:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Member not found"
                )
            
            # Check authorization: admin can remove anyone, user can only remove self
            is_admin = SocietyService._is_admin(db, society_id, current_user_id)
            if not is_admin and current_user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only admins can remove other members"
                )
            
            # Remove member
            db.execute(
                text("""
                    DELETE FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id
                """),
                {"society_id": society_id, "user_id": user_id}
            )
            db.commit()
            return True
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to remove member: {str(e)}"
            )
    
    @staticmethod
    def get_members(db: Session, society_id: int, skip: int = 0, limit: int = 100) -> list:
        """Get all members of a society"""
        try:
            # Verify society exists
            society_check = db.execute(
                text("SELECT id FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            members = db.execute(
                text("""
                    SELECT sm.society_id, sm.user_id, sm.role, sm.joined_at
                    FROM society_members sm
                    WHERE sm.society_id = :society_id
                    ORDER BY sm.joined_at DESC
                    LIMIT :limit OFFSET :skip
                """),
                {"society_id": society_id, "limit": limit, "skip": skip}
            ).fetchall()
            
            return [
                {
                    "society_id": m[0],
                    "user_id": m[1],
                    "role": m[2],
                    "joined_at": m[3]
                }
                for m in members
            ]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get members: {str(e)}"
            )
    
    @staticmethod
    def update_member_role(db: Session, society_id: int, user_id: int, new_role: str, current_user_id: int) -> dict:
        """Update member role (admin only)"""
        try:
            # Verify society exists
            society_check = db.execute(
                text("SELECT id FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            # Check if current user is admin
            is_admin = SocietyService._is_admin(db, society_id, current_user_id)
            if not is_admin:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins can update member roles"
                )
            
            # Get the member
            member = db.execute(
                text("""
                    SELECT user_id, role FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            if not member:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Member not found"
                )
            
            # Validate role
            valid_roles = ["ADMIN", "MODERATOR", "MEMBER"]
            if new_role not in valid_roles:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid role. Must be ADMIN, MODERATOR, or MEMBER"
                )
            
            # Update role
            db.execute(
                text("""
                    UPDATE society_members 
                    SET role = :role, updated_at = NOW()
                    WHERE society_id = :society_id AND user_id = :user_id
                """),
                {"role": new_role, "society_id": society_id, "user_id": user_id}
            )
            db.commit()
            
            return {
                "society_id": society_id,
                "user_id": user_id,
                "role": new_role
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update member role: {str(e)}"
            )
    
    @staticmethod
    def create_society_post(db: Session, society_id: int, created_by_id: int, caption: str, description: str) -> dict:
        """Create a society post/announcement and return formatted response"""
        try:
            # Verify society exists
            society_check = db.execute(
                text("SELECT id FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            # Check if user is a member
            is_member = SocietyService.is_member(db, society_id, created_by_id)
            if not is_member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society members can create posts"
                )
            
            # Create a post in posts table
            db.execute(
                text("""
                    INSERT INTO posts (user_id, type, caption, description, is_anonymous, is_approved, created_at)
                    VALUES (:user_id, :type, :caption, :description, :is_anonymous, :is_approved, NOW())
                """),
                {
                    "user_id": created_by_id,
                    "type": "SOCIETY_POST",
                    "caption": caption,
                    "description": description,
                    "is_anonymous": False,
                    "is_approved": True
                }
            )
            db.flush()
            
            # Get the post ID
            post_result = db.execute(
                text("""
                    SELECT id, created_at FROM posts 
                    WHERE user_id = :user_id AND type = 'SOCIETY_POST' AND caption = :caption
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"user_id": created_by_id, "caption": caption}
            ).fetchone()
            
            post_id = post_result[0]
            created_at = post_result[1]
            
            # Link post to society
            db.execute(
                text("""
                    INSERT INTO society_posts (post_id, society_id)
                    VALUES (:post_id, :society_id)
                """),
                {"post_id": post_id, "society_id": society_id}
            )
            db.commit()
            
            # Get media IDs
            media_ids = SocietyService.get_post_media_ids(db, post_id)
            
            # Return formatted response with post data
            return {
                "post_id": post_id,
                "society_id": society_id,
                "caption": caption,
                "description": description,
                "user_id": created_by_id,
                "media_ids": media_ids,
                "created_at": created_at
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create post: {str(e)}"
            )
    
    @staticmethod
    def get_society_posts(db: Session, society_id: int, skip: int = 0, limit: int = 20) -> list:
        """Get all posts from a society with media info and post details"""
        try:
            # Verify society exists
            society_check = db.execute(
                text("SELECT id FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            # Get society posts with post details
            society_posts = db.execute(
                text("""
                    SELECT sp.post_id, sp.society_id, p.caption, p.description, p.user_id, p.created_at
                    FROM society_posts sp
                    JOIN posts p ON sp.post_id = p.id
                    WHERE sp.society_id = :society_id
                    ORDER BY p.created_at DESC
                    LIMIT :limit OFFSET :skip
                """),
                {"society_id": society_id, "limit": limit, "skip": skip}
            ).fetchall()
            
            # Format response with media info
            result = []
            for post in society_posts:
                media_ids = SocietyService.get_post_media_ids(db, post[0])
                result.append({
                    "post_id": post[0],
                    "society_id": post[1],
                    "caption": post[2],
                    "description": post[3],
                    "user_id": post[4],
                    "media_ids": media_ids,
                    "created_at": post[5]
                })
            
            return result
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get posts: {str(e)}"
            )
    
    @staticmethod
    def delete_society_post(db: Session, society_id: int, post_id: int, current_user_id: int) -> bool:
        """Delete a society post (creator or admin only)"""
        try:
            # Verify society exists
            society_check = db.execute(
                text("SELECT id FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            if not society_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Society not found"
                )
            
            # Verify post exists in this society
            post_check = db.execute(
                text("""
                    SELECT p.user_id FROM posts p
                    JOIN society_posts sp ON p.id = sp.post_id
                    WHERE p.id = :post_id AND sp.society_id = :society_id
                """),
                {"post_id": post_id, "society_id": society_id}
            ).fetchone()
            
            if not post_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Post not found in this society"
                )
            
            post_creator_id = post_check[0]
            
            # Check authorization: creator can delete own post, admin can delete any
            is_admin = SocietyService._is_admin(db, society_id, current_user_id)
            if not is_admin and current_user_id != post_creator_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only post creator or society admin can delete this post"
                )
            
            # Delete post (will cascade delete from society_posts due to FK)
            db.execute(
                text("DELETE FROM posts WHERE id = :id"),
                {"id": post_id}
            )
            db.commit()
            return True
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete post: {str(e)}"
            )
    
    @staticmethod
    def get_post_media_ids(db: Session, post_id: int) -> list:
        """Get all media IDs for a post"""
        try:
            media_records = db.execute(
                text("SELECT media_id FROM post_media WHERE post_id = :post_id ORDER BY created_at"),
                {"post_id": post_id}
            ).fetchall()
            
            return [m[0] for m in media_records]
        except Exception:
            return []
    
    @staticmethod
    def is_member(db: Session, society_id: int, user_id: int) -> bool:
        """Check if user is member of society"""
        try:
            member = db.execute(
                text("""
                    SELECT id FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            return member is not None
        except Exception:
            return False
    
    # ==================== HELPER METHODS ====================
    
    @staticmethod
    def _is_admin(db: Session, society_id: int, user_id: int) -> bool:
        """Check if user is admin of society"""
        try:
            member = db.execute(
                text("""
                    SELECT id FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id AND role = 'ADMIN'
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            return member is not None
        except Exception:
            return False
    
    @staticmethod
    def get_member_count(db: Session, society_id: int) -> int:
        """Get total member count for society"""
        try:
            result = db.execute(
                text("SELECT COUNT(*) FROM society_members WHERE society_id = :society_id"),
                {"society_id": society_id}
            ).fetchone()
            
            return result[0] if result else 0
        except Exception:
            return 0
