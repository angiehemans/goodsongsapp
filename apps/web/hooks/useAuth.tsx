'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { notifications } from '@mantine/notifications';
import { apiClient, User, Role, Plan, normalizeRole } from '@/lib/api';

const CLAIM_TOKEN_KEY = 'pending_comment_claim_token';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  isFan: boolean;
  isBand: boolean;
  isBlogger: boolean;
  /** @deprecated Use `isBlogger` instead */
  isMusicBlogger: boolean;
  isAdmin: boolean;
  role: Role | null;
  plan: Plan | null;
  abilities: string[];
  can: (ability: string) => boolean;
  /** @deprecated Use `role` instead */
  accountType: Role | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Set up session expired callback to clear user state
  useEffect(() => {
    apiClient.setSessionExpiredCallback(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    const token = apiClient.getAuthToken();
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const fetchUser = async () => {
    // Prevent duplicate fetches
    if (isFetching) return;
    setIsFetching(true);
    try {
      const userData = await apiClient.getProfile();
      setUser(userData);
    } catch (error) {
      // Clear all tokens on failure (not just auth_token)
      apiClient.clearAllTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  // Try to claim any pending anonymous comment after auth
  const claimPendingComment = async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(CLAIM_TOKEN_KEY);
    if (!token) return;

    try {
      await apiClient.claimPostComment(token);
      localStorage.removeItem(CLAIM_TOKEN_KEY);
      notifications.show({
        title: 'Comment claimed!',
        message: 'Your anonymous comment has been linked to your account.',
        color: 'green',
      });
    } catch {
      // Silently fail - token may have expired or been used
      localStorage.removeItem(CLAIM_TOKEN_KEY);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    apiClient.setAuthToken(response.auth_token);
    if (response.refresh_token) {
      apiClient.setRefreshToken(response.refresh_token);
    }
    await fetchUser();
    // Try to claim any pending anonymous comment
    await claimPendingComment();
  };

  const signup = async (email: string, password: string, passwordConfirmation: string) => {
    const response = await apiClient.signup({
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
    apiClient.setAuthToken(response.auth_token);
    if (response.refresh_token) {
      apiClient.setRefreshToken(response.refresh_token);
    }
    await fetchUser();
    // Try to claim any pending anonymous comment
    await claimPendingComment();
  };

  const logout = () => {
    apiClient.clearAllTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const isOnboardingComplete = user?.onboarding_completed ?? false;

  // Normalize role: prefer user.role, fall back to user.account_type
  const role = normalizeRole(user?.role ?? user?.account_type);

  // Plan and abilities from user object
  const plan = user?.plan ?? null;
  const abilities = user?.abilities ?? [];

  // Helper to check if user has a specific ability
  const can = (ability: string): boolean => {
    return abilities.includes(ability);
  };

  const isFan = role === 'fan';
  const isBand = role === 'band';
  const isBlogger = role === 'blogger';
  // Alias for backwards compatibility
  const isMusicBlogger = isBlogger;
  // Admin is a separate flag, not a role
  const isAdmin = user?.admin === true;

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isOnboardingComplete,
      isFan,
      isBand,
      isBlogger,
      isMusicBlogger,
      isAdmin,
      role,
      plan,
      abilities,
      can,
      accountType: role, // Backwards compatibility alias
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
