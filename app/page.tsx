'use client';

import { Container, Title, Text, Button, Stack, Center, Group, Box } from '@mantine/core';
import { IconMusic } from '@tabler/icons-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/user/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <Container>
        <Text>Loading...</Text>
      </Container>
    );
  }

  return (
    <Box>
      {/* Top Menu Bar */}
      <Box bg="grape.0" p="md" style={{ borderBottom: '2px solid var(--mantine-color-grape-3)' }}>
        <Container size="md">
          <Group justify="space-between" align="center">
            <Group align="center">
              <IconMusic size={32} color="var(--mantine-color-grape-9)" />
              <Title order={2} c="grape.9">
                Goodsongs
              </Title>
            </Group>
            <Group>
              <Button
                component={Link}
                href="/login"
                variant="outline"
                size="md"
                color="grape"
              >
                Sign In
              </Button>
              <Button
                component={Link}
                href="/signup"
                size="md"
                color="grape.9"
              >
                Get Started
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>
      
      {/* Main Content */}
      <Container size="md" py="xl">
        <Center>
          <Stack align="center" gap="xl">
            <Title order={1} size="3rem" ta="center" c="grape.9">
              Welcome to Goodsongs
            </Title>
            <Text size="xl" ta="center" c="dimmed" maw={600}>
              Discover, organize, and share your music across all platforms. 
              Connect your Spotify, Apple Music, and more to create the ultimate music experience.
            </Text>
          </Stack>
        </Center>
      </Container>
    </Box>
  );
}
