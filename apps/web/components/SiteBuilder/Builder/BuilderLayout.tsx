'use client';

import { ReactNode, useEffect } from 'react';
import { Box, Loader, Center, Text, Stack } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import './builder.css';

interface BuilderLayoutProps {
  editor: ReactNode;
  preview: ReactNode;
}

export function BuilderLayout({ editor, preview }: BuilderLayoutProps) {
  const { isLoading, error, hasUnsavedChanges } = useBuilderStore();

  // Warn on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading builder...</Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Text c="red" size="lg">
            {error}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <div className="builder-layout">
      <aside className="builder-layout__editor">{editor}</aside>
      <main className="builder-layout__preview">{preview}</main>
    </div>
  );
}
