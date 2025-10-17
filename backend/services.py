# backend/services.py
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
import models
import schemas
import json
import google.generativeai as genai
import os
import time
from typing import List, Dict, Any
from utils.cache_manager import RecipeCache
from utils.recipe_matcher import RecipeMatcher
from utils.dataset_preprocessor import DatasetPreprocessor
from utils.serving_calculator import ServingCalculator
import pandas as pd
from datetime import datetime
import logging
from config import settings

logger = logging.getLogger(__name__)

# Initialize components with relative paths
recipe_cache = RecipeCache()
recipe_matcher = RecipeMatcher()

# Get relative paths for dataset
current_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(current_dir, 'dataset', 'recipes.csv')
images_dir = os.path.join(current_dir, 'dataset', 'food-images')

print(f"📁 Dataset path: {csv_path}")
print(f"📁 Images path: {images_dir}")

# Initialize preprocessor with error handling
try:
    preprocessor = DatasetPreprocessor(csv_path=csv_path, images_dir=images_dir)
    DATASET_RECIPES = preprocessor.load_and_preprocess()
    logger.info(f"Loaded {len(DATASET_RECIPES)} recipes from dataset")
except Exception as e:
    logger.error(f"Failed to load dataset: {e}")
    DATASET_RECIPES = []
    # Create a fallback dataset
    fallback_recipes = [
        {
            'id': 1,
            'title': 'Vegetable Stir Fry',
            'description': 'A quick and healthy vegetable stir fry',
            'image_url': 'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg',
            'difficulty': 'Easy',
            'cooking_time': 20,
            'servings': 2,
            'cuisine': 'Asian',
            'calories': 350,
            'protein': 12,
            'carbs': 45,
            'fat': 15,
            'ingredients': [
                {'name': 'Bell Pepper', 'amount': '2', 'unit': 'pieces'},
                {'name': 'Carrot', 'amount': '1', 'unit': 'piece'},
                {'name': 'Broccoli', 'amount': '1', 'unit': 'cup'},
                {'name': 'Soy Sauce', 'amount': '2', 'unit': 'tbsp'}
            ],
            'instructions': [
                'Chop all vegetables',
                'Heat oil in a wok',
                'Stir fry vegetables for 5 minutes',
                'Add soy sauce and serve'
            ],
            'dietary_tags': ['Vegetarian', 'Vegan', 'Gluten-Free']
        }
    ]
    DATASET_RECIPES = fallback_recipes

# Database indexing setup
def create_indexes(engine):
    """Create database indexes for performance"""
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)",
        "CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id)",
        "CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites (recipe_id)",
        "CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings (user_id)",
        "CREATE INDEX IF NOT EXISTS idx_ratings_recipe_id ON ratings (recipe_id)",
        "CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes (difficulty)",
        "CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes (cuisine)",
        "CREATE INDEX IF NOT EXISTS idx_recipes_cooking_time ON recipes (cooking_time)",
    ]
    
    with engine.connect() as conn:
        for index_sql in indexes:
            try:
                conn.execute(text(index_sql))
                conn.commit()
            except Exception as e:
                logger.warning(f"Error creating index: {e}")

# Initialize indexes when services are loaded
from database import engine
create_indexes(engine)

def get_available_gemini_model():
    """Get the correct Gemini model that's actually available"""
    try:
        # List available models to see what we can use
        available_models = genai.list_models()
        model_names = [model.name for model in available_models]
        logger.info(f"Available Gemini models: {len(model_names)}")
        
        # Try different model names in order of preference - Gemini 2.0 Flash-Lite first
        possible_models = [
            "models/gemini-2.0-flash-lite",  # Primary model
            "models/gemini-1.5-flash",
            "models/gemini-1.5-pro", 
            "models/gemini-1.0-pro",
            "models/gemini-pro"
        ]
        
        for model_name in possible_models:
            if model_name in model_names:
                logger.info(f"Using Gemini model: {model_name}")
                return model_name
        
        logger.warning("No compatible Gemini models found")
        return None
    except Exception as e:
        logger.warning(f"Could not fetch available models: {e}")
        return None

