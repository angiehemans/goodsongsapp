import { create } from 'zustand';
import { apiClient, ConnectedAccount } from './api';

interface ConnectedAccountsState {
  accounts: ConnectedAccount[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchAccounts: () => Promise<void>;
  updatePreferences: (
    platform: 'threads' | 'instagram',
    prefs: {
      auto_post_recommendations?: boolean;
      auto_post_band_posts?: boolean;
      auto_post_events?: boolean;
    }
  ) => Promise<void>;
  disconnect: (platform: 'threads' | 'instagram') => Promise<void>;
  invalidate: () => void;
  isConnected: (platform: 'threads' | 'instagram') => boolean;
  getAccount: (platform: 'threads' | 'instagram') => ConnectedAccount | undefined;
  hasAutoPost: (platform: 'threads' | 'instagram', contentType: 'recommendations' | 'band_posts' | 'events') => boolean;
}

export const useConnectedAccounts = create<ConnectedAccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,
  hasFetched: false,

  fetchAccounts: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const accounts = await apiClient.getConnectedAccounts();
      set({ accounts, hasFetched: true });
    } catch {
      set({ accounts: [], hasFetched: true });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePreferences: async (platform, prefs) => {
    const updated = await apiClient.updateConnectedAccountPreferences(platform, prefs);
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.platform === platform ? updated : a
      ),
    }));
  },

  disconnect: async (platform) => {
    await apiClient.disconnectAccount(platform);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.platform !== platform),
    }));
  },

  invalidate: () => set({ hasFetched: false }),

  isConnected: (platform) => get().accounts.some((a) => a.platform === platform),

  getAccount: (platform) => get().accounts.find((a) => a.platform === platform),

  hasAutoPost: (platform, contentType) => {
    const account = get().accounts.find((a) => a.platform === platform);
    if (!account) return false;
    switch (contentType) {
      case 'recommendations': return account.auto_post_recommendations;
      case 'band_posts': return account.auto_post_band_posts;
      case 'events': return account.auto_post_events;
      default: return false;
    }
  },
}));
