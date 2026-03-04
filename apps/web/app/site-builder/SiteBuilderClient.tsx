'use client';

import { useEffect, useRef } from 'react';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { notifications } from '@mantine/notifications';
import { Center, Loader, Text, Stack } from '@mantine/core';
import {
  ResponsiveBuilder,
  EditorPanel,
  PreviewPanel,
  Onboarding,
  useOnboarding,
} from '@/components/SiteBuilder/Builder';
import { useBuilderStore } from '@/lib/site-builder/store';
import { getProfileTheme } from '@/lib/site-builder/api';

export default function SiteBuilderClient() {
  const initialized = useRef(false);
  const { initialize, isLoading, setLoading, setError, error } = useBuilderStore();
  const { showOnboarding, checkFirstVisit, completeOnboarding, closeOnboarding } = useOnboarding();

  // Fetch theme from API on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function loadTheme() {
      setLoading(true);
      try {
        const response = await getProfileTheme();
        const data = response.data;

        initialize({
          theme: {
            background_color: data.background_color,
            brand_color: data.brand_color,
            font_color: data.font_color,
            header_font: data.header_font,
            body_font: data.body_font,
          },
          sections: data.sections,
          draftSections: data.draft_sections,
          config: data.config,
          sourceData: data.source_data,
        });

        // Check if user needs onboarding after data loads
        checkFirstVisit();
      } catch (err: any) {
        console.error('Failed to load profile theme:', err);
        setError(err.message || 'Failed to load profile theme');
        notifications.show({
          title: 'Error loading theme',
          message: err.message || 'Could not load your profile theme. Please try again.',
          color: 'red',
        });
      } finally {
        setLoading(false);
      }
    }

    loadTheme();
  }, [initialize, checkFirstVisit, setLoading, setError]);

  // Show loading state
  if (isLoading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading your profile...</Text>
        </Stack>
      </Center>
    );
  }

  // Show error state
  if (error) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Text c="red" fw={500}>Failed to load profile theme</Text>
          <Text c="dimmed" size="sm">{error}</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <ModalsProvider>
      <Notifications position="top-right" />
      <ResponsiveBuilder editor={<EditorPanel />} preview={<PreviewPanel />} />
      <Onboarding
        opened={showOnboarding}
        onClose={closeOnboarding}
        onComplete={completeOnboarding}
      />
    </ModalsProvider>
  );
}
