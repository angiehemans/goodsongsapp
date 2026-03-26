'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  IconBrandInstagram,
  IconBrandThreads,
  IconLink,
  IconAlertTriangle,
} from '@tabler/icons-react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, ConnectedAccount } from '@/lib/api';
import { useConnectedAccounts } from '@/lib/connectedAccounts';

function PersonalAccountMessage() {
  return (
    <Alert color="blue" variant="light">
      <Text size="sm">
        Auto-posting is only available for Instagram Business or Creator accounts.
        Switch your Instagram account type in the Instagram app to enable auto-posting.
      </Text>
    </Alert>
  );
}

interface PlatformRowProps {
  platform: 'threads' | 'instagram';
  account: ConnectedAccount | undefined;
  isBand: boolean;
}

function PlatformRow({ platform, account, isBand }: PlatformRowProps) {
  const { updatePreferences, disconnect } = useConnectedAccounts();
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Local toggle state (initialized from account)
  const [autoPostRecommendations, setAutoPostRecommendations] = useState(false);
  const [autoPostBandPosts, setAutoPostBandPosts] = useState(false);
  const [autoPostEvents, setAutoPostEvents] = useState(false);

  useEffect(() => {
    if (account) {
      setAutoPostRecommendations(account.auto_post_recommendations);
      setAutoPostBandPosts(account.auto_post_band_posts);
      setAutoPostEvents(account.auto_post_events);
    }
  }, [account]);

  const platformIcon = platform === 'threads'
    ? <IconBrandThreads size={20} />
    : <IconBrandInstagram size={20} />;
  const platformName = platform === 'threads' ? 'Threads' : 'Instagram';

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const { authorize_url } = await apiClient.getOAuthAuthorizeUrl(platform);
      window.location.href = authorize_url;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to connect ${platformName}`;
      notifications.show({ title: 'Error', message, color: 'red' });
      setIsConnecting(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      const prefs: {
        auto_post_recommendations?: boolean;
        auto_post_band_posts?: boolean;
        auto_post_events?: boolean;
      } = {};

      if (platform === 'threads' && !isBand) {
        prefs.auto_post_recommendations = autoPostRecommendations;
      } else if (isBand) {
        prefs.auto_post_band_posts = autoPostBandPosts;
        prefs.auto_post_events = autoPostEvents;
      }

      await updatePreferences(platform, prefs);
      notifications.show({
        title: 'Preferences saved',
        message: `${platformName} auto-post preferences updated.`,
        color: 'green',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save preferences';
      notifications.show({ title: 'Error', message, color: 'red' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to disconnect your ${platformName} account? Auto-posting will stop.`
    );
    if (!confirmed) return;

    setIsDisconnecting(true);
    try {
      await disconnect(platform);
      notifications.show({
        title: 'Disconnected',
        message: `${platformName} account disconnected.`,
        color: 'blue',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to disconnect ${platformName}`;
      notifications.show({ title: 'Error', message, color: 'red' });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Not connected state
  if (!account) {
    return (
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="sm">
          {platformIcon}
          <div>
            <Text fw={500}>{platformName}</Text>
            <Text size="sm" c="dimmed">Not connected</Text>
          </div>
        </Group>
        <Button
          variant="light"
          leftSection={<IconLink size={14} />}
          onClick={handleConnect}
          loading={isConnecting}
          size="sm"
        >
          Connect
        </Button>
      </Group>
    );
  }

  // Needs reauth state
  if (account.needs_reauth) {
    return (
      <Stack gap="sm">
        <Alert color="orange" icon={<IconAlertTriangle size={16} />} variant="light">
          <Text size="sm">
            Your {platformName} connection needs to be renewed. Please reconnect to continue auto-posting.
          </Text>
        </Alert>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            {platformIcon}
            <div>
              <Text fw={500}>{platformName}</Text>
              <Text size="sm" c="dimmed">@{account.platform_username}</Text>
            </div>
            <Badge color="orange" size="sm">Needs reconnection</Badge>
          </Group>
          <Group gap="xs">
            <Button
              variant="light"
              onClick={handleConnect}
              loading={isConnecting}
              size="sm"
            >
              Reconnect
            </Button>
            <Button
              variant="subtle"
              color="red"
              onClick={handleDisconnect}
              loading={isDisconnecting}
              size="sm"
            >
              Disconnect
            </Button>
          </Group>
        </Group>
      </Stack>
    );
  }

  // Connected state
  const isInstagramPersonal = platform === 'instagram' && account.account_type === 'PERSONAL';
  const showToggles = !isInstagramPersonal;

  // Determine which toggles to show
  const showRecommendationsToggle = platform === 'threads' && !isBand;
  const showBandToggles = isBand;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Group gap="sm">
          {platformIcon}
          <div>
            <Text fw={500}>{platformName}</Text>
            <Text size="sm" c="dimmed">@{account.platform_username}</Text>
          </div>
          <Badge color="green" size="sm">Connected</Badge>
        </Group>
        <Button
          variant="subtle"
          color="red"
          onClick={handleDisconnect}
          loading={isDisconnecting}
          size="sm"
        >
          Disconnect
        </Button>
      </Group>

      {isInstagramPersonal && <PersonalAccountMessage />}

      {showToggles && (
        <Stack gap="xs" pl={32}>
          {showRecommendationsToggle && (
            <Group justify="space-between">
              <Text size="sm">Auto-post recommendations</Text>
              <Switch
                checked={autoPostRecommendations}
                onChange={(e) => setAutoPostRecommendations(e.currentTarget.checked)}
              />
            </Group>
          )}
          {showBandToggles && (
            <>
              <Group justify="space-between">
                <Text size="sm">Auto-post band posts</Text>
                <Switch
                  checked={autoPostBandPosts}
                  onChange={(e) => setAutoPostBandPosts(e.currentTarget.checked)}
                />
              </Group>
              <Group justify="space-between">
                <Text size="sm">Auto-post events</Text>
                <Switch
                  checked={autoPostEvents}
                  onChange={(e) => setAutoPostEvents(e.currentTarget.checked)}
                />
              </Group>
            </>
          )}
          <Group justify="flex-end" mt="xs">
            <Button
              size="xs"
              onClick={handleSavePreferences}
              loading={isSaving}
            >
              Save preferences
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  );
}

export function ConnectedAccountsSection() {
  const { user, isBand } = useAuth();
  const { accounts, isLoading, hasFetched, fetchAccounts, getAccount } = useConnectedAccounts();

  useEffect(() => {
    if (!hasFetched && user) {
      fetchAccounts();
    }
  }, [hasFetched, user, fetchAccounts]);

  const threadsAccount = getAccount('threads');
  const instagramAccount = getAccount('instagram');

  return (
    <Paper p="lg" radius="md" withBorder>
      <Title order={4} mb="md">
        <Group gap="xs">
          <IconLink size={20} />
          Connected Accounts
        </Group>
      </Title>

      {isLoading && !hasFetched ? (
        <Group>
          <Loader size="sm" />
          <Text size="sm" c="dimmed">Loading connected accounts...</Text>
        </Group>
      ) : (
        <Stack gap="lg">
          <PlatformRow
            platform="threads"
            account={threadsAccount}
            isBand={isBand}
          />
          {isBand && (
            <PlatformRow
              platform="instagram"
              account={instagramAccount}
              isBand={isBand}
            />
          )}
        </Stack>
      )}
    </Paper>
  );
}
