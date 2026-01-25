/**
 * Format date to readable string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateString);
}

/**
 * Get user's initials for avatar fallback
 */
export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return 'An unexpected error occurred';
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Fix image URLs that come from Rails Active Storage with incorrect host
 */
export function fixImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';

  // Extract just the path from the URL if it's a localhost/127.0.0.1 URL
  // This handles cases where Rails returns URLs with wrong host/port
  const localhostMatch = url.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)/);
  if (localhostMatch) {
    return `${apiUrl}${localhostMatch[1]}`;
  }

  // Handle production URLs that incorrectly point to frontend domain instead of API
  // e.g., https://www.goodsongs.app/rails/active_storage/... should be https://api.goodsongs.app/rails/active_storage/...
  const frontendMatch = url.match(/^https?:\/\/(?:www\.)?goodsongs\.app(\/rails\/active_storage\/.*)/);
  if (frontendMatch) {
    return `${apiUrl}${frontendMatch[1]}`;
  }

  // If URL is a relative path starting with /, prepend the API URL
  if (url.startsWith('/')) {
    return `${apiUrl}${url}`;
  }

  return url;
}

/**
 * Extract Bandcamp embed URL from iframe HTML or return cleaned URL
 *
 * Users often paste the full iframe HTML from Bandcamp's embed generator:
 * <iframe style="..." src="https://bandcamp.com/EmbeddedPlayer/album=123/..." seamless>...</iframe>
 *
 * This function extracts just the base embed URL (album/track ID) and strips any
 * existing styling parameters so we can apply our own brand colors.
 *
 * @param input - Either a full iframe HTML string or just the embed URL
 * @returns The clean embed URL with just the album/track ID, or empty string if invalid
 */
export function extractBandcampEmbedUrl(input: string): string {
  if (!input || !input.trim()) return '';

  const trimmed = input.trim();

  // Try to extract src from iframe HTML
  // Match: src="https://bandcamp.com/EmbeddedPlayer/..."
  const iframeSrcMatch = trimmed.match(/src=["']([^"']*bandcamp\.com\/EmbeddedPlayer[^"']*)["']/i);

  let embedUrl = iframeSrcMatch ? iframeSrcMatch[1] : trimmed;

  // Verify it's a valid Bandcamp embed URL
  if (!embedUrl.includes('bandcamp.com/EmbeddedPlayer')) {
    // If it's a regular bandcamp URL (e.g., artist.bandcamp.com/album/name),
    // we can't convert it to embed URL without an API call, so return as-is
    // The MusicPlayer will handle this gracefully
    if (embedUrl.includes('bandcamp.com')) {
      return embedUrl;
    }
    return '';
  }

  // Extract just the album or track ID portion and remove all styling params
  // URL format: https://bandcamp.com/EmbeddedPlayer/album=123456/size=large/bgcol=.../...
  // We want: https://bandcamp.com/EmbeddedPlayer/album=123456 (or track=123456)

  // Match album=XXXXX or track=XXXXX
  const albumMatch = embedUrl.match(/album=(\d+)/);
  const trackMatch = embedUrl.match(/track=(\d+)/);

  if (albumMatch) {
    return `https://bandcamp.com/EmbeddedPlayer/album=${albumMatch[1]}`;
  }

  if (trackMatch) {
    return `https://bandcamp.com/EmbeddedPlayer/track=${trackMatch[1]}`;
  }

  // If we can't extract album/track ID, return the original URL
  // (the MusicPlayer will still try to use it)
  return embedUrl;
}