import React from 'react';
import { Stack, Text, ThemeIcon, Button, Container } from '@mantine/core';
import { Icon, IconProps } from '@tabler/icons-react';

interface EmptyStateProps {
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    color?: string;
    variant?: string;
  };
  iconColor?: string;
  iconSize?: number;
}

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  iconColor = 'grape.6',
  iconSize = 48,
}: EmptyStateProps) {
  return (
    <Container size="xs">
      <Stack align="center" gap="lg" py="xl">
        <ThemeIcon size={80} radius="xl" color={iconColor} variant="light">
          <IconComponent size={iconSize} />
        </ThemeIcon>
        
        <Stack align="center" gap="xs">
          <Text size="xl" fw={600} ta="center">
            {title}
          </Text>
          <Text c="dimmed" ta="center" maw={400}>
            {description}
          </Text>
        </Stack>

        {action && (
          <Button
            size="md"
            color={action.color || 'grape'}
            variant={action.variant || 'filled'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </Stack>
    </Container>
  );
}