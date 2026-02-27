'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Center, Container, Flex, Loader } from '@mantine/core';
import { BandSidebar } from '@/components/BandSidebar/BandSidebar';
import { Header } from '@/components/Header/Header';
import { NotificationList } from '@/components/Notifications';
import { UserSidebar } from '@/components/UserSidebar/UserSidebar';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band } from '@/lib/api';
import styles from './page.module.css';

export default function NotificationsPage() {
  const { user, isLoading: authLoading, isOnboardingComplete, isBand } = useAuth();
  const router = useRouter();
  const [band, setBand] = useState<Band | null>(null);
  const [bandLoading, setBandLoading] = useState(false);

  // Auth redirects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && !isOnboardingComplete) {
      router.push('/onboarding');
      return;
    }
  }, [user, authLoading, isOnboardingComplete, router]);

  // Fetch band data for band accounts
  useEffect(() => {
    const fetchBand = async () => {
      if (!user || !isBand) return;
      setBandLoading(true);
      try {
        const bands = await apiClient.getUserBands();
        if (bands.length > 0) {
          setBand(bands[0]);
        }
      } catch {
        // Silently fail
      } finally {
        setBandLoading(false);
      }
    };
    fetchBand();
  }, [user, isBand]);

  if (authLoading) {
    return (
      <Container>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container p={0} fluid className={styles.container}>
      <Header />

      <Flex className={styles.content}>
        {/* Sidebar - Show BandSidebar for bands, UserSidebar for fans */}
        {isBand ? (
          bandLoading ? (
            <Flex p="md" direction="column" className={styles.sidebar}>
              <Center py="xl">
                <Loader size="md" />
              </Center>
            </Flex>
          ) : band ? (
            <BandSidebar band={band} onBandSaved={setBand} />
          ) : (
            <Flex p="md" direction="column" className={styles.sidebar} />
          )
        ) : (
          <UserSidebar />
        )}

        {/* Main Content */}
        <Flex direction="column" px="md" pb="lg" flex={1}>
          <Box maw={700} mt="md">
            <NotificationList />
          </Box>
        </Flex>
      </Flex>
    </Container>
  );
}
