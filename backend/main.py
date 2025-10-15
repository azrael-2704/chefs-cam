# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import json
import os
from typing import List, Optional
import google.generativeai as genai
from config import settings
import base64
import io
from PIL import Image

from database import SessionLocal, engine, Base
import models
import schemas
import auth
import services

# Get relative path for static files
current_dir = os.path.dirname(os.path.abspath(__file__))
images_dir = os.path.join(current_dir, 'dataset', 'food-images')

print(f"📁 Images directory: {images_dir}")

# Initialize Gemini with proper error handling
try:
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "":
        genai.configure(api_key=settings.GEMINI_API_KEY)
        print("✅ Gemini API configured successfully")
        
        # Test available models
        try:
            available_models = genai.list_models()
            model_names = [model.name for model in available_models]
            print(f"📋 Available Gemini models: {len(model_names)}")
            if "models/gemini-2.0-flash-lite" in model_names:
                print("🎯 Using Gemini 2.0 Flash Lite")
        except Exception as e:
            print(f"⚠️  Could not list models: {e}")
    else:
        print("⚠️  Gemini API key not found - recipe enhancement will use default values")
except Exception as e:
    print(f"❌ Gemini API configuration failed: {e}")

app = FastAPI(
    title="Smart Recipe Generator API",
    version="1.0.0",
    description="A smart recipe recommendation system that suggests recipes based on available ingredients",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Create tables
Base.metadata.create_all(bind=engine)

# Populate database from CSV if empty
with SessionLocal() as db:
    services.populate_database_from_csv(db)

# Static files for images - only mount if directory exists
if os.path.exists(images_dir):
    app.mount("/static", StaticFiles(directory=images_dir), name="static")
    print(f"📁 Static files mounted from: {images_dir}")
else:
    print(f"⚠️  Images directory not found: {images_dir}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    user = auth.verify_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)):
    if credentials:
        token = credentials.credentials
        user = auth.verify_token(token, db)
        return user
    return None

# Health check and info endpoints
@app.get("/")
def root():
    return {
        "message": "Smart Recipe Generator API",
        "version": "1.0.0",
        "endpoints": {
            "auth": ["/auth/register", "/auth/login", "/auth/me", "/auth/delete"],
            "recipes": ["/recipes", "/recipes/search", "/recipes/{id}", "/recipes/{id}/favorite", "/recipes/{id}/rate"],
            "user": ["/favorites", "/recommendations", "/profile/stats"],
            "analysis": ["/analyze/image"],
            "info": ["/stats", "/popular", "/health"]
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Smart Recipe Generator API"}

@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Get statistics about the recipe database"""
    try:
        stats = services.get_recipe_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stats: {str(e)}")

# Authentication endpoints
@app.post("/auth/register", response_model=schemas.LoginResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        return auth.register_user(user_data, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/auth/login", response_model=schemas.LoginResponse)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    try:
        return auth.login_user(user_data, db)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/auth/me", response_model=schemas.UserResponse)
def get_current_user_endpoint(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.delete("/auth/delete", status_code=200)
def delete_current_user(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete the current user's account and all associated data."""
    try:
        return auth.delete_user(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete account")

# Recipe endpoints - UPDATED WITH USER-SPECIFIC DATA
@app.post("/recipes/search")
def search_recipes(
    ingredients: List[str] = Form(...),
    dietary_preferences: Optional[List[str]] = Form([]),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_optional_user)
):
    """
    Search recipes by ingredients with optional dietary preferences
    """
    try:
        if not ingredients:
            raise HTTPException(status_code=400, detail="At least one ingredient is required")
        
        # Pass user_id to search function if user is authenticated
        user_id = user.id if user else None
        recipes = services.search_recipes_by_ingredients(
            db, ingredients, dietary_preferences, user_id=user_id
        )
        
        return {"recipes": recipes}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/recipes")
def get_all_recipes(
    dietary: Optional[str] = Query(None, description="Filter by dietary preference"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty level"),
    cuisine: Optional[str] = Query(None, description="Filter by cuisine type"),
    cooking_time: Optional[str] = Query(None, description="Filter by cooking time: Quick (<30min), Moderate (30-60min), Long (>60min)"),
    limit: Optional[int] = Query(50, description="Limit number of results"),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_optional_user)
):
    """
    Get all recipes with optional filtering
    """
    try:
        user_id = user.id if user else None
        recipes = services.get_filtered_recipes(
            db, dietary, difficulty, cuisine, cooking_time, user_id=user_id
        )
        
        # Apply limit
        recipes = recipes[:limit]
        
        return {"recipes": recipes}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recipes: {str(e)}")

@app.get("/recipes/{recipe_id}")
def get_recipe(
    recipe_id: int,
    servings: Optional[int] = Query(None, description="Adjust recipe for specific number of servings"),
    db: Session = Depends(get_db),
    user: Optional[models.User] = Depends(get_optional_user)
):
    """
    Get a specific recipe by ID with optional serving size adjustment
    """
    try:
        user_id = user.id if user else None
        recipe = services.get_recipe_with_adjusted_servings(db, recipe_id, servings, user_id=user_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        return recipe
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recipe: {str(e)}")

@app.post("/recipes/{recipe_id}/favorite")
def toggle_favorite(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Toggle favorite status for a recipe
    """
    try:
        # Verify recipe exists
        recipe = services.get_recipe_with_adjusted_servings(db, recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        
        # Toggle favorite and get new state
        is_favorited = services.toggle_favorite(db, current_user.id, recipe_id)
        
        return {
            "is_favorited": is_favorited,
            "message": "Recipe favorited" if is_favorited else "Recipe unfavorited"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to toggle favorite: {str(e)}")

@app.post("/recipes/{recipe_id}/rate")
def rate_recipe(
    recipe_id: int,
    rating: int = Query(..., ge=1, le=5, description="Rating from 1 to 5"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Rate a recipe (1-5 stars)
    """
    try:
        # Update the rating in the database and get updated recipe
        updated_recipe = services.rate_recipe(db, current_user.id, recipe_id, rating)
        if not updated_recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")

        return updated_recipe

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rate recipe: {str(e)}")

@app.get("/favorites")
def get_favorites(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get user's favorite recipes
    """
    try:
        favorites = services.get_user_favorites(db, current_user.id)
        return {"recipes": favorites}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch favorites: {str(e)}")

# Recommendation endpoints
@app.get("/recommendations")
def get_recommendations(
    limit: int = Query(10, ge=1, le=50, description="Number of recommendations to return"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get personalized recipe recommendations based on user's favorites
    """
    try:
        recommendations = services.get_recommendations(db, current_user.id, limit)
        return {"recipes": recommendations}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@app.get("/popular")
def get_popular_recipes(
    limit: int = Query(10, ge=1, le=50, description="Number of popular recipes to return"),
    db: Session = Depends(get_db)
):
    """
    Get popular recipes (fallback when no favorites exist)
    """
    try:
        popular = services.get_popular_recipes(limit)
        return {"recipes": popular}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get popular recipes: {str(e)}")

# User profile endpoints
@app.get("/profile/stats")
def get_user_profile_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get user profile statistics (favorite count, ratings, etc.)
    """
    try:
        stats = services.get_user_profile_stats(db, current_user.id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user stats: {str(e)}")

# Analysis endpoints
def analyze_image_with_gemini(image_bytes: bytes) -> List[str]:
    """Use Gemini to analyze image and extract ingredients"""
    try:
        if not settings.GEMINI_API_KEY:
            raise Exception("Gemini API key not configured")
        
        # Get the best available model
        available_models = genai.list_models()
        model_names = [model.name for model in available_models]
        
        # Try different model names in order of preference
        possible_models = [
            "models/gemini-2.0-flash-lite",
            "models/gemini-1.5-flash",
            "models/gemini-1.5-pro", 
        ]
        
        model_name = None
        for possible_model in possible_models:
            if possible_model in model_names:
                model_name = possible_model
                break
        
        if not model_name:
            raise Exception("No suitable Gemini model available")
        
        model = genai.GenerativeModel(model_name)
        
        # Prepare the image
        image = Image.open(io.BytesIO(image_bytes))
        
        prompt = """
        Analyze this food image and list all the visible ingredients you can identify.
        Return ONLY a JSON array of ingredient names, nothing else.
        Example: ["tomato", "onion", "garlic", "olive oil"]
        Be specific about ingredients and include common cooking ingredients.
        """
        
        response = model.generate_content([prompt, image])
        response_text = response.text.strip()
        
        # Extract JSON array
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            ingredients = json.loads(json_match.group())
            return ingredients
        else:
            # Fallback: try to parse as comma-separated list
            ingredients = [ing.strip().lower() for ing in response_text.split(',')]
            return ingredients
            
    except Exception as e:
        print(f"Gemini image analysis error: {e}")
        raise

@app.post("/analyze/image")
async def analyze_image(
    file: UploadFile = File(..., description="Image file to analyze for ingredients"),
    db: Session = Depends(get_db)
):
    """
    Analyze image to detect ingredients using Gemini AI
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read the image file
        image_bytes = await file.read()
        
        if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
        
        # Analyze with Gemini
        ingredients = analyze_image_with_gemini(image_bytes)
        
        return {
            "ingredients": ingredients,
            "confidence_scores": [0.95] * len(ingredients),  # Mock confidence scores
            "message": f"AI detected {len(ingredients)} ingredients in your image",
            "analyzed_image": file.filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8000,
        reload=True
    )