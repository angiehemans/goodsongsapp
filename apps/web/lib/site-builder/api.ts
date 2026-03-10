import { apiClient } from '@/lib/api';
import {
  ProfileAsset,
  ProfileAssetsResponse,
  ProfileThemeResponse,
  PublicProfileResponse,
  Section,
  SinglePostLayout,
  ThemedPostResponse,
} from './types';
import { ProfileTheme } from './types';

// Get the authenticated user's profile theme configuration
export async function getProfileTheme(): Promise<ProfileThemeResponse> {
  return apiClient.request('/api/v1/profile_theme');
}

// Update the profile theme (saves to draft)
export async function updateProfileTheme(
  theme: Partial<ProfileTheme> & { sections?: Section[]; single_post_layout?: SinglePostLayout }
): Promise<ProfileThemeResponse> {
  return apiClient.request('/api/v1/profile_theme', {
    method: 'PUT',
    body: JSON.stringify(theme),
  });
}

// Publish draft sections to make them live
export async function publishProfileTheme(): Promise<ProfileThemeResponse> {
  return apiClient.request('/api/v1/profile_theme/publish', {
    method: 'POST',
  });
}

// Discard unpublished draft sections
export async function discardProfileThemeDraft(): Promise<ProfileThemeResponse> {
  return apiClient.request('/api/v1/profile_theme/discard_draft', {
    method: 'POST',
  });
}

// Reset the theme to role-based defaults
export async function resetProfileTheme(): Promise<ProfileThemeResponse> {
  return apiClient.request('/api/v1/profile_theme/reset', {
    method: 'POST',
  });
}

// Get the authenticated user's profile assets
export async function getProfileAssets(): Promise<ProfileAssetsResponse> {
  return apiClient.request('/api/v1/profile_assets');
}

// Upload a new profile asset
export async function uploadProfileAsset(
  file: File,
  purpose: 'background' | 'header' | 'custom' = 'background'
): Promise<{ data: ProfileAsset }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('purpose', purpose);

  return apiClient.formRequest('/api/v1/profile_assets', formData);
}

// Delete a profile asset
export async function deleteProfileAsset(assetId: number): Promise<{ message: string }> {
  return apiClient.request(`/api/v1/profile_assets/${assetId}`, {
    method: 'DELETE',
  });
}

// Get a themed single post for a band profile (public, no auth)
export async function getThemedBandPost(
  bandSlug: string,
  postSlug: string
): Promise<ThemedPostResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  const response = await fetch(
    `${apiUrl}/api/v1/profiles/bands/${bandSlug}/posts/${postSlug}`,
    {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) return null;
  return response.json();
}

// Get a themed single post for a user profile (public, no auth)
export async function getThemedUserPost(
  username: string,
  postSlug: string
): Promise<ThemedPostResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  const response = await fetch(
    `${apiUrl}/api/v1/profiles/users/${username}/posts/${postSlug}`,
    {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) return null;
  return response.json();
}

// Get a public profile with theme and hydrated section data
export async function getPublicProfile(username: string): Promise<PublicProfileResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  const response = await fetch(`${apiUrl}/api/v1/profiles/users/${username}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    next: {
      revalidate: 300,
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
