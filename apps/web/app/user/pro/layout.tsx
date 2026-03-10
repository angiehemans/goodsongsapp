'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconBell,
  IconCalendarEvent,
  IconExternalLink,
  IconFileText,
  IconHome,
  IconLayout,
  IconSettings,
} from '@tabler/icons-react';
import { Center, Loader } from '@mantine/core';
import { DashboardShell, NavItem } from '@/components/DashboardShell/DashboardShell';
import { useAuth } from '@/hooks/useAuth';
import { BandProvider, useBand } from './BandProvider';

function ProLayoutInner({ children }: { children: ReactNode }) {
  const { user, isLoading, isProUser, isBlogger, isBand, isFan, isOnboardingComplete } = useAuth();
  const { band } = useBand();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isOnboardingComplete) {
      router.replace('/onboarding');
      return;
    }
    if (!isProUser) {
      if (isFan) {
        router.replace('/user/dashboard');
      } else if (isBand) {
        // Free band
        router.replace('/user/band-dashboard');
      }
    }
  }, [user, isLoading, isProUser, isFan, isBand, isOnboardingComplete, router]);

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      { label: 'Home', href: '/user/pro/dashboard', icon: IconHome },
      { label: 'Notifications', href: '/user/pro/notifications', icon: IconBell },
      {
        label: 'Posts',
        href: '/user/pro/posts',
        icon: IconFileText,
        actionHref: '/user/pro/posts/editor',
      },
      { label: 'Events', href: '/user/pro/events', icon: IconCalendarEvent },
    ];

    // Role-specific "View Site" link
    if (isBlogger && user?.username) {
      items.push({
        label: 'View Site',
        href: `/blog/${user.username}`,
        icon: IconExternalLink,
        external: true,
      });
    } else if (isBand && band?.slug) {
      items.push({
        label: 'View Site',
        href: `/bands/${band.slug}`,
        icon: IconExternalLink,
        external: true,
      });
    }

    items.push(
      { label: 'Site Builder', href: '/site-builder', icon: IconLayout },
      { label: 'Settings', href: '/user/pro/settings', icon: IconSettings },
    );

    return items;
  }, [isBlogger, isBand, user?.username, band?.slug]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!user || !isProUser) {
    return null;
  }

  return (
    <DashboardShell navItems={navItems} logoHref="/user/pro/dashboard">
      {children}
    </DashboardShell>
  );
}

export default function ProLayout({ children }: { children: ReactNode }) {
  return (
    <BandProvider>
      <ProLayoutInner>{children}</ProLayoutInner>
    </BandProvider>
  );
}
