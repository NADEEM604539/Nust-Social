"""
Database Configuration and Connection
Purpose: SQLAlchemy database setup, session management, and FastAPI dependency injection
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

# SQLAlchemy Database URL
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connection before using
    echo=False  # Set to True for SQL debugging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class Database:
    """Database connection manager"""
    
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal
    
    def get_session(self) -> Session:
        """Get a new database session"""
        return self.SessionLocal()
    
    def connect(self):
        """Test database connection"""
        try:
            with self.engine.connect() as connection:
                print("✓ Database connection successful")
                return True
        except Exception as e:
            print(f"✗ Error while connecting to MySQL: {e}")
            return False
    
    def disconnect(self):
        """Dispose of all database connections"""
        try:
            self.engine.dispose()
            print("✓ Database connection closed")
            return True
        except Exception as e:
            print(f"✗ Error while disconnecting from MySQL: {e}")
            return False


# Initialize database object
db = Database()


# FastAPI Dependency - Get database session
def get_db():
    """FastAPI dependency to get database session"""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
