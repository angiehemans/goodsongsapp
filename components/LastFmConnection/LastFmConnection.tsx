'use client';

import { useEffect, useState } from 'react';
import { IconAlertCircle, IconBrandLastfm, IconCheck } from '@tabler/icons-react';
import { Alert, Button, Group, Loader, Paper, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiClient, LastFmStatus } from '@/lib/api';

interface LastFmConnectionProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function LastFmConnection({ onConnectionChange }: LastFmConnectionProps) {
  const [status, setStatus] = useState<LastFmStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    checkLastFmStatus();
  }, []);

  const checkLastFmStatus = async () => {
    try {
      setLoading(true);
      const lastFmStatus = await apiClient.getLastFmStatus();
      setStatus(lastFmStatus);
      onConnectionChange?.(lastFmStatus.connected);
    } catch (error) {
      console.error('Failed to check Last.fm status:', error);
      setStatus({ connected: false, username: null });
      onConnectionChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!username.trim()) {
      setUsernameError('Please enter your Last.fm username');
      return;
    }

    try {
      setConnecting(true);
      setUsernameError(null);

      const result = await apiClient.connectLastFm(username.trim());

      setStatus({
        connected: true,
        username: result.username,
        profile: result.profile,
      });
      onConnectionChange?.(true);
      setUsername('');

      notifications.show({
        title: 'Connected!',
        message: `Successfully connected to Last.fm as ${result.username}`,
        color: 'green',
      });
    } catch (error) {
      console.error('Failed to connect Last.fm:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Last.fm';
      setUsernameError(errorMessage);
      notifications.show({
        title: 'Connection Failed',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await apiClient.disconnectLastFm();
      setStatus({ connected: false, username: null });
      onConnectionChange?.(false);

      notifications.show({
        title: 'Disconnected',
        message: 'Successfully disconnected from Last.fm',
        color: 'blue',
      });
    } catch (error) {
      console.error('Failed to disconnect from Last.fm:', error);
      notifications.show({
        title: 'Disconnection Failed',
        message: 'Failed to disconnect from Last.fm. Please try again.',
        color: 'red',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Paper p="md" radius="md">
        <Group>
          <Loader size="sm" />
          <Text size="sm">Checking Last.fm connection...</Text>
        </Group>
      </Paper>
    );
  }

  if (status?.connected) {
    return (
      <Alert
        icon={<IconCheck size="1rem" />}
        title="Last.fm Connected"
        color="green"
        variant="light"
        withCloseButton={false}
      >
        <Group justify="space-between" align="center">
          <Stack gap={4}>
            <Text size="sm">
              Connected as <strong>{status.username}</strong>
            </Text>
            <Text size="xs" c="dimmed">
              Your recently played songs will appear on your dashboard.
            </Text>
          </Stack>
          <Button
            variant="outline"
            color="red"
            size="xs"
            onClick={handleDisconnect}
            loading={disconnecting}
          >
            Disconnect
          </Button>
        </Group>
      </Alert>
    );
  }

  return (
    <Alert
      icon={<IconAlertCircle size="1rem" />}
      title="Connect Your Last.fm"
      color="red"
      variant="light"
      withCloseButton={false}
      maw={700}
      my="md"
    >
      <Stack gap="sm">
        <Text size="sm">
          Connect your Last.fm account to see your recently played songs on your dashboard.
        </Text>
        <Group align="flex-end">
          <TextInput
            placeholder="Your Last.fm username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError(null);
            }}
            error={usernameError}
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConnect();
              }
            }}
          />
          <Button
            leftSection={<IconBrandLastfm size={16} />}
            color="red"
            onClick={handleConnect}
            loading={connecting}
          >
            Connect
          </Button>
        </Group>
      </Stack>
    </Alert>
  );
}
