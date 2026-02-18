import { AppState, AppStateStatus } from 'react-native';
import { create } from 'zustand';
import { apiClient } from '@/utils/api';

interface NotificationState {
  unreadCount: number;
  isLoading: boolean;
  isInitialized: boolean;
  fetchUnreadCount: () => Promise<void>;
  setInitialCount: (count: number) => void;
  clearUnreadCount: () => void;
  refreshCount: () => Promise<void>;
  startPolling: (intervalMs?: number) => () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  isLoading: false,
  isInitialized: false,

  fetchUnreadCount: async () => {
    // Skip if already initialized from dashboard
    if (get().isInitialized) return;

    try {
      set({ isLoading: true });
      const response = await apiClient.getUnreadNotificationCount();
      set({ unreadCount: response?.unread_count ?? 0, isInitialized: true });
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  // Set initial count from dashboard data (avoids extra API call)
  setInitialCount: (count: number) => {
    set({ unreadCount: count, isInitialized: true });
  },

  clearUnreadCount: () => {
    set({ unreadCount: 0 });
  },

  // Always fetches count from API (used for polling)
  refreshCount: async () => {
    try {
      const response = await apiClient.getUnreadNotificationCount();
      set({ unreadCount: response?.unread_count ?? 0 });
    } catch (error) {
      // Silently fail during polling
    }
  },

  // Start polling with AppState awareness (only polls when app is active)
  startPolling: (intervalMs = 60000) => {
    let interval: NodeJS.Timeout | null = null;

    const startInterval = () => {
      if (interval) return; // Already running
      interval = setInterval(() => {
        if (get().isInitialized) {
          get().refreshCount();
        }
      }, intervalMs);
    };

    const stopInterval = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        // Refresh immediately when app comes to foreground
        if (get().isInitialized) {
          get().refreshCount();
        }
        startInterval();
      } else {
        stopInterval();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);

    // Start polling if app is already active
    if (AppState.currentState === 'active') {
      startInterval();
    }

    // Return cleanup function
    return () => {
      subscription.remove();
      stopInterval();
    };
  },
}));
