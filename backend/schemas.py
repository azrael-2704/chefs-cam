# backend/schemas.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class IngredientBase(BaseModel):
    name: str
    amount: str
    unit: str

class RecipeBase(BaseModel):
    id: int
    title: str
    description: str
    image_url: str
    difficulty: str
    cooking_time: int
    servings: int
    cuisine: str
    calories: int
    protein: float
    carbs: float
    fat: float
    ingredients: List[IngredientBase]
    instructions: List[str]
    dietary_tags: List[str]
    created_at: datetime
    average_rating: Optional[float] = None
    is_favorited: Optional[bool] = False
    user_rating: Optional[int] = None

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: str  # Changed from EmailStr to str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: str  # Changed from EmailStr to str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class FavoriteResponse(BaseModel):
    recipe_id: int
    is_favorited: bool