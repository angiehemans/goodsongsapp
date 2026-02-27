import { ReactNode } from 'react';
import { Box, Center, Stack, Text } from '@mantine/core';

interface EmptyStateProps {
  /** Icon component to display */
  icon: ReactNode;
  /** Primary message (e.g., "No notifications yet") */
  title: string;
  /** Secondary description text */
  description?: string;
  /** Icon size in pixels */
  iconSize?: number;
  /** Icon container size in pixels */
  iconContainerSize?: number;
  /** Maximum width of the description text */
  maxWidth?: number;
  /** Optional action button or link */
  action?: ReactNode;
}

/**
 * A reusable empty state component for lists and data displays
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<IconBell size={36} color="var(--mantine-color-gray-5)" />}
 *   title="No notifications yet"
 *   description="When someone follows you, you'll see it here."
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  iconContainerSize = 80,
  maxWidth = 300,
  action,
}: EmptyStateProps) {
  return (
    <Center py="xl">
      <Stack align="center" gap="md">
        <Box
          style={{
            width: iconContainerSize,
            height: iconContainerSize,
            borderRadius: '50%',
            backgroundColor: 'var(--mantine-color-gray-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Text c="dimmed" ta="center" fw={500}>
          {title}
        </Text>
        {description && (
          <Text size="sm" c="dimmed" ta="center" maw={maxWidth}>
            {description}
          </Text>
        )}
        {action}
      </Stack>
    </Center>
  );
}
