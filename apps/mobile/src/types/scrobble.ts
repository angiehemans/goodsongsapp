export interface NowPlayingTrack {
  trackName: string;
  artistName: string;
  albumName: string;
  sourceApp: string;
  artworkUri?: string;
  albumArt?: string; // base64 encoded
}

export interface ScrobbleTrack {
  track_name: string;
  artist_name: string;
  album_name?: string;
  duration_ms?: number;
  source_app: string;
  played_at: string; // ISO 8601
  // Extended metadata
  source_device?: string;
  album_artist?: string;
  genre?: string;
  year?: number;
  release_date?: string;
  artwork_uri?: string;
  album_art?: string; // base64 encoded
}

export interface AppScrobbleSetting {
  packageName: string;
  displayName: string;
  enabled: boolean;
}

export enum ScrobbleStatus {
  notSetUp = 'notSetUp',
  permissionNeeded = 'permissionNeeded',
  active = 'active',
  paused = 'paused',
}

export interface ScrobbleState {
  status: ScrobbleStatus;
  appSettings: AppScrobbleSetting[];
  pendingCount: number;
  lastScrobbleTime: number | null;
}

export interface ScrobbleApiResponse {
  id: number;
  track_name: string;
  artist_name: string;
  album_name?: string;
  played_at: string;
  source_app: string;
  metadata_status?: string;
  track?: {
    id: number;
    name: string;
    duration_ms?: number;
    artist?: { id: number; name: string; image_url?: string };
    album?: { id: number; name: string; cover_art_url?: string };
  } | null;
}

export interface ScrobbleListResponse {
  data: {
    scrobbles: ScrobbleApiResponse[];
    pagination: {
      next_cursor?: string;
      has_more: boolean;
    };
  };
}

export interface SubmitScrobblesResponse {
  data: {
    accepted: number;
    rejected: number;
    scrobbles: ScrobbleApiResponse[];
  };
}

export interface PendingScrobbleLocal {
  id: string;
  trackName: string;
  artistName: string;
  albumName: string;
  durationMs: number;
  sourceApp: string;
  playedAt: number;
  syncAttempts: number;
  // Extended metadata
  albumArtist?: string;
  genre?: string;
  year?: number;
  releaseDate?: string;
  artworkUri?: string;
  albumArt?: string;
}
