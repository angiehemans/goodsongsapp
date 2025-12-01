'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Text, Center } from '@mantine/core';
import { Suspense } from 'react';

function DashboardRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if this is a Spotify OAuth callback in a popup
    const spotifyParam = searchParams.get('spotify');
    const isPopup = window.opener && window.opener !== window;

    if (isPopup && spotifyParam === 'connected') {
      // Close the popup - parent window will detect this and refresh status
      window.close();
      return;
    }

    // Otherwise redirect to the correct dashboard URL
    router.replace('/user/dashboard');
  }, [router, searchParams]);

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