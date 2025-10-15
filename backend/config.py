# backend/config.py
import os
import secrets
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Generate a secure secret key if not set
def generate_secret_key():
    return secrets.token_urlsafe(32)

# Configuration that reads from .env file
class Settings:
    # Database - read from .env or use default
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./recipes.db")
    
    # JWT - read from .env or generate
    SECRET_KEY = os.getenv("SECRET_KEY", generate_secret_key())
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Gemini API - read from .env
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # CORS
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    # Cache
    CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))

settings = Settings()

# Print configuration status
print(f"🔐 JWT Secret Key: {'✅ Set' if settings.SECRET_KEY else '❌ Not set'}")
print(f"🤖 Gemini API Key: {'✅ Set' if settings.GEMINI_API_KEY else '❌ Not set'}")
print(f"🗄️  Database URL: {settings.DATABASE_URL}")