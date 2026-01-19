'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { IconUsers } from '@tabler/icons-react';
import {
  Center,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Tabs,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { apiClient, FollowUser } from '@/lib/api';
import styles from './FollowersList.module.css';

interface FollowersListProps {
  followersCount?: number;
  followingCount?: number;
}

function UserListItem({ user }: { user: FollowUser }) {
  return (
    <UnstyledButton
      component={Link}
      href={`/users/${user.username}`}
      className={styles.userItem}
    >
      <Group gap="sm">
        <ProfilePhoto
          src={user.profile_image_url}
          alt={user.username}
          size={40}
          fallback={user.username}
        />
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            @{user.username}
          </Text>
          {(user.city || user.region) && (
            <Text size="xs" c="dimmed">
              {[user.city, user.region].filter(Boolean).join(', ')}
            </Text>
          )}
        </Stack>
      </Group>
    </UnstyledButton>
  );
}

export function FollowersList({ followersCount = 0, followingCount = 0 }: FollowersListProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [activeTab, setActiveTab] = useState<string | null>('followers');
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(false);

  const fetchFollowers = useCallback(async () => {
    setIsLoadingFollowers(true);
    try {
      const data = await apiClient.getFollowers();
      setFollowers(data);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
      notifications.show({
        title: 'Error',
        message: 'Could not load followers. Please try again.',
        color: 'red',
      });
    } finally {
      setIsLoadingFollowers(false);
    }
  }, []);

  const fetchFollowing = useCallback(async () => {
    setIsLoadingFollowing(true);
    try {
      const data = await apiClient.getFollowing();
      setFollowing(data);
    } catch (error) {
      console.error('Failed to fetch following:', error);
      notifications.show({
        title: 'Error',
        message: 'Could not load following. Please try again.',
        color: 'red',
      });
    } finally {
      setIsLoadingFollowing(false);
    }
  }, []);

  useEffect(() => {
    if (opened) {
      fetchFollowers();
      fetchFollowing();
    }
  }, [opened, fetchFollowers, fetchFollowing]);

  return (
    <>
      <Group gap="md" className={styles.statsContainer}>
        <UnstyledButton onClick={open} className={styles.statButton}>
          <Text size="sm" c="dimmed">
            <Text component="span" fw={600} c="dark">
              {followersCount}
            </Text>{' '}
            followers
          </Text>
        </UnstyledButton>
        <UnstyledButton onClick={open} className={styles.statButton}>
          <Text size="sm" c="dimmed">
            <Text component="span" fw={600} c="dark">
              {followingCount}
            </Text>{' '}
            following
          </Text>
        </UnstyledButton>
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        title="Connections"
        size="sm"
        centered
      >
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab value="followers">Followers ({followers.length})</Tabs.Tab>
            <Tabs.Tab value="following">Following ({following.length})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="followers" pt="md">
            {isLoadingFollowers ? (
              <Center py="xl">
                <Loader size="sm" />
              </Center>
            ) : followers.length === 0 ? (
              <Paper p="lg" radius="md">
                <Center py="md">
                  <Stack align="center" gap="xs">
                    <IconUsers size={32} color="var(--mantine-color-dimmed)" />
                    <Text c="dimmed" size="sm" ta="center">
                      No followers yet
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            ) : (
              <Stack gap="xs">
                {followers.map((user) => (
                  <UserListItem key={user.id} user={user} />
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="following" pt="md">
            {isLoadingFollowing ? (
              <Center py="xl">
                <Loader size="sm" />
              </Center>
            ) : following.length === 0 ? (
              <Paper p="lg" radius="md">
                <Center py="md">
                  <Stack align="center" gap="xs">
                    <IconUsers size={32} color="var(--mantine-color-dimmed)" />
                    <Text c="dimmed" size="sm" ta="center">
                      Not following anyone yet
                    </Text>
                  </Stack>
                </Center>
              </Paper>
            ) : (
              <Stack gap="xs">
                {following.map((user) => (
                  <UserListItem key={user.id} user={user} />
                ))}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  );
}
