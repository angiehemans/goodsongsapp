'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IconCheck, IconX, IconArrowLeft } from '@tabler/icons-react';
import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useConnectedAccounts } from '@/lib/connectedAccounts';
import { ConnectedAccountsSection } from '@/components/social/ConnectedAccountsSection';

function ConnectionsContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const platform = searchParams.get('platform');
  const { invalidate, fetchAccounts } = useConnectedAccounts();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setIsRefreshing(true);
      invalidate();
      fetchAccounts().finally(() => setIsRefreshing(false));
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const platformName = platform === 'threads' ? 'Threads' : platform === 'instagram' ? 'Instagram' : 'your account';

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group>
          <Button
            component={Link}
            href="/user/settings"
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            size="sm"
          >
            Back to Settings
          </Button>
        </Group>

        <Title order={2} style={{ color: 'var(--gs-text-heading)' }} fw={500}>
          Account Connection
        </Title>

        {status === 'success' && (
          <Alert color="green" icon={<IconCheck size={16} />} variant="light">
            <Text fw={500}>Successfully connected {platformName}!</Text>
            <Text size="sm" mt={4}>
              You can now configure your auto-posting preferences below.
            </Text>
          </Alert>
        )}

        {status === 'error' && (
          <Alert color="red" icon={<IconX size={16} />} variant="light">
            <Text fw={500}>Failed to connect {platformName}</Text>
            <Text size="sm" mt={4}>
              Something went wrong during the connection process. Please try again.
            </Text>
            <Button
              variant="light"
              color="red"
              size="sm"
              mt="sm"
              component={Link}
              href="/user/settings"
            >
              Try again
            </Button>
          </Alert>
        )}

        {isRefreshing ? (
          <Center py="lg">
            <Group>
              <Loader size="sm" />
              <Text size="sm" c="dimmed">Loading account details...</Text>
            </Group>
          </Center>
        ) : (
          status === 'success' && <ConnectedAccountsSection />
        )}
      </Stack>
    </Container>
  );
}

export default function ConnectionsCallbackPage() {
  return (
    <Suspense fallback={
      <Container size="sm" py="xl">
        <Center py="xl">
          <Loader size="md" />
        </Center>
      </Container>
    }>
      <ConnectionsContent />
    </Suspense>
  );
}
