'use client';

import { useEffect, useRef } from 'react';
import { trackView } from '@/lib/analytics';

interface PageViewTrackerProps {
  type: 'post' | 'band' | 'user' | 'event';
  id: number;
}

export function PageViewTracker({ type, id }: PageViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    if (!id || typeof id !== 'number') return;

    tracked.current = true;
    trackView(type, id);
  }, [type, id]);

  return null;
}
