'use client';

import Link from 'next/link';
import { IconMusic, IconUserPlus, IconLogin } from '@tabler/icons-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';

export default function NotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="xl" py="xl">
        <IconMusic size={80} color="var(--gs-text-muted)" stroke={1.5} />

        <Stack align="center" gap="xs">
          <Title order={1} ta="center" style={{ color: 'var(--gs-text-accent)' }}>
            Whoops! No one here...
          </Title>
          <Text size="lg" ta="center" c="dimmed" maw={400}>
            This user doesn't exist yet. Maybe they're still discovering their favorite songs?
          </Text>
        </Stack>

        <Stack align="center" gap="md" w="100%" maw={300}>
          <Text size="sm" c="dimmed" ta="center">
            Looking for your own profile?
          </Text>
          <Group grow w="100%">
            <Button
              component={Link}
              href="/login"
              variant="light"
              leftSection={<IconLogin size={18} />}
            >
              Log In
            </Button>
            <Button
              component={Link}
              href="/signup"
              variant="filled"
              leftSection={<IconUserPlus size={18} />}
            >
              Sign Up
            </Button>
          </Group>
        </Stack>

        <Text size="xs" c="dimmed" ta="center">
          Share your favorite songs with the world
        </Text>
      </Stack>
    </Container>
  );
}
