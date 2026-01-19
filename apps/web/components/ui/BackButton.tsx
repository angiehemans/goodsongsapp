import React from 'react';
import { Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

interface BackButtonProps {
  href: string;
  label?: string;
  variant?: string;
  size?: string;
  color?: string;
}

export function BackButton({
  href,
  label = 'Back',
  variant = 'subtle',
  size = 'sm',
  color = 'grape',
}: BackButtonProps) {
  return (
    <Button
      component={Link}
      href={href}
      variant={variant}
      size={size}
      color={color}
      leftSection={<IconArrowLeft size={16} />}
    >
      {label}
    </Button>
  );
}