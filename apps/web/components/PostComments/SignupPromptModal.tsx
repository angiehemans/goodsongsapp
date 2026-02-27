'use client';

import { IconCheck, IconUserPlus } from '@tabler/icons-react';
import { Button, Group, Modal, Stack, Text, ThemeIcon, Title } from '@mantine/core';

interface SignupPromptModalProps {
  opened: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
}

export function SignupPromptModal({ opened, onClose, onCreateAccount }: SignupPromptModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon color="green" size="lg" radius="xl">
            <IconCheck size={20} />
          </ThemeIcon>
          <Title order={4}>Comment Posted!</Title>
        </Group>
      }
      centered
      size="sm"
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          Your comment has been posted successfully. Create a Goodsongs account to:
        </Text>

        <Stack gap="xs">
          <Group gap="xs">
            <Text size="sm">Edit or delete your comments</Text>
          </Group>
          <Group gap="xs">
            <Text size="sm">Get notified when someone replies</Text>
          </Group>
          <Group gap="xs">
            <Text size="sm">Like posts and comments</Text>
          </Group>
          <Group gap="xs">
            <Text size="sm">Follow your favorite bloggers</Text>
          </Group>
        </Stack>

        <Stack gap="sm">
          <Button
            color="grape"
            leftSection={<IconUserPlus size={18} />}
            onClick={onCreateAccount}
            fullWidth
          >
            Create Account
          </Button>
          <Button variant="subtle" color="gray" onClick={onClose} fullWidth>
            Maybe Later
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
