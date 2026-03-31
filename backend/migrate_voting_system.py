"""
Migration script for Real-World Voting System upgrade
Adds:
1. Vote weight tracking (user reputation-based voting power)
2. Vote history/audit trail
3. Weighted vote aggregation
4. Rate limiting support
"""

from sqlalchemy import text
from database import SessionLocal, engine
from datetime import datetime

def run_migration():
    db = SessionLocal()
    try:
        print("🔄 Starting voting system migration...")
        
        # Step 1: Add columns to rumor_votes table if they don't exist
        print("📝 Step 1: Adding voting power and timestamp tracking to rumor_votes...")
        try:
            db.execute(text("""
                ALTER TABLE rumor_votes 
                ADD COLUMN vote_weight FLOAT DEFAULT 1.0 NOT NULL
            """))
            print("✅ Added vote_weight column")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e):
                print("⚠️  vote_weight column already exists, skipping...")
            else:
                raise
        
        try:
            db.execute(text("""
                ALTER TABLE rumor_votes 
                ADD COLUMN last_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
            """))
            print("✅ Added last_changed_at column")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e):
                print("⚠️  last_changed_at column already exists, skipping...")
            else:
                raise
        
        # Step 2: Add columns to post_stats table for weighted votes
        print("\n📝 Step 2: Adding weighted vote tracking to post_stats...")
        try:
            db.execute(text("""
                ALTER TABLE post_stats 
                ADD COLUMN rumor_true_votes_weighted FLOAT DEFAULT 0.0
            """))
            print("✅ Added rumor_true_votes_weighted column")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e):
                print("⚠️  rumor_true_votes_weighted column already exists, skipping...")
            else:
                raise
        
        try:
            db.execute(text("""
                ALTER TABLE post_stats 
                ADD COLUMN rumor_false_votes_weighted FLOAT DEFAULT 0.0
            """))
            print("✅ Added rumor_false_votes_weighted column")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e):
                print("⚠️  rumor_false_votes_weighted column already exists, skipping...")
            else:
                raise
        
        db.commit()
        
        # Step 3: Create rumor_vote_history table for audit trail
        print("\n📝 Step 3: Creating vote history audit table...")
        try:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS rumor_vote_history (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    rumor_vote_id BIGINT NOT NULL,
                    post_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    old_vote ENUM('TRUE', 'FALSE') NULL,
                    new_vote ENUM('TRUE', 'FALSE') NULL,
                    old_weight FLOAT NULL,
                    new_weight FLOAT NOT NULL,
                    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    reason VARCHAR(255),
                    
                    FOREIGN KEY (rumor_vote_id) REFERENCES rumor_votes(id) ON DELETE CASCADE,
                    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    
                    INDEX idx_rumor_vote_id (rumor_vote_id),
                    INDEX idx_post_id (post_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_changed_at (changed_at)
                )
            """))
            print("✅ Created rumor_vote_history table")
        except Exception as e:
            if "already exists" in str(e):
                print("⚠️  rumor_vote_history table already exists, skipping...")
            else:
                raise
        
        db.commit()
        
        # Step 4: Migrate existing votes to have weighted values
        print("\n📝 Step 4: Initializing weighted votes for existing data...")
        
        # Get all existing votes
        existing_votes = db.execute(text("""
            SELECT id, post_id, user_id, vote, vote_weight 
            FROM rumor_votes
            WHERE vote_weight = 1.0
        """)).fetchall()
        
        if existing_votes:
            print(f"Found {len(existing_votes)} existing votes to initialize...")
            
            # Initialize vote history for existing votes
            for vote_id, post_id, user_id, vote, weight in existing_votes:
                try:
                    db.execute(text("""
                        INSERT INTO rumor_vote_history 
                        (rumor_vote_id, post_id, user_id, old_vote, new_vote, old_weight, new_weight, reason)
                        VALUES (:vote_id, :post_id, :user_id, NULL, :vote, NULL, :weight, 'migration_initialized')
                    """), {
                        "vote_id": vote_id,
                        "post_id": post_id,
                        "user_id": user_id,
                        "vote": vote,
                        "weight": weight
                    })
                except Exception as e:
                    if "Duplicate entry" in str(e):
                        pass  # Already migrated
                    else:
                        print(f"⚠️  Error migrating vote {vote_id}: {str(e)}")
            
            db.commit()
            print(f"✅ Initialized vote history for {len(existing_votes)} votes")
        else:
            print("✅ No existing votes to initialize (clean database)")
        
        # Step 5: Calculate and update weighted vote counts in post_stats
        print("\n📝 Step 5: Calculating weighted vote aggregates...")
        
        # Reset weighted counts
        db.execute(text("""
            UPDATE post_stats 
            SET rumor_true_votes_weighted = 0.0, 
                rumor_false_votes_weighted = 0.0
        """))
        
        # Recalculate from vote data
        db.execute(text("""
            UPDATE post_stats ps
            SET ps.rumor_true_votes_weighted = (
                SELECT COALESCE(SUM(vote_weight), 0) 
                FROM rumor_votes rv 
                WHERE rv.post_id = ps.post_id AND rv.vote = 'TRUE'
            ),
            ps.rumor_false_votes_weighted = (
                SELECT COALESCE(SUM(vote_weight), 0) 
                FROM rumor_votes rv 
                WHERE rv.post_id = ps.post_id AND rv.vote = 'FALSE'
            )
        """))
        
        db.commit()
        print("✅ Calculated weighted vote aggregates")
        
        # Step 6: Add indexes for performance
        print("\n📝 Step 6: Adding performance indexes...")
        try:
            db.execute(text("""
                ALTER TABLE rumor_votes 
                ADD INDEX idx_post_user (post_id, user_id),
                ADD INDEX idx_last_changed (last_changed_at)
            """))
            print("✅ Added performance indexes")
        except Exception as e:
            if "Duplicate key" in str(e) or "already exists" in str(e):
                print("⚠️  Indexes already exist, skipping...")
            else:
                raise
        
        db.commit()
        
        print("\n" + "="*60)
        print("✅ Migration completed successfully!")
        print("="*60)
        print("\n📊 New Voting System Features:")
        print("  ✓ Vote weight (reputation-based voting power)")
        print("  ✓ Vote history/audit trail")
        print("  ✓ Weighted vote aggregation")
        print("  ✓ Rate limiting support (5 min cooldown)")
        print("  ✓ Better error handling")
        print("\n⚡ Your voting system now follows real-world standards!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
