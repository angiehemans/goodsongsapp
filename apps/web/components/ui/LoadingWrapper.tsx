import React from 'react';
import { Loader, Stack, Text, Center } from '@mantine/core';

interface LoadingWrapperProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingText?: string;
  errorText?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function LoadingWrapper({
  loading,
  error,
  children,
  loadingText = 'Loading...',
  errorText,
  size = 'md',
}: LoadingWrapperProps) {
  if (loading) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Loader size={size} color="grape" />
          <Text c="dimmed" size="sm">
            {loadingText}
          </Text>
        </Stack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Text c="red.6" size="sm" ta="center">
            {errorText || error}
          </Text>
        </Stack>
      </Center>
    );
  }

  return <>{children}</>;
}