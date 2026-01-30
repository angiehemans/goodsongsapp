import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { AppScrobbleSetting, NowPlayingTrack, PendingScrobbleLocal } from '@/types/scrobble';

const isAndroid = Platform.OS === 'android';

const ScrobbleNative = isAndroid ? NativeModules.ScrobbleModule : null;

const emitter = isAndroid && ScrobbleNative
  ? new NativeEventEmitter(ScrobbleNative)
  : null;

export const scrobbleNative = {
  async isPermissionGranted(): Promise<boolean> {
    if (!ScrobbleNative) return false;
    return ScrobbleNative.isPermissionGranted();
  },

  async openPermissionSettings(): Promise<boolean> {
    if (!ScrobbleNative) return false;
    return ScrobbleNative.openPermissionSettings();
  },

  async isScrobblingEnabled(): Promise<boolean> {
    if (!ScrobbleNative) return false;
    return ScrobbleNative.isScrobblingEnabled();
  },

  async setScrobblingEnabled(enabled: boolean): Promise<boolean> {
    if (!ScrobbleNative) return false;
    return ScrobbleNative.setScrobblingEnabled(enabled);
  },

  async getAppSettings(): Promise<AppScrobbleSetting[]> {
    if (!ScrobbleNative) return [];
    return ScrobbleNative.getAppSettings();
  },

  async setAppEnabled(packageName: string, enabled: boolean): Promise<boolean> {
    if (!ScrobbleNative) return false;
    return ScrobbleNative.setAppEnabled(packageName, enabled);
  },

  async getPendingCount(): Promise<number> {
    if (!ScrobbleNative) return 0;
    return ScrobbleNative.getPendingCount();
  },

  async getLastScrobbleTime(): Promise<number> {
    if (!ScrobbleNative) return 0;
    return ScrobbleNative.getLastScrobbleTime();
  },

  async removeSyncedScrobbles(ids: string[]): Promise<boolean> {
    if (!ScrobbleNative) return false;
    return ScrobbleNative.removeSyncedScrobbles(ids);
  },

  async getCurrentTrack(): Promise<NowPlayingTrack | null> {
    if (!ScrobbleNative) return null;
    return ScrobbleNative.getCurrentTrack();
  },

  async getRecentPendingScrobbles(limit: number = 20): Promise<PendingScrobbleLocal[]> {
    if (!ScrobbleNative) return [];
    return ScrobbleNative.getRecentPendingScrobbles(limit);
  },

  onScrobble(callback: (event: { pendingCount: number; lastScrobbleTime: number }) => void) {
    if (!emitter) return { remove: () => {} };
    const subscription = emitter.addListener('onScrobble', callback);
    return subscription;
  },

  onNowPlaying(callback: (event: NowPlayingTrack | Record<string, never>) => void) {
    if (!emitter) return { remove: () => {} };
    const subscription = emitter.addListener('onNowPlaying', callback);
    return subscription;
  },
};
