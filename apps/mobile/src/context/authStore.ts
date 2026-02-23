import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Role, Plan, normalizeRole } from '@goodsongs/api-client';
import { apiClient } from '@/utils/api';
import { unregisterFromPushNotifications } from '@/utils/pushNotifications';

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  // New RBAC fields
  role: Role | null;
  plan: Plan | null;
  abilities: string[];
  can: (ability: string) => boolean;
  /** @deprecated Use `role` instead */
  accountType: Role | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  loadAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AUTH_TOKEN_KEY = '@goodsongs_auth_token';
const REFRESH_TOKEN_KEY = '@goodsongs_refresh_token';

export const useAuthStore = create<AuthState>((set, get) => {
  // Set up token refresh callback to persist new tokens
  apiClient.setTokenRefreshCallback(async (newToken: string, refreshToken: string | null) => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
    set({ token: newToken });
  });

  // Set up session expired callback to log out
  apiClient.setSessionExpiredCallback(() => {
    get().logout();
  });

  return {
    user: null,
    token: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
    isOnboardingComplete: false,
    role: null,
    plan: null,
    abilities: [],
    can: (ability: string) => get().abilities.includes(ability),
    accountType: null,

    login: async (email: string, password: string) => {
      const response = await apiClient.login({ email, password });
      const token = response.auth_token;
      const refreshToken = response.refresh_token;

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      apiClient.setToken(token);

      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        apiClient.setRefreshToken(refreshToken);
      }

      const user = await apiClient.getProfile();
      // Normalize role: prefer user.role, fall back to user.account_type
      const role = normalizeRole(user.role ?? user.account_type);

      set({
        token,
        refreshToken: refreshToken || null,
        user,
        isAuthenticated: true,
        isOnboardingComplete: user.onboarding_completed ?? false,
        role,
        plan: user.plan ?? null,
        abilities: user.abilities ?? [],
        accountType: role, // Backwards compatibility
      });
    },

    signup: async (email: string, password: string, confirmPassword: string) => {
      const response = await apiClient.signup({
        email,
        password,
        password_confirmation: confirmPassword,
      });
      const token = response.auth_token;
      const refreshToken = response.refresh_token;

      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      apiClient.setToken(token);

      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        apiClient.setRefreshToken(refreshToken);
      }

      const user = await apiClient.getProfile();
      // Normalize role: prefer user.role, fall back to user.account_type
      const role = normalizeRole(user.role ?? user.account_type);

      set({
        token,
        refreshToken: refreshToken || null,
        user,
        isAuthenticated: true,
        isOnboardingComplete: user.onboarding_completed ?? false,
        role,
        plan: user.plan ?? null,
        abilities: user.abilities ?? [],
        accountType: role, // Backwards compatibility
      });
    },

    logout: async () => {
      // Unregister push notifications before clearing auth
      try {
        await unregisterFromPushNotifications();
      } catch {
        // Ignore errors - continue with logout
      }

      // Clear state immediately to ensure user is redirected to sign-in
      // This prevents blank dashboards even if network calls fail
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isOnboardingComplete: false,
        role: null,
        plan: null,
        abilities: [],
        accountType: null,
      });

      // Clear stored tokens
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);

      // Try to revoke the refresh token on the server (non-blocking)
      try {
        await apiClient.logout();
      } catch {
        // Ignore server errors - we've already cleared local state
      }
    },

    logoutAllDevices: async () => {
      // Unregister push notifications before clearing auth
      try {
        await unregisterFromPushNotifications();
      } catch {
        // Ignore errors - continue with logout
      }

      // Clear state immediately to ensure user is redirected to sign-in
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isOnboardingComplete: false,
        role: null,
        plan: null,
        abilities: [],
        accountType: null,
      });

      // Clear stored tokens
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);

      // Try to revoke all tokens on the server (non-blocking)
      try {
        await apiClient.logoutAll();
      } catch {
        // Ignore server errors - we've already cleared local state
      }
    },

    loadAuth: async () => {
      try {
        const [[, token], [, refreshToken]] = await AsyncStorage.multiGet([
          AUTH_TOKEN_KEY,
          REFRESH_TOKEN_KEY,
        ]);

        if (token) {
          apiClient.setToken(token);
          if (refreshToken) {
            apiClient.setRefreshToken(refreshToken);
          }

          const user = await apiClient.getProfile();
          // Normalize role: prefer user.role, fall back to user.account_type
          const role = normalizeRole(user.role ?? user.account_type);

          set({
            token,
            refreshToken: refreshToken || null,
            user,
            isAuthenticated: true,
            isOnboardingComplete: user.onboarding_completed ?? false,
            role,
            plan: user.plan ?? null,
            abilities: user.abilities ?? [],
            accountType: role, // Backwards compatibility
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error) {
        // Token invalid or expired - the API client will handle refresh automatically
        // If we get here, even the refresh failed
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        apiClient.clearAllTokens();
        set({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          isOnboardingComplete: false,
          role: null,
          plan: null,
          abilities: [],
          accountType: null,
        });
      }
    },

    refreshUser: async () => {
      const { token } = get();
      if (!token) return;

      try {
        const user = await apiClient.getProfile();
        // Normalize role: prefer user.role, fall back to user.account_type
        const role = normalizeRole(user.role ?? user.account_type);

        set({
          user,
          isOnboardingComplete: user.onboarding_completed ?? false,
          role,
          plan: user.plan ?? null,
          abilities: user.abilities ?? [],
          accountType: role, // Backwards compatibility
        });
      } catch (error) {
        // If refresh fails, log out
        await get().logout();
      }
    },

    setUser: (user: User) => {
      // Normalize role: prefer user.role, fall back to user.account_type
      const role = normalizeRole(user.role ?? user.account_type);
      set({
        user,
        isOnboardingComplete: user.onboarding_completed ?? false,
        role,
        plan: user.plan ?? null,
        abilities: user.abilities ?? [],
        accountType: role, // Backwards compatibility
      });
    },
  };
});
