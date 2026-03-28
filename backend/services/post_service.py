"""
Post Service
Purpose: Business logic for creating posts, comments, reactions, votes, and feed management
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session


class PostService:
    """Handle post operations"""

    @staticmethod
    def create_post(
        db: Session,
        user_id: int,
        post_type: str,
        caption: Optional[str] = None,
        description: Optional[str] = None,
        is_anonymous: bool = False,
        media_ids: Optional[List[int]] = None,
        tags: Optional[List[str]] = None
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Create new post
        Returns: (success, message, post_data)
        """
        try:
            # Validate post type
            valid_types = ['RUMOR', 'CONFESSION', 'SOCIETY_POST', 'ANNOUNCEMENT', 'MARKETPLACE_POST']
            if post_type not in valid_types:
                return False, f"Invalid post type. Must be one of: {', '.join(valid_types)}", None

            # Create post
            db.execute(
                text("""
                    INSERT INTO posts (user_id, type, caption, description, is_anonymous, created_at)
                    VALUES (:user_id, :type, :caption, :description, :is_anonymous, NOW())
                """),
                {
                    "user_id": user_id,
                    "type": post_type,
                    "caption": caption,
                    "description": description,
                    "is_anonymous": is_anonymous
                }
            )
            db.flush()

            # Get post ID
            post_result = db.execute(
                text("SELECT id FROM posts WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1"),
                {"user_id": user_id}
            ).fetchone()
            
            post_id = post_result[0]

            # Add media
            if media_ids:
                for media_id in media_ids:
                    db.execute(
                        text("INSERT INTO post_media (post_id, media_id) VALUES (:post_id, :media_id)"),
                        {"post_id": post_id, "media_id": media_id}
                    )

            # Add tags
            if tags:
                for tag in tags:
                    tag_lower = tag.lower()
                    
                    # Get or create tag
                    tag_result = db.execute(
                        text("SELECT id FROM tags WHERE name = :name"),
                        {"name": tag_lower}
                    ).fetchone()
                    
                    if tag_result:
                        tag_id = tag_result[0]
                    else:
                        # Create new tag
                        db.execute(
                            text("INSERT INTO tags (name, created_at) VALUES (:name, NOW())"),
                            {"name": tag_lower}
                        )
                        db.flush()
                        
                        tag_result = db.execute(
                            text("SELECT id FROM tags WHERE name = :name"),
                            {"name": tag_lower}
                        ).fetchone()
                        tag_id = tag_result[0]
                    
                    # Link post to tag
                    db.execute(
                        text("INSERT INTO post_tags (post_id, tag_id) VALUES (:post_id, :tag_id)"),
                        {"post_id": post_id, "tag_id": tag_id}
                    )

            # Initialize post stats
            db.execute(
                text("""
                    INSERT INTO post_stats (post_id, likes_count, comments_count, views_count, 
                                           rumor_true_votes, rumor_false_votes)
                    VALUES (:post_id, 0, 0, 0, 0, 0)
                """),
                {"post_id": post_id}
            )

            db.commit()

            return True, "Post created successfully", {
                "post_id": post_id,
                "user_id": user_id,
                "type": post_type,
                "is_anonymous": is_anonymous
            }
        except Exception as e:
            db.rollback()
            return False, f"Post creation failed: {str(e)}", None

    @staticmethod
    def get_post(
        db: Session,
        post_id: int,
        user_id: Optional[int] = None
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Get single post with stats and user reactions
        Returns: (success, message, post_data)
        """
        try:
            # Get post
            post_result = db.execute(
                text("""
                    SELECT p.id, p.user_id, p.type, p.caption, p.description, 
                           p.is_anonymous, p.is_approved, p.created_at, p.edited_at,
                           u.encrypted_name
                    FROM posts p
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE p.id = :post_id AND p.deleted_at IS NULL
                """),
                {"post_id": post_id}
            ).fetchone()

            if not post_result:
                return False, "Post not found", None

            post_id, post_user_id, post_type, caption, description, is_anonymous, is_approved, created_at, edited_at, encrypted_name = post_result

            # Mark as viewed if user_id provided
            if user_id:
                db.execute(
                    text("""
                        INSERT INTO post_views (post_id, user_id, viewed_at)
                        VALUES (:post_id, :user_id, NOW())
                        ON DUPLICATE KEY UPDATE viewed_at = NOW()
                    """),
                    {"post_id": post_id, "user_id": user_id}
                )

            # Get stats
            stats_result = db.execute(
                text("""
                    SELECT likes_count, comments_count, views_count, 
                           rumor_true_votes, rumor_false_votes
                    FROM post_stats
                    WHERE post_id = :post_id
                """),
                {"post_id": post_id}
            ).fetchone()

            stats = {
                "likes_count": stats_result[0] if stats_result else 0,
                "comments_count": stats_result[1] if stats_result else 0,
                "views_count": stats_result[2] if stats_result else 0,
                "rumor_true_votes": stats_result[3] if stats_result else 0,
                "rumor_false_votes": stats_result[4] if stats_result else 0,
            }

            # Get media
            media_results = db.execute(
                text("""
                    SELECT m.id, m.url, m.type, m.file_size
                    FROM post_media pm
                    JOIN media m ON pm.media_id = m.id
                    WHERE pm.post_id = :post_id
                """),
                {"post_id": post_id}
            ).fetchall()

            media = [{"id": r[0], "url": r[1], "type": r[2], "file_size": r[3]} for r in media_results]

            # Get tags
            tags_results = db.execute(
                text("""
                    SELECT t.name FROM tags t
                    JOIN post_tags pt ON t.id = pt.tag_id
                    WHERE pt.post_id = :post_id
                """),
                {"post_id": post_id}
            ).fetchall()

            tags = [r[0] for r in tags_results]

            # Get user reaction if user_id provided
            user_reaction = None
            user_rumor_vote = None
            if user_id:
                reaction_result = db.execute(
                    text("SELECT reaction_type FROM reactions WHERE target_type = 'POST' AND target_id = :post_id AND user_id = :user_id"),
                    {"post_id": post_id, "user_id": user_id}
                ).fetchone()
                user_reaction = reaction_result[0] if reaction_result else None

                if post_type == "RUMOR":
                    vote_result = db.execute(
                        text("SELECT vote FROM rumor_votes WHERE post_id = :post_id AND user_id = :user_id"),
                        {"post_id": post_id, "user_id": user_id}
                    ).fetchone()
                    user_rumor_vote = vote_result[0] if vote_result else None

            db.commit()

            return True, "Post retrieved", {
                "id": post_id,
                "user_id": post_user_id,
                "encrypted_name": encrypted_name if not is_anonymous else None,
                "type": post_type,
                "caption": caption,
                "description": description,
                "is_anonymous": is_anonymous,
                "is_approved": is_approved,
                "media": media,
                "tags": tags,
                "stats": stats,
                "user_reaction": user_reaction,
                "user_rumor_vote": user_rumor_vote,
                "created_at": created_at,
                "edited_at": edited_at
            }
        except Exception as e:
            return False, f"Get post failed: {str(e)}", None

    @staticmethod
    def add_comment(
        db: Session,
        post_id: int,
        user_id: int,
        content: str,
        is_anonymous: bool = False
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Add comment to post
        Returns: (success, message, comment_data)
        """
        try:
            # 1. Verify post exists and is not deleted
            post_check = db.execute(
                text("SELECT id FROM posts WHERE id = :post_id AND deleted_at IS NULL"),
                {"post_id": post_id}
            ).fetchone()

            if not post_check:
                return False, f"Post {post_id} not found or has been deleted", None

            # 2. Insert comment into comments table
            db.execute(
                text("""
                    INSERT INTO comments (user_id, content, deleted_at, edited_at, created_at)
                    VALUES (:user_id, :content, NULL, NULL, NOW())
                """),
                {
                    "user_id": user_id,
                    "content": content
                }
            )
            db.flush()

            # 3. Get the ID of the comment we just inserted using MySQL function
            id_result = db.execute(text("SELECT LAST_INSERT_ID() as id")).fetchone()
            
            if not id_result or not id_result[0]:
                raise Exception("Failed to get inserted comment ID")
            
            comment_id = int(id_result[0])

            # 4. Link comment to post via post_comments junction table  
            db.execute(
                text("INSERT INTO post_comments (comment_id, post_id) VALUES (:comment_id, :post_id)"),
                {
                    "comment_id": comment_id,
                    "post_id": post_id
                }
            )

            # 5. Update post statistics
            db.execute(
                text("UPDATE post_stats SET comments_count = comments_count + 1 WHERE post_id = :post_id"),
                {"post_id": post_id}
            )

            db.commit()

            return True, "Comment added successfully", {
                "comment_id": comment_id,
                "post_id": post_id,
                "user_id": user_id,
                "content": content
            }
        except Exception as e:
            db.rollback()
            return False, f"Comment failed: {str(e)}", None

    @staticmethod
    def delete_comment(
        db: Session,
        comment_id: int,
        user_id: int
    ) -> Tuple[bool, str]:
        """
        Delete a comment by ID
        Only the comment owner can delete it
        Returns: (success, message)
        """
        try:
            # 1. Check if comment exists and belongs to the user
            comment_check = db.execute(
                text("SELECT id, user_id, deleted_at FROM comments WHERE id = :comment_id"),
                {"comment_id": comment_id}
            ).fetchone()

            if not comment_check:
                return False, f"Comment {comment_id} not found"

            comment_user_id = comment_check[1]
            deleted_at = comment_check[2]

            if deleted_at is not None:
                return False, "Comment already deleted"

            if comment_user_id != user_id:
                return False, "You can only delete your own comments"

            # 2. Get the post_id from post_comments junction table
            post_comment = db.execute(
                text("SELECT post_id FROM post_comments WHERE comment_id = :comment_id"),
                {"comment_id": comment_id}
            ).fetchone()

            if not post_comment:
                return False, "Comment post mapping not found"

            post_id = post_comment[0]

            # 3. Soft delete the comment (set deleted_at)
            db.execute(
                text("UPDATE comments SET deleted_at = NOW() WHERE id = :comment_id"),
                {"comment_id": comment_id}
            )

            # 4. Decrement comment count in post_stats
            db.execute(
                text("UPDATE post_stats SET comments_count = GREATEST(0, comments_count - 1) WHERE post_id = :post_id"),
                {"post_id": post_id}
            )

            db.commit()

            return True, "Comment deleted successfully"
        except Exception as e:
            db.rollback()
            return False, f"Delete failed: {str(e)}"

    @staticmethod
    def react_to_post(
        db: Session,
        post_id: int,
        user_id: int,
        reaction_type: str
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        React to post (LIKE, LOVE, HAHA, WOW, SAD, ANGRY)
        Returns: (success, message, reaction_data)
        """
        try:
            valid_types = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY']
            if reaction_type not in valid_types:
                return False, f"Invalid reaction type. Must be one of: {', '.join(valid_types)}", None

            # Check post exists
            post_result = db.execute(
                text("SELECT id FROM posts WHERE id = :post_id AND deleted_at IS NULL"),
                {"post_id": post_id}
            ).fetchone()

            if not post_result:
                return False, "Post not found", None

            # Check if user already reacted
            existing = db.execute(
                text("SELECT id FROM reactions WHERE target_type = 'POST' AND target_id = :post_id AND user_id = :user_id"),
                {"post_id": post_id, "user_id": user_id}
            ).fetchone()

            if existing:
                # Update existing reaction (no increment)
                db.execute(
                    text("UPDATE reactions SET reaction_type = :reaction_type WHERE target_type = 'POST' AND target_id = :post_id AND user_id = :user_id"),
                    {"post_id": post_id, "user_id": user_id, "reaction_type": reaction_type}
                )
            else:
                # Create new reaction (increment count)
                db.execute(
                    text("""
                        INSERT INTO reactions (user_id, target_type, target_id, reaction_type, created_at)
                        VALUES (:user_id, 'POST', :post_id, :reaction_type, NOW())
                    """),
                    {"user_id": user_id, "post_id": post_id, "reaction_type": reaction_type}
                )
                
                # Only increment count for NEW reactions
                db.execute(
                    text("UPDATE post_stats SET likes_count = likes_count + 1 WHERE post_id = :post_id"),
                    {"post_id": post_id}
                )

            db.commit()

            return True, f"Reacted with {reaction_type}", {
                "post_id": post_id,
                "user_id": user_id,
                "reaction_type": reaction_type
            }
        except Exception as e:
            db.rollback()
            return False, f"Reaction failed: {str(e)}", None

    @staticmethod
    def unreact_from_post(
        db: Session,
        post_id: int,
        user_id: int
    ) -> Tuple[bool, str]:
        """
        Remove reaction from post
        Returns: (success, message)
        """
        try:
            # Check if user has reacted
            existing = db.execute(
                text("SELECT id FROM reactions WHERE target_type = 'POST' AND target_id = :post_id AND user_id = :user_id"),
                {"post_id": post_id, "user_id": user_id}
            ).fetchone()

            if not existing:
                return False, "No reaction found for this post"

            # Delete reaction
            db.execute(
                text("DELETE FROM reactions WHERE target_type = 'POST' AND target_id = :post_id AND user_id = :user_id"),
                {"post_id": post_id, "user_id": user_id}
            )

            # Decrement likes count
            db.execute(
                text("UPDATE post_stats SET likes_count = GREATEST(0, likes_count - 1) WHERE post_id = :post_id"),
                {"post_id": post_id}
            )

            db.commit()

            return True, "Reaction removed successfully"
        except Exception as e:
            db.rollback()
            return False, f"Unreact failed: {str(e)}"

    @staticmethod
    def vote_on_rumor(
        db: Session,
        post_id: int,
        user_id: int,
        vote: str
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Vote on rumor (TRUE/FALSE)
        Returns: (success, message, vote_data)
        """
        try:
            if vote not in ['TRUE', 'FALSE']:
                return False, "Vote must be TRUE or FALSE", None

            # Check post exists and is RUMOR type
            post_result = db.execute(
                text("SELECT type FROM posts WHERE id = :post_id AND deleted_at IS NULL"),
                {"post_id": post_id}
            ).fetchone()

            if not post_result or post_result[0] != 'RUMOR':
                return False, "Post not found or is not a rumor", None

            # Check if user already voted
            existing = db.execute(
                text("SELECT id FROM rumor_votes WHERE post_id = :post_id AND user_id = :user_id"),
                {"post_id": post_id, "user_id": user_id}
            ).fetchone()

            if existing:
                # Update existing vote
                db.execute(
                    text("UPDATE rumor_votes SET vote = :vote WHERE post_id = :post_id AND user_id = :user_id"),
                    {"post_id": post_id, "user_id": user_id, "vote": vote}
                )
            else:
                # Create new vote
                db.execute(
                    text("""
                        INSERT INTO rumor_votes (post_id, user_id, vote, created_at)
                        VALUES (:post_id, :user_id, :vote, NOW())
                    """),
                    {"post_id": post_id, "user_id": user_id, "vote": vote}
                )

            # Update post stats
            if vote == 'TRUE':
                db.execute(
                    text("UPDATE post_stats SET rumor_true_votes = rumor_true_votes + 1 WHERE post_id = :post_id"),
                    {"post_id": post_id}
                )
            else:
                db.execute(
                    text("UPDATE post_stats SET rumor_false_votes = rumor_false_votes + 1 WHERE post_id = :post_id"),
                    {"post_id": post_id}
                )

            # Get updated stats
            stats_result = db.execute(
                text("""
                    SELECT rumor_true_votes, rumor_false_votes
                    FROM post_stats
                    WHERE post_id = :post_id
                """),
                {"post_id": post_id}
            ).fetchone()

            true_votes, false_votes = stats_result
            total_votes = true_votes + false_votes
            percentage_true = (true_votes / total_votes * 100) if total_votes > 0 else 0

            db.commit()

            return True, f"Voted {vote} on rumor", {
                "post_id": post_id,
                "user_id": user_id,
                "vote": vote,
                "total_votes_true": true_votes,
                "total_votes_false": false_votes,
                "percentage_true": round(percentage_true, 2)
            }
        except Exception as e:
            db.rollback()
            return False, f"Vote failed: {str(e)}", None

    @staticmethod
    def update_post(
        db: Session,
        post_id: int,
        user_id: int,
        caption: Optional[str] = None,
        description: Optional[str] = None
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Update post (caption/description only, owner only)
        Returns: (success, message, post_data)
        """
        try:
            # Check ownership
            post_result = db.execute(
                text("SELECT user_id FROM posts WHERE id = :post_id AND deleted_at IS NULL"),
                {"post_id": post_id}
            ).fetchone()

            if not post_result:
                return False, "Post not found", None

            post_user_id = post_result[0]
            if post_user_id != user_id:
                return False, "Only post owner can edit", None

            # Update post
            db.execute(
                text("""
                    UPDATE posts 
                    SET caption = COALESCE(:caption, caption),
                        description = COALESCE(:description, description),
                        edited_at = NOW()
                    WHERE id = :post_id
                """),
                {"post_id": post_id, "caption": caption, "description": description}
            )

            db.commit()

            return True, "Post updated successfully", {"post_id": post_id}
        except Exception as e:
            db.rollback()
            return False, f"Update failed: {str(e)}", None

    @staticmethod
    def delete_post(
        db: Session,
        post_id: int,
        user_id: int
    ) -> Tuple[bool, str, None]:
        """
        Soft delete post (owner only)
        Returns: (success, message, None)
        """
        try:
            # Check ownership
            post_result = db.execute(
                text("SELECT user_id FROM posts WHERE id = :post_id AND deleted_at IS NULL"),
                {"post_id": post_id}
            ).fetchone()

            if not post_result:
                return False, "Post not found", None

            post_user_id = post_result[0]
            if post_user_id != user_id:
                return False, "Only post owner can delete", None

            # Soft delete
            db.execute(
                text("UPDATE posts SET deleted_at = NOW() WHERE id = :post_id"),
                {"post_id": post_id}
            )

            db.commit()

            return True, "Post deleted successfully", None
        except Exception as e:
            db.rollback()
            return False, f"Delete failed: {str(e)}", None
