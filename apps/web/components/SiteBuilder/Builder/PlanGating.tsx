'use client';

import { Alert, Button, Group, Text, Stack, Badge } from '@mantine/core';
import { IconLock, IconAlertTriangle } from '@tabler/icons-react';
import { useBuilderStore } from '@/lib/site-builder/store';
import { SectionType } from '@/lib/site-builder/types';
import { SECTION_LABELS } from '@/lib/site-builder/constants';

interface UpgradePromptProps {
  sectionType: SectionType;
  requiredPlan: string;
  onUpgrade?: () => void;
}

// Map plan keys to display names
const PLAN_DISPLAY_NAMES: Record<string, string> = {
  band_starter: 'Band Starter',
  band_pro: 'Band Pro',
  blogger: 'Blogger',
  blogger_pro: 'Blogger Pro',
};

export function UpgradePrompt({ sectionType, requiredPlan, onUpgrade }: UpgradePromptProps) {
  const planName = PLAN_DISPLAY_NAMES[requiredPlan] || requiredPlan;
  const sectionName = SECTION_LABELS[sectionType];

  return (
    <Alert
      icon={<IconLock size={18} />}
      color="grape"
      variant="light"
      title={`${sectionName} requires ${planName}`}
    >
      <Stack gap="sm">
        <Text size="sm">
          Upgrade to {planName} to add {sectionName.toLowerCase()} to your profile.
        </Text>
        <Group>
          <Button
            size="xs"
            variant="filled"
            onClick={onUpgrade}
            component="a"
            href="/settings/subscription"
          >
            View Plans
          </Button>
        </Group>
      </Stack>
    </Alert>
  );
}

interface HiddenSectionsBannerProps {
  hiddenSections: SectionType[];
  requiredPlan: string;
}

export function HiddenSectionsBanner({ hiddenSections, requiredPlan }: HiddenSectionsBannerProps) {
  if (hiddenSections.length === 0) return null;

  const planName = PLAN_DISPLAY_NAMES[requiredPlan] || requiredPlan;
  const sectionNames = hiddenSections.map((type) => SECTION_LABELS[type]).join(', ');

  return (
    <Alert
      icon={<IconAlertTriangle size={18} />}
      color="yellow"
      variant="light"
      mb="md"
    >
      <Stack gap="xs">
        <Text size="sm" fw={500}>
          Some sections are hidden
        </Text>
        <Text size="sm">
          The following sections require a higher plan: {sectionNames}. Your settings are saved and
          will reappear if you upgrade to {planName}.
        </Text>
        <Group>
          <Button
            size="xs"
            variant="light"
            color="yellow"
            component="a"
            href="/settings/subscription"
          >
            View Plans
          </Button>
        </Group>
      </Stack>
    </Alert>
  );
}

interface PlanBadgeProps {
  plan: string;
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const planName = PLAN_DISPLAY_NAMES[plan] || plan;

  const colorMap: Record<string, string> = {
    band_starter: 'blue',
    band_pro: 'grape',
    blogger: 'teal',
    blogger_pro: 'grape',
  };

  return (
    <Badge size="sm" variant="light" color={colorMap[plan] || 'gray'}>
      {planName}
    </Badge>
  );
}

// Hook to check section availability based on user's plan
export function usePlanGating() {
  const { config, sections } = useBuilderStore();

  const availableSectionTypes = config?.section_types || [];

  const isSectionAvailable = (type: SectionType): boolean => {
    return availableSectionTypes.includes(type);
  };

  const getRequiredPlanForSection = (type: SectionType): string | null => {
    // These sections require Pro plans
    if (type === 'mailing_list') return 'band_pro';
    if (type === 'merch') return 'band_pro';
    return null;
  };

  const getHiddenSections = (): SectionType[] => {
    return sections
      .filter((section) => !isSectionAvailable(section.type))
      .map((section) => section.type);
  };

  return {
    isSectionAvailable,
    getRequiredPlanForSection,
    getHiddenSections,
    availableSectionTypes,
  };
}
