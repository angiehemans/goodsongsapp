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

// Max number of sync attempts before giving up on a scrobble
const MAX_SYNC_RETRIES = 5;

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
      // Remove any scrobbles that have exceeded max retries
      const removedCount = await scrobbleNative.removeScrobblesExceedingRetries(MAX_SYNC_RETRIES);
      if (removedCount > 0) {
        console.log(`Removed ${removedCount} scrobbles that exceeded ${MAX_SYNC_RETRIES} retry attempts`);
      }

      const pending = await scrobbleNative.getRecentPendingScrobbles(1000);
      if (pending.length === 0) return true;

      const syncedIds: string[] = [];
      const failedIds: string[] = [];

      // Get device model for source_device field
      const deviceModel = getDeviceModel();

      // Estimate payload size for a batch of scrobbles
      const estimatePayloadSize = (scrobbles: typeof pending) => {
        return scrobbles.reduce((total, s) => {
          const baseSize = 300; // Approximate size of base fields in JSON
          const artworkSize = s.albumArt?.length || 0;
          const uriSize = s.artworkUri?.length || 0;
          return total + baseSize + artworkSize + uriSize;
        }, 0);
      };

      // Target max ~500KB per request to stay well under HTTP limits
      const MAX_PAYLOAD_BYTES = 500 * 1024;
      const DEFAULT_BATCH_SIZE = 50;
      const MIN_BATCH_SIZE = 5;

      let i = 0;
      while (i < pending.length) {
        // Calculate optimal batch size for this segment
        let batchSize = DEFAULT_BATCH_SIZE;
        const testBatch = pending.slice(i, i + DEFAULT_BATCH_SIZE);
        const estimatedSize = estimatePayloadSize(testBatch);

        if (estimatedSize > MAX_PAYLOAD_BYTES) {
          // Reduce batch size proportionally, with a minimum of MIN_BATCH_SIZE
          batchSize = Math.max(
            MIN_BATCH_SIZE,
            Math.floor(DEFAULT_BATCH_SIZE * (MAX_PAYLOAD_BYTES / estimatedSize))
          );
          console.log(`Large payload detected (~${Math.round(estimatedSize / 1024)}KB), reducing batch size to ${batchSize}`);
        }

        const batch = pending.slice(i, i + batchSize);
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
          const response = await apiClient.submitScrobbles(apiScrobbles);

          if (response.data?.accepted > 0) {
            // Only mark as synced if API actually accepted them
            syncedIds.push(...batch.map((s) => s.id));
            console.log(`Synced ${response.data.accepted} scrobbles (${response.data.rejected} rejected)`);
          } else if (response.data?.rejected > 0) {
            // All were rejected - log but don't retry (likely invalid data)
            console.warn(`All ${response.data.rejected} scrobbles in batch were rejected by API`);
            // Still remove them to prevent infinite retry of bad data
            syncedIds.push(...batch.map((s) => s.id));
          } else {
            // Unexpected response - don't remove, will retry
            console.warn('Unexpected API response:', response);
            failedIds.push(...batch.map((s) => s.id));
          }
        } catch (error) {
          console.warn(`Failed to sync scrobble batch (${batch.length} tracks):`, error);
          // Track failed IDs and increment their retry count
          const batchIds = batch.map((s) => s.id);
          failedIds.push(...batchIds);
          await scrobbleNative.incrementSyncAttempts(batchIds);
        }

        i += batchSize;
      }

      // Only remove successfully synced scrobbles
      if (syncedIds.length > 0) {
        await scrobbleNative.removeSyncedScrobbles(syncedIds);
      }

      if (failedIds.length > 0) {
        console.warn(`${failedIds.length} scrobbles failed to sync and will retry`);
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
