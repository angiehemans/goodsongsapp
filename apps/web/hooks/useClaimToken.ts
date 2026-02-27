'use client';

import { apiClient } from '@/lib/api';

const CLAIM_TOKEN_KEY = 'pending_comment_claim_token';

export function useClaimToken() {
  const storeClaimToken = (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CLAIM_TOKEN_KEY, token);
    }
  };

  const getClaimToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(CLAIM_TOKEN_KEY);
  };

  const clearClaimToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CLAIM_TOKEN_KEY);
    }
  };

  const claimPendingComment = async () => {
    const token = getClaimToken();
    if (!token) return null;

    try {
      const response = await apiClient.claimPostComment(token);
      clearClaimToken();
      return response.comment;
    } catch (error) {
      clearClaimToken(); // Clear invalid token
      throw error;
    }
  };

  return {
    storeClaimToken,
    getClaimToken,
    clearClaimToken,
    claimPendingComment,
  };
}
