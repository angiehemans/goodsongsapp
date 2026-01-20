// Utility to fix image URLs from the Rails API
// Rails Active Storage may return URLs with localhost which won't work on mobile

const API_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.goodsongs.app';

/**
 * Fix image URLs that come from Rails Active Storage
 * - Converts relative URLs to absolute URLs
 * - Fixes localhost/127.0.0.1 URLs to use the correct API host
 */
export function fixImageUrl(url: string | null | undefined): string | undefined {
  if (!url || url.trim() === '') return undefined;

  let fixedUrl = url;

  // If it's a relative URL, prepend the API URL
  if (fixedUrl.startsWith('/')) {
    fixedUrl = `${API_URL}${fixedUrl}`;
  }

  // Replace various localhost formats with our API URL
  // This ensures images work when accessed from the mobile device
  const localhostPatterns = [
    'http://127.0.0.1:3000',
    'http://127.0.0.1',
    'http://localhost:3000',
    'http://localhost',
  ];

  for (const pattern of localhostPatterns) {
    if (fixedUrl.startsWith(pattern)) {
      fixedUrl = fixedUrl.replace(pattern, API_URL);
      break;
    }
  }

  return fixedUrl;
}
