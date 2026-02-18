'use client';

import { useEffect, useState } from 'react';
import { IconAlertCircle, IconBrandDiscord, IconMail } from '@tabler/icons-react';
import { Alert, Button, Drawer, Group, Text, Center, Loader } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { FollowingFeed } from '@/components/FollowingFeed/FollowingFeed';
import { RecentlyPlayed } from '@/components/RecentlyPlayed/RecentlyPlayed';
import { RecommendationForm } from '@/components/RecommendationForm/RecommendationForm';
import { useAuth } from '@/hooks/useAuth';
import { useUserLayout } from '../../UserLayoutContext';
import { apiClient } from '@/lib/api';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { recentlyPlayedTracks, followingFeedItems, isDataLoading } = useUserLayout();

  // Email confirmation resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  // Drawer state for new recommendation
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [formPrefill, setFormPrefill] = useState<{
    song_name?: string;
    band_name?: string;
    artwork_url?: string;
  } | null>(null);

  // Countdown timer for email resend retry
  useEffect(() => {
    if (retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

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

  // Drawer handlers
  const handleOpenNewRecommendation = (prefill: {
    song_name?: string;
    band_name?: string;
    artwork_url?: string;
  }) => {
    setFormPrefill(prefill);
    openDrawer();
  };

  const handleRecommendationSuccess = () => {
    closeDrawer();
    setFormPrefill(null);
  };

  // Show loading state while fetching dashboard
  if (isDataLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <>
      {/* Email Confirmation Warning */}
      {user && user.email_confirmed === false && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Please confirm your email address"
          color="orange"
          mb="md"
          maw={700}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Text size="sm">
              We sent a confirmation email to {user.email}. Please check your inbox and click the
              link to confirm your account.
            </Text>
            <Button
              size="xs"
              variant="light"
              color="orange"
              leftSection={<IconMail size={14} />}
              onClick={handleResendConfirmation}
              loading={resendLoading}
              disabled={!canResend}
            >
              {retryAfter > 0 ? `Resend (${retryAfter}s)` : 'Resend email'}
            </Button>
          </Group>
        </Alert>
      )}

      {/* Recently Played Section - data from UserLayoutContext */}
      <RecentlyPlayed
        onRecommendTrack={handleOpenNewRecommendation}
        initialTracks={recentlyPlayedTracks.length > 0 ? recentlyPlayedTracks : undefined}
      />

      {/* Discord Notice */}
      <Alert bg="blue.0" my="md" maw={700}>
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Text size="sm">
            Want to give us feedback or join the Android beta test? Join our Discord community!
          </Text>
          <Button
            size="xs"
            variant="light"
            color="blue"
            component="a"
            href="https://discord.gg/33MCPDwws"
            target="_blank"
            rel="noopener noreferrer"
            leftSection={<IconBrandDiscord size={14} />}
          >
            Join Discord
          </Button>
        </Group>
      </Alert>

      {/* Following Feed - data from UserLayoutContext */}
      <FollowingFeed
        title="From People You Follow"
        initialFeedItems={followingFeedItems.length > 0 ? followingFeedItems : undefined}
      />

      {/* New Recommendation Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={() => {
          closeDrawer();
          setFormPrefill(null);
        }}
        title="New Recommendation"
        position="right"
        size="lg"
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <RecommendationForm
          initialValues={formPrefill || undefined}
          onSuccess={handleRecommendationSuccess}
          onCancel={() => {
            closeDrawer();
            setFormPrefill(null);
          }}
          showPrefilledAlert={!!formPrefill?.song_name || !!formPrefill?.band_name}
        />
      </Drawer>
    </>
  );
}
