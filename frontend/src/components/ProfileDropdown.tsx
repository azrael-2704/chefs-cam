import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export function ProfileDropdown() {
  const { user, signOut, deleteAccount } = useAuth();
  const { setCurrentPage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setCurrentPage('home');
      setIsOpen(false);
    } catch (error) {
      alert('Failed to sign out');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        )}
        <span className="hidden md:block font-medium text-gray-700 max-w-[150px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Sign Out</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left border-t border-gray-100"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-600">Delete Account</span>
          </button>
        </div>
      )}
    </div>
  );
}
