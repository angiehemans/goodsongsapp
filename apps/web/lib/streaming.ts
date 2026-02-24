// Streaming platform types and constants

/** Supported streaming platforms */
export type StreamingPlatform =
  | 'spotify' | 'appleMusic' | 'youtubeMusic' | 'tidal'
  | 'amazonMusic' | 'deezer' | 'soundcloud' | 'bandcamp';

/** Streaming links object from backend */
export interface StreamingLinks {
  spotify?: string;
  appleMusic?: string;
  youtubeMusic?: string;
  tidal?: string;
  amazonMusic?: string;
  deezer?: string;
  soundcloud?: string;
  bandcamp?: string;
}

/** Platform display info */
export const STREAMING_PLATFORMS: Record<StreamingPlatform, { name: string; color: string }> = {
  spotify: { name: 'Spotify', color: '#1DB954' },
  appleMusic: { name: 'Apple Music', color: '#FA243C' },
  youtubeMusic: { name: 'YouTube Music', color: '#FF0000' },
  tidal: { name: 'Tidal', color: '#000000' },
  amazonMusic: { name: 'Amazon Music', color: '#FF9900' },
  deezer: { name: 'Deezer', color: '#FEAA2D' },
  soundcloud: { name: 'SoundCloud', color: '#FF5500' },
  bandcamp: { name: 'Bandcamp', color: '#1DA0C3' },
};
