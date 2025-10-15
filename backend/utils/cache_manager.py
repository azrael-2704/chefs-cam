# backend/utils/cache_manager.py
import csv
import os
import json
from typing import List, Dict, Any
import pandas as pd

class RecipeCache:
    def __init__(self, cache_file: str = "recipe_cache.csv"):
        self.cache_file = cache_file
        self._ensure_cache_file()
    
    def _ensure_cache_file(self):
        if not os.path.exists(self.cache_file):
            with open(self.cache_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'ingredients_hash', 'dietary_preferences', 'recipe_ids', 
                    'search_count', 'last_accessed'
                ])
    
    def _get_ingredients_hash(self, ingredients: List[str]) -> str:
        """Create a hash key for ingredients combination"""
        normalized = sorted([ing.strip().lower() for ing in ingredients])
        return hash(tuple(normalized))
    
    def get_cached_recipes(self, ingredients: List[str], dietary_preferences: List[str]) -> List[int]:
        """Get cached recipe IDs for this search"""
        ingredients_hash = self._get_ingredients_hash(ingredients)
        dietary_key = json.dumps(sorted(dietary_preferences))
        
        try:
            df = pd.read_csv(self.cache_file)
            mask = (df['ingredients_hash'] == ingredients_hash) & (df['dietary_preferences'] == dietary_key)
            
            if mask.any():
                row = df[mask].iloc[0]
                # Update access count and timestamp
                self._update_access_count(ingredients_hash, dietary_key)
                return json.loads(row['recipe_ids'])
        except Exception as e:
            print(f"Cache read error: {e}")
        
        return []
    
    def save_to_cache(self, ingredients: List[str], dietary_preferences: List[str], recipe_ids: List[int]):
        """Save search results to cache"""
        ingredients_hash = self._get_ingredients_hash(ingredients)
        dietary_key = json.dumps(sorted(dietary_preferences))
        recipe_ids_json = json.dumps(recipe_ids)
        
        try:
            df = pd.read_csv(self.cache_file)
            mask = (df['ingredients_hash'] == ingredients_hash) & (df['dietary_preferences'] == dietary_key)
            
            if mask.any():
                # Update existing entry
                idx = df[mask].index[0]
                df.at[idx, 'recipe_ids'] = recipe_ids_json
                df.at[idx, 'search_count'] += 1
                df.at[idx, 'last_accessed'] = pd.Timestamp.now().isoformat()
            else:
                # Add new entry
                new_row = {
                    'ingredients_hash': ingredients_hash,
                    'dietary_preferences': dietary_key,
                    'recipe_ids': recipe_ids_json,
                    'search_count': 1,
                    'last_accessed': pd.Timestamp.now().isoformat()
                }
                df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
            
            df.to_csv(self.cache_file, index=False)
            
        except Exception as e:
            print(f"Cache write error: {e}")
    
    def _update_access_count(self, ingredients_hash: int, dietary_key: str):
        """Update access count and timestamp"""
        try:
            df = pd.read_csv(self.cache_file)
            mask = (df['ingredients_hash'] == ingredients_hash) & (df['dietary_preferences'] == dietary_key)
            
            if mask.any():
                idx = df[mask].index[0]
                df.at[idx, 'search_count'] += 1
                df.at[idx, 'last_accessed'] = pd.Timestamp.now().isoformat()
                df.to_csv(self.cache_file, index=False)
        except Exception as e:
            print(f"Cache update error: {e}")