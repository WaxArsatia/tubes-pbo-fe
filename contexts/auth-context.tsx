'use client';

/**
 * Auth Context
 * Global authentication state management using Context API
 */

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import type { User } from '@/lib/types/auth.types';
import {
  clearAuth,
  getAuthToken,
  getUserData,
  isAuthenticated as checkIsAuthenticated,
  setAuthToken,
  setUserData,
  updateUserData as updateUserStorage,
} from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const storedToken = getAuthToken();
      const storedUser = getUserData();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login function - store token and user data
  const login = useCallback((newToken: string, newUser: User) => {
    setAuthToken(newToken);
    setUserData(newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  // Logout function - clear all auth data
  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  // Update user data function
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...updates };
      updateUserStorage(updates);
      return updatedUser;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: checkIsAuthenticated(),
      isLoading,
      login,
      logout,
      updateUser,
    }),
    [user, token, isLoading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
