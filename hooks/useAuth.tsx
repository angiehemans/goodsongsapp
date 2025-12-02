'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiClient, User, AccountType } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  isFan: boolean;
  isBand: boolean;
  accountType: AccountType | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = apiClient.getAuthToken();
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await apiClient.getProfile();
      setUser(userData);
    } catch (error) {
      apiClient.removeAuthToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    apiClient.setAuthToken(response.auth_token);
    await fetchUser();
  };

  const signup = async (email: string, password: string, passwordConfirmation: string) => {
    const response = await apiClient.signup({
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    apiClient.setAuthToken(response.auth_token);
    await fetchUser();
  };

  const logout = () => {
    apiClient.removeAuthToken();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const isOnboardingComplete = user?.onboarding_completed ?? false;
  const accountType = user?.account_type ?? null;
  const isFan = accountType === 'fan';
  const isBand = accountType === 'band';

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isOnboardingComplete,
      isFan,
      isBand,
      accountType,
      login,
      signup,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
