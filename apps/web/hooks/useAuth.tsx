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
  /** Band with a paid (non-free) plan */
  isPaidBand: boolean;
  /** Eligible for /user/pro/ routes (blogger or paid band) */
  isProUser: boolean;
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
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Set up session expired callback to clear user state and redirect to login
  useEffect(() => {
    apiClient.setSessionExpiredCallback(() => {
      setUser(null);
      window.location.href = '/login';
    });
  }, []);

  useEffect(() => {
    const token = apiClient.getAuthToken();
    if (token) {
      fetchUser();
    } else if (apiClient.getRefreshToken()) {
      // No access token but refresh token exists — try to bootstrap session
      apiClient.refreshSession().then((ok) => {
        if (ok) {
          fetchUser();
        } else {
          setIsLoading(false);
        }
      });
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
      // Only clear user state here — don't clear tokens.
      // If the error was a 401, makeRequest already attempted a token refresh.
      // If refresh succeeded, the retry worked and we won't reach this catch.
      // If refresh failed, onSessionExpired already cleared tokens and redirects to login.
      // Clearing tokens here would destroy a valid refresh token on transient errors.
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
    const authToken = response.auth_token || response.access_token;
    if (authToken) {
      apiClient.setAuthToken(authToken);
    }
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
    const authToken = response.auth_token || response.access_token;
    if (authToken) {
      apiClient.setAuthToken(authToken);
    }
    if (response.refresh_token) {
      apiClient.setRefreshToken(response.refresh_token);
    }
    await fetchUser();
    // Try to claim any pending anonymous comment
    await claimPendingComment();
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignore errors — tokens are cleared inside apiClient.logout()
    }
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
  // Band with a paid (non-free) plan
  const isPaidBand = isBand && !!user?.plan?.key && user.plan.key !== 'band_free';
  // Eligible for /user/pro/ routes (blogger or paid band)
  const isProUser = isBlogger || isPaidBand;
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
      isPaidBand,
      isProUser,
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
