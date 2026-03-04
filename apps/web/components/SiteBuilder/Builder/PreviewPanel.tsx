'use client';

import { useState } from 'react';
import { IconDeviceDesktop, IconDeviceMobile } from '@tabler/icons-react';
import { SegmentedControl, Box, Center, Text } from '@mantine/core';
import { useBuilderStore } from '@/lib/site-builder/store';
import { ProfilePage } from '../ProfilePage';

type PreviewMode = 'desktop' | 'mobile';

export function PreviewPanel() {
  const { theme, sections, sourceData } = useBuilderStore();
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');

  const previewWidth = previewMode === 'mobile' ? 390 : '100%';

  return (
    <div className="preview-panel">
      {/* Preview Controls */}
      <Box mb="md">
        <Center>
          <SegmentedControl
            value={previewMode}
            onChange={(value) => setPreviewMode(value as PreviewMode)}
            data={[
              {
                value: 'desktop',
                label: (
                  <Center style={{ gap: 6 }}>
                    <IconDeviceDesktop size={16} />
                    <span>Desktop</span>
                  </Center>
                ),
              },
              {
                value: 'mobile',
                label: (
                  <Center style={{ gap: 6 }}>
                    <IconDeviceMobile size={16} />
                    <span>Mobile</span>
                  </Center>
                ),
              },
            ]}
          />
        </Center>
      </Box>

      {/* Preview Container */}
      <div className="preview-container">
        <Box
          className="preview-container__inner"
          style={{
            width: previewWidth,
            margin: previewMode === 'mobile' ? '0 auto' : undefined,
            minHeight: '100vh',
          }}
        >
          {sections.length > 0 ? (
            <ProfilePage
              theme={theme}
              sections={sections}
              sourceData={sourceData}
              isPreview={true}
            />
          ) : (
            <Center h={400}>
              <Text c="dimmed">Add sections to see your profile preview</Text>
            </Center>
          )}
        </Box>
      </div>
    </div>
  );
}
