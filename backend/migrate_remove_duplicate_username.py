"""
Migration script to remove duplicate username column from user_profiles table
Since username should only exist in users table
"""

from database import engine
from sqlalchemy import text

def migrate():
    """Remove username from user_profiles if it exists"""
    with engine.connect() as connection:
        try:
            # Check if column exists
            result = connection.execute(
                text("""
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME='user_profiles' AND COLUMN_NAME='username' AND TABLE_SCHEMA='nust_social'
                """)
            ).fetchone()
            
            if result:
                print("✓ Found username column in user_profiles, removing...")
                connection.execute(text("ALTER TABLE user_profiles DROP COLUMN username"))
                connection.commit()
                print("✓ Successfully removed username column from user_profiles")
            else:
                print("✓ Username column not found in user_profiles (already removed or doesn't exist)")
                
        except Exception as e:
            print(f"✗ Error during migration: {str(e)}")
            connection.rollback()

if __name__ == "__main__":
    migrate()
