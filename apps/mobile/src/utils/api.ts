import {
  User,
  AuthResponse,
  LoginCredentials,
  SignupData,
  Review,
  Band,
  UserProfile,
  Event,
  PaginationMeta,
  LastFmStatus,
  RecentlyPlayedTrack,
} from '@goodsongs/api-client';

// API base URL - configure this for your environment
const API_URL = __DEV__
  ? 'http://localhost:3000' // Physical device via adb reverse, or emulator via 10.0.2.2
  : 'https://api.goodsongs.app';

class MobileApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: this.getHeaders(),
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

  // Auth
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    return this.request('/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<User> {
    return this.request('/profile');
  }

  // Discover
  async discoverUsers(page: number = 1): Promise<{
    users: UserProfile[];
    meta: PaginationMeta;
  }> {
    return this.request(`/discover/users?page=${page}`);
  }

  async discoverBands(page: number = 1): Promise<{
    bands: Band[];
    meta: PaginationMeta;
  }> {
    return this.request(`/discover/bands?page=${page}`);
  }

  async discoverReviews(page: number = 1): Promise<{
    reviews: Review[];
    meta: PaginationMeta;
  }> {
    return this.request(`/discover/reviews?page=${page}`);
  }

  async discoverEvents(page: number = 1): Promise<{
    events: Event[];
    meta: PaginationMeta;
  }> {
    return this.request(`/discover/events?page=${page}`);
  }

  // Users
  async getUserProfile(username: string): Promise<UserProfile> {
    return this.request(`/users/${username}`);
  }

  async followUser(userId: number): Promise<{ message: string }> {
    return this.request(`/users/${userId}/follow`, { method: 'POST' });
  }

  async unfollowUser(userId: number): Promise<{ message: string }> {
    return this.request(`/users/${userId}/follow`, { method: 'DELETE' });
  }

  // Bands
  async getBand(slug: string): Promise<Band> {
    return this.request(`/bands/${slug}`);
  }

  async getUserBands(): Promise<Band[]> {
    return this.request('/bands/user');
  }

  async getBandEvents(slug: string): Promise<Event[]> {
    return this.request(`/bands/${slug}/events`);
  }

  async createEvent(
    slug: string,
    data: {
      name: string;
      description?: string;
      event_date: string;
      ticket_link?: string;
      price?: string;
      age_restriction?: string;
      venue_id?: number;
      venue_attributes?: {
        name: string;
        address?: string;
        city: string;
        region?: string;
      };
    }
  ): Promise<Event> {
    return this.request(`/bands/${slug}/events`, {
      method: 'POST',
      body: JSON.stringify({ event: data }),
    });
  }

  async getEvent(eventId: number): Promise<Event> {
    return this.request(`/events/${eventId}`);
  }

  async searchVenues(search?: string): Promise<Array<{
    id: number;
    name: string;
    address?: string;
    city?: string;
    region?: string;
  }>> {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.request(`/venues${params}`);
  }

  // Reviews
  async getReview(reviewId: number): Promise<Review> {
    return this.request(`/reviews/${reviewId}`);
  }

  async getUserReviews(): Promise<Review[]> {
    return this.request('/reviews/user');
  }

  async createReview(data: {
    song_link: string;
    band_name: string;
    song_name: string;
    artwork_url?: string;
    review_text: string;
    liked_aspects?: string[];
    band_lastfm_artist_name?: string;
    band_musicbrainz_id?: string;
  }): Promise<Review> {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify({ review: data }),
    });
  }

  // Feed
  async getFollowingFeed(page: number = 1): Promise<{
    reviews: Review[];
    meta: PaginationMeta;
  }> {
    return this.request(`/feed/following?page=${page}`);
  }

  // Notifications
  async getNotifications(page: number = 1): Promise<{
    notifications: any[];
    unread_count: number;
    meta: PaginationMeta;
  }> {
    return this.request(`/notifications?page=${page}`);
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.request('/notifications/unread_count');
  }

  async markNotificationAsRead(notificationId: number): Promise<any> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return this.request('/notifications/read_all', { method: 'PATCH' });
  }

  // Profile Update
  async updateProfile(data: { about_me?: string; city?: string; region?: string }): Promise<User> {
    const formData = new FormData();
    formData.append('_method', 'PATCH');

    if (data.about_me !== undefined) {
      formData.append('about_me', data.about_me);
    }
    if (data.city !== undefined) {
      formData.append('city', data.city);
    }
    if (data.region !== undefined) {
      formData.append('region', data.region);
    }

    const response = await fetch(`${API_URL}/update-profile`, {
      method: 'POST',
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update profile');
    }

    return response.json();
  }

  // Last.fm
  async getLastFmStatus(): Promise<LastFmStatus> {
    return this.request('/lastfm/status');
  }

  async getRecentlyPlayed(limit?: number): Promise<{ tracks: RecentlyPlayedTrack[] }> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/recently-played${params}`);
  }

  async connectLastFm(username: string): Promise<{ message: string; username: string }> {
    return this.request('/lastfm/connect', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  }

  async disconnectLastFm(): Promise<void> {
    await this.request('/lastfm/disconnect', { method: 'DELETE' });
  }
}

export const apiClient = new MobileApiClient();
