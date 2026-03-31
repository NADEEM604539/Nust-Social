"""
Migration script to add proper liking system with reaction weight, rate limiting, and audit trail

Changes:
1. Add reaction_weight column to reactions table
2. Add last_changed_at column to reactions table
3. Create reaction_history table for audit trail
4. Add likes_count_weighted column to post_stats table
5. Update existing data with safe defaults
"""

from database import engine
from sqlalchemy import text
import sys


def run_migration():
    """Run the liking system migration"""
    with engine.connect() as connection:
        try:
            print("Starting liking system migration...")
            
            # 0. Add type column to reactions if not exists (MUST BE FIRST)
            print("✓ Checking type column...")
            try:
                connection.execute(
                    text("ALTER TABLE reactions ADD COLUMN type ENUM('LIKE','LOVE','HAHA','WOW','SAD','ANGRY') DEFAULT 'LIKE' NOT NULL")
                )
                print("  ✓ Added type column to reactions")
            except Exception as e:
                if "Duplicate column name" in str(e) or "already exists" in str(e):
                    print("  ✓ type column already exists")
                else:
                    raise
            
            # 1. Add reaction_weight column to reactions if not exists
            print("✓ Checking reaction_weight column...")
            try:
                connection.execute(
                    text("ALTER TABLE reactions ADD COLUMN reaction_weight FLOAT DEFAULT 1.0 NOT NULL")
                )
                print("  ✓ Added reaction_weight column to reactions")
            except Exception as e:
                if "Duplicate column name" in str(e) or "already exists" in str(e):
                    print("  ✓ reaction_weight column already exists")
                else:
                    raise
            
            # 2. Add last_changed_at column to reactions if not exists
            print("✓ Checking last_changed_at column...")
            try:
                connection.execute(
                    text("ALTER TABLE reactions ADD COLUMN last_changed_at DATETIME DEFAULT NOW() NOT NULL")
                )
                print("  ✓ Added last_changed_at column to reactions")
            except Exception as e:
                if "Duplicate column name" in str(e) or "already exists" in str(e):
                    print("  ✓ last_changed_at column already exists")
                else:
                    raise
            
            # 3. Add reaction_history table if not exists
            print("✓ Checking reaction_history table...")
            try:
                connection.execute(
                    text("""
                        CREATE TABLE IF NOT EXISTS reaction_history (
                            id BIGINT PRIMARY KEY AUTO_INCREMENT,
                            reaction_id BIGINT NOT NULL,
                            post_id BIGINT NOT NULL,
                            user_id BIGINT NOT NULL,
                            old_reaction ENUM('LIKE','LOVE','HAHA','WOW','SAD','ANGRY') NULL,
                            new_reaction ENUM('LIKE','LOVE','HAHA','WOW','SAD','ANGRY') NULL,
                            old_weight FLOAT NULL,
                            new_weight FLOAT NULL,
                            changed_at DATETIME DEFAULT NOW(),
                            reason VARCHAR(255) NULL,
                            CONSTRAINT fk_reaction_history_reaction FOREIGN KEY (reaction_id) 
                                REFERENCES reactions(id) ON DELETE CASCADE,
                            CONSTRAINT fk_reaction_history_post FOREIGN KEY (post_id) 
                                REFERENCES posts(id) ON DELETE CASCADE,
                            CONSTRAINT fk_reaction_history_user FOREIGN KEY (user_id) 
                                REFERENCES users(id) ON DELETE CASCADE,
                            INDEX idx_reaction_id (reaction_id),
                            INDEX idx_post_id (post_id),
                            INDEX idx_user_id (user_id),
                            INDEX idx_changed_at (changed_at)
                        )
                    """)
                )
                print("  ✓ Created reaction_history table")
            except Exception as e:
                if "already exists" in str(e):
                    print("  ✓ reaction_history table already exists")
                else:
                    raise
            
            # 4. Add likes_count_weighted column to post_stats if not exists
            print("✓ Checking likes_count_weighted column...")
            try:
                connection.execute(
                    text("ALTER TABLE post_stats ADD COLUMN likes_count_weighted FLOAT DEFAULT 0.0 NOT NULL")
                )
                print("  ✓ Added likes_count_weighted column to post_stats")
            except Exception as e:
                if "Duplicate column name" in str(e) or "already exists" in str(e):
                    print("  ✓ likes_count_weighted column already exists")
                else:
                    raise
            
            # 5. Update existing LIKE reactions to have reaction_weight = 1.0 and create history
            print("✓ Updating existing reactions...")
            
            # Get all existing POST reactions (only)
            result = connection.execute(
                text("""
                    SELECT id, target_id, user_id, created_at 
                    FROM reactions 
                    WHERE target_type = 'POST'
                    ORDER BY id
                """)
            )
            
            post_reactions = result.fetchall()
            print(f"  Found {len(post_reactions)} existing POST reactions")
            
            # Create initial history records for existing reactions
            for reaction_id, post_id, user_id, created_at in post_reactions:
                try:
                    # Check if history already exists
                    exists = connection.execute(
                        text("""
                            SELECT id FROM reaction_history 
                            WHERE reaction_id = :reaction_id
                        """),
                        {"reaction_id": reaction_id}
                    ).fetchone()
                    
                    if not exists:
                        connection.execute(
                            text("""
                                INSERT INTO reaction_history 
                                (reaction_id, post_id, user_id, old_reaction, new_reaction, old_weight, new_weight, reason, changed_at)
                                VALUES (:reaction_id, :post_id, :user_id, NULL, 'LIKE', NULL, 1.0, 'migration', :created_at)
                            """),
                            {
                                "reaction_id": reaction_id,
                                "post_id": post_id,
                                "user_id": user_id,
                                "created_at": created_at
                            }
                        )
                except Exception as e:
                    print(f"  ⚠ Warning: Could not create history for reaction {reaction_id}: {str(e)}")
            
            print(f"  ✓ Created history for {len(post_reactions)} existing reactions")
            
            # 6. Update post_stats likes_count_weighted based on existing LIKE reactions on POSTs only
            print("✓ Recalculating weighted likes...")
            try:
                connection.execute(
                    text("""
                        UPDATE post_stats ps
                        SET likes_count_weighted = (
                            SELECT COALESCE(SUM(reaction_weight), 0)
                            FROM reactions r
                            WHERE r.target_id = ps.post_id AND r.target_type = 'POST'
                        )
                    """)
                )
                print("  ✓ Updated weighted likes counts")
            except Exception as e:
                print(f"  ⚠ Warning: Could not update weighted likes: {str(e)}")
            
            # Commit all changes
            connection.commit()
            
            print("\n✅ Migration completed successfully!")
            print("\nChanges made:")
            print("  • Added reaction_weight to reactions table")
            print("  • Added last_changed_at to reactions table") 
            print("  • Created reaction_history audit table")
            print("  • Added likes_count_weighted to post_stats")
            print("  • Initialized history for existing reactions")
            print("  • Recalculated weighted likes counts")
            
            return True
            
        except Exception as e:
            connection.rollback()
            print(f"\n❌ Migration failed: {str(e)}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
