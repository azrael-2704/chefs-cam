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
        # Precomputed vectorizer and recipe matrix for performance
        self.vectorizer = None
        self.recipe_matrix = None
        self.recipe_docs = []
        self.recipe_meta = []
    
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
        all_docs = [' '.join(user_processed), ' '.join(recipe_processed)]

        # Create TF-IDF vectors
        try:
            vectorizer = TfidfVectorizer().fit(all_docs)
            user_vector = vectorizer.transform([' '.join(user_processed)])
            recipe_vector = vectorizer.transform([' '.join(recipe_processed)])

            # Calculate cosine similarity
            similarity = cosine_similarity(user_vector, recipe_vector)[0][0]
            return similarity
        except Exception:
            return 0.0

    def build_corpus(self, recipes: List[Dict]):
        """Precompute TF-IDF vectors for a corpus of recipes to speed up searches."""
        self.recipe_docs = []
        self.recipe_meta = []
        for recipe in recipes:
            recipe_ingredient_names = [ing['name'] for ing in recipe.get('ingredients', [])]
            proc = self.preprocess_ingredients(recipe_ingredient_names)
            self.recipe_docs.append(' '.join(proc))
            self.recipe_meta.append((recipe, set(map(str.lower, recipe_ingredient_names))))

        try:
            self.vectorizer = TfidfVectorizer()
            # Fit on recipes only
            self.vectorizer.fit(self.recipe_docs)
            self.recipe_matrix = self.vectorizer.transform(self.recipe_docs)
        except Exception:
            # If precomputation fails, clear stored state
            self.vectorizer = None
            self.recipe_matrix = None
    
    def find_best_matches(self, user_ingredients: List[str], recipes: List[Dict], top_k: int = 10) -> List[Dict]:
        """Find best matching recipes based on ingredient similarity"""
        # Fast path: if no recipes or no user ingredients
        if not recipes or not user_ingredients:
            return []

        # Preprocess user ingredients into a single query doc
        user_processed = self.preprocess_ingredients(user_ingredients)
        if not user_processed:
            return []
        user_doc = ' '.join(user_processed)

        # Build recipe documents in batch
        recipe_docs = []
        recipe_meta = []
        for recipe in recipes:
            recipe_ingredient_names = [ing['name'] for ing in recipe.get('ingredients', [])]
            proc = self.preprocess_ingredients(recipe_ingredient_names)
            recipe_docs.append(' '.join(proc))
            recipe_meta.append((recipe, set(map(str.lower, recipe_ingredient_names))))

        # Vectorize recipes and user query in one pass. Prefer precomputed corpus if available
        similarities = []
        try:
            if self.vectorizer is not None and self.recipe_matrix is not None and len(self.recipe_docs) == len(recipes):
                # use precomputed matrix
                user_vector = self.vectorizer.transform([user_doc])
                similarities = cosine_similarity(user_vector, self.recipe_matrix).flatten()
            else:
                vectorizer = TfidfVectorizer()
                vectorizer.fit(recipe_docs + [user_doc])
                recipe_matrix = vectorizer.transform(recipe_docs)
                user_vector = vectorizer.transform([user_doc])
                similarities = cosine_similarity(user_vector, recipe_matrix).flatten()
        except Exception:
            # Fallback to slower per-recipe calculation if vectorization fails
            for recipe_doc in recipe_docs:
                try:
                    vec = TfidfVectorizer().fit([user_doc, recipe_doc])
                    u = vec.transform([user_doc])
                    r = vec.transform([recipe_doc])
                    similarities.append(cosine_similarity(u, r)[0][0])
                except Exception:
                    similarities.append(0.0)

        scored_recipes = []
        for idx, (recipe, recipe_ingredient_set) in enumerate(recipe_meta):
            sim = similarities[idx] if idx < len(similarities) else 0.0
            ingredient_count_score = len(set(map(str.lower, user_ingredients)) & recipe_ingredient_set) / max(len(set(user_ingredients)), 1)
            final_score = 0.7 * sim + 0.3 * ingredient_count_score

            scored_recipes.append({
                **recipe,
                'match_score': final_score,
                'matching_ingredients': list(set(user_ingredients) & set([ing for ing in recipe.get('ingredients', [])]))
            })

        scored_recipes.sort(key=lambda x: x['match_score'], reverse=True)
        return scored_recipes[:top_k]