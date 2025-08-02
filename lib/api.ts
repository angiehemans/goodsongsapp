const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface User {
  id: number;
  email: string;
  username: string;
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
  liked_aspects: string[];
}

export interface Review extends ReviewData {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username: string;
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
  owner: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/signup`, {
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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
    const response = await fetch(`${API_BASE_URL}/profile`, {
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
    const response = await fetch(`${API_BASE_URL}/reviews`, {
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
    // Use the Next.js API route which will forward to the backend
    const response = await fetch(`/api/users/${username}`, {
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

      const response = await fetch('/api/bands', {
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
    const response = await fetch('/api/bands', {
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
    const response = await fetch(`/api/bands/${slug}`, {
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
    const response = await fetch('/api/bands/user', {
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
    const response = await fetch('/api/reviews/user', {
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
}

export const apiClient = new ApiClient();
