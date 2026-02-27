'use client';

import { ReactNode } from 'react';
import { Box, Flex, ScrollArea } from '@mantine/core';
import { PostEditorAside } from '@/components/Posts/PostEditorAside';
import { PostEditorProvider } from '@/components/Posts/PostEditorContext';

export default function PostEditorLayout({ children }: { children: ReactNode }) {
  return (
    <PostEditorProvider>
      <Flex h="calc(100vh - 60px)">
        <Box flex={1} style={{ overflow: 'hidden' }}>
          {children}
        </Box>
        <Box
          w={320}
          p="md"
          style={{
            borderLeft: 'var(--gs-border-width) solid var(--gs-border-default)',
            backgroundColor: 'var(--gs-bg-app)',
          }}
        >
          <ScrollArea h="100%">
            <PostEditorAside />
          </ScrollArea>
        </Box>
      </Flex>
    </PostEditorProvider>
  );
}
