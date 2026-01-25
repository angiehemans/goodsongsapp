'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconLogout, IconMail } from '@tabler/icons-react';
import { Badge, Button, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

// Lazy load components
const LastFmConnection = lazy(() =>
  import('@/components/LastFmConnection/LastFmConnection').then((mod) => ({
    default: mod.LastFmConnection,
  }))
);

export default function SettingsPage() {
  const { user, logout, isBand, isFan, refreshUser } = useAuth();
  const router = useRouter();
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Countdown timer for retry
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const handleLogout = () => {
    logout();
    notifications.show({
      title: 'Logged out',
      message: 'See you next time!',
      color: 'blue',
    });
    router.push('/login');
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    try {
      const response = await apiClient.resendConfirmationEmail();
      notifications.show({
        title: 'Email sent',
        message: response.message || 'Confirmation email has been sent.',
        color: 'green',
      });
      if (response.retry_after) {
        setRetryAfter(response.retry_after);
      }
      // Refresh user to get updated can_resend_confirmation status
      await refreshUser();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send confirmation email';
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const canResend = user?.can_resend_confirmation && retryAfter === 0;

  return (
    <>
      <Title order={2} my="sm" c="blue.8" fw={500}>
        Settings
      </Title>

      <Stack gap="md">
        {/* Last.fm Connection - Only for fan accounts */}
        {isFan && (
          <Paper p="lg" radius="md" withBorder>
            <Title order={4} mb="md">
              Last.fm Connection
            </Title>
            <Suspense
              fallback={
                <Group>
                  <Loader size="sm" />
                  <Text size="sm">Loading Last.fm status...</Text>
                </Group>
              }
            >
              <LastFmConnection />
            </Suspense>
          </Paper>
        )}

        {/* Account Section */}
        <Paper p="lg" radius="md" withBorder>
          <Title order={4} mb="md">
            Account
          </Title>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start">
              <div>
                <Group gap="xs" mb={4}>
                  <Text fw={500}>Email</Text>
                  {user?.email_confirmed ? (
                    <Badge color="green" size="sm" leftSection={<IconCheck size={12} />}>
                      Confirmed
                    </Badge>
                  ) : (
                    <Badge color="orange" size="sm">
                      Unconfirmed
                    </Badge>
                  )}
                </Group>
                <Text size="sm" c="dimmed">
                  {user?.email}
                </Text>
              </div>
              {!user?.email_confirmed && (
                <Button
                  size="xs"
                  variant="light"
                  leftSection={<IconMail size={14} />}
                  onClick={handleResendConfirmation}
                  loading={resendLoading}
                  disabled={!canResend}
                >
                  {retryAfter > 0 ? `Resend (${retryAfter}s)` : 'Resend confirmation'}
                </Button>
              )}
            </Group>
          </Stack>
        </Paper>

        {/* Logout Section */}
        <Paper p="lg" radius="md" withBorder>
          <Group justify="space-between" align="center">
            <div>
              <Title order={4}>Sign Out</Title>
              <Text size="sm" c="dimmed">
                Sign out of your account on this device
              </Text>
            </div>
            <Button
              leftSection={<IconLogout size={16} />}
              variant="outline"
              color="red"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Group>
        </Paper>
      </Stack>
    </>
  );
}
