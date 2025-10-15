import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './Button';

export function FilterPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { filters, setFilters } = useApp();

  const cookingTimes = [
    { value: 'Quick', label: 'Quick', range: '< 30 min' },
    { value: 'Moderate', label: 'Moderate', range: '30-60 min' },
    { value: 'Long', label: 'Long', range: '> 60 min' },
  ];

  const difficulties = ['Easy', 'Medium', 'Hard'];

  const cuisines = [
    'Italian',
    'Chinese',
    'Indian',
    'Mexican',
    'Thai',
    'Japanese',
    'Mediterranean',
    'American',
    'French',
  ];

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 shadow-2xl"
      >
        <SlidersHorizontal className="w-5 h-5 mr-2" />
        Filters
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Cooking Time
                </h3>
                <div className="space-y-2">
                  {cookingTimes.map((time) => (
                    <button
                      key={time.value}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          cookingTime: filters.cookingTime === time.value ? undefined : time.value as any,
                        })
                      }
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        filters.cookingTime === time.value
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-medium">{time.label}</div>
                      <div className="text-sm opacity-80">{time.range}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Difficulty
                </h3>
                <div className="space-y-2">
                  {difficulties.map((difficulty) => (
                    <button
                      key={difficulty}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          difficulty: filters.difficulty === difficulty ? undefined : difficulty as any,
                        })
                      }
                      className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                        filters.difficulty === difficulty
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {difficulty}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Cuisine
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {cuisines.map((cuisine) => (
                    <button
                      key={cuisine}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          cuisine: filters.cuisine === cuisine ? undefined : cuisine,
                        })
                      }
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        filters.cuisine === cuisine
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
