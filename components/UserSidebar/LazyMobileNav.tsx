'use client';

import dynamic from 'next/dynamic';

// Lazy load MobileNav - only renders on client, reduces initial bundle
const MobileNav = dynamic(
  () => import('./UserSidebar').then((mod) => mod.MobileNav),
  { ssr: false }
);

export function LazyMobileNav() {
  return <MobileNav />;
}
