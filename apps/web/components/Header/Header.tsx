'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconSun, IconMoon } from '@tabler/icons-react';
import { ActionIcon, Button, Container, Group, Title, useMantineColorScheme } from '@mantine/core';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

interface HeaderProps {
  /** The URL the logo links to. Defaults to /user/dashboard */
  logoHref?: string;
  /** Show login/signup buttons (for landing page) */
  showAuthButtons?: boolean;
  /** Show back button (for pages without sidebar nav like discover, profiles) */
  showBackButton?: boolean;
  /** Use a larger container size */
  size?: 'fluid' | 'lg' | 'md' | 'sm';
  /** Hide the theme toggle button */
  hideThemeToggle?: boolean;
}

export function Header({
  logoHref,
  showAuthButtons = false,
  showBackButton = false,
  size = 'fluid',
  hideThemeToggle = false,
}: HeaderProps) {
  const { isBand } = useAuth();
  const router = useRouter();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dashboardUrl = isBand ? '/user/band-dashboard' : '/user/dashboard';

  return (
    <Container fluid p="md" className={styles.header}>
      <Container fluid p={0}>
        <Group justify="space-between" align="center">
          {/* Left section - theme toggle and back button */}
          <Group className={styles.headerLeft}>
            {!hideThemeToggle && (
              <ActionIcon
                variant="subtle"
                color="grape"
                size="lg"
                onClick={() => toggleColorScheme()}
                aria-label="Toggle color scheme"
              >
                {mounted ? (
                  colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />
                ) : (
                  <IconMoon size={20} />
                )}
              </ActionIcon>
            )}
            {showBackButton && (
              <ActionIcon
                variant="subtle"
                color="grape"
                size="lg"
                onClick={() => router.back()}
                className={styles.backButton}
                aria-label="Go back"
              >
                <IconArrowLeft size={20} />
              </ActionIcon>
            )}
          </Group>

          {/* Center - Logo */}
          <Link href={logoHref || dashboardUrl} className={styles.headerLink}>
            <Group gap="xs" align="center">
              <span style={{ color: 'var(--gs-logo-color)', display: 'flex' }}>
                <Logo size={28} />
              </span>
              <Title order={2} style={{ color: 'var(--gs-text-heading)' }}>
                goodsongs
              </Title>
            </Group>
          </Link>

          {/* Right section - auth buttons or spacer */}
          <Group className={styles.headerRight}>
            {showAuthButtons && (
              <>
                <Button component={Link} href="/login" variant="outline" size="md" color="grape">
                  Sign In
                </Button>
                <Button component={Link} href="/signup" size="md" color="grape">
                  Get Started
                </Button>
              </>
            )}
          </Group>
        </Group>
      </Container>
    </Container>
  );
}
