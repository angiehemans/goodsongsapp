import React from 'react';
import { Paper, Group, Avatar, Stack, Title, Text, Badge, ActionIcon } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';

interface ProfileHeaderProps {
  name: string;
  imageUrl?: string;
  fallbackText: string;
  subtitle?: string;
  description?: string;
  metadata?: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  badges?: Array<{
    label: string;
    color?: string;
    variant?: string;
  }>;
  actions?: React.ReactNode;
  onEdit?: () => void;
  editable?: boolean;
}

export function ProfileHeader({
  name,
  imageUrl,
  fallbackText,
  subtitle,
  description,
  metadata = [],
  badges = [],
  actions,
  onEdit,
  editable = false,
}: ProfileHeaderProps) {
  return (
    <Paper p="lg" radius="md" withBorder>
      <Group align="flex-start">
        <Avatar size="xl" src={imageUrl} color="grape">
          {fallbackText}
        </Avatar>
        
        <Stack gap="xs" flex={1}>
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={1} size="h2">
                {name}
              </Title>
              {subtitle && (
                <Text c="dimmed" size="sm">
                  {subtitle}
                </Text>
              )}
            </div>
            
            <Group gap="xs">
              {editable && onEdit && (
                <ActionIcon
                  variant="subtle"
                  color="grape"
                  onClick={onEdit}
                  aria-label="Edit profile"
                >
                  <IconEdit size={16} />
                </ActionIcon>
              )}
              {actions}
            </Group>
          </Group>

          {description && (
            <Text size="sm" lineClamp={3}>
              {description}
            </Text>
          )}

          {metadata.length > 0 && (
            <Group gap="md">
              {metadata.map((item, index) => (
                <Text key={index} size="sm">
                  <Text span fw={500} c={item.color}>
                    {item.value}
                  </Text>{' '}
                  <Text span c="dimmed">
                    {item.label}
                  </Text>
                </Text>
              ))}
            </Group>
          )}

          {badges.length > 0 && (
            <Group gap="xs">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  size="sm"
                  color={badge.color}
                  variant={badge.variant || 'light'}
                >
                  {badge.label}
                </Badge>
              ))}
            </Group>
          )}
        </Stack>
      </Group>
    </Paper>
  );
}