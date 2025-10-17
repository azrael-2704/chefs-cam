# backend/utils/recipe_matcher.py
import re
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class RecipeMatcher:
    def __init__(self):
        # Common ingredients to ignore in matching
        self.common_ingredients = {
            'salt', 'pepper', 'water', 'oil', 'sugar', 'flour', 'butter', 'garlic', 
            'onion', 'spices', 'turmeric', 'cumin', 'coriander', 'paprika', 'chili', 
            'vinegar', 'soy sauce', 'olive oil', 'vegetable oil', 'black pepper', 
            'white pepper', 'ginger', 'cinnamon', 'nutmeg', 'cloves', 'cardamom',
            'baking soda', 'baking powder', 'yeast', 'vanilla', 'honey', 'maple syrup'
        }
    
    def preprocess_ingredients(self, ingredients: List[str]) -> List[str]:
        """Clean and normalize ingredients"""
        processed = []
        for ingredient in ingredients:
            # Convert to lowercase and remove extra spaces
            clean = ingredient.strip().lower()
            # Remove measurements and parentheses
            clean = re.sub(r'\([^)]*\)', '', clean)  # Remove parentheses content
            clean = re.sub(r'\d+/\d+|\d+\.\d+|\d+', '', clean)  # Remove numbers
            clean = re.sub(r'[^\w\s]', ' ', clean)  # Remove special chars
            clean = ' '.join(clean.split())  # Remove extra spaces
            
            if clean and clean not in self.common_ingredients:
                processed.append(clean)
        
        return processed
    
    def calculate_similarity(self, user_ingredients: List[str], recipe_ingredients: List[str]) -> float:
        """Calculate similarity between user ingredients and recipe ingredients"""
        if not user_ingredients or not recipe_ingredients:
            return 0.0
        
        # Preprocess both sets
        user_processed = self.preprocess_ingredients(user_ingredients)
        recipe_processed = self.preprocess_ingredients(recipe_ingredients)
        
        if not user_processed or not recipe_processed:
            return 0.0
        
        # Combine for TF-IDF
        all_ingredients = user_processed + recipe_processed
        
        # Create TF-IDF vectors
        vectorizer = TfidfVectorizer().fit(all_ingredients)
        user_vector = vectorizer.transform([' '.join(user_processed)])
        recipe_vector = vectorizer.transform([' '.join(recipe_processed)])
        
        # Calculate cosine similarity
        similarity = cosine_similarity(user_vector, recipe_vector)[0][0]
        
        return similarity
    
    def find_best_matches(self, user_ingredients: List[str], recipes: List[Dict], top_k: int = 10) -> List[Dict]:
        """Find best matching recipes based on ingredient similarity"""
        scored_recipes = []
        
        for recipe in recipes:
            recipe_ingredient_names = [ing['name'] for ing in recipe.get('ingredients', [])]
            similarity = self.calculate_similarity(user_ingredients, recipe_ingredient_names)
            
            # Additional scoring factors
            ingredient_count_score = len(set(user_ingredients) & set(recipe_ingredient_names)) / max(len(set(user_ingredients)), 1)
            
            # Combined score (70% similarity, 30% ingredient count)
            final_score = 0.7 * similarity + 0.3 * ingredient_count_score
            
            scored_recipes.append({
                **recipe,
                'match_score': final_score,
                'matching_ingredients': list(set(user_ingredients) & set(recipe_ingredient_names))
            })
        
        # Sort by score and return top matches
        scored_recipes.sort(key=lambda x: x['match_score'], reverse=True)
        return scored_recipes[:top_k]