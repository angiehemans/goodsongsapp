
export interface User {
  id: number;
  email: string;
  username: string;
  about_me?: string;
  profile_image_url?: string;
  reviews_count?: number;
  bands_count?: number;
  spotify_connected?: boolean;
}

export interface ProfileUpdateData {
  about_me?: string;
  profile_image?: File;
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
  username: string;
  password: string;
  password_confirmation: string;
}

export interface ReviewData {
  song_link: string;
  band_name: string;
  song_name: string;
  artwork_url: string;
  review_text: string;
  overall_rating: number;
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
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  about_me?: string;
  profile_image_url?: string;
  reviews: Review[];
  bands?: Band[];
}

export interface BandData {
  name: string;
  slug?: string;
  location?: string;
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
  about?: string;
  spotify_link?: string;
  bandcamp_link?: string;
  apple_music_link?: string;
  youtube_music_link?: string;
  profile_picture_url?: string;
  reviews_count: number;
  user_owned: boolean;
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

class ApiClient {
  private getApiUrl(): string {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${this.getApiUrl()}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${this.getApiUrl()}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${this.getApiUrl()}/profile`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return response.json();
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
    const response = await fetch(`${this.getApiUrl()}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ review: data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create review');
    }

    return response.json();
  }

  async getUserProfile(username: string): Promise<UserProfile> {
    const response = await fetch(`${this.getApiUrl()}/users/${username}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user profile');
    }

    return response.json();
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
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user reviews');
    }

    return response.json();
  }

  async getSpotifyConnectUrl(): Promise<{ auth_url: string }> {
    const response = await fetch(`${this.getApiUrl()}/spotify/connect-url`, {
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
    const response = await fetch(`${this.getApiUrl()}/spotify/status`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get Spotify status');
    }

    return response.json();
  }

  async disconnectSpotify(): Promise<void> {
    const response = await fetch(`${this.getApiUrl()}/spotify/disconnect`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect Spotify');
    }
  }

  async getRecentlyPlayed(): Promise<RecentlyPlayedTrack[] | { tracks: RecentlyPlayedTrack[] }> {
    const response = await fetch(`${this.getApiUrl()}/recently-played`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch recently played tracks');
    }

    return response.json();
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
    }

    const response = await fetch(`${this.getApiUrl()}/profile`, {
      method: 'POST',  // Send as POST...
      headers: {
        ...this.getAuthHeader(),
        // Don't set Content-Type, let browser handle FormData
      },
      body: formData  // ...but Rails will treat it as PATCH due to _method
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
