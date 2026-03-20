export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad/i.test(navigator.userAgent);
};

export const supportsWebShare = (): boolean => {
  if (typeof window === 'undefined') return false;
  return typeof navigator.share === 'function';
};
