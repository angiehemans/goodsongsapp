import type { AccountType } from './types';

/**
 * Helper to normalize account_type from API (can be number or string)
 */
export function normalizeAccountType(
  accountType: AccountType | number | undefined | null
): AccountType | null {
  if (accountType === 'fan' || accountType === 0) return 'fan';
  if (accountType === 'band' || accountType === 1) return 'band';
  if (accountType === 'admin' || accountType === 2) return 'admin';
  return null;
}

/**
 * Get the largest available album image from Last.fm images
 */
export function getLargestAlbumImage(
  images: { url: string; size: string }[] | undefined
): string | undefined {
  if (!images || images.length === 0) return undefined;

  const sizeOrder = ['extralarge', 'large', 'medium', 'small'];
  for (const size of sizeOrder) {
    const image = images.find((img) => img.size === size && img.url);
    if (image) return image.url;
  }

  return images[0]?.url;
}
