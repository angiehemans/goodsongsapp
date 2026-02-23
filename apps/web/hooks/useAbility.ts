'use client';

import { useAuth } from './useAuth';

/**
 * Hook to check if the current user has a specific ability.
 *
 * @param key - The ability key to check (e.g., 'create_review', 'upload_image')
 * @returns boolean indicating if the user has the ability
 *
 * @example
 * ```tsx
 * function FeatureButton() {
 *   const canUpload = useAbility('upload_image');
 *
 *   if (!canUpload) {
 *     return <UpgradePrompt />;
 *   }
 *
 *   return <UploadButton />;
 * }
 * ```
 */
export function useAbility(key: string): boolean {
  const { abilities } = useAuth();
  return abilities.includes(key);
}

/**
 * Hook to check multiple abilities at once.
 *
 * @param keys - Array of ability keys to check
 * @returns Object with each key mapped to a boolean
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { canUpload, canCreateEvent } = useAbilities(['upload_image', 'create_event']);
 *   // ...
 * }
 * ```
 */
export function useAbilities<T extends string>(keys: T[]): Record<T, boolean> {
  const { abilities } = useAuth();

  return keys.reduce(
    (acc, key) => {
      acc[key] = abilities.includes(key);
      return acc;
    },
    {} as Record<T, boolean>
  );
}
