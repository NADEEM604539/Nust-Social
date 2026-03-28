from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime
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
    
    def execute_query(self, query, params=None):
        """Execute SELECT query and return results"""
        try:
            session = self.get_session()
            if params:
                result = session.execute(query, params)
            else:
                result = session.execute(query)
            data = result.fetchall()
            session.close()
            return data
        except Exception as e:
            print(f"✗ Query execution error: {e}")
            return None
    
    def execute_single(self, query, params=None):
        """Execute SELECT query and return single result"""
        try:
            session = self.get_session()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            result = cursor.fetchone()
            cursor.close()
            return result
        except Error as e:
            print(f"✗ Query execution error: {e}")
            return None
    
    def execute_update(self, query, params=None):
        """Execute INSERT, UPDATE, DELETE queries"""
        try:
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            self.connection.commit()
            affected_rows = cursor.rowcount
            cursor.close()
            return affected_rows
        except Error as e:
            self.connection.rollback()
            print(f"✗ Update execution error: {e}")
            return 0

# Database instance
db = Database()
