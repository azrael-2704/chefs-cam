export interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cooking_time: number;
  servings: number;
  original_servings?: number;
  adjusted_servings?: number;
  cuisine: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  instructions: string[];
  dietary_tags: string[];
  created_at: string;
  average_rating?: number;
  rating_count?: number;
  is_favorited?: boolean;
  user_rating?: number;
}

export interface Ingredient {
  name: string;
  amount: string;
  original_amount?: string;
  unit: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  recipe_id: string;
  rating: number;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  dietary_preferences: string[];
  favorite_cuisines: string[];
  updated_at: string;
}

export interface RecipeFilters {
  dietary?: string[];
  cookingTime?: 'Quick' | 'Moderate' | 'Long';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  cuisine?: string;
}

export type Page = 'home' | 'input' | 'results' | 'details' | 'favorites' | 'login';

export interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
}
