# backend/auth.py
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from config import settings
import models
import schemas

# Use a different crypt context to avoid bcrypt issues
pwd_context = CryptContext(
    schemes=["pbkdf2_sha256", "django_argon2", "plaintext"],
    deprecated="auto"
)

def validate_password(password: str):
    """Validate password before hashing"""
    if len(password) < 6:
        raise ValueError("Password must be at least 6 characters long")
    if len(password) > 72:
        raise ValueError("Password must be less than 72 characters long")
    return password

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    # Validate password first
    validated_password = validate_password(password)
    return pwd_context.hash(validated_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def register_user(user_data: schemas.UserCreate, db: Session):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise ValueError("User already exists")
    
    # Validate password
    try:
        validate_password(user_data.password)
    except ValueError as e:
        raise ValueError(str(e))
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = models.User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create access token - user is automatically logged in after registration
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

def login_user(user_data: schemas.UserLogin, db: Session):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise ValueError("Invalid credentials")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

def verify_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
    
    user = db.query(models.User).filter(models.User.email == email).first()
    return user

def delete_user(db: Session, user_id: int):
    """Delete a user and all their associated data."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    # Delete associated ratings and favorites
    db.query(models.Rating).filter(models.Rating.user_id == user_id).delete()
    db.query(models.Favorite).filter(models.Favorite.user_id == user_id).delete()

    db.delete(user)
    db.commit()
    return {"message": "Account deleted successfully"}