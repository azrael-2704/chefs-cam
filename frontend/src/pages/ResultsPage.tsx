// src/pages/ResultsPage.tsx
import { RecipeCard } from '../components/RecipeCard';
import { FilterPanel } from '../components/FilterPanel';
import { useApp } from '../context/AppContext';
import { ChefHat } from 'lucide-react';
import { Recipe } from '../types';

export function ResultsPage() {
  const { searchResults, setCurrentPage, setSelectedRecipe, filters } = useApp();

  const filteredRecipes = searchResults.filter((recipe) => {
    if (filters.dietary && filters.dietary.length > 0) {
      const hasMatchingDietary = filters.dietary.some((pref) =>
        recipe.dietary_tags.includes(pref)
      );
      if (!hasMatchingDietary) return false;
    }

    if (filters.difficulty && recipe.difficulty !== filters.difficulty) {
      return false;
    }

    if (filters.cookingTime) {
      const time = recipe.cooking_time;
      if (filters.cookingTime === 'Quick' && time >= 30) return false;
      if (filters.cookingTime === 'Moderate' && (time < 30 || time > 60)) return false;
      if (filters.cookingTime === 'Long' && time <= 60) return false;
    }

    if (filters.cuisine && recipe.cuisine !== filters.cuisine) {
      return false;
    }

    return true;
  });

  const handleViewDetails = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setCurrentPage('details');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg mb-4">
            <ChefHat className="w-6 h-6 text-amber-500" />
            <span className="font-semibold text-gray-700">
              {filteredRecipes.length} {filteredRecipes.length === 1 ? 'Recipe' : 'Recipes'} Found
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Your Recipe Matches
          </h1>
          <p className="text-xl text-gray-600">
            Handpicked recipes based on your ingredients
          </p>
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl shadow-xl p-12 max-w-md mx-auto">
              <ChefHat className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No Recipes Found
              </h2>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or adding different ingredients
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onViewDetails={() => handleViewDetails(recipe)}
              />
            ))}
          </div>
        )}
      </div>

      <FilterPanel />
    </div>
  );
}