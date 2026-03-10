'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function BloggerRedirectLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect /user/blogger/* → /user/pro/*
    const newPath = pathname.replace('/user/blogger', '/user/pro');
    router.replace(newPath);
  }, [pathname, router]);

  return null;
}
