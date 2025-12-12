'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';
import { ActionIcon, Button, Container, Group, Title } from '@mantine/core';
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
}

export function Header({
  logoHref,
  showAuthButtons = false,
  showBackButton = false,
  size = 'fluid',
}: HeaderProps) {
  const { isBand } = useAuth();
  const router = useRouter();

  const dashboardUrl = isBand ? '/user/band-dashboard' : '/user/dashboard';

  return (
    <Container fluid p="md" className={styles.header}>
      <Container size={size === 'fluid' ? undefined : size} p={0}>
        <Group justify="space-between" align="center">
          {/* Left section - back button or spacer */}
          <Group className={styles.headerLeft}>
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
              <Image src="/logo.svg" alt="goodsongs" width={28} height={28} />
              <Title order={2} c="blue.9">
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
                <Button component={Link} href="/signup" size="md" color="grape.9">
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
