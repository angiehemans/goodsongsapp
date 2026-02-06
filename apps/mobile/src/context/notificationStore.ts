import { create } from 'zustand';
import { apiClient } from '@/utils/api';

interface NotificationState {
  unreadCount: number;
  isLoading: boolean;
  fetchUnreadCount: () => Promise<void>;
  clearUnreadCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  isLoading: false,

  fetchUnreadCount: async () => {
    try {
      set({ isLoading: true });
      const response = await apiClient.getUnreadNotificationCount();
      set({ unreadCount: response?.unread_count ?? 0 });
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearUnreadCount: () => {
    set({ unreadCount: 0 });
  },
}));
