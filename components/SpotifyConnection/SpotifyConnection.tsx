'use client';

import { useEffect, useState } from 'react';
import { IconAlertCircle, IconBrandSpotify, IconCheck } from '@tabler/icons-react';
import { Alert, Button, Group, Loader, Paper, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { apiClient, SpotifyStatus } from '@/lib/api';

interface SpotifyConnectionProps {
  onConnectionChange?: (connected: boolean) => void;
}

export function SpotifyConnection({ onConnectionChange }: SpotifyConnectionProps) {
  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkSpotifyStatus();
  }, []);

  const checkSpotifyStatus = async () => {
    try {
      setLoading(true);
      const spotifyStatus = await apiClient.getSpotifyStatus();
      setStatus(spotifyStatus);
      onConnectionChange?.(spotifyStatus.connected);
    } catch (error) {
      console.error('Failed to check Spotify status:', error);
      // Assume not connected if we can't check status
      setStatus({ connected: false });
      onConnectionChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);

      // Get auth URL via AJAX with JWT token in headers (secure)
      const { auth_url } = await apiClient.getSpotifyConnectUrl();

      // Redirect in the same window to avoid popup/localStorage issues
      window.location.href = auth_url;
    } catch (error) {
      console.error('Failed to get Spotify connect URL:', error);
      notifications.show({
        title: 'Connection Failed',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get Spotify connection URL. Please try again.',
        color: 'red',
      });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await apiClient.disconnectSpotify();
      setStatus({ connected: false });
      onConnectionChange?.(false);

      notifications.show({
        title: 'Disconnected',
        message: 'Successfully disconnected from Spotify',
        color: 'blue',
      });
    } catch (error) {
      console.error('Failed to disconnect from Spotify:', error);
      notifications.show({
        title: 'Disconnection Failed',
        message: 'Failed to disconnect from Spotify. Please try again.',
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
          <Text size="sm">Checking Spotify connection...</Text>
        </Group>
      </Paper>
    );
  }

  if (status?.connected) {
    return (
      <Alert
        icon={<IconCheck size="1rem" />}
        title="Spotify Connected"
        color="green"
        variant="light"
        withCloseButton={false}
      >
        <Group justify="space-between" align="center">
          <Text size="sm">
            Your Spotify account is connected and we can show your recently played songs.
          </Text>
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
      title="Connect Your Spotify"
      color="grape"
      variant="light"
      withCloseButton={false}
      maw={700}
      my="md"
    >
      <Group justify="space-between" align="center">
        <Text size="sm">
          Connect your Spotify account to see your recently played songs on your dashboard.
        </Text>
        <Button
          leftSection={<IconBrandSpotify size={16} />}
          color="green"
          onClick={handleConnect}
          loading={connecting}
        >
          Connect Spotify
        </Button>
      </Group>
    </Alert>
  );
}
