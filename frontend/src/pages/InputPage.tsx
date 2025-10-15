// frontend/src/pages/InputPage.tsx
import { useState } from 'react';
import { Camera, Plus, X, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { recipesAPI, analyzeAPI } from '../lib/api';

export function InputPage() {
  const { setCurrentPage, setSearchIngredients, filters, setFilters, setSearchResults } = useApp();
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Dairy-Free'];

  const addIngredient = () => {
    if (currentInput.trim() && !ingredients.includes(currentInput.trim())) {
      setIngredients([...ingredients, currentInput.trim()]);
      setCurrentInput('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  const toggleDietaryPreference = (preference: string) => {
    const current = filters.dietary || [];
    const updated = current.includes(preference)
      ? current.filter(p => p !== preference)
      : [...current, preference];
    setFilters({ ...filters, dietary: updated });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageLoading(true);
      try {
        const result = await analyzeAPI.image(file);
        // Add detected ingredients to the list
        const newIngredients = result.ingredients.filter(
          (ing: string) => !ingredients.includes(ing.toLowerCase())
        );
        setIngredients([...ingredients, ...newIngredients]);
        alert(`AI detected: ${newIngredients.join(', ')}`);
      } catch (error) {
        console.error('Image analysis failed:', error);
        alert('Image analysis failed. Please type your ingredients manually.');
      } finally {
        setImageLoading(false);
        // Reset the file input
        e.target.value = '';
      }
    }
  };

  const generateRecipes = async () => {
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setSearchIngredients(ingredients);

    try {
      // Use actual API call instead of mock data
      const response = await recipesAPI.search(ingredients, filters.dietary || []);
      setSearchResults(response);
      setCurrentPage('results');
    } catch (error) {
      console.error('Failed to generate recipes:', error);
      alert('Failed to generate recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            What's In Your Kitchen?
          </h1>
          <p className="text-xl text-gray-600">
            Add your ingredients and discover amazing recipes
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 space-y-8">
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Add Ingredients
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Tomatoes, Pasta, Cheese..."
                className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all outline-none text-lg"
              />
              <Button onClick={addIngredient} className="px-6">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {ingredients.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {ingredients.map((ingredient) => (
                  <span
                    key={ingredient}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full font-medium"
                  >
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="hover:bg-green-200 rounded-full p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Upload Photo
            </label>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {imageLoading ? (
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-3"></div>
                ) : (
                  <Camera className="w-12 h-12 text-gray-400 group-hover:text-green-500 transition-colors mb-3" />
                )}
                <p className="text-lg font-semibold text-gray-700 group-hover:text-green-600 transition-colors">
                  {imageLoading ? 'Analyzing Image...' : 'Click to capture or upload'}
                </p>
                <p className="text-sm text-gray-500">AI will recognize your ingredients</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                disabled={imageLoading}
              />
            </label>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              Dietary Preferences
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dietaryOptions.map((option) => {
                const isSelected = filters.dietary?.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleDietaryPreference(option)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            size="lg"
            onClick={generateRecipes}
            disabled={loading || imageLoading}
            className="w-full text-xl py-5 shadow-xl flex items-center justify-center"
          >
            <Sparkles className="w-6 h-6 mr-2" />
            {loading ? 'Finding Recipes...' : 'Generate Recipes'}
          </Button>
        </div>
      </div>
    </div>
  );
}