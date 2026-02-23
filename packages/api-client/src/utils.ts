import type { AccountType, Role } from './types';

/**
 * Helper to normalize role from API (can be number or string)
 * Handles both new 'role' field and legacy 'account_type' field
 *
 * Mapping:
 * - 'fan' | 0 → 'fan'
 * - 'band' | 1 → 'band'
 * - 'blogger' | 'music_blogger' | 3 → 'blogger'
 */
export function normalizeRole(
  roleOrAccountType: Role | AccountType | number | undefined | null
): Role | null {
  if (roleOrAccountType === 'fan' || roleOrAccountType === 0) return 'fan';
  if (roleOrAccountType === 'band' || roleOrAccountType === 1) return 'band';
  if (
    roleOrAccountType === 'blogger' ||
    roleOrAccountType === 'music_blogger' ||
    roleOrAccountType === 3
  ) {
    return 'blogger';
  }
  return null;
}

/**
 * @deprecated Use `normalizeRole` instead
 * Helper to normalize account_type from API (can be number or string)
 */
export function normalizeAccountType(
  accountType: AccountType | number | undefined | null
): AccountType | null {
  if (accountType === 'fan' || accountType === 0) return 'fan';
  if (accountType === 'band' || accountType === 1) return 'band';
  if (accountType === 'music_blogger' || accountType === 3) return 'music_blogger';
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
