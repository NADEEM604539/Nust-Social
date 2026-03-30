#!/usr/bin/env python3
"""
Database migration script to add department column to user_profiles
"""

from sqlalchemy import text
import sys
sys.path.insert(0, 'E:\\NUST SOCIAL\\backend')

from database import SessionLocal

def migrate():
    db = SessionLocal()
    try:
        # Check if column already exists
        result = db.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME='user_profiles' AND COLUMN_NAME='department'
        """))
        
        if result.fetchone():
            print("✓ Department column already exists")
            return True
        
        # Add the column
        db.execute(text("""
            ALTER TABLE user_profiles 
            ADD COLUMN department VARCHAR(100) NULL
        """))
        db.commit()
        print("✓ Department column added successfully")
        return True
        
    except Exception as e:
        print(f"✗ Migration failed: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
