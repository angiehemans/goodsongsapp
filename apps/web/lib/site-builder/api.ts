import { apiClient } from '@/lib/api';
import {
  ProfileAsset,
  ProfileAssetsResponse,
  ProfileTheme,
  ProfileThemeResponse,
  PublicProfileResponse,
  Section,
} from './types';

// Get the authenticated user's profile theme configuration
export async function getProfileTheme(): Promise<ProfileThemeResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/profile_theme`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch profile theme');
  }

  return response.json();
}

// Update the profile theme (saves to draft)
export async function updateProfileTheme(
  theme: Partial<ProfileTheme> & { sections?: Section[] }
): Promise<ProfileThemeResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/profile_theme`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(theme),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile theme');
  }

  return response.json();
}

// Publish draft sections to make them live
export async function publishProfileTheme(): Promise<ProfileThemeResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/profile_theme/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to publish profile theme');
  }

  return response.json();
}

// Discard unpublished draft sections
export async function discardProfileThemeDraft(): Promise<ProfileThemeResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/profile_theme/discard_draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to discard draft');
  }

  return response.json();
}

// Reset the theme to role-based defaults
export async function resetProfileTheme(): Promise<ProfileThemeResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/profile_theme/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reset profile theme');
  }

  return response.json();
}

// Get the authenticated user's profile assets
export async function getProfileAssets(): Promise<ProfileAssetsResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/profile_assets`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch profile assets');
  }

  return response.json();
}

// Upload a new profile asset
export async function uploadProfileAsset(
  file: File,
  purpose: 'background' | 'header' | 'custom' = 'background'
): Promise<{ data: ProfileAsset }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('purpose', purpose);

  const response = await fetch(`${getApiUrl()}/api/v1/profile_assets`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload asset');
  }

  return response.json();
}

// Delete a profile asset
export async function deleteProfileAsset(assetId: number): Promise<{ message: string }> {
  const response = await fetch(`${getApiUrl()}/api/v1/profile_assets/${assetId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete asset');
  }

  return response.json();
}

// Get a public profile with theme and hydrated section data
export async function getPublicProfile(username: string): Promise<PublicProfileResponse> {
  const response = await fetch(`${getApiUrl()}/api/v1/profiles/${username}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    next: {
      revalidate: 300, // Cache for 5 minutes
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Profile not found');
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch profile');
  }

  return response.json();
}

// Helper to get API URL
function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
}

// Helper to get auth header
function getAuthHeader(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
