import { createContext, useContext, useState, ReactNode } from 'react';
import { Recipe, RecipeFilters, Page } from '../types';
import { useAuth } from './AuthContext';

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
  toggleFavorite: (recipeId: string | number, setTo?: boolean) => void;
  setFavoritesFromArray: (ids: string[]) => void;
  user: any | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchIngredients, setSearchIngredients] = useState<string[]>([]);
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [searchResults, setSearchResults] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  // Pull authenticated user from AuthContext so components can check login state
  const { user } = useAuth();

  const toggleFavorite = (recipeId: string | number, setTo?: boolean) => {
    const id = String(recipeId);
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      const shouldSet = typeof setTo === 'boolean' ? setTo : !newFavorites.has(id);
      if (shouldSet) {
        newFavorites.add(id);
      } else {
        newFavorites.delete(id);
      }
      return newFavorites;
    });
  };

  const setFavoritesFromArray = (ids: string[]) => {
    setFavorites(new Set(ids));
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
  setFavoritesFromArray,
        user,
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
