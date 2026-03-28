"""
Database Module
Purpose: Configure SQLAlchemy ORM, establish database connections, and provide session management
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, BigInteger, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT

# SQLAlchemy Database URL
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connection before using
    pool_size=10,  # Number of connections to maintain
    max_overflow=20,  # Max additional connections beyond pool_size
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
    
    def create_tables(self):
        """Create all tables defined in models"""
        try:
            Base.metadata.create_all(bind=self.engine)
            print("✓ Database tables created successfully")
            return True
        except Exception as e:
            print(f"✗ Error creating tables: {e}")
            return False


# Initialize database instance
db = Database()
