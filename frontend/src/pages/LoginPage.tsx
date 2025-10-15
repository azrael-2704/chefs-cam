// src/pages/LoginPage.tsx
import { useState } from 'react';
import { ChefHat, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export function LoginPage() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const { setCurrentPage } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        // Removed email confirmation alert - user is automatically logged in
        setCurrentPage('home');
      } else {
        await signInWithEmail(email, password);
        setCurrentPage('home');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-3 rounded-xl">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Chef's Cam
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {isSignUp ? 'Sign up to save your favorite recipes' : 'Sign in to continue cooking'}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-amber-600 hover:text-amber-700 font-semibold transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          <div className="text-center pt-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage('home')}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}