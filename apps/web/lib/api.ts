
export type AccountType = 'fan' | 'band' | 'admin';

// Helper to normalize account_type from API (can be number or string)
export function normalizeAccountType(accountType: AccountType | number | undefined | null): AccountType | null {
  if (accountType === 'fan' || accountType === 0) return 'fan';
  if (accountType === 'band' || accountType === 1) return 'band';
  if (accountType === 'admin' || accountType === 2) return 'admin';
  return null;
}

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
  account_type?: AccountType | number;  // API returns 0 for fan, 1 for band
  onboarding_completed?: boolean;
  primary_band?: Band;
  admin?: boolean;  // Separate admin flag
  disabled?: boolean;  // Whether the account is disabled
  display_name?: string;
  followers_count?: number;
  following_count?: number;
  email_confirmed?: boolean;
  can_resend_confirmation?: boolean;
}

export interface ResendConfirmationResponse {
  message: string;
  can_resend_confirmation: boolean;
  retry_after?: number;
}

export interface ProfileUpdateData {
  about_me?: string;
  profile_image?: File;
  city?: string;
  region?: string;
}

export interface AuthResponse {
  auth_token: string;
  refresh_token?: string;
  message?: string;
}

export interface RefreshTokenResponse {
  auth_token: string;
}

export interface Session {
  id: number;
  device_info: string;
  ip_address: string;
  last_used_at: string;
  created_at: string;
  current: boolean;
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
  likes_count?: number;
  liked_by_current_user?: boolean;
  comments_count?: number;
}

export interface ReviewComment {
  id: number;
  body: string;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    username: string;
    display_name?: string;
    profile_image_url?: string;
  };
}

