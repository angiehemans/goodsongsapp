// Viewable types that match the backend model names
export type ViewableType = 'Post' | 'Band' | 'User' | 'Event';

// Map of frontend-friendly names to backend model names
const VIEWABLE_TYPE_MAP: Record<string, ViewableType> = {
  post: 'Post',
  blog_post: 'Post',
  band: 'Band',
  user: 'User',
  event: 'Event',
};

export function trackView(viewableType: string, viewableId: number): void {
  if (typeof window === 'undefined') return;

  // Only track if we have a valid numeric ID
  if (!viewableId || typeof viewableId !== 'number') return;

  // Map to backend-expected type name
  const mappedType = VIEWABLE_TYPE_MAP[viewableType.toLowerCase()];
  if (!mappedType) return;

  const payload = JSON.stringify({
    viewable_type: mappedType,
    viewable_id: viewableId,
    referrer: document.referrer || undefined,
    path: window.location.pathname,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
  const endpoint = `${apiUrl}/api/v1/track`;

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon(endpoint, blob)) return;
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
