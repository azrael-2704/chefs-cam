# backend/utils/dataset_preprocessor.py
import pandas as pd
import json
import re
import os
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class DatasetPreprocessor:
    def __init__(self, csv_path: str, images_dir: str):
        self.csv_path = csv_path
        self.images_dir = images_dir
        self.common_ingredients = self._load_common_ingredients()
    
    def _load_common_ingredients(self) -> set:
        """Common ingredients to handle specially"""
        return {
            'salt', 'pepper', 'water', 'oil', 'sugar', 'flour', 'butter', 'garlic', 
            'onion', 'spices', 'turmeric', 'cumin', 'coriander', 'paprika', 'chili', 
            'vinegar', 'soy sauce', 'olive oil', 'vegetable oil', 'black pepper', 
            'white pepper', 'ginger', 'cinnamon', 'nutmeg', 'cloves', 'cardamom',
            'baking soda', 'baking powder', 'yeast', 'vanilla', 'honey', 'maple syrup',
            'salt and pepper', 'salt to taste', 'pepper to taste'
        }
    
    def load_and_preprocess(self) -> List[Dict[str, Any]]:
        """Load and preprocess the Kaggle dataset"""
        try:
            if not os.path.exists(self.csv_path):
                logger.error(f"CSV file not found: {self.csv_path}")
                return []
                
            df = pd.read_csv(self.csv_path)
            logger.info(f"Loaded dataset with {len(df)} recipes")
            
            recipes = []
            for idx, row in df.iterrows():
                try:
                    recipe = self._process_recipe(row, idx)
                    if recipe:
                        recipes.append(recipe)
                except Exception as e:
                    logger.warning(f"Error processing recipe {idx}: {e}")
                    continue
            
            logger.info(f"Successfully processed {len(recipes)} recipes")
            return recipes
            
        except Exception as e:
            logger.error(f"Error loading dataset: {e}")
            return []
    
    def _process_recipe(self, row: pd.Series, index: int) -> Dict[str, Any]:
        """Process a single recipe row"""
        # Extract basic information
        title = self._clean_text(row.get('Title', f'Recipe {index}'))
        ingredients_text = row.get('Cleaned_Ingredients', '') or row.get('Ingredients', '')
        instructions_text = row.get('Instructions', '')
        image_name = row.get('Image_Name', '')
        
        # Skip recipes without essential information
        if not ingredients_text or not instructions_text:
            return None
        
        # Process ingredients
        ingredients = self._parse_ingredients(ingredients_text)
        if not ingredients:
            return None
        
        # Process instructions
        instructions = self._parse_instructions(instructions_text)
        if not instructions:
            return None
        
        # Create recipe structure
        recipe = {
            'id': index + 1,
            'title': title,
            'description': self._generate_description(title, ingredients),
            'image_url': self._get_image_url(image_name, title),
            'difficulty': 'Medium',  # Will be enhanced by Gemini
            'cooking_time': 30,  # Will be enhanced by Gemini
            'servings': 4,  # Default servings
            'cuisine': self._infer_cuisine(title, ingredients),
            'calories': 0,  # Will be enhanced by Gemini
            'protein': 0,  # Will be enhanced by Gemini
            'carbs': 0,  # Will be enhanced by Gemini
            'fat': 0,  # Will be enhanced by Gemini
            'ingredients': ingredients,
            'instructions': instructions,
            'dietary_tags': self._infer_dietary_tags(ingredients),
            'created_at': pd.Timestamp.now().isoformat(),
            'source_row': index
        }
        
        return recipe
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if pd.isna(text):
            return ""
        
        text = str(text).strip()
        # Remove extra whitespace and normalize
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def _parse_ingredients(self, ingredients_text: str) -> List[Dict[str, str]]:
        """Parse ingredients text into structured format"""
        ingredients = []
        lines = str(ingredients_text).split('\n')
        
        for line in lines:
            line = self._clean_text(line)
            if not line or len(line) < 2:
                continue
            
            # Parse ingredient line
            ingredient = self._parse_ingredient_line(line)
            if ingredient and ingredient['name']:
                ingredients.append(ingredient)
        
        return ingredients[:20]  # Limit to 20 ingredients
    
    def _parse_ingredient_line(self, line: str) -> Dict[str, str]:
        """Parse a single ingredient line"""
        # Common patterns for ingredient parsing
        patterns = [
            # Pattern: "amount unit name" e.g., "2 cups flour"
            r'^(\d+\.?\d*)\s*(\w+)\s+(.+)',
            # Pattern: "amount name" e.g., "2 eggs"
            r'^(\d+\.?\d*)\s+(.+)',
            # Pattern: "fraction unit name" e.g., "1/2 cup sugar"
            r'^(\d+/\d+)\s*(\w+)\s+(.+)',
            # Pattern: "fraction name" e.g., "1/2 onion"
            r'^(\d+/\d+)\s+(.+)',
        ]
        
        line_lower = line.lower()
        
        # Skip common ingredients without amounts
        if line_lower in self.common_ingredients:
            return {'name': line, 'amount': 'to taste', 'unit': ''}
        
        for pattern in patterns:
            match = re.match(pattern, line_lower)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    return {'name': groups[2].title(), 'amount': groups[0], 'unit': groups[1]}
                elif len(groups) == 2:
                    return {'name': groups[1].title(), 'amount': groups[0], 'unit': ''}
        
        # If no pattern matches, treat the whole line as name
        return {'name': line.title(), 'amount': '1', 'unit': ''}
    
    def _parse_instructions(self, instructions_text: str) -> List[str]:
        """Parse instructions text into steps"""
        instructions = []
        text = str(instructions_text)
        
        # Split by common delimiters
        delimiters = [r'\n', r'\.\s+(?=[A-Z])', r'\d+\.', r'•', r'-']
        
        for delimiter in delimiters:
            steps = re.split(delimiter, text)
            if len(steps) > 1:
                break
        else:
            # If no delimiters found, split by sentences
            steps = re.split(r'\.\s+', text)
        
        for step in steps:
            step = self._clean_text(step)
            if step and len(step) > 10:  # Filter very short steps
                # Capitalize first letter
                step = step[0].upper() + step[1:] if step else step
                instructions.append(step)
        
        return instructions[:10]  # Limit to 10 steps
    
    def _get_image_url(self, image_name: str, title: str) -> str:
        """Generate image URL with fallback to title matching."""
        try:
            # 1. Try with the provided image name
            if image_name and not pd.isna(image_name):
                image_name = str(image_name).strip()
                # Check if images directory exists
                if os.path.exists(self.images_dir):
                    local_path = os.path.join(self.images_dir, image_name)
                    if os.path.exists(local_path):
                        return f"/static/{image_name}"
                else:
                    logger.warning(f"Images directory not found: {self.images_dir}")

            # 2. If images directory exists, try to match with the recipe title
            if os.path.exists(self.images_dir):
                # Sanitize title to create a potential filename
                sanitized_title = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
                
                # List all available images
                available_images = []
                for ext in ['*.jpg', '*.jpeg', '*.png']:
                    import glob
                    available_images.extend(glob.glob(os.path.join(self.images_dir, ext)))
                
                # Find a match
                for img_path in available_images:
                    img_file = os.path.basename(img_path)
                    if sanitized_title in img_file.lower():
                        return f"/static/{img_file}"
        except Exception as e:
            logger.warning(f"Could not find image for '{title}': {e}")

        # 3. Fallback to placeholder based on cuisine
        cuisine = self._infer_cuisine(title, []).lower()
        cuisine_images = {
            'italian': 'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg',
            'chinese': 'https://images.pexels.com/photos/2679501/pexels-photo-2679501.jpeg',
            'indian': 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg',
            'mexican': 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg',
            'american': 'https://images.pexels.com/photos/699544/pexels-photo-699544.jpeg',
            'thai': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
            'japanese': 'https://images.pexels.com/photos/2092507/pexels-photo-2092507.jpeg',
            'mediterranean': 'https://images.pexels.com/photos/6275121/pexels-photo-6275121.jpeg'
        }
        
        for cuisine_key, url in cuisine_images.items():
            if cuisine_key in cuisine:
                return url
        
        # Default placeholder
        return "https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg"
    
    def _generate_description(self, title: str, ingredients: List[Dict]) -> str:
        """Generate recipe description"""
        main_ingredients = [ing['name'] for ing in ingredients[:3]]
        return f"A delicious {title.lower()} made with {', '.join(main_ingredients)}. Perfect for any occasion."
    
    def _infer_cuisine(self, title: str, ingredients: List[Dict]) -> str:
        """Infer cuisine from title and ingredients"""
        title_lower = title.lower()
        ingredient_names = ' '.join([ing['name'].lower() for ing in ingredients])
        
        cuisine_keywords = {
            'italian': ['pasta', 'pizza', 'risotto', 'mozzarella', 'parmesan', 'basil', 'oregano'],
            'mexican': ['taco', 'burrito', 'salsa', 'avocado', 'cilantro', 'lime', 'chili'],
            'indian': ['curry', 'masala', 'turmeric', 'cumin', 'coriander', 'ginger', 'garam'],
            'chinese': ['soy', 'ginger', 'stir fry', 'noodle', 'rice', 'sesame', 'five spice'],
            'mediterranean': ['olive', 'feta', 'hummus', 'tzatziki', 'lemon', 'oregano'],
            'american': ['burger', 'cheese', 'bacon', 'bbq', 'potato', 'corn'],
            'thai': ['coconut', 'lemongrass', 'thai basil', 'fish sauce', 'lime'],
            'japanese': ['soy', 'miso', 'sushi', 'rice', 'ginger', 'wasabi']
        }
        
        for cuisine, keywords in cuisine_keywords.items():
            if any(keyword in title_lower for keyword in keywords) or \
               any(keyword in ingredient_names for keyword in keywords):
                return cuisine.title()
        
        return 'International'
    
    def _infer_dietary_tags(self, ingredients: List[Dict]) -> List[str]:
        """Infer dietary tags from ingredients"""
        tags = []
        ingredient_names = ' '.join([ing['name'].lower() for ing in ingredients])
        
        # Check for vegetarian
        non_veg_indicators = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'seafood', 'meat', 'bacon']
        if not any(indicator in ingredient_names for indicator in non_veg_indicators):
            tags.append('Vegetarian')
        
        # Check for vegan
        animal_products = ['milk', 'cheese', 'butter', 'cream', 'egg', 'yogurt', 'honey']
        if not any(product in ingredient_names for product in animal_products):
            tags.append('Vegan')
        
        # Check for gluten-free
        gluten_indicators = ['wheat', 'flour', 'bread', 'pasta', 'barley', 'rye']
        if not any(indicator in ingredient_names for indicator in gluten_indicators):
            tags.append('Gluten-Free')
        
        return tags