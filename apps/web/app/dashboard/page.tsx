'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Text, Center } from '@mantine/core';
import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';

function DashboardRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, isOnboardingComplete, isBand } = useAuth();

  useEffect(() => {
    // Wait for auth to load before redirecting
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Redirect based on onboarding status and account type
    if (!isOnboardingComplete) {
      router.replace('/onboarding');
    } else if (isBand) {
      router.replace('/user/band-dashboard');
    } else {
      router.replace('/user/dashboard');
    }
  }, [router, searchParams, user, isLoading, isOnboardingComplete, isBand]);

  return (
    <Container size="sm" py="xl">
      <Center>
        <Text>Redirecting to dashboard...</Text>
      </Center>
    </Container>
  );
}

export default function DashboardRedirect() {
  return (
    <Suspense fallback={
      <Container size="sm" py="xl">
        <Center>
          <Text>Loading...</Text>
        </Center>
      </Container>
    }>
      <DashboardRedirectContent />
    </Suspense>
  );
}