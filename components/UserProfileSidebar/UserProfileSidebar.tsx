'use client';

import { Badge, Flex, Group, Spoiler, Stack, Text, Title } from '@mantine/core';
import { FollowButton } from '@/components/FollowButton/FollowButton';
import { ProfilePhoto } from '@/components/ProfilePhoto/ProfilePhoto';
import { UserProfile } from '@/lib/api';
import styles from './UserProfileSidebar.module.css';

interface UserProfileSidebarProps {
  profile: UserProfile;
  showFollowButton?: boolean;
  isOwnProfile?: boolean;
}

export function UserProfileSidebar({
  profile,
  showFollowButton = true,
  isOwnProfile = false,
}: UserProfileSidebarProps) {
  return (
    <Flex p="md" direction="column" gap="sm" className={styles.container}>
      <Group align="center">
        <ProfilePhoto
          src={profile.profile_image_url}
          alt={profile.username}
          size={72}
          fallback={profile.username}
        />
        <Stack gap="xs" flex={1}>
          <Title order={2} c="blue.8" fw={500} lh={1}>
            @{profile.username}
          </Title>
          {(profile.city || profile.region || profile.location) && (
            <Text c="blue.7" size="sm" lh={1}>
              {profile.city || profile.region
                ? [profile.city, profile.region].filter(Boolean).join(', ')
                : profile.location}
            </Text>
          )}
        </Stack>
      </Group>
      {profile.about_me && (
        <Spoiler
          maxHeight={60}
          showLabel="Read more"
          hideLabel="Show less"
          styles={{
            control: {
              fontSize: 'var(--mantine-font-size-sm)',
              color: 'var(--mantine-color-grape-4)',
            },
          }}
        >
          <Text c="gray.7" size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {profile.about_me}
          </Text>
        </Spoiler>
      )}
      <Group gap="xs">
        <Badge color="grape" variant="light" fw="500" tt="capitalize" bg="grape.1">
          {profile.reviews.length} recommendation{profile.reviews.length !== 1 ? 's' : ''}
        </Badge>
        {profile.followers_count !== undefined && (
          <Badge color="blue" variant="light" fw="500" tt="capitalize" bg="blue.1">
            {profile.followers_count} follower{profile.followers_count !== 1 ? 's' : ''}
          </Badge>
        )}
      </Group>
      {showFollowButton && !isOwnProfile && (
        <FollowButton
          userId={profile.id}
          initialIsFollowing={profile.is_following || false}
          mt="sm"
        />
      )}
    </Flex>
  );
}
