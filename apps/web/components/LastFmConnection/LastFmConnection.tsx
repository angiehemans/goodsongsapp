'use client';

import { useEffect, useState } from 'react';
import { IconBrandLastfm, IconCheck } from '@tabler/icons-react';
import {
  Accordion,
  Alert,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
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
    <Paper p="md" radius="md" bg="grape.0" maw={700}>
      <Stack gap="sm">
        <Group gap="xs">
          <IconBrandLastfm size={20} color="var(--mantine-color-grape-6)" />
          <Title order={4} c="grape.8">
            Connect Your Last.fm
          </Title>
        </Group>

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
            color="grape"
            onClick={handleConnect}
            loading={connecting}
          >
            Connect
          </Button>
        </Group>

        <Accordion variant="subtle" chevronPosition="left">
          <Accordion.Item value="about">
            <Accordion.Control>
              <Text size="sm" c="dimmed">
                What is Last.fm?
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Text size="sm" c="dimmed">
                Last.fm is a service that tracks the music you listen to across all your streaming
                platforms. GoodSongs uses Last.fm to pull in your recently played songs so you can
                easily recommend tracks you're actually listening to. To get started, connect your
                Spotify, Apple Music, or other streaming services to your Last.fm account at{' '}
                <Text
                  component="a"
                  href="https://www.last.fm/about/trackmymusic"
                  target="_blank"
                  rel="noopener noreferrer"
                  c="grape.6"
                  td="underline"
                >
                  last.fm/about/trackmymusic
                </Text>
                .
              </Text>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </Stack>
    </Paper>
  );
}
