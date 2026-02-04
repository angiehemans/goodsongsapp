
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
  notification_type?: 'new_follower' | 'new_review';
  type?: 'new_follower' | 'new_review';  // Alternative field name from API
  message: string;
  read: boolean;
  created_at: string;
  actor: NotificationActor;
  // For new_review notifications
  song_name?: string;
  band_name?: string;
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
  mbid?: string;
  artists: LastFmArtist[];
  album: {
    name: string;
    mbid?: string;
    images: LastFmAlbumImage[];
  };
  lastfm_url: string;
  played_at: string | null;
  now_playing: boolean;
  loved: boolean;
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
  private getApiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  }

  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
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
      throw new Error(error.error || error.errors || 'Request failed');
    }

    return response.json();
  }

  private async makeFormRequest<T = any>(
    endpoint: string,
    formData: FormData
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
      throw new Error(error.error || error.errors || 'Request failed');
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

  removeAuthToken() {
    localStorage.removeItem('auth_token');
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

  async getUserProfile(username: string): Promise<UserProfile> {
    return this.makeRequest(`/users/${username}`, {
      headers: { 'Content-Type': 'application/json' }, // Override auth header for public profiles
    });
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

  async getRecentlyPlayed(limit?: number): Promise<{ tracks: RecentlyPlayedTrack[] }> {
    const params = limit ? `?limit=${limit}` : '';
    return this.makeRequest(`/recently-played${params}`);
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
  async discoverUsers(page: number = 1): Promise<{
    users: UserProfile[];
    pagination: DiscoverPagination;
  }> {
    return this.makeRequest(`/discover/users?page=${page}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async discoverBands(page: number = 1): Promise<{
    bands: Band[];
    pagination: DiscoverPagination;
  }> {
    return this.makeRequest(`/discover/bands?page=${page}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async discoverReviews(page: number = 1): Promise<{
    reviews: Review[];
    pagination: DiscoverPagination;
  }> {
    return this.makeRequest(`/discover/reviews?page=${page}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admin endpoints
  async getAllUsers(): Promise<User[]> {
    return this.makeRequest('/admin/users');
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

  async getAdminBands(): Promise<Band[]> {
    return this.makeRequest('/admin/bands');
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

  async getAdminReviews(): Promise<Review[]> {
    return this.makeRequest('/admin/reviews');
  }

  async deleteReview(reviewId: number): Promise<{ message: string }> {
    return this.makeRequest(`/admin/reviews/${reviewId}`, {
      method: 'DELETE',
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

  async discoverEvents(page: number = 1): Promise<{
    events: Event[];
    pagination: DiscoverPagination;
  }> {
    return this.makeRequest(`/discover/events?page=${page}`, {
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
}

export const apiClient = new ApiClient();