def enhance_recipe_with_gemini(recipe_data):
    """Use Gemini API to enhance recipe with missing information"""
    try:
        # Check if Gemini API key is available
        gemini_api_key = settings.GEMINI_API_KEY
        if not gemini_api_key:
            logger.warning("Gemini API key not found, using default values")
            return _apply_default_recipe_values(recipe_data)
        
        # Get the correct model
        model_name = get_available_gemini_model()
        if not model_name:
            logger.warning("No Gemini model available, using default values")
            return _apply_default_recipe_values(recipe_data)
            
        model = genai.GenerativeModel(model_name)
        
        prompt = f"""
        Recipe: {recipe_data['title']}
        Ingredients: {[ing['name'] for ing in recipe_data['ingredients']][:10]}
        
        Estimate in JSON:
        - cooking_time: minutes (number)
        - difficulty: Easy, Medium, or Hard
        - calories: number
        - protein: grams (number)
        - carbs: grams (number)  
        - fat: grams (number)
        - dietary_tags: array of applicable tags
        - cuisine: string
        
        JSON only, no explanations.
        """
        
        # Add rate limiting
        time.sleep(0.5)
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Simple JSON extraction
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]
        elif response_text.startswith('{') and response_text.endswith('}'):
            # Already JSON
            pass
        else:
            # Try to find JSON in the response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group()
        
        enhanced_data = json.loads(response_text)
        
        # Update recipe with enhanced data
        recipe_data.update({
            "cooking_time": enhanced_data.get("cooking_time", 30),
            "difficulty": enhanced_data.get("difficulty", "Medium"),
            "calories": enhanced_data.get("calories", 400),
            "protein": enhanced_data.get("protein", 15.0),
            "carbs": enhanced_data.get("carbs", 50.0),
            "fat": enhanced_data.get("fat", 15.0),
            "dietary_tags": enhanced_data.get("dietary_tags", ["Vegetarian"]),
            "cuisine": enhanced_data.get("cuisine", "International")
        })
        
        logger.info(f"Enhanced recipe: {recipe_data['title']}")
        
    except Exception as e:
        logger.error(f"Gemini API error for {recipe_data['title']}: {e}")
        recipe_data = _apply_default_recipe_values(recipe_data)
    
    return recipe_data

def _apply_default_recipe_values(recipe_data):
    """Apply default values to recipe"""
    recipe_data.update({
        "cooking_time": 30,
        "difficulty": "Medium",
        "calories": 400,
        "protein": 15.0,
        "carbs": 50.0,
        "fat": 15.0,
        "dietary_tags": recipe_data.get('dietary_tags', ["Vegetarian"]),
        "cuisine": recipe_data.get('cuisine', "International")
    })
    return recipe_data

