# backend/utils/serving_calculator.py
import re
import fractions
from typing import List, Dict, Any

class ServingCalculator:
    @staticmethod
    def parse_amount(amount_str: str) -> float:
        """Parse ingredient amount string to float"""
        if not amount_str or amount_str.strip() == '':
            return 0.0
        
        amount_str = str(amount_str).strip().lower()
        
        # Handle fractions
        if '/' in amount_str:
            try:
                # Handle mixed numbers like "1 1/2"
                if ' ' in amount_str:
                    whole, fraction_part = amount_str.split(' ')
                    whole_num = float(whole)
                    fraction_val = float(fractions.Fraction(fraction_part))
                    return whole_num + fraction_val
                else:
                    return float(fractions.Fraction(amount_str))
            except:
                return 0.0
        
        # Handle decimal numbers
        try:
            return float(amount_str)
        except:
            return 0.0
    
    @staticmethod
    def format_amount(amount: float) -> str:
        """Format float amount to readable string"""
        if amount == 0:
            return "0"
        
        # Check if it's a whole number
        if amount.is_integer():
            return str(int(amount))
        
        # Convert to fraction for common values
        common_fractions = {
            0.125: '1/8', 0.25: '1/4', 0.333: '1/3', 0.5: '1/2',
            0.666: '2/3', 0.75: '3/4', 0.875: '7/8'
        }
        
        for decimal, fraction in common_fractions.items():
            if abs(amount - decimal) < 0.01:
                return fraction
        
        # Return with 1 decimal place
        return str(round(amount, 1))
    
    @staticmethod
    def adjust_ingredients(ingredients: List[Dict], original_servings: int, desired_servings: int) -> List[Dict]:
        """Adjust ingredient amounts based on serving size"""
        if original_servings == 0:
            return ingredients
        
        ratio = desired_servings / original_servings
        
        adjusted_ingredients = []
        for ingredient in ingredients:
            adjusted_ingredient = ingredient.copy()
            amount = ingredient.get('amount', '0')
            
            # Parse and adjust amount
            parsed_amount = ServingCalculator.parse_amount(amount)
            adjusted_amount = parsed_amount * ratio
            
            # Format the adjusted amount
            adjusted_ingredient['amount'] = ServingCalculator.format_amount(adjusted_amount)
            adjusted_ingredient['original_amount'] = amount  # Keep original for reference
            
            adjusted_ingredients.append(adjusted_ingredient)
        
        return adjusted_ingredients
    
    @staticmethod
    def adjust_nutrition(nutrition: Dict, original_servings: int, desired_servings: int) -> Dict:
        """Adjust nutritional values based on serving size"""
        if original_servings == 0:
            return nutrition
        
        ratio = desired_servings / original_servings
        adjusted_nutrition = nutrition.copy()
        
        # Adjust numeric nutritional values
        numeric_fields = ['calories', 'protein', 'carbs', 'fat', 'sugar', 'fiber']
        for field in numeric_fields:
            if field in adjusted_nutrition:
                try:
                    adjusted_nutrition[field] = round(adjusted_nutrition[field] * ratio, 1)
                except (TypeError, ValueError):
                    pass
        
        return adjusted_nutrition