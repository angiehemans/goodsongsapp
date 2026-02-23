'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconCrown,
  IconLayoutDashboard,
  IconMessage,
  IconMicrophone2,
  IconUsers,
} from '@tabler/icons-react';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Text,
  Badge,
  Loader,
  Center,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { label: 'Dashboard', icon: IconLayoutDashboard, href: '/admin' },
  { label: 'Users', icon: IconUsers, href: '/admin/users' },
  { label: 'Bands', icon: IconMicrophone2, href: '/admin/bands' },
  { label: 'Reviews', icon: IconMessage, href: '/admin/reviews' },
  { label: 'Plans & Abilities', icon: IconCrown, href: '/admin/plans' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isOnboardingComplete, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [opened, { toggle, close }] = useDisclosure();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (!isLoading && user && !isOnboardingComplete) {
      router.push('/onboarding');
      return;
    }

    if (!isLoading && user && !isAdmin) {
      router.push('/user/dashboard');
      return;
    }
  }, [user, isLoading, isOnboardingComplete, isAdmin, router]);

  if (!mounted || isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const handleNavClick = (href: string) => {
    router.push(href);
    close();
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          backgroundColor: 'var(--mantine-color-gray-0)',
          minHeight: '100vh',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text size="lg" fw={700} c="grape.7">
              Admin Panel
            </Text>
          </Group>
          <Badge color="red" size="lg">
            Admin
          </Badge>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <NavLink
                key={item.href}
                label={item.label}
                leftSection={<item.icon size={20} />}
                active={isActive}
                onClick={() => handleNavClick(item.href)}
                variant="filled"
                style={{ borderRadius: 'var(--mantine-radius-md)', marginBottom: 4 }}
              />
            );
          })}
        </AppShell.Section>

        <AppShell.Section>
          <NavLink
            label="Back to App"
            leftSection={<IconLayoutDashboard size={20} />}
            onClick={() => router.push('/user/dashboard')}
            variant="subtle"
            style={{ borderRadius: 'var(--mantine-radius-md)' }}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box mih="calc(100vh - 60px - 2 * var(--mantine-spacing-md))">
          {children}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