def get_recipe_with_adjusted_servings(db: Session, recipe_id: int, desired_servings: int = None, user_id: int = None):
    """Get recipe with optional serving size adjustment - with user data"""
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        return None

    recipe_dict = {c.name: getattr(recipe, c.name) for c in recipe.__table__.columns}
    recipe_dict['ingredients'] = [
        {'name': ing.name, 'amount': ing.amount, 'unit': ing.unit} for ing in recipe.ingredients_rel
    ]
    recipe_dict['instructions'] = json.loads(recipe.instructions)
    recipe_dict['dietary_tags'] = json.loads(recipe.dietary_tags)

    # LAZY enhancement: Only enhance with Gemini if absolutely necessary
    if recipe_dict.get('calories', 0) == 0 and settings.GEMINI_API_KEY:
        try:
            recipe_dict = enhance_recipe_with_gemini(recipe_dict)
            # Update the database with the enhanced data
            recipe.calories = recipe_dict['calories']
            recipe.protein = recipe_dict['protein']
            recipe.carbs = recipe_dict['carbs']
            recipe.fat = recipe_dict['fat']
            recipe.difficulty = recipe_dict['difficulty']
            recipe.cooking_time = recipe_dict['cooking_time']
            recipe.cuisine = recipe_dict['cuisine']
            recipe.dietary_tags = json.dumps(recipe_dict['dietary_tags'])
            db.commit()
        except Exception as e:
            logger.error(f"Failed to enhance recipe {recipe_id}: {e}")
            recipe_dict = _apply_default_recipe_values(recipe_dict)

    # Add user-specific data
    recipe_dict['is_favorited'] = False
    recipe_dict['user_rating'] = 0
    recipe_dict['average_rating'] = recipe.average_rating or 0
    recipe_dict['rating_count'] = recipe.rating_count or 0

    # Add user-specific data if user is provided
    if user_id:
        recipe_dict['is_favorited'] = is_recipe_favorited(db, user_id, recipe_id)
        recipe_dict['user_rating'] = get_user_rating(db, user_id, recipe_id)

    # Adjust servings if requested
    if desired_servings and desired_servings != recipe_dict.get('servings', 4):
        original_servings = recipe_dict.get('servings', 4)
        
        # Adjust ingredients
        recipe_dict['ingredients'] = ServingCalculator.adjust_ingredients(
            recipe_dict['ingredients'], original_servings, desired_servings
        )
        
        # Adjust nutrition
        nutrition = {
            'calories': recipe_dict.get('calories', 0),
            'protein': recipe_dict.get('protein', 0),
            'carbs': recipe_dict.get('carbs', 0),
            'fat': recipe_dict.get('fat', 0)
        }
        adjusted_nutrition = ServingCalculator.adjust_nutrition(
            nutrition, original_servings, desired_servings
        )
        
        recipe_dict.update(adjusted_nutrition)
        recipe_dict['adjusted_servings'] = desired_servings
        recipe_dict['original_servings'] = original_servings
    
    return recipe_dict

def search_recipes_by_ingredients(
    db: Session,
    ingredients: List[str],
    dietary_preferences: List[str] = None,
    user_id: int = None,
    top_n_gemini: int = 5
):
    """Search recipes with caching and user-specific data"""
    
    # Check cache first
    cached_recipe_ids = recipe_cache.get_cached_recipes(ingredients, dietary_preferences or [])
    if cached_recipe_ids:
        cached_recipes = []
        for recipe_id in cached_recipe_ids:
            recipe = get_recipe_with_adjusted_servings(db, recipe_id, user_id=user_id)
            if recipe:
                cached_recipes.append(recipe)
        logger.info(f"Returning {len(cached_recipes)} cached recipes")
        return cached_recipes
    
    # Find matches
    matched_recipes = recipe_matcher.find_best_matches(ingredients, DATASET_RECIPES)
    matched_recipes.sort(key=lambda r: r.get("match_score", 0), reverse=True)
    
    # Apply dietary filters
    if dietary_preferences:
        matched_recipes = [
            recipe for recipe in matched_recipes
            if any(tag in recipe.get('dietary_tags', []) for tag in dietary_preferences)
        ]

    # Enhance ONLY top recipes via Gemini
    enhanced_recipes = []
    for i, recipe in enumerate(matched_recipes):
        if i < top_n_gemini and recipe.get('calories', 0) == 0 and settings.GEMINI_API_KEY:
            try:
                recipe = enhance_recipe_with_gemini(recipe)
                recipe['enhanced'] = True
            except Exception as e:
                logger.error(f"Failed to enhance recipe {recipe['title']}: {e}")
                recipe['enhanced'] = False
        else:
            recipe['enhanced'] = False
        
        # Add user-specific data if user is provided
        if user_id:
            recipe['is_favorited'] = is_recipe_favorited(db, user_id, recipe['id'])
            recipe['user_rating'] = get_user_rating(db, user_id, recipe['id'])
        
        enhanced_recipes.append(recipe)

    # Cache the resulting recipe IDs
    recipe_ids = [recipe['id'] for recipe in enhanced_recipes]
    recipe_cache.save_to_cache(ingredients, dietary_preferences or [], recipe_ids)

    logger.info(f"Found {len(enhanced_recipes)} matching recipes")
    return enhanced_recipes

