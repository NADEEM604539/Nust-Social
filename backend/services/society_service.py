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
            
            # Get created society with updated_at
            society_result = db.execute(
                text("SELECT id, name, description, created_by, created_at, updated_at FROM societies WHERE id = :id"),
                {"id": society_id}
            ).fetchone()
            
            # Return society data
            return {
                "id": society_result[0],
                "name": society_result[1],
                "description": society_result[2],
                "created_by": society_result[3],
                "created_at": society_result[4],
                "updated_at": society_result[5]
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
                text("SELECT id, name, description, created_by, created_at, updated_at FROM societies WHERE id = :id"),
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
                "created_at": society[4],
                "updated_at": society[5]
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
                    SELECT id, name, description, created_by, created_at, updated_at
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
                    "created_at": s[4],
                    "updated_at": s[5]
                }
                for s in societies
            ]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list societies: {str(e)}"
            )
    
    @staticmethod
    def get_user_societies(db: Session, user_id: int) -> list:
        """Get all societies that a user is ADMIN or MODERATOR of"""
        try:
            societies = db.execute(
                text("""
                    SELECT s.id, s.name, s.description, s.created_by, s.created_at, s.updated_at
                    FROM societies s
                    INNER JOIN society_members sm ON s.id = sm.society_id
                    WHERE sm.user_id = :user_id 
                    AND sm.role IN ('ADMIN', 'MODERATOR')
                    ORDER BY s.created_at DESC
                """),
                {"user_id": user_id}
            ).fetchall()
            
            return [
                {
                    "id": s[0],
                    "name": s[1],
                    "description": s[2],
                    "created_by": s[3],
                    "created_at": s[4],
                    "updated_at": s[5]
                }
                for s in societies
            ]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get user societies: {str(e)}"
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
                    SET role = :role
                    WHERE society_id = :society_id AND user_id = :user_id
                """),
                {"role": new_role, "society_id": society_id, "user_id": user_id}
            )
            db.commit()
            
            # Fetch the updated member to include joined_at
            updated_member = db.execute(
                text("""
                    SELECT user_id, society_id, role, joined_at FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id
                """),
                {"society_id": society_id, "user_id": user_id}
            ).fetchone()
            
            return {
                "user_id": updated_member[0],
                "society_id": updated_member[1],
                "role": updated_member[2],
                "joined_at": updated_member[3]
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
            
            # Check if user is admin or moderator
            is_admin_or_mod = SocietyService._is_admin_or_moderator(db, society_id, created_by_id)
            if not is_admin_or_mod:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins and moderators can create posts"
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
            
            # Initialize post stats for society post
            db.execute(
                text("""
                    INSERT INTO post_stats (post_id, likes_count, comments_count, views_count, 
                                           rumor_true_votes, rumor_false_votes, rumor_true_votes_weighted, rumor_false_votes_weighted)
                    VALUES (:post_id, 0, 0, 0, 0, 0, 0.0, 0.0)
                """),
                {"post_id": post_id}
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
    def _is_admin_or_moderator(db: Session, society_id: int, user_id: int) -> bool:
        """Check if user is admin or moderator of society"""
        try:
            member = db.execute(
                text("""
                    SELECT id FROM society_members 
                    WHERE society_id = :society_id AND user_id = :user_id AND role IN ('ADMIN', 'MODERATOR')
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
    
    # ==================== EVENT METHODS ====================
    
    @staticmethod
    def create_event(db: Session, society_id: int, event_data: 'EventCreate', current_user_id: int) -> dict:
        """Create a new event for a society"""
        try:
            # Check if user is admin or moderator
            is_admin_or_mod = SocietyService._is_admin_or_moderator(db, society_id, current_user_id)
            if not is_admin_or_mod:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins and moderators can create events"
                )
            
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
            
            # Create event
            db.execute(
                text("""
                    INSERT INTO events (society_id, title, description, location, event_date, created_at, updated_at)
                    VALUES (:society_id, :title, :description, :location, :event_date, NOW(), NOW())
                """),
                {
                    "society_id": society_id,
                    "title": event_data.title,
                    "description": event_data.description,
                    "location": event_data.location,
                    "event_date": event_data.event_date
                }
            )
            db.commit()
            
            # Get created event
            event_result = db.execute(
                text("""
                    SELECT id, society_id, title, description, location, event_date, created_at, updated_at
                    FROM events 
                    WHERE society_id = :society_id AND title = :title
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"society_id": society_id, "title": event_data.title}
            ).fetchone()
            
            return {
                "id": event_result[0],
                "society_id": event_result[1],
                "title": event_result[2],
                "description": event_result[3],
                "location": event_result[4],
                "event_date": event_result[5],
                "created_at": event_result[6],
                "updated_at": event_result[7]
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create event: {str(e)}"
            )
    
    @staticmethod
    def get_event_by_id(db: Session, society_id: int, event_id: int) -> dict:
        """Get event details"""
        try:
            event = db.execute(
                text("""
                    SELECT id, society_id, title, description, location, event_date, created_at, updated_at
                    FROM events 
                    WHERE id = :id AND society_id = :society_id
                """),
                {"id": event_id, "society_id": society_id}
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
    
    @staticmethod
    def list_events_for_society(db: Session, society_id: int, skip: int = 0, limit: int = 20) -> list:
        """List all events for a society"""
        try:
            events = db.execute(
                text("""
                    SELECT id, society_id, title, description, location, event_date, created_at, updated_at
                    FROM events 
                    WHERE society_id = :society_id
                    ORDER BY event_date DESC
                    LIMIT :limit OFFSET :skip
                """),
                {"society_id": society_id, "limit": limit, "skip": skip}
            ).fetchall()
            
            return [
                {
                    "id": e[0],
                    "society_id": e[1],
                    "title": e[2],
                    "description": e[3],
                    "location": e[4],
                    "event_date": e[5],
                    "created_at": e[6],
                    "updated_at": e[7]
                }
                for e in events
            ]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list events: {str(e)}"
            )
    
    @staticmethod
    def list_all_events(db: Session, skip: int = 0, limit: int = 20) -> list:
        """List all events across all societies"""
        try:
            events = db.execute(
                text("""
                    SELECT id, society_id, title, description, location, event_date, created_at, updated_at
                    FROM events 
                    ORDER BY event_date DESC
                    LIMIT :limit OFFSET :skip
                """),
                {"limit": limit, "skip": skip}
            ).fetchall()
            
            return [
                {
                    "id": e[0],
                    "society_id": e[1],
                    "title": e[2],
                    "description": e[3],
                    "location": e[4],
                    "event_date": e[5],
                    "created_at": e[6],
                    "updated_at": e[7]
                }
                for e in events
            ]
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list all events: {str(e)}"
            )
    
    @staticmethod
    def update_event(db: Session, society_id: int, event_id: int, event_data: 'EventUpdate', current_user_id: int) -> dict:
        """Update event details"""
        try:
            # Check if user is admin or moderator
            is_admin_or_mod = SocietyService._is_admin_or_moderator(db, society_id, current_user_id)
            if not is_admin_or_mod:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins and moderators can update events"
                )
            
            # Check if event exists
            event_check = db.execute(
                text("SELECT id FROM events WHERE id = :id AND society_id = :society_id"),
                {"id": event_id, "society_id": society_id}
            ).fetchone()
            
            if not event_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            # Build update query dynamically
            update_fields = []
            params = {"event_id": event_id, "society_id": society_id}
            
            if event_data.title is not None:
                update_fields.append("title = :title")
                params["title"] = event_data.title
            if event_data.description is not None:
                update_fields.append("description = :description")
                params["description"] = event_data.description
            if event_data.location is not None:
                update_fields.append("location = :location")
                params["location"] = event_data.location
            if event_data.event_date is not None:
                update_fields.append("event_date = :event_date")
                params["event_date"] = event_data.event_date
            
            update_fields.append("updated_at = NOW()")
            
            if not update_fields or len(update_fields) == 1:  # Only updated_at
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No fields to update"
                )
            
            db.execute(
                text(f"""
                    UPDATE events 
                    SET {', '.join(update_fields)}
                    WHERE id = :event_id AND society_id = :society_id
                """),
                params
            )
            db.commit()
            
            # Get updated event
            return SocietyService.get_event_by_id(db, society_id, event_id)
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update event: {str(e)}"
            )
    
    @staticmethod
    def delete_event(db: Session, society_id: int, event_id: int, current_user_id: int) -> None:
        """Delete an event"""
        try:
            # Check if user is admin or moderator
            is_admin_or_mod = SocietyService._is_admin_or_moderator(db, society_id, current_user_id)
            if not is_admin_or_mod:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins and moderators can delete events"
                )
            
            # Check if event exists
            event_check = db.execute(
                text("SELECT id FROM events WHERE id = :id AND society_id = :society_id"),
                {"id": event_id, "society_id": society_id}
            ).fetchone()
            
            if not event_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            db.execute(
                text("DELETE FROM events WHERE id = :id AND society_id = :society_id"),
                {"id": event_id, "society_id": society_id}
            )
            db.commit()
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete event: {str(e)}"
            )
    
    # ==================== TICKET METHODS ====================
    
    @staticmethod
    def create_event_ticket(db: Session, society_id: int, event_id: int, ticket_data: 'EventTicketCreate', current_user_id: int) -> dict:
        """Create a ticket type for an event"""
        try:
            # Check if user is admin or moderator
            is_admin_or_mod = SocietyService._is_admin_or_moderator(db, society_id, current_user_id)
            if not is_admin_or_mod:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins and moderators can create tickets"
                )
            
            # Verify event exists
            event_check = db.execute(
                text("SELECT id FROM events WHERE id = :id AND society_id = :society_id"),
                {"id": event_id, "society_id": society_id}
            ).fetchone()
            
            if not event_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            # Create ticket
            db.execute(
                text("""
                    INSERT INTO event_tickets (event_id, type, price, total_stock, sold_count, created_at)
                    VALUES (:event_id, :type, :price, :total_stock, :sold_count, NOW())
                """),
                {
                    "event_id": event_id,
                    "type": ticket_data.type,
                    "price": ticket_data.price,
                    "total_stock": ticket_data.total_stock,
                    "sold_count": 0
                }
            )
            db.commit()
            
            # Get created ticket
            ticket_result = db.execute(
                text("""
                    SELECT id, event_id, type, price, total_stock, sold_count FROM event_tickets
                    WHERE event_id = :event_id AND type = :type
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"event_id": event_id, "type": ticket_data.type}
            ).fetchone()
            
            return {
                "id": ticket_result[0],
                "event_id": ticket_result[1],
                "type": ticket_result[2],
                "price": ticket_result[3],
                "total_stock": ticket_result[4],
                "sold_count": ticket_result[5]
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create ticket: {str(e)}"
            )
    
    @staticmethod
    def list_event_tickets(db: Session, society_id: int, event_id: int) -> list:
        """List all tickets for an event"""
        try:
            # Verify event exists
            event_check = db.execute(
                text("SELECT id FROM events WHERE id = :id AND society_id = :society_id"),
                {"id": event_id, "society_id": society_id}
            ).fetchone()
            
            if not event_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            tickets = db.execute(
                text("""
                    SELECT id, event_id, type, price, total_stock, sold_count FROM event_tickets
                    WHERE event_id = :event_id
                    ORDER BY created_at ASC
                """),
                {"event_id": event_id}
            ).fetchall()
            
            return [
                {
                    "id": t[0],
                    "event_id": t[1],
                    "type": t[2],
                    "price": t[3],
                    "total_stock": t[4],
                    "sold_count": t[5]
                }
                for t in tickets
            ]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to list tickets: {str(e)}"
            )
    
    @staticmethod
    def update_event_ticket(db: Session, society_id: int, event_id: int, ticket_id: int, ticket_data: 'EventTicketCreate', current_user_id: int) -> dict:
        """Update a ticket type"""
        try:
            # Check if user is admin or moderator
            is_admin_or_mod = SocietyService._is_admin_or_moderator(db, society_id, current_user_id)
            if not is_admin_or_mod:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins and moderators can update tickets"
                )
            
            # Verify ticket exists
            ticket_check = db.execute(
                text("SELECT id FROM event_tickets WHERE id = :id AND event_id = :event_id"),
                {"id": ticket_id, "event_id": event_id}
            ).fetchone()
            
            if not ticket_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ticket not found"
                )
            
            # Update ticket
            db.execute(
                text("""
                    UPDATE event_tickets 
                    SET type = :type, price = :price, total_stock = :total_stock
                    WHERE id = :id AND event_id = :event_id
                """),
                {
                    "id": ticket_id,
                    "event_id": event_id,
                    "type": ticket_data.type,
                    "price": ticket_data.price,
                    "total_stock": ticket_data.total_stock
                }
            )
            db.commit()
            
            # Get updated ticket
            ticket_result = db.execute(
                text("""
                    SELECT id, event_id, type, price, total_stock, sold_count FROM event_tickets
                    WHERE id = :id
                """),
                {"id": ticket_id}
            ).fetchone()
            
            return {
                "id": ticket_result[0],
                "event_id": ticket_result[1],
                "type": ticket_result[2],
                "price": ticket_result[3],
                "total_stock": ticket_result[4],
                "sold_count": ticket_result[5]
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update ticket: {str(e)}"
            )
    
    @staticmethod
    def delete_event_ticket(db: Session, society_id: int, event_id: int, ticket_id: int, current_user_id: int) -> None:
        """Delete a ticket type"""
        try:
            # Check if user is admin or moderator
            is_admin_or_mod = SocietyService._is_admin_or_moderator(db, society_id, current_user_id)
            if not is_admin_or_mod:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins and moderators can delete tickets"
                )
            
            # Verify ticket exists
            ticket_check = db.execute(
                text("SELECT id FROM event_tickets WHERE id = :id AND event_id = :event_id"),
                {"id": ticket_id, "event_id": event_id}
            ).fetchone()
            
            if not ticket_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ticket not found"
                )
            
            db.execute(
                text("DELETE FROM event_tickets WHERE id = :id AND event_id = :event_id"),
                {"id": ticket_id, "event_id": event_id}
            )
            db.commit()
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete ticket: {str(e)}"
            )
    
    @staticmethod
    def purchase_event_ticket(db: Session, event_id: int, ticket_id: int, user_id: int, quantity: int) -> dict:
        """Purchase tickets for an event"""
        try:
            # Get ticket details
            ticket = db.execute(
                text("""
                    SELECT id, event_id, price, total_stock, sold_count FROM event_tickets
                    WHERE id = :id AND event_id = :event_id
                """),
                {"id": ticket_id, "event_id": event_id}
            ).fetchone()
            
            if not ticket:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ticket not found"
                )
            
            available = ticket[3] - ticket[4]  # total_stock - sold_count
            if available < quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Only {available} tickets available"
                )
            
            # Create purchase record
            total_price = ticket[2] * quantity  # price * quantity
            db.execute(
                text("""
                    INSERT INTO event_ticket_purchases (event_id, ticket_id, user_id, quantity, total_price, status, created_at, updated_at)
                    VALUES (:event_id, :ticket_id, :user_id, :quantity, :total_price, :status, NOW(), NOW())
                """),
                {
                    "event_id": event_id,
                    "ticket_id": ticket_id,
                    "user_id": user_id,
                    "quantity": quantity,
                    "total_price": total_price,
                    "status": "PENDING"
                }
            )
            
            # Update sold count
            db.execute(
                text("""
                    UPDATE event_tickets 
                    SET sold_count = sold_count + :quantity
                    WHERE id = :id
                """),
                {"id": ticket_id, "quantity": quantity}
            )
            db.commit()
            
            # Get purchase record
            purchase = db.execute(
                text("""
                    SELECT id, event_id, ticket_id, user_id, quantity, total_price, status, created_at, updated_at FROM event_ticket_purchases
                    WHERE event_id = :event_id AND ticket_id = :ticket_id AND user_id = :user_id
                    ORDER BY created_at DESC LIMIT 1
                """),
                {"event_id": event_id, "ticket_id": ticket_id, "user_id": user_id}
            ).fetchone()
            
            return {
                "id": purchase[0],
                "event_id": purchase[1],
                "ticket_id": purchase[2],
                "user_id": purchase[3],
                "quantity": purchase[4],
                "total_price": purchase[5],
                "status": purchase[6],
                "created_at": purchase[7],
                "updated_at": purchase[8]
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to purchase ticket: {str(e)}"
            )
    
    @staticmethod
    def get_event_attendees(db: Session, society_id: int, event_id: int) -> list:
        """Get list of event attendees (users with confirmed/completed ticket purchases)"""
        try:
            # Verify event exists
            event_check = db.execute(
                text("SELECT id FROM events WHERE id = :id AND society_id = :society_id"),
                {"id": event_id, "society_id": society_id}
            ).fetchone()
            
            if not event_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            attendees = db.execute(
                text("""
                    SELECT u.id, u.username, COUNT(etp.id) as tickets_purchased
                    FROM users u
                    JOIN event_ticket_purchases etp ON u.id = etp.user_id
                    WHERE etp.event_id = :event_id AND etp.status IN ('CONFIRMED', 'COMPLETED')
                    GROUP BY u.id, u.username
                    ORDER BY MAX(etp.created_at) DESC
                """),
                {"event_id": event_id}
            ).fetchall()
            
            return [
                {
                    "user_id": a[0],
                    "username": a[1],
                    "tickets_purchased": a[2]
                }
                for a in attendees
            ]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get attendees: {str(e)}"
            )
    
    @staticmethod
    def get_event_ticket_purchases(db: Session, society_id: int, event_id: int, current_user_id: int, skip: int = 0, limit: int = 50) -> list:
        """Get all ticket purchases for an event with full details (admin/moderator only)"""
        try:
            # Check if user is admin or moderator
            is_admin_or_mod = SocietyService._is_admin_or_moderator(db, society_id, current_user_id)
            if not is_admin_or_mod:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins and moderators can view ticket purchases"
                )
            
            # Verify event exists
            event_check = db.execute(
                text("SELECT id FROM events WHERE id = :id AND society_id = :society_id"),
                {"id": event_id, "society_id": society_id}
            ).fetchone()
            
            if not event_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            # Get all purchases with user and ticket details
            purchases = db.execute(
                text("""
                    SELECT 
                        etp.id, etp.event_id, etp.ticket_id, etp.user_id, 
                        etp.quantity, etp.total_price, etp.status,
                        etp.created_at, etp.updated_at,
                        u.username, u.email,
                        up.name,
                        et.type as ticket_type, et.price as ticket_price
                    FROM event_ticket_purchases etp
                    JOIN users u ON etp.user_id = u.id
                    LEFT JOIN user_profiles up ON etp.user_id = up.user_id
                    JOIN event_tickets et ON etp.ticket_id = et.id
                    WHERE etp.event_id = :event_id
                    ORDER BY etp.created_at DESC
                    LIMIT :limit OFFSET :skip
                """),
                {"event_id": event_id, "limit": limit, "skip": skip}
            ).fetchall()
            
            return [
                {
                    "purchase_id": p[0],
                    "event_id": p[1],
                    "ticket_id": p[2],
                    "user_id": p[3],
                    "quantity": p[4],
                    "total_price": p[5],
                    "status": p[6],
                    "created_at": p[7],
                    "updated_at": p[8],
                    "username": p[9],
                    "email": p[10],
                    "name": p[11],
                    "ticket_type": p[12],
                    "ticket_price": p[13]
                }
                for p in purchases
            ]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get ticket purchases: {str(e)}"
            )
    
    @staticmethod
    def update_ticket_purchase_status(db: Session, society_id: int, event_id: int, purchase_id: int, new_status: str, current_user_id: int) -> dict:
        """Update ticket purchase status (admin/moderator only)"""
        try:
            # Check if user is admin or moderator
            is_admin_or_mod = SocietyService._is_admin_or_moderator(db, society_id, current_user_id)
            if not is_admin_or_mod:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only society admins and moderators can approve tickets"
                )
            
            # Validate status
            valid_statuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]
            if new_status not in valid_statuses:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                )
            
            # Verify purchase exists
            purchase_check = db.execute(
                text("""
                    SELECT id FROM event_ticket_purchases 
                    WHERE id = :id AND event_id = :event_id
                """),
                {"id": purchase_id, "event_id": event_id}
            ).fetchone()
            
            if not purchase_check:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Ticket purchase not found"
                )
            
            # Update status
            db.execute(
                text("""
                    UPDATE event_ticket_purchases 
                    SET status = :status, updated_at = NOW()
                    WHERE id = :id
                """),
                {"id": purchase_id, "status": new_status}
            )
            db.commit()
            
            # Get updated purchase
            purchase = db.execute(
                text("""
                    SELECT id, event_id, ticket_id, user_id, quantity, total_price, status, created_at, updated_at 
                    FROM event_ticket_purchases WHERE id = :id
                """),
                {"id": purchase_id}
            ).fetchone()
            
            return {
                "id": purchase[0],
                "event_id": purchase[1],
                "ticket_id": purchase[2],
                "user_id": purchase[3],
                "quantity": purchase[4],
                "total_price": purchase[5],
                "status": purchase[6],
                "created_at": purchase[7],
                "updated_at": purchase[8]
            }
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update ticket status: {str(e)}"
            )
