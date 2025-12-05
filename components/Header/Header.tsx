'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Container, Group, Title } from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

interface HeaderProps {
  /** The URL the logo links to. Defaults to /user/dashboard */
  logoHref?: string;
}

export function Header({ logoHref }: HeaderProps) {
  const { isBand } = useAuth();

  const dashboardUrl = isBand ? '/user/band-dashboard' : '/user/dashboard';

  return (
    <Container fluid p="md" className={styles.header}>
      <Group justify="space-between" align="center">
        <Link href={logoHref || dashboardUrl} className={styles.headerLink}>
          <Group gap="xs" align="center">
            <Image src="/logo.svg" alt="goodsongs" width={28} height={28} />
            <Title order={2} c="blue.9">
              goodsongs
            </Title>
          </Group>
        </Link>
      </Group>
    </Container>
  );
}
