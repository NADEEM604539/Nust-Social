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
            valid_types = ['RUMOR', 'CONFESSION', 'SIMPLE_POST', 'SOCIETY_POST', 'ANNOUNCEMENT', 'MARKETPLACE_POST']
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
                print(f"DEBUG: Adding {len(media_ids)} media files to post {post_id}: {media_ids}")
                for media_id in media_ids:
                    db.execute(
                        text("INSERT INTO post_media (post_id, media_id) VALUES (:post_id, :media_id)"),
                        {"post_id": post_id, "media_id": media_id}
                    )
                db.flush()
                
                # Verify insertion
                check_result = db.execute(
                    text("SELECT COUNT(*) FROM post_media WHERE post_id = :post_id"),
                    {"post_id": post_id}
                ).fetchone()
                print(f"DEBUG: Verified {check_result[0]} media records linked to post {post_id}")
            else:
                print(f"DEBUG: No media_ids provided")

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
                db.flush()

            # Initialize post stats
            db.execute(
                text("""
                    INSERT INTO post_stats (post_id, likes_count, comments_count, views_count, 
                                           rumor_true_votes, rumor_false_votes)
                    VALUES (:post_id, 0, 0, 0, 0, 0)
                """),
                {"post_id": post_id}
            )
            
            db.flush()
            db.commit()
            print(f"DEBUG: Post {post_id} created successfully with {len(media_ids) if media_ids else 0} media files")

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
                           u.encrypted_name, u.username
                    FROM posts p
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE p.id = :post_id AND p.deleted_at IS NULL
                """),
                {"post_id": post_id}
            ).fetchone()

            if not post_result:
                return False, "Post not found", None

            post_id, post_user_id, post_type, caption, description, is_anonymous, is_approved, created_at, edited_at, encrypted_name, username = post_result

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
            
            print(f"DEBUG: Post {post_id} - Found {len(media)} media items")
            if media:
                print(f"DEBUG: First media: {media[0]}")

            # Get tags

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
                    text("SELECT reaction_type FROM reactions WHERE target_id = :post_id AND target_type = 'POST' AND user_id = :user_id"),
                    {"post_id": post_id, "user_id": user_id}
                ).fetchone()
                user_reaction = reaction_result[0] if reaction_result else None

                if post_type == "RUMOR":
                    vote_result = db.execute(
                        text("SELECT vote FROM rumor_votes WHERE post_id = :post_id AND user_id = :user_id"),
                        {"post_id": post_id, "user_id": user_id}
                    ).fetchone()
                    user_rumor_vote = vote_result[0] if vote_result else None

            # Get comments with author information
            comments_results = db.execute(
                text("""
                    SELECT c.id, c.content, c.is_anonymous, c.user_id, c.created_at, c.edited_at,
                           u.username, u.encrypted_name
                    FROM comments c
                    LEFT JOIN users u ON c.user_id = u.id
                    WHERE c.post_id = :post_id AND c.deleted_at IS NULL
                    ORDER BY c.created_at ASC
                """),
                {"post_id": post_id}
            ).fetchall()

            comments = []
            for comment_row in comments_results:
                comment_id, content, is_anon, comment_user_id, comment_created, comment_edited, comment_username, comment_encrypted = comment_row
                comments.append({
                    "id": comment_id,
                    "content": content,
                    "is_anonymous": is_anon,
                    "is_owner": user_id == comment_user_id if user_id else False,
                    "author": {
                        "id": comment_user_id if not is_anon else None,
                        "username": comment_username if not is_anon else None,
                        "encrypted_name": comment_encrypted if is_anon else None
                    } if comment_user_id else None,
                    "encrypted_name": comment_encrypted if is_anon else None,
                    "created_at": comment_created,
                    "edited_at": comment_edited
                })

            db.commit()

            return True, "Post retrieved", {
                "id": post_id,
                "user_id": None if is_anonymous else post_user_id,
                "username": None if is_anonymous else username,
                "encrypted_name": encrypted_name if is_anonymous else None,
                "type": post_type,
                "caption": caption,
                "description": description,
                "is_anonymous": is_anonymous,
                "is_approved": is_approved,
                "is_owner": user_id == post_user_id if user_id else False,
                "media": media,
                "tags": tags,
                "comments": comments,
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

            # 2. Insert comment into comments table with post_id
            db.execute(
                text("""
                    INSERT INTO comments (post_id, user_id, content, is_anonymous, deleted_at, edited_at, created_at)
                    VALUES (:post_id, :user_id, :content, :is_anonymous, NULL, NULL, NOW())
                """),
                {
                    "post_id": post_id,
                    "user_id": user_id,
                    "content": content,
                    "is_anonymous": is_anonymous
                }
            )
            db.flush()

            # 3. Get the ID of the comment we just inserted using MySQL function
            id_result = db.execute(text("SELECT LAST_INSERT_ID() as id")).fetchone()
            
            if not id_result or not id_result[0]:
                raise Exception("Failed to get inserted comment ID")
            
            comment_id = int(id_result[0])

            # 4. Update post statistics
            db.execute(
                text("UPDATE post_stats SET comments_count = comments_count + 1 WHERE post_id = :post_id"),
                {"post_id": post_id}
            )

            db.commit()

            return True, "Comment added successfully", {
                "comment_id": comment_id,
                "post_id": post_id,
                "user_id": user_id,
                "content": content,
                "is_anonymous": is_anonymous
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
                text("SELECT id, user_id, post_id, deleted_at FROM comments WHERE id = :comment_id"),
                {"comment_id": comment_id}
            ).fetchone()

            if not comment_check:
                return False, f"Comment {comment_id} not found"

            comment_user_id = comment_check[1]
            post_id = comment_check[2]
            deleted_at = comment_check[3]

            if deleted_at is not None:
                return False, "Comment already deleted"

            if comment_user_id != user_id:
                return False, "You can only delete your own comments"

            # 2. Soft delete the comment (set deleted_at)
            db.execute(
                text("UPDATE comments SET deleted_at = NOW() WHERE id = :comment_id"),
                {"comment_id": comment_id}
            )

            # 3. Decrement comment count in post_stats
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
                text("SELECT id, reaction_type FROM reactions WHERE target_id = :post_id AND target_type = 'POST' AND user_id = :user_id"),
                {"post_id": post_id, "user_id": user_id}
            ).fetchone()

            if existing:
                # Update existing reaction (no increment)
                db.execute(
                    text("UPDATE reactions SET reaction_type = :reaction_type WHERE target_id = :post_id AND target_type = 'POST' AND user_id = :user_id"),
                    {"post_id": post_id, "user_id": user_id, "reaction_type": reaction_type}
                )
            else:
                # Create new reaction (increment count)
                db.execute(
                    text("""
                        INSERT INTO reactions (user_id, target_type, target_id, reaction_type, created_at)
                        VALUES (:user_id, 'POST', :post_id, :reaction_type, NOW())
                    """),
                    {"post_id": post_id, "user_id": user_id, "reaction_type": reaction_type}
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
                text("SELECT id FROM reactions WHERE target_id = :post_id AND target_type = 'POST' AND user_id = :user_id"),
                {"post_id": post_id, "user_id": user_id}
            ).fetchone()

            if not existing:
                return False, "No reaction found for this post"

            # Delete reaction
            db.execute(
                text("DELETE FROM reactions WHERE target_id = :post_id AND target_type = 'POST' AND user_id = :user_id"),
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
            existing_vote = db.execute(
                text("SELECT vote FROM rumor_votes WHERE post_id = :post_id AND user_id = :user_id"),
                {"post_id": post_id, "user_id": user_id}
            ).fetchone()

            if existing_vote:
                old_vote = existing_vote[0]
                
                # Only update if vote is different from existing one
                if old_vote != vote:
                    # Decrement old vote count
                    if old_vote == 'TRUE':
                        db.execute(
                            text("UPDATE post_stats SET rumor_true_votes = GREATEST(0, rumor_true_votes - 1) WHERE post_id = :post_id"),
                            {"post_id": post_id}
                        )
                    else:
                        db.execute(
                            text("UPDATE post_stats SET rumor_false_votes = GREATEST(0, rumor_false_votes - 1) WHERE post_id = :post_id"),
                            {"post_id": post_id}
                        )
                    
                    # Update the vote
                    db.execute(
                        text("UPDATE rumor_votes SET vote = :vote WHERE post_id = :post_id AND user_id = :user_id"),
                        {"post_id": post_id, "user_id": user_id, "vote": vote}
                    )
                    
                    # Increment new vote count
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
            else:
                # Create new vote
                db.execute(
                    text("""
                        INSERT INTO rumor_votes (post_id, user_id, vote, created_at)
                        VALUES (:post_id, :user_id, :vote, NOW())
                    """),
                    {"post_id": post_id, "user_id": user_id, "vote": vote}
                )
                
                # Increment vote count for new vote
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
    def delete_vote(
        db: Session,
        post_id: int,
        user_id: int
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Delete/remove vote on rumor
        Returns: (success, message, vote_data)
        """
        try:
            # Check if user has voted on this post
            vote_result = db.execute(
                text("SELECT vote FROM rumor_votes WHERE post_id = :post_id AND user_id = :user_id"),
                {"post_id": post_id, "user_id": user_id}
            ).fetchone()

            if not vote_result:
                return False, "No vote found for this post", None

            old_vote = vote_result[0]

            # Delete the vote
            db.execute(
                text("DELETE FROM rumor_votes WHERE post_id = :post_id AND user_id = :user_id"),
                {"post_id": post_id, "user_id": user_id}
            )

            # Decrement the vote count
            if old_vote == 'TRUE':
                db.execute(
                    text("UPDATE post_stats SET rumor_true_votes = GREATEST(0, rumor_true_votes - 1) WHERE post_id = :post_id"),
                    {"post_id": post_id}
                )
            else:
                db.execute(
                    text("UPDATE post_stats SET rumor_false_votes = GREATEST(0, rumor_false_votes - 1) WHERE post_id = :post_id"),
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

            return True, "Vote removed successfully", {
                "post_id": post_id,
                "user_id": user_id,
                "removed_vote": old_vote,
                "total_votes_true": true_votes,
                "total_votes_false": false_votes,
                "percentage_true": round(percentage_true, 2)
            }
        except Exception as e:
            db.rollback()
            return False, f"Delete vote failed: {str(e)}", None

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

    @staticmethod
    def get_all_posts(
        db: Session,
        user_id: Optional[int] = None,
        limit: int = 20,
        offset: int = 0,
        post_type: Optional[str] = None
    ) -> Tuple[bool, str, Optional[dict]]:
        """
        Get all posts for feed with pagination - OPTIMIZED
        Returns only essential data without comments (loaded only in detail page)
        Returns: (success, message, posts_data)
        """
        try:
            # Build base params
            params = {
                "limit": limit,
                "offset": offset
            }
            
            post_type_filter = ""
            if post_type:
                post_type_filter = "AND p.type = :post_type"
                params["post_type"] = post_type
            
            # 1. Get posts with stats (2 tables only, simple join)
            posts_query = f"""
                SELECT p.id, p.user_id, p.type, p.caption, p.description, 
                       p.is_anonymous, p.is_approved, p.created_at, p.edited_at,
                       u.encrypted_name, u.username,
                       COALESCE(ps.likes_count, 0),
                       COALESCE(ps.comments_count, 0),
                       COALESCE(ps.views_count, 0),
                       COALESCE(ps.rumor_true_votes, 0),
                       COALESCE(ps.rumor_false_votes, 0)
                FROM posts p
                LEFT JOIN users u ON p.user_id = u.id
                LEFT JOIN post_stats ps ON p.id = ps.post_id
                WHERE p.deleted_at IS NULL {post_type_filter}
                ORDER BY p.created_at DESC
                LIMIT :limit OFFSET :offset
            """
            
            posts_result = db.execute(text(posts_query), params).fetchall()
            
            if not posts_result:
                return True, "No posts found", {
                    "posts": [],
                    "total": 0,
                    "limit": limit,
                    "offset": offset,
                    "has_more": False
                }
            
            post_ids = [row[0] for row in posts_result]
            
            # 2. Get media for all posts at once
            media_by_post = {}
            if post_ids:
                placeholders = ','.join([str(pid) for pid in post_ids])
                media_query = f"""
                    SELECT pm.post_id, m.id, m.url, m.type, m.file_size
                    FROM post_media pm
                    JOIN media m ON pm.media_id = m.id
                    WHERE pm.post_id IN ({placeholders})
                    ORDER BY pm.post_id, pm.id
                """
                media_results = db.execute(text(media_query)).fetchall()
                for row in media_results:
                    post_id = row[0]
                    if post_id not in media_by_post:
                        media_by_post[post_id] = []
                    media_by_post[post_id].append({
                        "id": row[1],
                        "url": row[2],
                        "type": row[3],
                        "file_size": row[4]
                    })
            
            # 3. Get tags for all posts at once
            tags_by_post = {}
            if post_ids:
                placeholders = ','.join([str(pid) for pid in post_ids])
                tags_query = f"""
                    SELECT pt.post_id, t.name
                    FROM post_tags pt
                    JOIN tags t ON pt.tag_id = t.id
                    WHERE pt.post_id IN ({placeholders})
                """
                tags_results = db.execute(text(tags_query)).fetchall()
                for row in tags_results:
                    post_id = row[0]
                    if post_id not in tags_by_post:
                        tags_by_post[post_id] = []
                    tags_by_post[post_id].append(row[1])
            
            # 4. Get user reactions if logged in
            user_reactions = {}
            if user_id and post_ids:
                placeholders = ','.join([str(pid) for pid in post_ids])
                reactions_query = f"""
                    SELECT target_id, reaction_type
                    FROM reactions
                    WHERE target_id IN ({placeholders}) AND target_type = 'POST' AND user_id = :user_id
                """
                reactions_results = db.execute(text(reactions_query), {"user_id": user_id}).fetchall()
                user_reactions = {row[0]: row[1] for row in reactions_results}
            
            # Assemble posts
            posts = []
            for post_row in posts_result:
                (post_id, post_user_id, post_type, caption, description, is_anonymous, is_approved,
                 created_at, edited_at, encrypted_name, username, likes_count, comments_count, views_count,
                 rumor_true_votes, rumor_false_votes) = post_row
                
                posts.append({
                    "id": post_id,
                    "user_id": None if is_anonymous else post_user_id,
                    "username": None if is_anonymous else username,
                    "encrypted_name": encrypted_name if is_anonymous else None,
                    "type": post_type,
                    "caption": caption,
                    "description": description,
                    "is_anonymous": is_anonymous,
                    "is_approved": is_approved,
                    "is_owner": user_id == post_user_id if user_id else False,
                    "media": media_by_post.get(post_id, []),
                    "tags": tags_by_post.get(post_id, []),
                    "stats": {
                        "likes_count": likes_count,
                        "comments_count": comments_count,
                        "views_count": views_count,
                        "rumor_true_votes": rumor_true_votes,
                        "rumor_false_votes": rumor_false_votes
                    },
                    "user_reaction": user_reactions.get(post_id),
                    "created_at": created_at,
                    "edited_at": edited_at
                })
            
            # Get total count
            count_query = f"SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL {post_type_filter}"
            count_params = {"post_type": params.get("post_type")} if post_type else {}
            count_result = db.execute(text(count_query), count_params).fetchone()
            total_count = count_result[0] if count_result else 0
            
            print(f"✓ Feed loaded {len(posts)} posts using 4 optimized queries (reduced from 40+ queries)")
            
            return True, "Posts retrieved successfully", {
                "posts": posts,
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": (offset + limit) < total_count
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return False, f"Get all posts failed: {str(e)}", None
