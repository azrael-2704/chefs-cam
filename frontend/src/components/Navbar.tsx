import { ChefHat, Home, Search, Heart, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ProfileDropdown } from './ProfileDropdown';
import { Page } from '../types';

export function Navbar() {
  const { currentPage, setCurrentPage } = useApp();
  const { user } = useAuth();

  const navItems: { page: Page; icon: typeof Home; label: string }[] = [
    { page: 'home', icon: Home, label: 'Home' },
    { page: 'input', icon: Search, label: 'Find Recipes' },
    { page: 'favorites', icon: Heart, label: 'Favorites' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 group"
          >
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 rounded-xl group-hover:scale-110 transition-transform">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Chef's Cam
            </span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map(({ page, icon: Icon, label }) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-amber-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}

            {user ? (
              <ProfileDropdown />
            ) : (
              <button
                onClick={() => setCurrentPage('login')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <LogIn className="w-5 h-5" />
                <span className="font-medium">Sign In</span>
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {navItems.map(({ page, icon: Icon }) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`p-2 rounded-full transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : 'text-gray-700 hover:bg-amber-50'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}

            {user ? (
              <ProfileDropdown />
            ) : (
              <button
                onClick={() => setCurrentPage('login')}
                className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              >
                <LogIn className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
