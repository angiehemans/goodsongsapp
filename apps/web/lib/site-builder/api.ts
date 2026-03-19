import { apiClient } from '@/lib/api';
import {
  LinkPageResponse,
  ProfileAsset,
  ProfileAssetsResponse,
  ProfileLink,
  ProfilePage,
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
  theme: Partial<ProfileTheme> & { sections?: Section[]; single_post_layout?: SinglePostLayout; pages?: ProfilePage[] }
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

// Get a band's public profile by slug (for theming)
export async function getBandPublicProfile(bandSlug: string): Promise<PublicProfileResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  const response = await fetch(`${apiUrl}/api/v1/profiles/bands/${bandSlug}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 300 },
  });

  if (!response.ok) return null;
  return response.json();
}

// Get a single event by ID (public, no auth)
export async function getEventById(eventId: number): Promise<import('@/lib/api').Event | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  const response = await fetch(`${apiUrl}/events/${eventId}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 60 },
  });

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

// --- Profile Links CRUD ---

export async function getProfileLinks(): Promise<{ data: ProfileLink[] }> {
  return apiClient.request('/api/v1/profile_links');
}

export async function createProfileLink(link: {
  title: string;
  url: string;
  icon?: string;
  thumbnail?: File;
  position?: number;
  visible?: boolean;
}): Promise<{ data: ProfileLink }> {
  if (link.thumbnail) {
    const formData = new FormData();
    formData.append('title', link.title);
    formData.append('url', link.url);
    if (link.icon) formData.append('icon', link.icon);
    if (link.position !== undefined) formData.append('position', String(link.position));
    if (link.visible !== undefined) formData.append('visible', String(link.visible));
    formData.append('thumbnail', link.thumbnail);
    return apiClient.formRequest('/api/v1/profile_links', formData);
  }
  const { thumbnail, ...jsonFields } = link;
  return apiClient.request('/api/v1/profile_links', {
    method: 'POST',
    body: JSON.stringify(jsonFields),
  });
}

export async function updateProfileLink(
  id: number,
  updates: Partial<Pick<ProfileLink, 'title' | 'url' | 'icon' | 'position' | 'visible'>> & {
    thumbnail?: File;
    remove_thumbnail?: boolean;
  }
): Promise<{ data: ProfileLink }> {
  if (updates.thumbnail || updates.remove_thumbnail) {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (updates.title !== undefined) formData.append('title', updates.title);
    if (updates.url !== undefined) formData.append('url', updates.url);
    if (updates.icon !== undefined) formData.append('icon', updates.icon);
    if (updates.visible !== undefined) formData.append('visible', String(updates.visible));
    if (updates.thumbnail) formData.append('thumbnail', updates.thumbnail);
    if (updates.remove_thumbnail) formData.append('remove_thumbnail', 'true');
    return apiClient.formRequest(`/api/v1/profile_links/${id}`, formData);
  }
  const { thumbnail, remove_thumbnail, ...jsonFields } = updates;
  return apiClient.request(`/api/v1/profile_links/${id}`, {
    method: 'PUT',
    body: JSON.stringify(jsonFields),
  });
}

export async function deleteProfileLink(id: number): Promise<{ message: string }> {
  return apiClient.request(`/api/v1/profile_links/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderProfileLinks(linkIds: number[]): Promise<{ data: ProfileLink[] }> {
  return apiClient.request('/api/v1/profile_links/reorder', {
    method: 'PUT',
    body: JSON.stringify({ link_ids: linkIds }),
  });
}

// --- Public Link Page ---

export async function getBandLinkPage(bandSlug: string): Promise<LinkPageResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  const response = await fetch(`${apiUrl}/api/v1/profiles/bands/${bandSlug}/links`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 300 },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function getUserLinkPage(username: string): Promise<LinkPageResponse | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  const response = await fetch(`${apiUrl}/api/v1/profiles/users/${username}/links`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate: 300 },
  });
  if (!response.ok) return null;
  return response.json();
}
