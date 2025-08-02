import { Container, Title, Text, Button, Stack } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container size="md" py="xl">
      <Stack align="center" gap="xl">
        <div>
          <Title order={1} size="4rem" ta="center" c="dimmed">
            404
          </Title>
          <Title order={2} ta="center" mb="md">
            User Not Found
          </Title>
          <Text size="lg" ta="center" c="dimmed" mb="xl">
            The user you're looking for doesn't exist or may have been removed.
          </Text>
        </div>
        
        <Button
          component={Link}
          href="/"
          leftSection={<IconArrowLeft size={16} />}
          variant="outline"
        >
          Back to Home
        </Button>
      </Stack>
    </Container>
  );
}