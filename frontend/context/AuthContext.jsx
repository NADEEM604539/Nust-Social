'use client';

/**
 * AuthContext - Global Authentication State Management
 * 
 * Features:
 * - Access to current user data
 * - Token refresh logic
 * - Login/logout state
 * - Automatic token refresh on 401 errors
 * - Session persistence across page reloads
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAccessToken, 
  setTokens, 
  clearTokens, 
  getUserId, 
  getUserEmail,
  isAuthenticated 
} from '@/utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const userId = getUserId();
    const email = getUserEmail();
    const hasToken = isAuthenticated();

    if (hasToken && userId) {
      setUser({ id: userId, email });
      setIsAuth(true);
    } else {
      setUser(null);
      setIsAuth(false);
    }

    setIsLoading(false);
  }, []);

  // Login function
  const login = (accessToken, refreshToken, userId, email) => {
    setTokens(accessToken, refreshToken, userId, email);
    setUser({ id: userId, email });
    setIsAuth(true);
  };

  // Logout function
  const logout = () => {
    clearTokens();
    setUser(null);
    setIsAuth(false);
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    isAuth,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
