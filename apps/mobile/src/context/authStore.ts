import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AccountType, normalizeAccountType } from '@goodsongs/api-client';
import { apiClient } from '@/utils/api';

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  accountType: AccountType | null;

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
      const accountType = normalizeAccountType(user.account_type);

      set({
        token,
        refreshToken: refreshToken || null,
        user,
        isAuthenticated: true,
        isOnboardingComplete: user.onboarding_completed ?? false,
        accountType,
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
      const accountType = normalizeAccountType(user.account_type);

      set({
        token,
        refreshToken: refreshToken || null,
        user,
        isAuthenticated: true,
        isOnboardingComplete: user.onboarding_completed ?? false,
        accountType,
      });
    },

    logout: async () => {
      // Revoke the refresh token on the server
      await apiClient.logout();

      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isOnboardingComplete: false,
        accountType: null,
      });
    },

    logoutAllDevices: async () => {
      // Revoke all tokens on the server
      await apiClient.logoutAll();

      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isOnboardingComplete: false,
        accountType: null,
      });
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
          const accountType = normalizeAccountType(user.account_type);

          set({
            token,
            refreshToken: refreshToken || null,
            user,
            isAuthenticated: true,
            isOnboardingComplete: user.onboarding_completed ?? false,
            accountType,
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
        set({ isLoading: false });
      }
    },

    refreshUser: async () => {
      const { token } = get();
      if (!token) return;

      try {
        const user = await apiClient.getProfile();
        const accountType = normalizeAccountType(user.account_type);

        set({
          user,
          isOnboardingComplete: user.onboarding_completed ?? false,
          accountType,
        });
      } catch (error) {
        // If refresh fails, log out
        await get().logout();
      }
    },

    setUser: (user: User) => {
      const accountType = normalizeAccountType(user.account_type);
      set({
        user,
        isOnboardingComplete: user.onboarding_completed ?? false,
        accountType,
      });
    },
  };
});
