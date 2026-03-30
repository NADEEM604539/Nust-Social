"""
User Service
Purpose: Business logic for user registration, authentication, profiles, and follow system
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Tuple, Optional
from models.users import User, UserProfile, Follow
from schemas.users import UserCreate, UserProfileUpdate


class UserService:
    """Service for user-related operations"""
    
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """Create a new user"""
        # TODO: Implement user creation with email verification
        pass
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """Get user by email"""
        # TODO: Implement get user by email
        pass
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> User:
        """Get user by ID"""
        # TODO: Implement get user by ID
        pass
    
    @staticmethod
    def verify_user_email(db: Session, user_id: int) -> bool:
        """Verify user email"""
        # TODO: Implement email verification
        pass
    
    @staticmethod
    def update_user_profile(db: Session, user_id: int, profile_data: UserProfileUpdate) -> Tuple[bool, str, Optional[dict]]:
        """
        Update user profile
        Returns: (success, message, profile_data)
        """
        try:
            # Check if user exists
            user_check = db.execute(
                text("SELECT id FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            ).fetchone()
            
            if not user_check:
                return False, "User not found", None
            
            # Build update query dynamically based on provided fields
            update_fields = []
            params = {"user_id": user_id}
            
            # Handle username (update in users table)
            if profile_data.username is not None:
                # Check if username is already taken
                existing_user = db.execute(
                    text("SELECT id FROM users WHERE username = :username AND id != :user_id"),
                    {"username": profile_data.username, "user_id": user_id}
                ).fetchone()
                
                if existing_user:
                    return False, "Username already taken", None
                
                db.execute(
                    text("UPDATE users SET username = :username WHERE id = :user_id"),
                    {"username": profile_data.username, "user_id": user_id}
                )
            
            # Handle full_name or name (both map to 'name' column)
            name_value = profile_data.full_name or profile_data.name
            if name_value is not None:
                update_fields.append("name = :name")
                params["name"] = name_value
            
            # Handle bio
            if profile_data.bio is not None:
                update_fields.append("bio = :bio")
                params["bio"] = profile_data.bio
            
            # Handle batch or batch_year (both map to 'batch_year' column)
            batch_value = profile_data.batch or profile_data.batch_year
            if batch_value is not None:
                update_fields.append("batch_year = :batch_year")
                params["batch_year"] = batch_value
            
            # Handle department
            if profile_data.department is not None:
                update_fields.append("department = :department")
                params["department"] = profile_data.department
            
            # Update profile
            if update_fields:
                update_fields.append("updated_at = NOW()")
                query = f"UPDATE user_profiles SET {', '.join(update_fields)} WHERE user_id = :user_id"
                db.execute(text(query), params)
            
            # Retrieve updated profile with email and username
            profile_result = db.execute(
                text("""
                    SELECT p.user_id, p.name, p.bio, p.batch_year, p.department, 
                           p.created_at, p.updated_at, u.email, u.username
                    FROM user_profiles p
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE p.user_id = :user_id
                """),
                {"user_id": user_id}
            ).fetchone()
            
            db.commit()
            
            if profile_result:
                return True, "Profile updated successfully", {
                    "user_id": profile_result[0],
                    "username": profile_result[8],
                    "name": profile_result[1],
                    "bio": profile_result[2],
                    "batch_year": profile_result[3],
                    "department": profile_result[4],
                    "created_at": profile_result[5],
                    "updated_at": profile_result[6],
                    "email": profile_result[7]
                }
            
            return False, "Failed to retrieve updated profile", None
        except Exception as e:
            db.rollback()
            return False, f"Update profile failed: {str(e)}", None
    
    @staticmethod
    def follow_user(
        db: Session,
        follower_id: int,
        following_id: int
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Add follow relationship
        Returns: (success, message, follow_data)
        """
        try:
            # Validate that user can't follow themselves
            if follower_id == following_id:
                return False, "You cannot follow yourself", None
            
            # Check if both users exist
            follower_exists = db.execute(
                text("SELECT id FROM users WHERE id = :user_id AND status = 'ACTIVE'"),
                {"user_id": follower_id}
            ).fetchone()
            
            following_exists = db.execute(
                text("SELECT id FROM users WHERE id = :user_id AND status = 'ACTIVE'"),
                {"user_id": following_id}
            ).fetchone()
            
            if not follower_exists or not following_exists:
                return False, "User not found or is not active", None
            
            # Check if already following
            existing = db.execute(
                text("SELECT 1 FROM follows WHERE follower_id = :follower_id AND following_id = :following_id"),
                {"follower_id": follower_id, "following_id": following_id}
            ).fetchone()
            
            if existing:
                return False, "You are already following this user", None
            
            # Create follow relationship
            db.execute(
                text("""
                    INSERT INTO follows (follower_id, following_id, created_at)
                    VALUES (:follower_id, :following_id, NOW())
                """),
                {"follower_id": follower_id, "following_id": following_id}
            )
            
            db.commit()
            
            return True, "Successfully followed user", {
                "follower_id": follower_id,
                "following_id": following_id
            }
        except Exception as e:
            db.rollback()
            return False, f"Follow failed: {str(e)}", None
    
    @staticmethod
    def unfollow_user(
        db: Session,
        follower_id: int,
        following_id: int
    ) -> Tuple[bool, str]:
        """
        Remove follow relationship
        Returns: (success, message)
        """
        try:
            # Check if follow relationship exists
            existing = db.execute(
                text("SELECT 1 FROM follows WHERE follower_id = :follower_id AND following_id = :following_id"),
                {"follower_id": follower_id, "following_id": following_id}
            ).fetchone()
            
            if not existing:
                return False, "You are not following this user"
            
            # Delete follow relationship
            db.execute(
                text("DELETE FROM follows WHERE follower_id = :follower_id AND following_id = :following_id"),
                {"follower_id": follower_id, "following_id": following_id}
            )
            
            db.commit()
            
            return True, "Successfully unfollowed user"
        except Exception as e:
            db.rollback()
            return False, f"Unfollow failed: {str(e)}"
    
    @staticmethod
    def is_following(
        db: Session,
        follower_id: int,
        following_id: int
    ) -> Optional[bool]:
        """
        Check if follower_id is following following_id
        Returns: True if following, False if not, None if error
        """
        try:
            result = db.execute(
                text("SELECT 1 FROM follows WHERE follower_id = :follower_id AND following_id = :following_id"),
                {"follower_id": follower_id, "following_id": following_id}
            ).fetchone()
            
            return result is not None
        except Exception:
            return None
    
    @staticmethod
    def get_followers(
        db: Session,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        current_user_id: Optional[int] = None
    ) -> Tuple[bool, str, Optional[list]]:
        """
        Get user's followers
        Returns: (success, message, followers_list)
        """
        try:
            # Check if user exists
            user_exists = db.execute(
                text("SELECT id FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            ).fetchone()
            
            if not user_exists:
                return False, "User not found", None
            
            # Get followers
            followers = db.execute(
                text("""
                    SELECT u.id, u.username, up.name
                    FROM follows f
                    JOIN users u ON f.follower_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE f.following_id = :user_id
                    ORDER BY f.created_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                {"user_id": user_id, "limit": limit, "offset": offset}
            ).fetchall()
            
            result = []
            for f in followers:
                follower_record = {
                    "user_id": f[0],
                    "username": f[1],
                    "name": f[2],
                    "is_following": False
                }
                
                # Check if current user is following this follower
                if current_user_id and current_user_id != f[0]:
                    is_following = db.execute(
                        text("SELECT 1 FROM follows WHERE follower_id = :follower_id AND following_id = :following_id"),
                        {"follower_id": current_user_id, "following_id": f[0]}
                    ).fetchone()
                    follower_record["is_following"] = bool(is_following)
                
                result.append(follower_record)
            
            return True, "Followers retrieved", result
        except Exception as e:
            return False, f"Get followers failed: {str(e)}", None
    
    @staticmethod
    def get_following(
        db: Session,
        user_id: int,
        limit: int = 50,
        offset: int = 0,
        current_user_id: Optional[int] = None
    ) -> Tuple[bool, str, Optional[list]]:
        """
        Get users that user is following
        Returns: (success, message, following_list)
        """
        try:
            # Check if user exists
            user_exists = db.execute(
                text("SELECT id FROM users WHERE id = :user_id"),
                {"user_id": user_id}
            ).fetchone()
            
            if not user_exists:
                return False, "User not found", None
            
            # Get following
            following = db.execute(
                text("""
                    SELECT u.id, u.username, up.name
                    FROM follows f
                    JOIN users u ON f.following_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE f.follower_id = :user_id
                    ORDER BY f.created_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                {"user_id": user_id, "limit": limit, "offset": offset}
            ).fetchall()
            
            result = []
            for f in following:
                following_record = {
                    "user_id": f[0],
                    "username": f[1],
                    "name": f[2],
                    "is_following": False
                }
                
                # Check if current user is following this user
                if current_user_id and current_user_id != f[0]:
                    is_following = db.execute(
                        text("SELECT 1 FROM follows WHERE follower_id = :follower_id AND following_id = :following_id"),
                        {"follower_id": current_user_id, "following_id": f[0]}
                    ).fetchone()
                    following_record["is_following"] = bool(is_following)
                
                result.append(following_record)
            
            return True, "Following retrieved", result
        except Exception as e:
            return False, f"Get following failed: {str(e)}", None
    
    @staticmethod
    def get_follow_stats(
        db: Session,
        user_id: int,
        current_user_id: Optional[int] = None
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Get follow statistics for a user (followers, following, posts count)
        Returns: (success, message, stats_data)
        """
        try:
            # Get followers count
            followers_result = db.execute(
                text("SELECT COUNT(*) FROM follows WHERE following_id = :user_id"),
                {"user_id": user_id}
            ).fetchone()
            
            # Get following count
            following_result = db.execute(
                text("SELECT COUNT(*) FROM follows WHERE follower_id = :user_id"),
                {"user_id": user_id}
            ).fetchone()
            
            # Get posts count (ALL posts - anonymous and non-anonymous)
            posts_result = db.execute(
                text("SELECT COUNT(*) FROM posts WHERE user_id = :user_id AND deleted_at IS NULL"),
                {"user_id": user_id}
            ).fetchone()
            
            followers_count = followers_result[0] if followers_result else 0
            following_count = following_result[0] if following_result else 0
            posts_count = posts_result[0] if posts_result else 0
            
            # Check if current user is following this user
            is_following = False
            if current_user_id:
                follow_check = db.execute(
                    text("SELECT 1 FROM follows WHERE follower_id = :follower_id AND following_id = :following_id"),
                    {"follower_id": current_user_id, "following_id": user_id}
                ).fetchone()
                is_following = follow_check is not None
            
            return True, "Stats retrieved", {
                "user_id": user_id,
                "posts_count": posts_count,
                "followers_count": followers_count,
                "following_count": following_count,
                "is_following": is_following
            }
        except Exception as e:
            return False, f"Get stats failed: {str(e)}", None
    
    @staticmethod
    def get_mutual_followers(
        db: Session,
        user_id: int,
        current_user_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[bool, str, Optional[list]]:
        """
        Get mutual followers between user and current user
        (Users that follow both the user and are followed by the current user)
        Returns: (success, message, mutual_followers_list)
        """
        try:
            # Get mutual followers: users that follow 'user_id' AND are followed by 'current_user_id'
            mutual = db.execute(
                text("""
                    SELECT u.id, u.email, u.username, up.bio
                    FROM follows f1
                    JOIN users u ON f1.follower_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE f1.following_id = :user_id
                    AND EXISTS (
                        SELECT 1 FROM follows f2
                        WHERE f2.follower_id = :current_user_id
                        AND f2.following_id = u.id
                    )
                    ORDER BY f1.created_at DESC
                    LIMIT :limit OFFSET :offset
                """),
                {"user_id": user_id, "current_user_id": current_user_id, "limit": limit, "offset": offset}
            ).fetchall()
            
            return True, "Mutual followers retrieved", [
                {"id": m[0], "email": m[1], "username": m[2], "bio": m[3]}
                for m in mutual
            ]
        except Exception as e:
            return False, f"Get mutual followers failed: {str(e)}", None
    
    @staticmethod
    def get_mutual_count(
        db: Session,
        user_id: int,
        current_user_id: int
    ) -> Tuple[bool, str, Optional[int]]:
        """
        Get count of mutual followers
        Returns: (success, message, count)
        """
        try:
            count_result = db.execute(
                text("""
                    SELECT COUNT(DISTINCT f1.follower_id)
                    FROM follows f1
                    WHERE f1.following_id = :user_id
                    AND EXISTS (
                        SELECT 1 FROM follows f2
                        WHERE f2.follower_id = :current_user_id
                        AND f2.following_id = f1.follower_id
                    )
                """),
                {"user_id": user_id, "current_user_id": current_user_id}
            ).fetchone()
            
            count = count_result[0] if count_result else 0
            return True, "Mutual count retrieved", count
        except Exception as e:
            return False, f"Get mutual count failed: {str(e)}", None
    
    @staticmethod
    def ban_user(db: Session, user_id: int, reason: str) -> bool:
        """Ban a user"""
        # TODO: Implement user ban
        pass
    
    @staticmethod
    def suspend_user(db: Session, user_id: int, duration_days: int, reason: str) -> bool:
        """Suspend a user temporarily"""
        # TODO: Implement user suspension
        pass
    
    @staticmethod
    def get_user_ticket_purchases(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> list:
        """Get user's purchased event tickets with event and ticket details"""
        try:
            purchases = db.execute(
                text("""
                    SELECT etp.id, etp.event_id, etp.ticket_id, etp.quantity, etp.total_price, etp.status,
                           etp.created_at, etp.updated_at,
                           e.title as event_title, e.event_date, e.location,
                           et.type as ticket_type, et.price
                    FROM event_ticket_purchases etp
                    JOIN events e ON etp.event_id = e.id
                    JOIN event_tickets et ON etp.ticket_id = et.id
                    WHERE etp.user_id = :user_id
                    ORDER BY etp.created_at DESC
                    LIMIT :limit OFFSET :skip
                """),
                {"user_id": user_id, "limit": limit, "skip": skip}
            ).fetchall()
            
            return [
                {
                    "id": p[0],
                    "event_id": p[1],
                    "ticket_id": p[2],
                    "quantity": p[3],
                    "total_price": p[4],
                    "status": p[5],
                    "created_at": p[6],
                    "updated_at": p[7],
                    "event_title": p[8],
                    "event_date": p[9],
                    "location": p[10],
                    "ticket_type": p[11],
                    "ticket_price": p[12]
                }
                for p in purchases
            ]
        except Exception as e:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get ticket purchases: {str(e)}"
            )
