'use client';

import { ReactNode, useState } from 'react';
import { Center, Container, Drawer, Flex, Loader, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Header } from '@/components/Header/Header';
import { RecommendationForm } from '@/components/RecommendationForm/RecommendationForm';
import { UserSidebar } from '@/components/UserSidebar/UserSidebar';
import { useAuth } from '@/hooks/useAuth';
import { UserLayoutProvider, useUserLayout } from '../UserLayoutContext';
import styles from './layout.module.css';

function LayoutContent({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { reviewsCount, followersCount, followingCount, refreshReviews } = useUserLayout();
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);

  const handleRecommendationSuccess = () => {
    closeDrawer();
    refreshReviews();
  };

  if (isLoading) {
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
    <>
      <Container p={0} fluid className={styles.container}>
        <Header />

        <Flex className={styles.content}>
          <UserSidebar
            badgeText={`${reviewsCount} recommendation${reviewsCount !== 1 ? 's' : ''}`}
            followersCount={followersCount}
            followingCount={followingCount}
            onNewRecommendation={openDrawer}
          />

          <Flex direction="column" px="md" pb="lg" flex={1}>
            {children}
          </Flex>
        </Flex>
      </Container>

      {/* New Recommendation Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title={
          <Text size="xl" fw={600} c="blue.8">
            New Recommendation
          </Text>
        }
        position="right"
        size="lg"
        styles={{
          body: { paddingTop: 0 },
        }}
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <RecommendationForm
          onSuccess={handleRecommendationSuccess}
          onCancel={closeDrawer}
        />
      </Drawer>
    </>
  );
}

export default function UserFanLayout({ children }: { children: ReactNode }) {
  return (
    <UserLayoutProvider>
      <LayoutContent>{children}</LayoutContent>
    </UserLayoutProvider>
  );
}
