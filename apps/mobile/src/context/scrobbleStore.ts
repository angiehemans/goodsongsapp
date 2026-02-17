import { create } from 'zustand';
import { Platform, NativeModules } from 'react-native';
import { scrobbleNative } from '@/utils/scrobbleNative';
import { apiClient } from '@/utils/api';
import { ScrobbleStatus } from '@/types/scrobble';
import type { AppScrobbleSetting, ScrobbleApiResponse, NowPlayingTrack, PendingScrobbleLocal } from '@/types/scrobble';
import { useAuthStore } from './authStore';

// Get device model from platform constants
const getDeviceModel = (): string | undefined => {
  if (Platform.OS === 'android') {
    const { PlatformConstants } = NativeModules;
    return PlatformConstants?.Model || PlatformConstants?.Brand || 'Android Device';
  }
  return undefined;
};

interface ScrobbleStoreState {
  status: ScrobbleStatus;
  appSettings: AppScrobbleSetting[];
  pendingCount: number;
  lastScrobbleTime: number | null;
  syncing: boolean;
  nowPlaying: NowPlayingTrack | null;
  recentScrobbles: ScrobbleApiResponse[];
  recentScrobblesLoading: boolean;
  localScrobbles: PendingScrobbleLocal[];

  checkPermission: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  toggleScrobbling: () => Promise<void>;
  toggleApp: (packageName: string, enabled: boolean) => Promise<void>;
  syncNow: () => Promise<boolean>;
  refreshPendingCount: () => Promise<void>;
  setNowPlaying: (track: NowPlayingTrack | null) => void;
  fetchRecentScrobbles: () => Promise<void>;
  fetchLocalScrobbles: () => Promise<void>;
  autoSync: () => Promise<void>;
}

let autoSyncTimer: ReturnType<typeof setTimeout> | null = null;

export const useScrobbleStore = create<ScrobbleStoreState>((set, get) => ({
  status: ScrobbleStatus.notSetUp,
  appSettings: [],
  pendingCount: 0,
  lastScrobbleTime: null,
  syncing: false,
  nowPlaying: null,
  recentScrobbles: [],
  recentScrobblesLoading: false,
  localScrobbles: [],

  checkPermission: async () => {
    return scrobbleNative.isPermissionGranted();
  },

  refreshStatus: async () => {
    if (Platform.OS !== 'android') return;

    const hasPermission = await scrobbleNative.isPermissionGranted();

    if (!hasPermission) {
      const wasEnabled = await scrobbleNative.isScrobblingEnabled();
      set({
        status: wasEnabled
          ? ScrobbleStatus.permissionNeeded
          : ScrobbleStatus.notSetUp,
      });
      return;
    }

    const enabled = await scrobbleNative.isScrobblingEnabled();
    const appSettings = await scrobbleNative.getAppSettings();
    const pendingCount = await scrobbleNative.getPendingCount();
    const lastTime = await scrobbleNative.getLastScrobbleTime();

    set({
      status: enabled ? ScrobbleStatus.active : ScrobbleStatus.paused,
      appSettings,
      pendingCount,
      lastScrobbleTime: lastTime > 0 ? lastTime : null,
    });

    // Also fetch current track and local scrobbles on status refresh
    const currentTrack = await scrobbleNative.getCurrentTrack();
    set({ nowPlaying: currentTrack });

    // Fetch local pending scrobbles so they show in the feed immediately
    if (enabled) {
      await get().fetchLocalScrobbles();
    }
  },

  toggleScrobbling: async () => {
    const current = await scrobbleNative.isScrobblingEnabled();
    await scrobbleNative.setScrobblingEnabled(!current);
    await get().refreshStatus();
  },

  toggleApp: async (packageName: string, enabled: boolean) => {
    await scrobbleNative.setAppEnabled(packageName, enabled);
    const appSettings = await scrobbleNative.getAppSettings();
    set({ appSettings });
  },

  syncNow: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return false;

    set({ syncing: true });
    try {
      const pending = await scrobbleNative.getRecentPendingScrobbles(1000);
      if (pending.length === 0) return true;

      const BATCH_SIZE = 50;
      const syncedIds: string[] = [];

      // Get device model for source_device field
      const deviceModel = getDeviceModel();

      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        const batch = pending.slice(i, i + BATCH_SIZE);
        const apiScrobbles = batch.map((s) => ({
          track_name: s.trackName,
          artist_name: s.artistName,
          album_name: s.albumName || undefined,
          duration_ms: Math.max(s.durationMs || 30000, 30000),
          source_app: s.sourceApp,
          played_at: new Date(s.playedAt).toISOString(),
          // Extended metadata
          source_device: deviceModel,
          album_artist: s.albumArtist || undefined,
          genre: s.genre || undefined,
          year: s.year && s.year > 0 ? s.year : undefined,
          release_date: s.releaseDate || undefined,
          artwork_uri: s.artworkUri || undefined,
          album_art: s.albumArt || undefined,
        }));

        try {
          await apiClient.submitScrobbles(apiScrobbles);
          syncedIds.push(...batch.map((s) => s.id));
        } catch (error) {
          console.warn('Failed to sync scrobble batch:', error);
        }
      }

      if (syncedIds.length > 0) {
        await scrobbleNative.removeSyncedScrobbles(syncedIds);
      }

      await get().refreshPendingCount();
      await get().fetchRecentScrobbles();
      return syncedIds.length > 0;
    } catch (error) {
      console.warn('Scrobble sync failed:', error);
      return false;
    } finally {
      set({ syncing: false });
    }
  },

  refreshPendingCount: async () => {
    const pendingCount = await scrobbleNative.getPendingCount();
    const lastTime = await scrobbleNative.getLastScrobbleTime();
    set({
      pendingCount,
      lastScrobbleTime: lastTime > 0 ? lastTime : null,
    });
  },

  setNowPlaying: (track: NowPlayingTrack | null) => {
    set({ nowPlaying: track });
  },

  fetchRecentScrobbles: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ recentScrobblesLoading: true });
    try {
      const response = await apiClient.getScrobbles(undefined, 20);
      set({ recentScrobbles: response.data?.scrobbles || [] });
    } catch (error) {
      console.warn('Failed to fetch scrobbles from API:', error);
      // API scrobbles unavailable — local scrobbles will be shown instead
    } finally {
      set({ recentScrobblesLoading: false });
    }
  },

  fetchLocalScrobbles: async () => {
    try {
      const local = await scrobbleNative.getRecentPendingScrobbles(20);
      set({ localScrobbles: local });
    } catch (error) {
      console.warn('Failed to fetch local scrobbles:', error);
    }
  },

  autoSync: async () => {
    // Debounce: wait 5 seconds after last scrobble event before syncing
    if (autoSyncTimer) clearTimeout(autoSyncTimer);
    autoSyncTimer = setTimeout(async () => {
      const { syncing, status } = get();
      if (syncing || status !== ScrobbleStatus.active) return;
      await get().syncNow();
    }, 5000);
  },
}));
