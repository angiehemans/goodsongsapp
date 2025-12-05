
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
  profile_image_url?: string;
  reviews_count?: number;
  bands_count?: number;
  spotify_connected?: boolean;
  account_type?: AccountType | number;  // API returns 0 for fan, 1 for band
  onboarding_completed?: boolean;
  primary_band?: Band;
  admin?: boolean;  // Separate admin flag
  disabled?: boolean;  // Whether the account is disabled
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
  reviews: Review[];
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
  apple_music_link?: string;
  youtube_music_link?: string;
  profile_picture_url?: string;
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

export interface SpotifyArtist {
  name: string;
  id: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
}

export interface RecentlyPlayedTrack {
  id: string;
  name: string;
  artists: (string | SpotifyArtist)[];
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
  played_at: string;
  preview_url?: string | null;
}

export interface SpotifyStatus {
  connected: boolean;
  user_id?: string;
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

class ApiClient {
  private getApiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
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

  async getSpotifyConnectUrl(): Promise<{ auth_url: string }> {
    // Use Next.js API route which handles the backend redirect properly
    const response = await fetch('/api/spotify/connect', {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get Spotify connect URL');
    }

    return response.json();
  }

  async getSpotifyStatus(): Promise<SpotifyStatus> {
    return this.makeRequest('/spotify/status');
  }

  async disconnectSpotify(): Promise<void> {
    await this.makeRequest('/spotify/disconnect', { method: 'DELETE' });
  }

  async getRecentlyPlayed(): Promise<RecentlyPlayedTrack[] | { tracks: RecentlyPlayedTrack[] }> {
    return this.makeRequest('/recently-played');
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
    meta: { current_page: number; total_pages: number; total_count: number; per_page: number };
  }> {
    return this.makeRequest(`/discover/users?page=${page}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async discoverBands(page: number = 1): Promise<{
    bands: Band[];
    meta: { current_page: number; total_pages: number; total_count: number; per_page: number };
  }> {
    return this.makeRequest(`/discover/bands?page=${page}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async discoverReviews(page: number = 1): Promise<{
    reviews: Review[];
    meta: { current_page: number; total_pages: number; total_count: number; per_page: number };
  }> {
    return this.makeRequest(`/discover/reviews?page=${page}`, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admin endpoints
  async getAllUsers(): Promise<User[]> {
    return this.makeRequest('/admin/users');
  }

  async getAdminUserDetail(userId: string): Promise<{ user: UserProfile; reviews: Review[] }> {
    return this.makeRequest(`/admin/users/${userId}`);
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
}

export const apiClient = new ApiClient();