def get_filtered_recipes(db: Session, dietary: str = None, difficulty: str = None, cuisine: str = None, cooking_time: str = None, user_id: int = None):
    """Get recipes with filters and user-specific data"""
    filtered_recipes = DATASET_RECIPES.copy()
    
    if dietary:
        filtered_recipes = [r for r in filtered_recipes if dietary in r.get('dietary_tags', [])]
    if difficulty:
        filtered_recipes = [r for r in filtered_recipes if r.get('difficulty') == difficulty]
    if cuisine:
        filtered_recipes = [r for r in filtered_recipes if r.get('cuisine', '').lower() == cuisine.lower()]
    if cooking_time:
        if cooking_time == 'Quick':
            filtered_recipes = [r for r in filtered_recipes if r.get('cooking_time', 0) < 30]
        elif cooking_time == 'Moderate':
            filtered_recipes = [r for r in filtered_recipes if 30 <= r.get('cooking_time', 0) <= 60]
        elif cooking_time == 'Long':
            filtered_recipes = [r for r in filtered_recipes if r.get('cooking_time', 0) > 60]
    
    # Add user-specific data if user is provided
    if user_id:
        for recipe in filtered_recipes:
            recipe['is_favorited'] = is_recipe_favorited(db, user_id, recipe['id'])
            recipe['user_rating'] = get_user_rating(db, user_id, recipe['id'])
    
    return filtered_recipes

def is_recipe_favorited(db: Session, user_id: int, recipe_id: int) -> bool:
    """Check if a recipe is favorited by user"""
    favorite = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.recipe_id == recipe_id
    ).first()
    return favorite is not None

def get_user_rating(db: Session, user_id: int, recipe_id: int) -> int:
    """Get user's rating for a recipe"""
    rating = db.query(models.Rating).filter(
        models.Rating.user_id == user_id,
        models.Rating.recipe_id == recipe_id
    ).first()
    return rating.rating if rating else 0

def toggle_favorite(db: Session, user_id: int, recipe_id: int):
    """Toggle favorite status for a recipe"""
    try:
        # Check if already favorited
        favorite = db.query(models.Favorite).filter(
            models.Favorite.user_id == user_id,
            models.Favorite.recipe_id == recipe_id
        ).first()
        
        if favorite:
            # Remove favorite
            db.delete(favorite)
            db.commit()
            logger.info(f"Removed favorite: user {user_id}, recipe {recipe_id}")
            return False  # Return new state
        else:
            # Add favorite
            new_favorite = models.Favorite(user_id=user_id, recipe_id=recipe_id)
            db.add(new_favorite)
            db.commit()
            db.refresh(new_favorite)
            logger.info(f"Added favorite: user {user_id}, recipe {recipe_id}")
            return True  # Return new state
    except Exception as e:
        logger.error(f"Error toggling favorite: {e}")
        db.rollback()
        raise

