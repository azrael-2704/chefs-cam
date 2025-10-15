import { createContext, useContext, useState, ReactNode } from 'react';
import { Recipe, RecipeFilters, Page } from '../types';

interface AppContextType {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  searchIngredients: string[];
  setSearchIngredients: (ingredients: string[]) => void;
  filters: RecipeFilters;
  setFilters: (filters: RecipeFilters) => void;
  searchResults: Recipe[];
  setSearchResults: (recipes: Recipe[]) => void;
  favorites: Set<string>;
  toggleFavorite: (recipeId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchIngredients, setSearchIngredients] = useState<string[]>([]);
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (recipeId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(recipeId)) {
        newFavorites.delete(recipeId);
      } else {
        newFavorites.add(recipeId);
      }
      return newFavorites;
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        selectedRecipe,
        setSelectedRecipe,
        searchIngredients,
        setSearchIngredients,
        filters,
        setFilters,
        searchResults,
        setSearchResults,
        favorites,
        toggleFavorite,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
