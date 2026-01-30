// Utility to fix image URLs from the Rails API
// Rails Active Storage may return URLs with localhost which won't work on mobile

const API_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.goodsongs.app';

/**
 * Fix image URLs that come from Rails Active Storage
 * - Converts relative URLs to absolute URLs
 * - Fixes localhost/127.0.0.1 URLs to use the correct API host
 * - Fixes production URLs that incorrectly point to frontend domain
 */
export function fixImageUrl(url: string | null | undefined): string | undefined {
  if (!url || url.trim() === '') return undefined;

  // Extract just the path from the URL if it's a localhost/127.0.0.1 URL
  // This handles cases where Rails returns URLs with wrong host/port
  const localhostMatch = url.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/.*)/);
  if (localhostMatch) {
    return `${API_URL}${localhostMatch[1]}`;
  }

  // Handle production URLs that incorrectly point to frontend domain instead of API
  // e.g., https://www.goodsongs.app/rails/active_storage/... should be https://api.goodsongs.app/rails/active_storage/...
  const frontendMatch = url.match(/^https?:\/\/(?:www\.)?goodsongs\.app(\/rails\/active_storage\/.*)/);
  if (frontendMatch) {
    return `${API_URL}${frontendMatch[1]}`;
  }

  // If URL is a relative path starting with /, prepend the API URL
  if (url.startsWith('/')) {
    return `${API_URL}${url}`;
  }

  return url;
}