def rate_recipe(db: Session, user_id: int, recipe_id: int, rating: int):
    """Rate a recipe and update its average rating."""
    try:
        if not 1 <= rating <= 5:
            raise ValueError("Rating must be between 1 and 5")

        recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
        if not recipe:
            raise ValueError("Recipe not found")

        # Get or create the rating
        existing_rating = db.query(models.Rating).filter(
            models.Rating.user_id == user_id,
            models.Rating.recipe_id == recipe_id
        ).first()

        if existing_rating:
            existing_rating.rating = rating
        else:
            new_rating = models.Rating(user_id=user_id, recipe_id=recipe_id, rating=rating)
            db.add(new_rating)

        # Recalculate average rating
        all_ratings = db.query(models.Rating.rating).filter(models.Rating.recipe_id == recipe_id).all()
        
        if all_ratings:
            total_rating = sum(r[0] for r in all_ratings)
            recipe.rating_count = len(all_ratings)
            recipe.average_rating = round(total_rating / recipe.rating_count, 1)
        else:
            recipe.rating_count = 0
            recipe.average_rating = 0.0
        
        db.commit()
        db.refresh(recipe)
        
        logger.info(f"User {user_id} rated recipe {recipe_id} with {rating}. New average: {recipe.average_rating}")
        
        # Return the updated recipe with user data
        updated_recipe = get_recipe_with_adjusted_servings(db, recipe_id, user_id=user_id)
        if updated_recipe:
            updated_recipe['is_favorited'] = is_recipe_favorited(db, user_id, recipe_id)
            updated_recipe['user_rating'] = rating
            updated_recipe['average_rating'] = recipe.average_rating
            updated_recipe['rating_count'] = recipe.rating_count
        
        return updated_recipe

    except Exception as e:
        logger.error(f"Error rating recipe: {e}")
        db.rollback()
        raise

def get_user_favorites(db: Session, user_id: int):
    """Get user's favorite recipes with complete data"""
    try:
        favorites = db.query(models.Favorite).filter(models.Favorite.user_id == user_id).all()
        favorite_recipes = []
        
        for fav in favorites:
            recipe_data = get_recipe_by_id(db, fav.recipe_id, user_id=user_id)
            if recipe_data:
                recipe_data['is_favorited'] = True  # These are favorites by definition
                recipe_data['user_rating'] = get_user_rating(db, user_id, fav.recipe_id)
                favorite_recipes.append(recipe_data)
        
        logger.info(f"Found {len(favorite_recipes)} favorites for user {user_id}")
        return favorite_recipes
    except Exception as e:
        logger.error(f"Error getting favorites: {e}")
        return []

def get_recommendations(db: Session, user_id: int, limit: int = 10) -> List[Dict]:
    """Get recipe recommendations based on user's favorite recipes"""
    try:
        favorites = db.query(models.Favorite).filter(models.Favorite.user_id == user_id).all()
        
        if not favorites:
            return get_popular_recipes(limit)
        
        favorite_ingredients = set()
        for favorite in favorites:
            recipe = get_recipe_by_id(db, favorite.recipe_id, user_id=user_id)
            if recipe:
                recipe_ingredients = [ing['name'].lower() for ing in recipe.get('ingredients', [])]
                favorite_ingredients.update(recipe_ingredients)
        
        favorited_recipe_ids = {fav.recipe_id for fav in favorites}
        candidate_recipes = [
            r for r in DATASET_RECIPES 
            if r['id'] not in favorited_recipe_ids
        ]
        
        scored_recipes = []
        for recipe in candidate_recipes:
            recipe_ingredients = [ing['name'].lower() for ing in recipe.get('ingredients', [])]
            
            common_ingredients = favorite_ingredients.intersection(recipe_ingredients)
            similarity_score = len(common_ingredients) / len(favorite_ingredients) if favorite_ingredients else 0
            
            rating_boost = recipe.get('average_rating', 0) / 5.0
            final_score = 0.7 * similarity_score + 0.3 * rating_boost
            
            scored_recipes.append({
                **recipe,
                'recommendation_score': final_score,
                'matching_ingredients': list(common_ingredients)
            })
        
        scored_recipes.sort(key=lambda x: x['recommendation_score'], reverse=True)
        recommendations = scored_recipes[:limit]
        
        # Add user-specific data
        for recipe in recommendations:
            recipe['is_favorited'] = is_recipe_favorited(db, user_id, recipe['id'])
            recipe['user_rating'] = get_user_rating(db, user_id, recipe['id'])
        
        logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")
        return recommendations
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        return get_popular_recipes(limit)

def get_popular_recipes(limit: int = 10) -> List[Dict]:
    """Get popular recipes (fallback for recommendations)"""
    DATASET_RECIPES.sort(key=lambda x: x.get('average_rating', 0), reverse=True)
    return DATASET_RECIPES[:limit]

