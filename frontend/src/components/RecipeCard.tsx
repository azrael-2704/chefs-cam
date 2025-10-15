// frontend/src/components/RecipeCard.tsx
import { Clock, Users, Flame, Heart, Star } from 'lucide-react';
import { Recipe } from '../types';
import { useApp } from '../context/AppContext';
import { Button } from './Button';
import { recipesAPI } from '../lib/api';
import { useState } from 'react';

interface RecipeCardProps {
  recipe: Recipe;
  onViewDetails?: () => void;
  onUpdate?: (updatedRecipe: Recipe) => void;
  showMatchScore?: boolean;
  showRecommendationScore?: boolean;
}

export function RecipeCard({ 
  recipe, 
  onViewDetails, 
  onUpdate,
  showMatchScore = false,
  showRecommendationScore = false 
}: RecipeCardProps) {
  const { favorites, toggleFavorite, user } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  
  // Use both context and recipe data for favorite state
  const isFavorited = favorites.has(recipe.id) || recipe.is_favorited;

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading || !user) return;
    
    setIsLoading(true);
    try {
      const response = await recipesAPI.toggleFavorite(parseInt(recipe.id));
      
      // Update local state
      toggleFavorite(recipe.id);
      
      // Update recipe data if callback provided
      if (onUpdate) {
        onUpdate({
          ...recipe,
          is_favorited: response.is_favorited
        });
      }
      
      console.log(`Recipe ${recipe.id} ${response.is_favorited ? 'favorited' : 'unfavorited'}`);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite');
    } finally {
      setIsLoading(false);
    }
  };

  const difficultyColors = {
    Easy: 'text-green-600 bg-green-50',
    Medium: 'text-amber-600 bg-amber-50',
    Hard: 'text-red-600 bg-red-50',
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getRecommendationScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-purple-600 bg-purple-50';
    if (score >= 0.4) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.image_url || "https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg"}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = "https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg";
          }}
        />
        
        {/* Favorite Button */}
        {user && (
          <button
            onClick={handleFavoriteClick}
            disabled={isLoading}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-all ${
              isFavorited
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Heart 
              className={`w-5 h-5 transition-all ${
                isFavorited ? 'fill-current scale-110' : ''
              }`} 
            />
          </button>
        )}
        
        {/* Difficulty Badge */}
        <div className="absolute bottom-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColors[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
        </div>

        {/* Match Score Badge */}
        {showMatchScore && recipe.matchScore && (
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getMatchScoreColor(recipe.matchScore)}`}>
              {Math.round(recipe.matchScore * 100)}% Match
            </span>
          </div>
        )}

        {/* Recommendation Score Badge */}
        {showRecommendationScore && recipe.recommendationScore && (
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRecommendationScoreColor(recipe.recommendationScore)}`}>
              {Math.round(recipe.recommendationScore * 100)}% Match
            </span>
          </div>
        )}

        {/* Enhanced Badge */}
        {recipe.enhanced && (
          <div className="absolute bottom-3 right-3">
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
              AI Enhanced
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
          {recipe.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {recipe.description}
        </p>

        {/* Recipe Stats */}
        <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>{recipe.cooking_time} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-green-500" />
            <span>
              {recipe.adjusted_servings || recipe.servings} 
              {recipe.adjusted_servings && (
                <span className="text-xs text-gray-400 ml-1">
                  (orig. {recipe.original_servings})
                </span>
              )}
              {' '}servings
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{recipe.calories} cal</span>
          </div>
        </div>

        {/* Dietary Tags */}
        {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {recipe.dietary_tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {recipe.dietary_tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{recipe.dietary_tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Matching Ingredients */}
        {recipe.matchingIngredients && recipe.matchingIngredients.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Matching ingredients:</p>
            <div className="flex flex-wrap gap-1">
              {recipe.matchingIngredients.slice(0, 3).map((ingredient) => (
                <span
                  key={ingredient}
                  className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                >
                  {ingredient}
                </span>
              ))}
              {recipe.matchingIngredients.length > 3 && (
                <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                  +{recipe.matchingIngredients.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Rating and Action */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              <span className="text-sm font-semibold text-gray-700">
                {recipe.average_rating?.toFixed(1) || 'New'}
              </span>
              {recipe.rating_count > 0 && (
                <span className="text-xs text-gray-500">({recipe.rating_count})</span>
              )}
            </div>
            
            {/* User Rating Indicator */}
            {recipe.user_rating > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-blue-600 font-medium">
                  You: {recipe.user_rating}★
                </span>
              </div>
            )}
          </div>
          
          <Button 
            size="sm" 
            onClick={onViewDetails}
            variant="primary"
          >
            View Recipe
          </Button>
        </div>
      </div>
    </div>
  );
}