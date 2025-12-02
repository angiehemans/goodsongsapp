'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
  Center,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUsers, IconMicrophone2 } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, AccountType } from '@/lib/api';

export default function OnboardingPage() {
  const { user, isLoading, refreshUser, isOnboardingComplete, isBand } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user && isOnboardingComplete) {
      const dashboard = isBand ? '/user/band-dashboard' : '/user/dashboard';
      router.push(dashboard);
    }
  }, [user, isLoading, isOnboardingComplete, isBand, router]);

  // If account type is set but onboarding not complete, redirect to appropriate profile page
  // Only redirect if account_type is explicitly 'fan' or 'band' (not null/undefined/empty)
  useEffect(() => {
    if (!isLoading && user && !isOnboardingComplete) {
      const accountType = user.account_type;
      if (accountType === 'fan') {
        router.push('/onboarding/fan-profile');
      } else if (accountType === 'band') {
        router.push('/onboarding/band-profile');
      }
      // If account_type is null/undefined, stay on this page to let user choose
    }
  }, [user, isLoading, isOnboardingComplete, router]);

  const handleContinue = async () => {
    if (!selectedType || !user) return;

    setSubmitting(true);
    try {
      await apiClient.setAccountType({ account_type: selectedType });

      // Navigate to the appropriate profile completion page
      const targetPage = selectedType === 'fan' ? '/onboarding/fan-profile' : '/onboarding/band-profile';

      // Use window.location for a hard navigation to ensure it works
      window.location.href = targetPage;
    } catch (error) {
      console.error('Failed to set account type:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to set account type',
        color: 'red',
      });
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container size={600} my={40}>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  // If account type already selected (fan or band), show loading while redirecting
  if ((user.account_type === 'fan' || user.account_type === 'band') && !isOnboardingComplete) {
    return (
      <Container size={600} my={40}>
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size={600} my={40}>
      <Stack gap="xl">
        <Stack gap="xs" ta="center">
          <Title order={1} c="grape.8">
            Welcome to Goodsongs!
          </Title>
          <Text c="dimmed" size="lg">
            What brings you here today?
          </Text>
        </Stack>

        <Stack gap="md">
          <Card
            p="xl"
            radius="md"
            withBorder
            style={{
              cursor: 'pointer',
              borderColor: selectedType === 'fan' ? 'var(--mantine-color-grape-6)' : undefined,
              borderWidth: selectedType === 'fan' ? 2 : 1,
              backgroundColor: selectedType === 'fan' ? 'var(--mantine-color-grape-0)' : undefined,
            }}
            onClick={() => setSelectedType('fan')}
          >
            <Group>
              <IconUsers size={48} color="var(--mantine-color-grape-6)" />
              <Stack gap="xs" style={{ flex: 1 }}>
                <Title order={3}>I'm a Fan</Title>
                <Text size="sm" c="dimmed">
                  Discover new music, connect your Spotify account, and share your favorite song recommendations with the community.
                </Text>
                <Group gap="xs" mt="xs">
                  <Text size="xs" c="grape.6" fw={500}>
                    Connect Spotify
                  </Text>
                  <Text size="xs" c="dimmed">•</Text>
                  <Text size="xs" c="grape.6" fw={500}>
                    Write Recommendations
                  </Text>
                  <Text size="xs" c="dimmed">•</Text>
                  <Text size="xs" c="grape.6" fw={500}>
                    Discover Music
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Card>

          <Card
            p="xl"
            radius="md"
            withBorder
            style={{
              cursor: 'pointer',
              borderColor: selectedType === 'band' ? 'var(--mantine-color-grape-6)' : undefined,
              borderWidth: selectedType === 'band' ? 2 : 1,
              backgroundColor: selectedType === 'band' ? 'var(--mantine-color-grape-0)' : undefined,
            }}
            onClick={() => setSelectedType('band')}
          >
            <Group>
              <IconMicrophone2 size={48} color="var(--mantine-color-grape-6)" />
              <Stack gap="xs" style={{ flex: 1 }}>
                <Title order={3}>I'm a Band / Artist</Title>
                <Text size="sm" c="dimmed">
                  Manage your band profile, track recommendations from fans, and connect with your audience.
                </Text>
                <Group gap="xs" mt="xs">
                  <Text size="xs" c="grape.6" fw={500}>
                    Band Profile
                  </Text>
                  <Text size="xs" c="dimmed">•</Text>
                  <Text size="xs" c="grape.6" fw={500}>
                    Track Recommendations
                  </Text>
                  <Text size="xs" c="dimmed">•</Text>
                  <Text size="xs" c="grape.6" fw={500}>
                    Connect with Fans
                  </Text>
                </Group>
              </Stack>
            </Group>
          </Card>
        </Stack>

        <Button
          size="lg"
          fullWidth
          color="grape.9"
          disabled={!selectedType}
          loading={submitting}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </Stack>
    </Container>
  );
}
