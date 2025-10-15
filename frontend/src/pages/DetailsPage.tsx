// frontend/src/pages/DetailsPage.tsx
import { useState, useEffect } from 'react';
import { Clock, Users, Flame, Heart, Star, ArrowLeft, ChefHat, Utensils } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { recipesAPI } from '../lib/api';

export function DetailsPage() {
  const { selectedRecipe, setCurrentPage, favorites, toggleFavorite, user } = useApp();
  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps' | 'nutrition'>('ingredients');
  const [servings, setServings] = useState(selectedRecipe?.servings || 4);
  const [userRating, setUserRating] = useState(selectedRecipe?.user_rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState(selectedRecipe);

  // Update local state when selectedRecipe changes
  useEffect(() => {
    if (selectedRecipe) {
      setCurrentRecipe(selectedRecipe);
      setUserRating(selectedRecipe.user_rating || 0);
      setServings(selectedRecipe.servings || 4);
    }
  }, [selectedRecipe]);

  if (!currentRecipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Recipe Selected</h2>
          <Button onClick={() => setCurrentPage('input')}>
            Find Recipes
          </Button>
        </div>
      </div>
    );
  }

  const isFavorited = favorites.has(currentRecipe.id) || currentRecipe.is_favorited;

  const handleFavoriteClick = async () => {
    if (!user) {
      alert('Please log in to save favorites');
      return;
    }

    setIsFavoriting(true);
    try {
      const response = await recipesAPI.toggleFavorite(parseInt(currentRecipe.id));
      toggleFavorite(currentRecipe.id);
      
      // Update local recipe state
      setCurrentRecipe({
        ...currentRecipe,
        is_favorited: response.is_favorited
      });
      
      console.log(`Recipe ${currentRecipe.id} ${response.is_favorited ? 'favorited' : 'unfavorited'}`);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite');
    } finally {
      setIsFavoriting(false);
    }
  };

  const handleRateRecipe = async (rating: number) => {
    if (!user) {
      alert('Please log in to rate recipes');
      return;
    }

    if (isRating) return;
    
    setIsRating(true);
    try {
      const updatedRecipe = await recipesAPI.rate(parseInt(currentRecipe.id), rating);
      
      // Update local state with the updated recipe
      setCurrentRecipe(updatedRecipe);
      setUserRating(rating);
      
      console.log(`Rated recipe ${currentRecipe.id} with ${rating} stars`);
    } catch (err) {
      console.error('Error rating recipe:', err);
      alert('Failed to rate recipe');
    } finally {
      setIsRating(false);
    }
  };

  const handleServingsChange = async (newServings: number) => {
    if (newServings < 1) return;
    
    setServings(newServings);
    
    // If servings change significantly, reload recipe with adjusted servings
    if (Math.abs(newServings - currentRecipe.servings) > 2) {
      try {
        const adjustedRecipe = await recipesAPI.getById(parseInt(currentRecipe.id), newServings);
        setCurrentRecipe(adjustedRecipe);
      } catch (err) {
        console.error('Error loading adjusted recipe:', err);
        // Fallback to local calculation
      }
    }
  };

  const servingMultiplier = servings / (currentRecipe.original_servings || currentRecipe.servings);

  const difficultyColors = {
    Easy: 'text-green-600 bg-green-50',
    Medium: 'text-amber-600 bg-amber-50',
    Hard: 'text-red-600 bg-red-50',
  };

  const nutritionInfo = [
    { 
      label: 'Calories', 
      value: Math.round(currentRecipe.calories * servingMultiplier), 
      unit: 'kcal',
      icon: Flame,
      color: 'from-orange-100 to-red-100'
    },
    { 
      label: 'Protein', 
      value: Math.round(currentRecipe.protein * servingMultiplier), 
      unit: 'g',
      icon: Utensils,
      color: 'from-blue-100 to-cyan-100'
    },
    { 
      label: 'Carbs', 
      value: Math.round(currentRecipe.carbs * servingMultiplier), 
      unit: 'g',
      icon: ChefHat,
      color: 'from-green-100 to-emerald-100'
    },
    { 
      label: 'Fat', 
      value: Math.round(currentRecipe.fat * servingMultiplier), 
      unit: 'g',
      icon: Flame,
      color: 'from-amber-100 to-orange-100'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={currentRecipe.image_url || "https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg"}
          alt={currentRecipe.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => setCurrentPage('results')}
          className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isFavoriting}
          className={`absolute top-6 right-6 p-3 rounded-full shadow-lg transition-all ${
            isFavorited
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-red-500'
          } ${isFavoriting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Recipe Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${difficultyColors[currentRecipe.difficulty]}`}>
                {currentRecipe.difficulty}
              </span>
              <span className="px-4 py-2 rounded-full text-sm font-semibold bg-white/90 backdrop-blur-sm text-gray-900">
                {currentRecipe.cuisine}
              </span>
              {currentRecipe.dietary_tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-green-500/90 backdrop-blur-sm text-white"
                >
                  {tag}
                </span>
              ))}
              {currentRecipe.dietary_tags && currentRecipe.dietary_tags.length > 3 && (
                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-green-500/90 backdrop-blur-sm text-white">
                  +{currentRecipe.dietary_tags.length - 3} more
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {currentRecipe.title}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl">
              {currentRecipe.description}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="inline-flex p-4 bg-amber-100 rounded-2xl mb-3">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{currentRecipe.cooking_time}</div>
              <div className="text-sm text-gray-600">Minutes</div>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 bg-green-100 rounded-2xl mb-3">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {currentRecipe.adjusted_servings || currentRecipe.servings}
                {currentRecipe.adjusted_servings && (
                  <span className="text-sm text-gray-400 ml-1">
                    (orig. {currentRecipe.original_servings})
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">Servings</div>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 bg-orange-100 rounded-2xl mb-3">
                <Flame className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{currentRecipe.calories}</div>
              <div className="text-sm text-gray-600">Calories</div>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 bg-amber-100 rounded-2xl mb-3">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {currentRecipe.average_rating?.toFixed(1) || 'New'}
              </div>
              <div className="text-sm text-gray-600">
                ({currentRecipe.rating_count || 0} ratings)
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              {(['ingredients', 'steps', 'nutrition'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-4 text-lg font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'ingredients' && (
              <div>
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    Adjust Servings
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleServingsChange(Math.max(1, servings - 1))}
                      className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full font-bold text-xl transition-colors"
                    >
                      -
                    </button>
                    <span className="text-3xl font-bold text-gray-900 min-w-[60px] text-center">
                      {servings}
                    </span>
                    <button
                      onClick={() => handleServingsChange(servings + 1)}
                      className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full font-bold text-xl transition-colors"
                    >
                      +
                    </button>
                    <span className="text-gray-600 ml-2">servings</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentRecipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl hover:shadow-md transition-shadow"
                    >
                      <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                      <span className="text-lg text-gray-900">
                        <span className="font-semibold">
                          {ingredient.amount} {ingredient.unit}
                        </span>{' '}
                        {ingredient.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'steps' && (
              <div className="space-y-6">
                {currentRecipe.instructions.map((step, index) => (
                  <div key={index} className="flex gap-6 group">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-lg text-gray-900 leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  {nutritionInfo.map((info) => (
                    <div
                      key={info.label}
                      className={`bg-gradient-to-br ${info.color} rounded-2xl p-6 text-center hover:shadow-lg transition-shadow`}
                    >
                      <div className="inline-flex p-3 rounded-2xl bg-white/50 mb-3">
                        <info.icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {info.value}
                        <span className="text-lg text-gray-600 ml-1">{info.unit}</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-600">{info.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
                  <p className="text-gray-700 text-center">
                    Nutritional values are per serving based on {servings} servings
                    {currentRecipe.adjusted_servings && (
                      <span className="block text-sm text-gray-600 mt-1">
                        Originally {currentRecipe.original_servings} servings
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Rate This Recipe
          </h2>
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRateRecipe(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={isRating || !user}
                className={`transform transition-transform ${
                  isRating ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'
                } ${!user ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredRating || userRating)
                      ? 'text-amber-500 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          {!user ? (
            <p className="text-center text-gray-600 mb-4">
              Please log in to rate this recipe
            </p>
          ) : userRating > 0 ? (
            <div className="text-center">
              <p className="text-gray-600 mb-2">
                You rated this recipe {userRating} star{userRating !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-500">
                Average rating: {currentRecipe.average_rating?.toFixed(1) || '0.0'} 
                ({currentRecipe.rating_count || 0} ratings)
              </p>
            </div>
          ) : (
            <p className="text-center text-gray-600">
              Click on a star to rate this recipe
            </p>
          )}
          
          {isRating && (
            <p className="text-center text-amber-600 mt-2">Updating rating...</p>
          )}
        </div>
      </div>
    </div>
  );
}