'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  IconMoon,
  IconPlus,
  IconSun,
} from '@tabler/icons-react';
import {
  ActionIcon,
  AppShell,
  Burger,
  Center,
  Group,
  Loader,
  NavLink,
  Stack,
  Title,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size: number }>;
  /** Href for an action button (e.g. "New post") shown on the right side */
  actionHref?: string;
  /** If true, opens in a new tab */
  external?: boolean;
}

interface DashboardShellProps {
  navItems: NavItem[];
  logoHref: string;
  children: ReactNode;
}

export function DashboardShell({ navItems, logoHref, children }: DashboardShellProps) {
  const { user, isLoading } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const pathname = usePathname();
  const router = useRouter();
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure();

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
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !navOpened } }}
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
          <Link href={logoHref} style={{ textDecoration: 'none' }}>
            <Group gap="xs" align="center">
              <span style={{ color: 'var(--gs-logo-color)', display: 'flex' }}>
                <Logo size={28} />
              </span>
              <Title order={2} style={{ color: 'var(--gs-text-heading)' }}>
                goodsongs
              </Title>
            </Group>
          </Link>

          {/* Right - Burger (mobile) */}
          <Burger opened={navOpened} onClick={toggleNav} hiddenFrom="sm" size="sm" aria-label="Toggle navigation" />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={0}>
        <Stack gap={0}>
          {navItems.map((item) => (
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
                        const isOnEditor = pathname.startsWith('/user/pro/posts/editor');
                        if (isOnEditor) {
                          if (window.confirm('Are you sure you want to start a new post? Any unsaved changes will be lost.')) {
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
              onClick={closeNav}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
