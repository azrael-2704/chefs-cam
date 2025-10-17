import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { RecipeCard } from '../components/RecipeCard';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { Recipe } from '../types';
import { favoritesAPI } from '../lib/api';

export function FavoritesPage() {
  const { setCurrentPage, setSelectedRecipe, setFavoritesFromArray } = useApp();
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        const recipes = await favoritesAPI.get();
        setFavoriteRecipes(recipes);
        setError(null);
        // ensure AppContext favorites set reflects server
        if (recipes && recipes.length) {
          setFavoritesFromArray(recipes.map((r: any) => String(r.id)));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleViewDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentPage('details');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg mb-4">
            <Heart className="w-6 h-6 text-red-500 fill-current" />
            <span className="font-semibold text-gray-700">
              {favoriteRecipes.length} Favorite{favoriteRecipes.length !== 1 ? 's' : ''}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Your Favorites
          </h1>
          <p className="text-xl text-gray-600">
            Recipes you love, all in one place
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-20">Loading...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : favoriteRecipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto">
              <Heart className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No Favorites Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start exploring recipes and save your favorites to see them here
              </p>
              <Button onClick={() => setCurrentPage('input')}>
                Find Recipes
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {favoriteRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onViewDetails={() => handleViewDetails(recipe)}
              />
            ))}
          </div>
        )}

        <div className="mt-16 bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-3xl shadow-2xl p-12 text-center">
          <Heart className="w-16 h-16 text-white mx-auto mb-6 fill-current" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Love What You're Cooking?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Keep exploring new recipes and build your personal cookbook
          </p>
          <Button
            variant="outline"
            onClick={() => setCurrentPage('input')}
            className="bg-white text-pink-600 border-white hover:bg-pink-50"
          >
            Discover More Recipes
          </Button>
        </div>
      </div>
    </div>
  );
}