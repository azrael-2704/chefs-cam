// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, setAuthToken, getAuthToken } from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // Verify token and get user info
      authAPI.getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          // Token is invalid, clear it
          setAuthToken('');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const response = await authAPI.login(email, password);
    setAuthToken(response.access_token);
    setUser(response.user);
  };

  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    const response = await authAPI.register(email, password, fullName);
    setAuthToken(response.access_token);
    setUser(response.user);
    // Removed the email confirmation alert - user is automatically logged in
  };

  const signOut = async () => {
    setAuthToken('');
    setUser(null);
  };

  const deleteAccount = async () => {
    await authAPI.deleteAccount();
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}