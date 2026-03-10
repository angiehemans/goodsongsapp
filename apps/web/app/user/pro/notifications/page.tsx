'use client';

import { Box, Stack } from '@mantine/core';
import { NotificationList } from '@/components/Notifications';

export default function ProNotificationsPage() {
  return (
    <Stack p="md" gap="md">
      <Box maw={700}>
        <NotificationList />
      </Box>
    </Stack>
  );
}
