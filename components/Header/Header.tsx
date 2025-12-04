'use client';

import Image from 'next/image';
import Link from 'next/link';
import { IconArrowLeft, IconSettings, IconShield } from '@tabler/icons-react';
import { ActionIcon, Container, Group, Title } from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

interface HeaderProps {
  /** The URL the logo links to. Defaults to /user/dashboard */
  logoHref?: string;
  /** Show the settings icon. Defaults to true */
  showSettings?: boolean;
  /** Show the back arrow instead of settings. Defaults to false */
  showBackArrow?: boolean;
  /** Custom back URL when showBackArrow is true */
  backHref?: string;
  /** Hide all right-side icons (for public pages) */
  minimal?: boolean;
}

export function Header({
  logoHref = '/user/dashboard',
  showSettings = true,
  showBackArrow = false,
  backHref,
  minimal = false,
}: HeaderProps) {
  const { isAdmin, isBand } = useAuth();

  const dashboardUrl = isBand ? '/user/band-dashboard' : '/user/dashboard';
  const effectiveBackHref = backHref || dashboardUrl;

  return (
    <Container fluid p="md" className={styles.header}>
      <Group justify="space-between" align="center">
        <Link href={logoHref} className={styles.headerLink}>
          <Group gap="xs" align="center">
            <Image src="/logo.svg" alt="goodsongs" width={28} height={28} />
            <Title order={2} c="blue.9">
              goodsongs
            </Title>
          </Group>
        </Link>
        {!minimal && (
          <Group gap="xs">
            {isAdmin && (
              <ActionIcon component={Link} href="/admin" variant="subtle" size="lg" color="red">
                <IconShield size={24} />
              </ActionIcon>
            )}
            {showBackArrow ? (
              <ActionIcon
                component={Link}
                href={effectiveBackHref}
                variant="subtle"
                size="lg"
                color="gray"
              >
                <IconArrowLeft size={24} />
              </ActionIcon>
            ) : showSettings ? (
              <ActionIcon
                component={Link}
                href="/user/settings"
                variant="subtle"
                size="lg"
                color="gray"
              >
                <IconSettings size={24} />
              </ActionIcon>
            ) : null}
          </Group>
        )}
      </Group>
    </Container>
  );
}