export interface ReviewCommentsResponse {
  comments: ReviewComment[];
  pagination: {
    current_page: number;
    per_page: number;
    total_count: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export interface LikeResponse {
  message: string;
  liked: boolean;
  likes_count: number;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  about_me?: string;
  city?: string;
  region?: string;
  location?: string;  // Combined "City, Region" from API
  profile_image_url?: string;
  reviews?: Review[];
  reviews_count?: number;
  bands?: Band[];
  is_following?: boolean;  // Whether the current user follows this user
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
  likes_count?: number;
  liked_by_current_user?: boolean;
  comments_count?: number;
}

export interface FollowingFeedResponse {
  reviews: FollowingFeedItem[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

export interface NotificationActor {
  id: number;
  username: string;
  profile_image_url?: string;
}

export interface Notification {
  id: number;
  notification_type?: 'new_follower' | 'new_review' | 'review_like' | 'review_comment';
  type?: 'new_follower' | 'new_review' | 'review_like' | 'review_comment';  // Alternative field name from API
  message: string;
  read: boolean;
  created_at: string;
  actor: NotificationActor;
  // For new_review notifications
  song_name?: string;
  band_name?: string;
  // For review_like and review_comment notifications
  review?: {
    id: number;
    song_name: string;
    band_name: string;
  };
  // For review_comment notifications
  comment?: {
    id: number;
    body: string;
  };
}

export interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
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
  musicbrainz_id?: string;
  reviews_count: number;
  user_owned: boolean;
  disabled?: boolean;
  owner?: {
    id: number;
    username: string;
  } | null;
  reviews?: Review[];
  created_at: string;
  updated_at: string;
}

// Venue types
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

// Event types
export interface EventBand {
  id: number;
  slug: string;
  name: string;
  location?: string;
  profile_picture_url?: string;
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

export interface DiscoverPagination {
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
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
  name: string;
  artist: string;
  album: string;
  played_at: string | null;
  now_playing: boolean;
  source: 'lastfm' | 'scrobble';
  album_art_url: string | null;
  loved: boolean;
  id?: number | string;  // Scrobble ID (only present for scrobble source)
  scrobble_id?: number | string;  // Alternative field name
  metadata_status?: 'pending' | 'enriched' | 'not_found' | 'failed';
  can_refresh_artwork?: boolean;
}

export interface RefreshArtworkResponse {
  status: 'success' | 'already_has_artwork' | 'not_found' | 'no_track';
  message: string;
  artwork_url?: string;
  scrobble?: {
    id: number;
    track?: {
      id: number;
      name: string;
      album?: {
        id: number;
        name: string;
        cover_art_url?: string;
      };
    };
  };
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

// Admin types
export interface AdminUserUpdateData {
  email?: string;
  username?: string;
  about_me?: string;
  city?: string;
  region?: string;
  admin?: boolean;
  disabled?: boolean;
  account_type?: 'fan' | 'band';
  lastfm_username?: string;
  onboarding_completed?: boolean;
  profile_image?: File;
}

export interface AdminBandUpdateData {
  name?: string;
  slug?: string;
  about?: string;
  city?: string;
  region?: string;
  disabled?: boolean;
  user_id?: number;
  spotify_link?: string;
  bandcamp_link?: string;
  bandcamp_embed?: string;
  apple_music_link?: string;
  youtube_music_link?: string;
  musicbrainz_id?: string;
  lastfm_artist_name?: string;
  artist_image_url?: string;
  profile_picture?: File;
}

export interface AdminUserDetail extends User {
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUserDetailResponse {
  user: AdminUserDetail;
  reviews: Review[];
  bands: Band[];
}

export interface AdminBandDetail extends Band {
  latitude?: number;
  longitude?: number;
  artist_image_url?: string;
  lastfm_artist_name?: string;
  lastfm_url?: string;
  musicbrainz_id?: string;
  events_count?: number;
  owner?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface AdminBandDetailResponse {
  band: AdminBandDetail;
  reviews: Review[];
  events: Event[];
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

export interface DiscogsSearchResult {
  song_name: string;
  band_name: string;
  album_title: string;
  release_year?: number;
  artwork_url?: string;
  discogs_url?: string;
  genre?: string;
  style?: string;
}

export interface DiscogsSearchResponse {
  results: DiscogsSearchResult[];
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
  query: {
    track?: string;
    artist?: string;
    q?: string;
  };
}

export interface DiscogsTrack {
  position: string;
  title: string;
  duration?: string;
}

export interface DiscogsMasterResponse {
  id: number;
  title: string;
  artist: string;
  year?: number;
  genres?: string[];
  styles?: string[];
  artwork_url?: string;
  discogs_url?: string;
  tracklist: DiscogsTrack[];
}

// Keep old types for backward compatibility during transition
export interface MusicBrainzSearchResult {
  mbid: string;
  song_name: string;
  band_name: string;
  band_musicbrainz_id?: string;
  release_mbid?: string;
  release_name?: string;
  release_date?: string;
  duration_ms?: number;
  score?: number;
  artwork_url?: string;
}

export interface MusicBrainzSearchResponse {
  results: MusicBrainzSearchResult[];
  query: {
    track: string;
    artist?: string;
  };
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  private getApiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  }

  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.getApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid - clear tokens and throw
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json();
    localStorage.setItem('auth_token', data.auth_token);
    return data.auth_token;
  }

  private async handleTokenRefresh(): Promise<string> {
    // If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshAccessToken();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<T> {
    const response = await fetch(`${this.getApiUrl()}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // Check for token expiration and attempt refresh
      if (response.status === 401 && error.error?.code === 'token_expired' && !isRetry) {
        try {
          await this.handleTokenRefresh();
          // Retry the original request with new token
          return this.makeRequest<T>(endpoint, options, true);
        } catch (refreshError) {
          // Refresh failed - throw the original error
          throw new Error('Session expired. Please log in again.');
        }
      }

      // Handle nested error structure: { error: { code, message } }
      const message = error.error?.message || error.error || error.errors || 'Request failed';
      throw new Error(message);
    }

    return response.json();
  }

  private async makeFormRequest<T = any>(
    endpoint: string,
    formData: FormData,
    isRetry = false
  ): Promise<T> {
    const response = await fetch(`${this.getApiUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader(),
        // Don't set Content-Type for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // Check for token expiration and attempt refresh
      if (response.status === 401 && error.error?.code === 'token_expired' && !isRetry) {
        try {
          await this.handleTokenRefresh();
          // Retry the original request with new token
          return this.makeFormRequest<T>(endpoint, formData, true);
        } catch (refreshError) {
          throw new Error('Session expired. Please log in again.');
        }
      }

      // Handle nested error structure: { error: { code, message } }
      let message = 'Request failed';
      if (error.error?.message) {
        message = error.error.message;
      } else if (typeof error.error === 'string') {
        message = error.error;
      } else if (error.errors) {
        // Handle Rails-style validation errors: { errors: { username: ["has already been taken"] } }
        if (typeof error.errors === 'object' && !Array.isArray(error.errors)) {
          const firstKey = Object.keys(error.errors)[0];
          if (firstKey && Array.isArray(error.errors[firstKey])) {
            message = `${firstKey} ${error.errors[firstKey][0]}`;
          } else {
            message = JSON.stringify(error.errors);
          }
        } else {
          message = typeof error.errors === 'string' ? error.errors : JSON.stringify(error.errors);
        }
      } else if (error.message) {
        message = error.message;
      }
      throw new Error(message);
    }

    return response.json();
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    return this.makeRequest('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Override auth header for signup
      body: JSON.stringify(data),
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.makeRequest('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Override auth header for login
      body: JSON.stringify(credentials),
    });
  }

  async getProfile(): Promise<User> {
    return this.makeRequest('/profile');
  }

  async resendConfirmationEmail(): Promise<ResendConfirmationResponse> {
    return this.makeRequest('/email/resend-confirmation', {
      method: 'POST',
    });
  }

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    return this.makeRequest('/onboarding/status');
  }

  async setAccountType(data: SetAccountTypeData): Promise<SetAccountTypeResponse> {
    return this.makeRequest('/onboarding/account-type', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeFanProfile(data: CompleteFanProfileData): Promise<User> {
    const formData = new FormData();
    formData.append('username', data.username);
    if (data.about_me) {
      formData.append('about_me', data.about_me);
    }
    if (data.profile_image) {
      formData.append('profile_image', data.profile_image);
    }
    if (data.city) {
      formData.append('city', data.city);
    }
    if (data.region) {
      formData.append('region', data.region);
    }
    return this.makeFormRequest('/onboarding/complete-fan-profile', formData);
  }

  async completeBandProfile(data: CompleteBandProfileData): Promise<User> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.about) {
      formData.append('about', data.about);
    }
    if (data.location) {
      formData.append('location', data.location);
    }
    if (data.city) {
      formData.append('city', data.city);
    }
    if (data.region) {
      formData.append('region', data.region);
    }
    if (data.spotify_link) {
      formData.append('spotify_link', data.spotify_link);
    }
    if (data.bandcamp_link) {
      formData.append('bandcamp_link', data.bandcamp_link);
    }
    if (data.apple_music_link) {
      formData.append('apple_music_link', data.apple_music_link);
    }
    if (data.youtube_music_link) {
      formData.append('youtube_music_link', data.youtube_music_link);
    }
    if (data.profile_picture) {
      formData.append('profile_picture', data.profile_picture);
    }
    return this.makeFormRequest('/onboarding/complete-band-profile', formData);
  }

  setAuthToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  setRefreshToken(token: string) {
    localStorage.setItem('refresh_token', token);
  }

  removeAuthToken() {
    localStorage.removeItem('auth_token');
  }

  removeRefreshToken() {
    localStorage.removeItem('refresh_token');
  }

  clearAllTokens() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Auth endpoints
  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await this.makeRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Ignore errors during logout - we're clearing tokens anyway
      }
    }
    this.clearAllTokens();
  }

  async logoutAll(): Promise<{ message: string }> {
    const result = await this.makeRequest<{ message: string }>('/auth/logout-all', {
      method: 'POST',
    });
    this.clearAllTokens();
    return result;
  }

  async getSessions(): Promise<Session[]> {
    return this.makeRequest('/auth/sessions');
  }

  async revokeSession(sessionId: number): Promise<{ message: string }> {
    return this.makeRequest(`/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  async createReview(data: ReviewData): Promise<any> {
    return this.makeRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({ review: data }),
    });
  }

  async getReview(reviewId: number): Promise<Review> {
    return this.makeRequest(`/reviews/${reviewId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async likeReview(reviewId: number): Promise<LikeResponse> {
    return this.makeRequest(`/reviews/${reviewId}/like`, {
      method: 'POST',
    });
  }

  async unlikeReview(reviewId: number): Promise<LikeResponse> {
    return this.makeRequest(`/reviews/${reviewId}/like`, {
      method: 'DELETE',
    });
  }

  // Review Comments
  async getReviewComments(reviewId: number, page: number = 1): Promise<ReviewCommentsResponse> {
    return this.makeRequest(`/reviews/${reviewId}/comments?page=${page}`);
  }

  async createReviewComment(reviewId: number, body: string): Promise<ReviewComment> {
    return this.makeRequest(`/reviews/${reviewId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment: { body } }),
    });
  }

  async updateReviewComment(reviewId: number, commentId: number, body: string): Promise<ReviewComment> {
    return this.makeRequest(`/reviews/${reviewId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ comment: { body } }),
    });
  }

  async deleteReviewComment(reviewId: number, commentId: number): Promise<{ message: string }> {
    return this.makeRequest(`/reviews/${reviewId}/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  async getUserProfile(username: string): Promise<UserProfile> {
    // Include auth header when available to get liked_by_current_user in reviews
    return this.makeRequest(`/users/${username}`);
  }

  async getUserProfilePaginated(
    username: string,
    page: number = 1,
    perPage: number = 20
  ): Promise<UserProfile & {
    reviews_pagination?: {
      current_page: number;
      per_page: number;
      total_count: number;
      total_pages: number;
      has_next_page: boolean;
      has_previous_page: boolean;
    };
  }> {
    return this.makeRequest(`/users/${username}?page=${page}&per_page=${perPage}`);
  }

  async createBand(data: BandData): Promise<Band> {
    // Check if we need to use FormData for file upload
    const hasFile = data.profile_picture instanceof File;
    
    if (hasFile) {
      const formData = new FormData();
      formData.append('band[name]', data.name);
      if (data.slug) {
        formData.append('band[slug]', data.slug);
      }
      if (data.location) {
        formData.append('band[location]', data.location);
      }
      if (data.city) {
        formData.append('band[city]', data.city);
      }
      if (data.region) {
        formData.append('band[region]', data.region);
      }
      if (data.about) {
        formData.append('band[about]', data.about);
      }
      if (data.spotify_link) {
        formData.append('band[spotify_link]', data.spotify_link);
      }
      if (data.bandcamp_link) {
        formData.append('band[bandcamp_link]', data.bandcamp_link);
      }
      if (data.bandcamp_embed) {
        formData.append('band[bandcamp_embed]', data.bandcamp_embed);
      }
      if (data.apple_music_link) {
        formData.append('band[apple_music_link]', data.apple_music_link);
      }
      if (data.youtube_music_link) {
        formData.append('band[youtube_music_link]', data.youtube_music_link);
      }
      if (data.profile_picture) {
        formData.append('band[profile_picture]', data.profile_picture);
      }

      const response = await fetch(`${this.getApiUrl()}/bands`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeader(),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create band');
      }

      return response.json();
    }
    
    // Use JSON for non-file uploads
    const response = await fetch(`${this.getApiUrl()}/bands`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ band: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create band');
    }

    return response.json();
  }

  async getBand(slug: string): Promise<Band> {
    const response = await fetch(`${this.getApiUrl()}/bands/${slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch band');
    }

    return response.json();
  }

  async updateBand(slug: string, data: BandData): Promise<Band> {
    const hasFile = data.profile_picture instanceof File;

    if (hasFile) {
      const formData = new FormData();
      formData.append('_method', 'PATCH');
      formData.append('band[name]', data.name);
      if (data.slug) {
        formData.append('band[slug]', data.slug);
      }
      if (data.location) {
        formData.append('band[location]', data.location);
      }
      if (data.city) {
        formData.append('band[city]', data.city);
      }
      if (data.region) {
        formData.append('band[region]', data.region);
      }
      if (data.about) {
        formData.append('band[about]', data.about);
      }
      if (data.spotify_link) {
        formData.append('band[spotify_link]', data.spotify_link);
      }
      if (data.bandcamp_link) {
        formData.append('band[bandcamp_link]', data.bandcamp_link);
      }
      if (data.bandcamp_embed) {
        formData.append('band[bandcamp_embed]', data.bandcamp_embed);
      }
      if (data.apple_music_link) {
        formData.append('band[apple_music_link]', data.apple_music_link);
      }
      if (data.youtube_music_link) {
        formData.append('band[youtube_music_link]', data.youtube_music_link);
      }
      if (data.profile_picture) {
        formData.append('band[profile_picture]', data.profile_picture);
      }

      const response = await fetch(`${this.getApiUrl()}/bands/${slug}`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeader(),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update band');
      }

      return response.json();
    }

    const response = await fetch(`${this.getApiUrl()}/bands/${slug}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ band: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update band');
    }

    return response.json();
  }

  async getUserBands(): Promise<Band[]> {
    const response = await fetch(`${this.getApiUrl()}/bands/user`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user bands');
    }

    return response.json();
  }

  async getUserReviews(): Promise<Review[]> {
    const response = await fetch(`${this.getApiUrl()}/reviews/user`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      let errorMessage = 'Failed to fetch user reviews';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch {
        // Response wasn't JSON
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async connectLastFm(username: string): Promise<{ message: string; username: string; profile: LastFmStatus['profile'] }> {
    return this.makeRequest('/lastfm/connect', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async getLastFmStatus(): Promise<LastFmStatus> {
    return this.makeRequest('/lastfm/status');
  }

  async disconnectLastFm(): Promise<void> {
    await this.makeRequest('/lastfm/disconnect', { method: 'DELETE' });
  }

  async getRecentlyPlayed(options?: { limit?: number; sources?: ('lastfm' | 'scrobble')[] }): Promise<RecentlyPlayedResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.sources?.length) params.append('sources', options.sources.join(','));
    const queryString = params.toString();
    return this.makeRequest(`/recently-played${queryString ? `?${queryString}` : ''}`);
  }

  async refreshScrobbleArtwork(scrobbleId: number | string, force?: boolean): Promise<RefreshArtworkResponse> {
    const params = force ? '?force=true' : '';
    return this.makeRequest(`/api/v1/scrobbles/${scrobbleId}/refresh_artwork${params}`, {
      method: 'POST',
    });
  }

  async searchLastFmArtists(query: string, limit?: number): Promise<{ artists: LastFmSearchArtist[] }> {
    const params = new URLSearchParams({ query });
    if (limit) params.append('limit', limit.toString());
    return this.makeRequest(`/lastfm/search-artist?${params.toString()}`);
  }

  async updateProfile(data: ProfileUpdateData | FormData): Promise<User> {
    // Use POST with _method parameter to simulate PATCH (Rails method override)
    const formData = new FormData();
    
    // Add Rails method override to make POST act like PATCH
    formData.append('_method', 'PATCH');
    
    if (data instanceof FormData) {
      // If already FormData, extract the values and add them to our new FormData
      const entries = Array.from(data.entries());
      for (const [key, value] of entries) {
        if (key !== '_method') { // Don't duplicate _method if it exists
          formData.append(key, value);
        }
      }
    } else {
      // Add profile data - only append if values exist
      if (data.about_me) {
        formData.append('about_me', data.about_me);
      }
      if (data.profile_image) {
        formData.append('profile_image', data.profile_image);
      }
      if (data.city) {
        formData.append('city', data.city);
      }
      if (data.region) {
        formData.append('region', data.region);
      }
    }

    return this.makeFormRequest('/update-profile', formData);
  }

  // Public discover endpoints (no auth required)
  async discoverUsers(page: number = 1, query?: string): Promise<{
    users: UserProfile[];
    pagination: DiscoverPagination;
    query?: string;
  }> {
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.append('q', query);
    return this.makeRequest(`/discover/users?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async discoverBands(page: number = 1, query?: string): Promise<{
    bands: Band[];
    pagination: DiscoverPagination;
    query?: string;
  }> {
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.append('q', query);
    return this.makeRequest(`/discover/bands?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async discoverReviews(page: number = 1, query?: string): Promise<{
    reviews: Review[];
    pagination: DiscoverPagination;
    query?: string;
  }> {
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.append('q', query);
    return this.makeRequest(`/discover/reviews?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admin endpoints
  async getAllUsers(page: number = 1, perPage: number = 20, query?: string): Promise<{
    users: User[];
    pagination: DiscoverPagination;
    query?: string;
  }> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (query) params.append('q', query);
    return this.makeRequest(`/admin/users?${params.toString()}`);
  }

  async getAdminUserDetail(userId: number): Promise<AdminUserDetailResponse> {
    return this.makeRequest(`/admin/users/${userId}`);
  }

  async updateAdminUser(userId: number, data: AdminUserUpdateData): Promise<{ message: string; user: AdminUserDetail }> {
    const hasFile = data.profile_image instanceof File;

    if (hasFile) {
      const formData = new FormData();
      if (data.email !== undefined) formData.append('email', data.email);
      if (data.username !== undefined) formData.append('username', data.username);
      if (data.about_me !== undefined) formData.append('about_me', data.about_me);
      if (data.city !== undefined) formData.append('city', data.city);
      if (data.region !== undefined) formData.append('region', data.region);
      if (data.admin !== undefined) formData.append('admin', String(data.admin));
      if (data.disabled !== undefined) formData.append('disabled', String(data.disabled));
      if (data.account_type !== undefined) formData.append('account_type', data.account_type);
      if (data.lastfm_username !== undefined) formData.append('lastfm_username', data.lastfm_username);
      if (data.onboarding_completed !== undefined) formData.append('onboarding_completed', String(data.onboarding_completed));
      if (data.profile_image) formData.append('profile_image', data.profile_image);

      const response = await fetch(`${this.getApiUrl()}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeader(),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.errors?.join(', ') || 'Failed to update user');
      }

      return response.json();
    }

    return this.makeRequest(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async toggleUserDisabled(userId: number): Promise<User> {
    return this.makeRequest(`/admin/users/${userId}/toggle-disabled`, {
      method: 'PATCH',
    });
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    return this.makeRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getAdminBands(
    page: number = 1,
    perPage: number = 20,
    options?: { findDuplicates?: boolean; duplicateMbids?: boolean; search?: string }
  ): Promise<{
    bands: (Band & {
      normalized_name?: string;
      duplicate_group_size?: number;
      duplicate_mbid_count?: number;
    })[];
    pagination: DiscoverPagination;
    duplicate_groups_count?: number;
    total_duplicate_bands?: number;
    duplicate_mbid_count?: number;
  }> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (options?.findDuplicates) {
      params.append('find_duplicates', 'true');
    }
    if (options?.duplicateMbids) {
      params.append('duplicate_mbids', 'true');
    }
    if (options?.search) {
      params.append('search', options.search);
    }
    return this.makeRequest(`/admin/bands?${params.toString()}`);
  }

  async getAdminBandDetail(bandId: number): Promise<AdminBandDetailResponse> {
    return this.makeRequest(`/admin/bands/${bandId}`);
  }

  async updateAdminBand(bandId: number, data: AdminBandUpdateData): Promise<{ message: string; band: AdminBandDetail }> {
    const hasFile = data.profile_picture instanceof File;

    if (hasFile) {
      const formData = new FormData();
      if (data.name !== undefined) formData.append('name', data.name);
      if (data.slug !== undefined) formData.append('slug', data.slug);
      if (data.about !== undefined) formData.append('about', data.about);
      if (data.city !== undefined) formData.append('city', data.city);
      if (data.region !== undefined) formData.append('region', data.region);
      if (data.disabled !== undefined) formData.append('disabled', String(data.disabled));
      if (data.user_id !== undefined) formData.append('user_id', String(data.user_id));
      if (data.spotify_link !== undefined) formData.append('spotify_link', data.spotify_link);
      if (data.bandcamp_link !== undefined) formData.append('bandcamp_link', data.bandcamp_link);
      if (data.bandcamp_embed !== undefined) formData.append('bandcamp_embed', data.bandcamp_embed);
      if (data.apple_music_link !== undefined) formData.append('apple_music_link', data.apple_music_link);
      if (data.youtube_music_link !== undefined) formData.append('youtube_music_link', data.youtube_music_link);
      if (data.musicbrainz_id !== undefined) formData.append('musicbrainz_id', data.musicbrainz_id);
      if (data.lastfm_artist_name !== undefined) formData.append('lastfm_artist_name', data.lastfm_artist_name);
      if (data.artist_image_url !== undefined) formData.append('artist_image_url', data.artist_image_url);
      if (data.profile_picture) formData.append('profile_picture', data.profile_picture);

      const response = await fetch(`${this.getApiUrl()}/admin/bands/${bandId}`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeader(),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.errors?.join(', ') || 'Failed to update band');
      }

      return response.json();
    }

    return this.makeRequest(`/admin/bands/${bandId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async toggleBandDisabled(bandId: number): Promise<Band> {
    return this.makeRequest(`/admin/bands/${bandId}/toggle-disabled`, {
      method: 'PATCH',
    });
  }

  async deleteBand(bandId: number): Promise<{ message: string }> {
    return this.makeRequest(`/admin/bands/${bandId}`, {
      method: 'DELETE',
    });
  }

  async enrichBand(bandId: number): Promise<{ message: string; band: Band }> {
    return this.makeRequest(`/admin/bands/${bandId}/enrich`, {
      method: 'POST',
    });
  }

  async getAdminReviews(page: number = 1, perPage: number = 20, query?: string): Promise<{
    reviews: Review[];
    pagination: DiscoverPagination;
    query?: string;
  }> {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(perPage),
    });
    if (query) params.append('q', query);
    return this.makeRequest(`/admin/reviews?${params.toString()}`);
  }

  async deleteReview(reviewId: number): Promise<{ message: string }> {
    return this.makeRequest(`/admin/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  async enrichReview(reviewId: number): Promise<{
    message: string;
    band: Band;
    track_lookup: {
      status: 'found' | 'not_found' | 'skipped' | 'error';
      mbid?: string;
      title?: string;
      artist?: string;
      album?: string;
      duration_ms?: number;
    };
  }> {
    return this.makeRequest(`/admin/reviews/${reviewId}/enrich`, {
      method: 'POST',
    });
  }

  // Follow endpoints
  async followUser(userId: number): Promise<{ message: string }> {
    return this.makeRequest(`/users/${userId}/follow`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: number): Promise<{ message: string }> {
    return this.makeRequest(`/users/${userId}/follow`, {
      method: 'DELETE',
    });
  }

  async getFollowing(): Promise<FollowUser[]> {
    return this.makeRequest('/following');
  }

  async getFollowers(): Promise<FollowUser[]> {
    return this.makeRequest('/followers');
  }

  async getUserFollowing(userId: number): Promise<FollowUser[]> {
    return this.makeRequest(`/users/${userId}/following`);
  }

  async getUserFollowers(userId: number): Promise<FollowUser[]> {
    return this.makeRequest(`/users/${userId}/followers`);
  }

  async getFollowingFeed(page: number = 1): Promise<FollowingFeedResponse> {
    return this.makeRequest(`/feed/following?page=${page}`);
  }

  // Notification endpoints
  async getNotifications(page: number = 1): Promise<NotificationsResponse> {
    return this.makeRequest(`/notifications?page=${page}`);
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.makeRequest('/notifications/unread_count');
  }

  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    return this.makeRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return this.makeRequest('/notifications/read_all', {
      method: 'PATCH',
    });
  }

  // Event endpoints
  async getBandEvents(slug: string): Promise<Event[]> {
    return this.makeRequest(`/bands/${slug}/events`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async createEvent(slug: string, data: EventData | FormData): Promise<Event> {
    if (data instanceof FormData) {
      // For file uploads
      const response = await fetch(`${this.getApiUrl()}/bands/${slug}/events`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeader(),
        },
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create event');
      }

      return response.json();
    }

    return this.makeRequest(`/bands/${slug}/events`, {
      method: 'POST',
      body: JSON.stringify({ event: data }),
    });
  }

  async getEvent(eventId: number): Promise<Event> {
    return this.makeRequest(`/events/${eventId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async updateEvent(eventId: number, data: EventData | FormData): Promise<Event> {
    if (data instanceof FormData) {
      // For file uploads, use POST with _method override
      data.append('_method', 'PATCH');
      const response = await fetch(`${this.getApiUrl()}/events/${eventId}`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeader(),
        },
        body: data,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update event');
      }

      return response.json();
    }

    return this.makeRequest(`/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify({ event: data }),
    });
  }

  async deleteEvent(eventId: number): Promise<void> {
    await this.makeRequest(`/events/${eventId}`, {
      method: 'DELETE',
    });
  }

  async discoverEvents(page: number = 1, query?: string): Promise<{
    events: Event[];
    pagination: DiscoverPagination;
    query?: string;
  }> {
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.append('q', query);
    return this.makeRequest(`/discover/events?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Venue endpoints
  async searchVenues(search?: string): Promise<Venue[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.makeRequest(`/venues${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getVenue(venueId: number): Promise<Venue> {
    return this.makeRequest(`/venues/${venueId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async createVenue(data: VenueData): Promise<Venue> {
    return this.makeRequest('/venues', {
      method: 'POST',
      body: JSON.stringify({ venue: data }),
    });
  }

  // Discogs Search
  async searchDiscogs(
    track?: string,
    artist?: string,
    limit: number = 10
  ): Promise<DiscogsSearchResponse> {
    const params = new URLSearchParams();
    if (track) {
      params.append('track', track);
    }
    if (artist) {
      params.append('artist', artist);
    }
    params.append('limit', limit.toString());

    return this.makeRequest(`/discogs/search?${params.toString()}`);
  }

  async getDiscogsMaster(id: number): Promise<DiscogsMasterResponse> {
    return this.makeRequest(`/discogs/master/${id}`);
  }

  async getDiscogsRelease(id: number): Promise<DiscogsMasterResponse> {
    return this.makeRequest(`/discogs/release/${id}`);
  }

  // Artwork Search - fetches from multiple sources
  async searchArtwork(
    track: string,
    artist: string,
    album?: string
  ): Promise<ArtworkSearchResponse> {
    const params = new URLSearchParams();
    params.append('track', track);
    params.append('artist', artist);
    if (album) {
      params.append('album', album);
    }
    return this.makeRequest(`/artwork/search?${params.toString()}`);
  }
}

export interface ArtworkOption {
  url: string;
  source: 'cover_art_archive' | 'discogs' | 'lastfm';
  source_display: string;
  album_name?: string;
  release_mbid?: string;
  release_date?: string;
  size?: number;
  master_id?: number;
  year?: number;
}

export interface ArtworkSearchResponse {
  artwork_options: ArtworkOption[];
  query: {
    track: string;
    artist: string;
    album: string | null;
  };
}

export const apiClient = new ApiClient();