def get_recipe_stats(db: Session):
    """Get statistics about recipes"""
    total_recipes = len(DATASET_RECIPES)
    enhanced_recipes = sum(1 for r in DATASET_RECIPES if r.get('calories', 0) > 0)
    
    cuisines = {}
    difficulties = {}
    dietary_tags = {}
    
    for recipe in DATASET_RECIPES:
        cuisine = recipe.get('cuisine', 'Unknown')
        cuisines[cuisine] = cuisines.get(cuisine, 0) + 1
        
        difficulty = recipe.get('difficulty', 'Unknown')
        difficulties[difficulty] = difficulties.get(difficulty, 0) + 1
        
        for tag in recipe.get('dietary_tags', []):
            dietary_tags[tag] = dietary_tags.get(tag, 0) + 1
    
    return {
        'total_recipes': total_recipes,
        'enhanced_recipes': enhanced_recipes,
        'cuisines': cuisines,
        'difficulties': difficulties,
        'dietary_tags': dietary_tags
    }

def populate_database_from_csv(db: Session):
    """Populate the database with recipes from the CSV file if it's empty."""
    if db.query(models.Recipe).count() == 0:
        logger.info("Database is empty. Populating with recipes...")
        for recipe_data in DATASET_RECIPES:
            recipe = models.Recipe(
                id=recipe_data['id'],
                title=recipe_data['title'],
                description=recipe_data['description'],
                image_url=recipe_data['image_url'],
                difficulty=recipe_data['difficulty'],
                cooking_time=recipe_data['cooking_time'],
                servings=recipe_data['servings'],
                cuisine=recipe_data['cuisine'],
                calories=recipe_data['calories'],
                protein=recipe_data['protein'],
                carbs=recipe_data['carbs'],
                fat=recipe_data['fat'],
                instructions=json.dumps(recipe_data['instructions']),
                dietary_tags=json.dumps(recipe_data['dietary_tags']),
            )

            for ingredient_data in recipe_data['ingredients']:
                ingredient = db.query(models.Ingredient).filter_by(name=ingredient_data['name']).first()
                if not ingredient:
                    ingredient = models.Ingredient(
                        name=ingredient_data['name'],
                        amount=ingredient_data.get('amount', ''),
                        unit=ingredient_data.get('unit', '')
                    )
                    db.add(ingredient)
                recipe.ingredients_rel.append(ingredient)

            db.add(recipe)
        db.commit()
        logger.info(f"Successfully populated the database with {len(DATASET_RECIPES)} recipes.")
    else:
        logger.info("Database already contains recipes. Skipping population.")

def get_all_recipes(db: Session, user_id: int = None):
    """Get all recipes with optional user-specific data"""
    recipes = []
    for recipe_data in DATASET_RECIPES:
        recipe = get_recipe_by_id(db, recipe_data['id'], user_id=user_id)
        if recipe:
            recipes.append(recipe)
    return recipes

def get_recipe_by_id(db: Session, recipe_id: int, user_id: int = None):
    """Get a specific recipe by ID with user-specific data"""
    return get_recipe_with_adjusted_servings(db, recipe_id, user_id=user_id)

def clear_cache():
    """Clear the recipe cache"""
    recipe_cache.clear_cache()
    logger.info("Recipe cache cleared")

def health_check(db: Session):
    """Perform health check of the service"""
    try:
        # Check database connection
        db.execute(text("SELECT 1"))
        
        # Check dataset
        dataset_status = len(DATASET_RECIPES) > 0
        
        # Check Gemini API
        gemini_status = bool(settings.GEMINI_API_KEY and get_available_gemini_model())
        
        # Check cache
        cache_status = recipe_cache.is_healthy()
        
        return {
            "status": "healthy",
            "database": "connected",
            "dataset_loaded": dataset_status,
            "dataset_count": len(DATASET_RECIPES),
            "gemini_available": gemini_status,
            "cache_healthy": cache_status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }