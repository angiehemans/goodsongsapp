export const shareToThreads = (intentUrl: string): void => {
  window.open(intentUrl, '_blank', 'noopener');
};

export const shareToInstagram = async (
  text: string,
  url: string,
  imageUrl?: string | null
): Promise<{ method: 'web_share' | 'clipboard' | 'cancelled' }> => {
  const fullText = `${text}\n\n${url}`;

  if (typeof navigator.share === 'function') {
    try {
      const shareData: ShareData = { text: fullText };

      // Try to include the image as a file if available
      if (imageUrl && typeof navigator.canShare === 'function') {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const ext = blob.type.split('/')[1] || 'jpg';
          const file = new File([blob], `share.${ext}`, { type: blob.type });
          const withFile = { ...shareData, files: [file] };
          if (navigator.canShare(withFile)) {
            shareData.files = [file];
          }
        } catch {
          // Image fetch failed — share without it
        }
      }

      await navigator.share(shareData);
      return { method: 'web_share' };
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return { method: 'cancelled' };
      }
      // Fall through to clipboard on other errors
    }
  }

  await navigator.clipboard.writeText(fullText);
  return { method: 'clipboard' };
};

export const copyLink = async (url: string): Promise<void> => {
  await navigator.clipboard.writeText(url);
};
