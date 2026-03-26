import { Linking, Share } from 'react-native';
import { apiClient } from './api';
import type { ShareSheetRef } from '@/components/ShareSheet';

let shareSheetRef: ShareSheetRef | null = null;

/**
 * Register the global ShareSheet ref (call from App root)
 */
export function setShareSheetRef(ref: ShareSheetRef | null) {
  shareSheetRef = ref;
}

/**
 * Fetch share payload from the API and show the themed share sheet.
 * Falls back to the native share dialog if the sheet isn't mounted.
 */
export async function showShareMenu(
  postableType: 'review' | 'post' | 'event',
  postableId: number | string,
  fallbackText?: string,
  fallbackUrl?: string
) {
  try {
    const payload = await apiClient.getSharePayload(postableType, postableId);

    if (shareSheetRef) {
      shareSheetRef.show(payload);
    } else {
      // Fallback: native share
      await Share.share({
        message: `${payload.text}\n\n${payload.url}`,
        url: payload.url,
      });
    }
  } catch {
    // Fallback to basic share if API fails
    if (fallbackText && fallbackUrl) {
      try {
        await Share.share({
          message: `${fallbackText}\n\n${fallbackUrl}`,
          url: fallbackUrl,
        });
      } catch {
        // User cancelled
      }
    }
  }
}

/**
 * Share directly to Threads using the API payload
 */
export async function shareToThreads(
  postableType: 'review' | 'post' | 'event',
  postableId: number | string
) {
  try {
    const payload = await apiClient.getSharePayload(postableType, postableId);
    if (payload.threads_intent_url) {
      await Linking.openURL(payload.threads_intent_url.replace(/\+/g, '%20'));
    }
  } catch (error) {
    console.error('Failed to share to Threads:', error);
  }
}

/**
 * Share using the native share sheet with API-formatted text
 */
export async function shareNative(
  postableType: 'review' | 'post' | 'event',
  postableId: number | string,
  fallbackMessage?: string,
  fallbackUrl?: string
) {
  try {
    const payload = await apiClient.getSharePayload(postableType, postableId);
    await Share.share({
      message: `${payload.text}\n\n${payload.url}`,
      url: payload.url,
    });
  } catch {
    if (fallbackMessage && fallbackUrl) {
      try {
        await Share.share({
          message: fallbackMessage,
          url: fallbackUrl,
        });
      } catch {
        // User cancelled
      }
    }
  }
}
