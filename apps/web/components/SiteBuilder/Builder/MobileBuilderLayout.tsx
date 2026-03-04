'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Box, SegmentedControl, Center, Stack, Text, Alert, Loader } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconEdit, IconEye, IconDeviceDesktop } from '@tabler/icons-react';
import { useBuilderStore } from '@/lib/site-builder/store';
import './builder.css';

interface MobileBuilderLayoutProps {
  editor: ReactNode;
  preview: ReactNode;
}

type MobileTab = 'edit' | 'preview';

export function MobileBuilderLayout({ editor, preview }: MobileBuilderLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('edit');
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
    <div className="mobile-builder-layout">
      {/* Desktop suggestion banner */}
      <Alert
        icon={<IconDeviceDesktop size={16} />}
        color="blue"
        variant="light"
        className="mobile-builder-layout__banner"
      >
        <Text size="sm">
          For the best experience, use the profile builder on a desktop or laptop.
        </Text>
      </Alert>

      {/* Tab switcher */}
      <Box className="mobile-builder-layout__tabs">
        <SegmentedControl
          value={activeTab}
          onChange={(value) => setActiveTab(value as MobileTab)}
          fullWidth
          data={[
            {
              value: 'edit',
              label: (
                <Center style={{ gap: 8 }}>
                  <IconEdit size={16} />
                  <span>Edit</span>
                </Center>
              ),
            },
            {
              value: 'preview',
              label: (
                <Center style={{ gap: 8 }}>
                  <IconEye size={16} />
                  <span>Preview</span>
                </Center>
              ),
            },
          ]}
        />
      </Box>

      {/* Content area */}
      <div className="mobile-builder-layout__content">
        {activeTab === 'edit' ? (
          <div className="mobile-builder-layout__editor">{editor}</div>
        ) : (
          <div className="mobile-builder-layout__preview">{preview}</div>
        )}
      </div>
    </div>
  );
}
