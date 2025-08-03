'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Text, Center } from '@mantine/core';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct dashboard URL
    router.replace('/user/dashboard');
  }, [router]);

  return (
    <Container size="sm" py="xl">
      <Center>
        <Text>Redirecting to dashboard...</Text>
      </Center>
    </Container>
  );
}