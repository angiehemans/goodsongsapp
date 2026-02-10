import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AccountType, normalizeAccountType } from '@goodsongs/api-client';
import { apiClient } from '@/utils/api';

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  accountType: AccountType | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AUTH_TOKEN_KEY = '@goodsongs_auth_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  isOnboardingComplete: false,
  accountType: null,

  login: async (email: string, password: string) => {
    const response = await apiClient.login({ email, password });
    const token = response.auth_token;

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    apiClient.setToken(token);

    const user = await apiClient.getProfile();
    const accountType = normalizeAccountType(user.account_type);

    set({
      token,
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

    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    apiClient.setToken(token);

    const user = await apiClient.getProfile();
    const accountType = normalizeAccountType(user.account_type);

    set({
      token,
      user,
      isAuthenticated: true,
      isOnboardingComplete: user.onboarding_completed ?? false,
      accountType,
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    apiClient.clearToken();

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isOnboardingComplete: false,
      accountType: null,
    });
  },

  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      if (token) {
        apiClient.setToken(token);
        const user = await apiClient.getProfile();
        const accountType = normalizeAccountType(user.account_type);

        set({
          token,
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
      // Token invalid or expired
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      apiClient.clearToken();
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
}));
