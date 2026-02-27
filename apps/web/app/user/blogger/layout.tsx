'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconBell,
  IconExternalLink,
  IconFileText,
  IconHome,
  IconLayout,
  IconMoon,
  IconPlus,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';
import {
  ActionIcon,
  AppShell,
  Center,
  Group,
  Loader,
  NavLink,
  Stack,
  Title,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

const getNavItems = (username?: string) => [
  { label: 'Home', href: '/user/blogger/dashboard', icon: IconHome },
  { label: 'Notifications', href: '/user/blogger/notifications', icon: IconBell },
  {
    label: 'Posts',
    href: '/user/blogger/posts',
    icon: IconFileText,
    actionHref: '/user/blogger/posts/editor',
  },
  {
    label: 'View Site',
    href: username ? `/blog/${username}` : '#',
    icon: IconExternalLink,
    external: true,
  },
  { label: 'Site Builder', href: '/user/blogger/site-builder', icon: IconLayout },
  { label: 'Settings', href: '/user/blogger/settings', icon: IconSettings },
];

export default function BloggerLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: 'sm' }}
      padding={0}
      styles={{
        header: { backgroundColor: 'var(--gs-bg-app)' },
        navbar: { backgroundColor: 'var(--gs-bg-app)' },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          {/* Left - Dark mode toggle */}
          <ActionIcon
            variant="subtle"
            color="grape"
            size="lg"
            onClick={() => toggleColorScheme()}
            aria-label="Toggle color scheme"
          >
            {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
          </ActionIcon>

          {/* Center - Logo */}
          <Link href="/user/blogger/dashboard" style={{ textDecoration: 'none' }}>
            <Group gap="xs" align="center">
              <span style={{ color: 'var(--gs-logo-color)', display: 'flex' }}>
                <Logo size={28} />
              </span>
              <Title order={2} style={{ color: 'var(--gs-text-heading)' }}>
                goodsongs
              </Title>
            </Group>
          </Link>

          {/* Right - Spacer for balance */}
          <div style={{ width: 34 }} />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={0}>
        <Stack gap={0}>
          {getNavItems(user?.username).map((item) => (
            <NavLink
              key={item.label}
              component={Link}
              href={item.href}
              label={item.label}
              leftSection={<item.icon size={20} />}
              rightSection={
                item.actionHref && (
                  <Tooltip label="New post" position="right">
                    <ActionIcon
                      variant="subtle"
                      color="grape"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const isOnEditor = pathname.startsWith('/user/blogger/posts/editor');
                        if (isOnEditor) {
                          if (window.confirm('Are you sure you want to start a new post? Any unsaved changes will be lost.')) {
                            // Navigate with a unique key to force remount
                            router.push(`${item.actionHref}?new=${Date.now()}`);
                          }
                        } else {
                          router.push(item.actionHref!);
                        }
                      }}
                    >
                      <IconPlus size={16} />
                    </ActionIcon>
                  </Tooltip>
                )
              }
              active={pathname === item.href || pathname.startsWith(item.href + '/')}
              color="grape"
              style={{ borderRadius: 0 }}
              target={item.external ? '_blank' : undefined}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
