// frontend/src/lib/api.ts

// Use environment variable for API URL with fallbacks
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://chefs-cam.onrender.com';

console.log('API Base URL:', API_BASE_URL); // Debug log

let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

export const getAuthToken = () => {
  if (!authToken) {
    authToken = localStorage.getItem('authToken');
  }
  return authToken;
};

// Initialize authToken from localStorage
authToken = localStorage.getItem('authToken');

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Prepare headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  // Remove Content-Type for FormData requests
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  console.log(`API Request: ${url}`, config); // Debug log

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = 'API request failed';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      return response.text();
    }
  } catch (error) {
    console.error('API Request Error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
};

// Auth API
export const authAPI = {
  register: async (email: string, password: string, fullName?: string) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.access_token) {
      setAuthToken(response.access_token);
    }
    
    return response;
  },

  getCurrentUser: async () => {
    return apiRequest('/auth/me');
  },

  logout: () => {
    setAuthToken('');
  },

  deleteAccount: async () => {
    await apiRequest('/auth/delete', {
      method: 'DELETE',
    });
    setAuthToken('');
  },
};

// Recipes API
export const recipesAPI = {
  search: async (ingredients: string[], dietaryPreferences: string[] = []) => {
    const formData = new FormData();
    ingredients.forEach(ingredient => formData.append('ingredients', ingredient));
    dietaryPreferences.forEach(pref => formData.append('dietary_preferences', pref));

    const response = await fetch(`${API_BASE_URL}/recipes/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Search failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    return data.recipes.map((recipe: any) => ({
      ...recipe,
      id: recipe.id?.toString() || Math.random().toString(),
      matchScore: recipe.match_score || 1.0,
      matchingIngredients: recipe.matching_ingredients || [],
      is_favorited: recipe.is_favorited || false,
      user_rating: recipe.user_rating || 0,
      average_rating: recipe.average_rating || 0,
      rating_count: recipe.rating_count || 0,
    }));
  },

  getAll: async (filters?: {
    dietary?: string;
    difficulty?: string;
    cuisine?: string;
    cookingTime?: string;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.dietary) params.append('dietary', filters.dietary);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.cuisine) params.append('cuisine', filters.cuisine);
    if (filters?.cookingTime) params.append('cooking_time', filters.cookingTime);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const data = await apiRequest(`/recipes?${params.toString()}`);
    
    return data.recipes.map((recipe: any) => ({
      ...recipe,
      id: recipe.id?.toString() || Math.random().toString(),
      is_favorited: recipe.is_favorited || false,
      user_rating: recipe.user_rating || 0,
      average_rating: recipe.average_rating || 0,
      rating_count: recipe.rating_count || 0,
    }));
  },

  getById: async (id: number, servings?: number) => {
    const params = new URLSearchParams();
    if (servings) params.append('servings', servings.toString());

    const recipe = await apiRequest(`/recipes/${id}?${params.toString()}`);
    
    return {
      ...recipe,
      id: recipe.id?.toString() || Math.random().toString(),
      is_favorited: recipe.is_favorited || false,
      user_rating: recipe.user_rating || 0,
      average_rating: recipe.average_rating || 0,
      rating_count: recipe.rating_count || 0,
    };
  },

  toggleFavorite: async (recipeId: number) => {
    const response = await apiRequest(`/recipes/${recipeId}/favorite`, {
      method: 'POST',
    });
    
    return {
      is_favorited: response.is_favorited,
      message: response.message || 'Favorite status updated'
    };
  },

  rate: async (recipeId: number, rating: number) => {
    const recipe = await apiRequest(`/recipes/${recipeId}/rate?rating=${rating}`, {
      method: 'POST',
    });
    
    return {
      ...recipe,
      id: recipe.id?.toString() || Math.random().toString(),
      is_favorited: recipe.is_favorited || false,
      user_rating: recipe.user_rating || 0,
      average_rating: recipe.average_rating || 0,
      rating_count: recipe.rating_count || 0,
    };
  },

  getRecommendations: async (limit: number = 10) => {
    const data = await apiRequest(`/recommendations?limit=${limit}`);
    return data.recipes.map((recipe: any) => ({
      ...recipe,
      id: recipe.id?.toString() || Math.random().toString(),
      is_favorited: recipe.is_favorited || false,
      user_rating: recipe.user_rating || 0,
      average_rating: recipe.average_rating || 0,
      rating_count: recipe.rating_count || 0,
      recommendationScore: recipe.recommendation_score || 0,
      matchingIngredients: recipe.matching_ingredients || [],
    }));
  },

  getPopular: async (limit: number = 10) => {
    const data = await apiRequest(`/popular?limit=${limit}`);
    return data.recipes.map((recipe: any) => ({
      ...recipe,
      id: recipe.id?.toString() || Math.random().toString(),
      is_favorited: recipe.is_favorited || false,
      user_rating: recipe.user_rating || 0,
      average_rating: recipe.average_rating || 0,
      rating_count: recipe.rating_count || 0,
    }));
  },
};

// Favorites API
export const favoritesAPI = {
  get: async () => {
    const data = await apiRequest('/favorites');
    return data.recipes.map((recipe: any) => ({
      ...recipe,
      id: recipe.id?.toString() || Math.random().toString(),
      is_favorited: true,
      user_rating: recipe.user_rating || 0,
      average_rating: recipe.average_rating || 0,
      rating_count: recipe.rating_count || 0,
    }));
  },
};

// Analyze API
export const analyzeAPI = {
  image: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/analyze/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Image analysis failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },
};

// Health check API
export const healthAPI = {
  check: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Utility function to clear authentication
export const clearAuth = (): void => {
  setAuthToken('');
};

export default {
  authAPI,
  recipesAPI,
  favoritesAPI,
  analyzeAPI,
  healthAPI,
  setAuthToken,
  getAuthToken,
  isAuthenticated,
  clearAuth,
};
