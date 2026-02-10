// Shared types for the GoodSongs API
// These types are used by both web and mobile apps

export type AccountType = 'fan' | 'band' | 'admin';

export interface User {
  id: number;
  email: string;
  username?: string;
  about_me?: string;
  city?: string;
  region?: string;
  location?: string;
  profile_image_url?: string;
  reviews_count?: number;
  bands_count?: number;
  lastfm_connected?: boolean;
  lastfm_username?: string | null;
  account_type?: AccountType | number;
  onboarding_completed?: boolean;
  primary_band?: Band;
  admin?: boolean;
  disabled?: boolean;
  display_name?: string;
  followers_count?: number;
  following_count?: number;
}

export interface ProfileUpdateData {
  about_me?: string;
  profile_image?: File;
  city?: string;
  region?: string;
}

export interface AuthResponse {
  auth_token: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ReviewData {
  song_link: string;
  band_name: string;
  song_name: string;
  artwork_url: string;
  review_text: string;
  liked_aspects: (string | { name: string })[];
  band_lastfm_artist_name?: string;
  band_musicbrainz_id?: string;
}

export interface Review extends ReviewData {
  id: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    username: string;
  };
  author?: {
    id: number;
    username: string;
    profile_image_url?: string;
  };
  band?: {
    id: number;
    slug: string;
    name: string;
  };
  liked_by_current_user?: boolean;
  likes_count?: number;
  comments_count?: number;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  about_me?: string;
  city?: string;
  region?: string;
  location?: string;
  profile_image_url?: string;
  reviews?: Review[];
  reviews_count?: number;
  reviews_pagination?: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
  bands?: Band[];
  is_following?: boolean;
  following?: boolean;
  followers_count?: number;
  following_count?: number;
}

export interface FollowUser {
  id: number;
  username: string;
  profile_image_url?: string;
  about_me?: string;
  city?: string;
  region?: string;
}

export interface FollowingFeedItem {
  id: number;
  song_name: string;
  band_name: string;
  artwork_url?: string;
  song_link?: string;
  review_text: string;
  liked_aspects?: (string | { name: string })[];
  created_at: string;
  author: {
    id: number;
    username: string;
    profile_image_url?: string;
  };
  band?: {
    id: number;
    slug: string;
    name: string;
  };
}

export interface FollowingFeedResponse {
  reviews: FollowingFeedItem[];
  meta: PaginationMeta;
}

export interface NotificationActor {
  id: number;
  username: string;
  profile_image_url?: string;
}

export interface Notification {
  id: number;
  notification_type?: 'new_follower' | 'new_review';
  type?: 'new_follower' | 'new_review';
  message: string;
  read: boolean;
  created_at: string;
  actor: NotificationActor;
  song_name?: string;
  band_name?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  meta: PaginationMeta;
}

export interface BandData {
  name: string;
  slug?: string;
  location?: string;
  city?: string;
  region?: string;
  about?: string;
  spotify_link?: string;
  bandcamp_link?: string;
  bandcamp_embed?: string;
  apple_music_link?: string;
  youtube_music_link?: string;
  profile_picture?: File;
}

export interface Band {
  id: number;
  slug: string;
  name: string;
  location?: string;
  city?: string;
  region?: string;
  about?: string;
  spotify_link?: string;
  bandcamp_link?: string;
  bandcamp_embed?: string;
  apple_music_link?: string;
  youtube_music_link?: string;
  profile_picture_url?: string;
  spotify_image_url?: string;
  reviews_count: number;
  user_owned: boolean;
  disabled?: boolean;
  genres?: string[];
  owner?: {
    id: number;
    username: string;
  } | null;
  reviews?: Review[];
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface VenueData {
  name: string;
  address: string;
  city: string;
  region: string;
}

export interface EventBand {
  id: number;
  slug: string;
  name: string;
  location?: string;
  profile_picture_url?: string;
  spotify_image_url?: string;
  reviews_count: number;
  user_owned: boolean;
}

export interface Event {
  id: number;
  name: string;
  description?: string;
  event_date: string;
  ticket_link?: string;
  image_url?: string;
  price?: string;
  age_restriction?: string;
  venue: Venue;
  band: EventBand;
  created_at: string;
  updated_at: string;
}

export interface EventData {
  name: string;
  description?: string;
  event_date: string;
  ticket_link?: string;
  price?: string;
  age_restriction?: string;
  venue_id?: number;
  venue_attributes?: {
    name: string;
    address: string;
    city: string;
    region: string;
  };
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

export interface LastFmArtist {
  name: string;
  mbid?: string;
  lastfm_url?: string;
}

export interface LastFmAlbumImage {
  url: string;
  size: 'small' | 'medium' | 'large' | 'extralarge';
}

export interface LastFmTrack {
  name: string;
  mbid?: string;
  artists: LastFmArtist[];
  album: {
    name: string;
    mbid?: string;
    images: LastFmAlbumImage[];
  };
  lastfm_url: string;
}

export interface RecentlyPlayedTrack {
  id?: number | string;
  scrobble_id?: number | string;
  name: string;
  artist: string;
  album: string;
  played_at: string | null;
  now_playing: boolean;
  source: 'lastfm' | 'scrobble';
  album_art_url: string | null;
  loved: boolean;
  metadata_status?: 'pending' | 'enriched' | 'not_found' | 'failed';
  can_refresh_artwork?: boolean;
}

export interface RecentlyPlayedResponse {
  tracks: RecentlyPlayedTrack[];
  sources: ('lastfm' | 'scrobble')[];
}

export interface LastFmStatus {
  connected: boolean;
  username: string | null;
  profile?: {
    name: string;
    realname?: string;
    url: string;
    playcount?: string;
    image?: string;
  };
}

export interface LastFmSearchArtist {
  name: string;
  mbid?: string;
  url: string;
  image?: string;
}

export interface OnboardingStatus {
  onboarding_completed: boolean;
  account_type?: AccountType;
}

export interface SetAccountTypeData {
  account_type: AccountType;
}

export interface SetAccountTypeResponse {
  message: string;
  account_type: AccountType;
  next_step: string;
}

export interface CompleteFanProfileData {
  username: string;
  about_me?: string;
  profile_image?: File;
  city?: string;
  region?: string;
}

export interface CompleteBandProfileData {
  name: string;
  about?: string;
  location?: string;
  city?: string;
  region?: string;
  spotify_link?: string;
  bandcamp_link?: string;
  apple_music_link?: string;
  youtube_music_link?: string;
  profile_picture?: File;
}
