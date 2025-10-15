# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# SQLite database URL - it will create the file automatically
SQLITE_DATABASE_URL = settings.DATABASE_URL

# Create engine with better configuration
engine = create_engine(
    SQLITE_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    echo=True  # Set to False in production
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Test database connection
def test_connection():
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False