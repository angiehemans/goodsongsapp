'use client';

import dynamic from 'next/dynamic';

// Dynamically import the builder with SSR disabled for easier debugging
const SiteBuilderClient = dynamic(() => import('./SiteBuilderClient'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      Loading Site Builder...
    </div>
  ),
});

export default function SiteBuilderPage() {
  return <SiteBuilderClient />;
}
