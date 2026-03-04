'use client';

import { useState, useCallback } from 'react';
import {
  Modal,
  Stack,
  Text,
  Title,
  Button,
  Group,
  Stepper,
  ThemeIcon,
  Box,
  List,
} from '@mantine/core';
import {
  IconPalette,
  IconLayoutList,
  IconEye,
  IconRocket,
  IconCheck,
} from '@tabler/icons-react';

interface OnboardingProps {
  opened: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function Onboarding({ opened, onClose, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      centered
      withCloseButton={false}
      closeOnClickOutside={false}
    >
      <Stack gap="lg" p="md">
        <Stepper active={step} size="xs">
          <Stepper.Step icon={<IconPalette size={16} />} />
          <Stepper.Step icon={<IconLayoutList size={16} />} />
          <Stepper.Step icon={<IconEye size={16} />} />
          <Stepper.Step icon={<IconRocket size={16} />} />
        </Stepper>

        {step === 0 && (
          <Stack gap="md" ta="center">
            <ThemeIcon size={60} radius="xl" variant="light" color="grape">
              <IconPalette size={30} />
            </ThemeIcon>
            <Title order={2}>Welcome to the Profile Builder</Title>
            <Text c="dimmed">
              Create a stunning profile page that showcases your music, events, and content. Let's
              get you started with a quick tour.
            </Text>
            <Box ta="left" mx="auto" maw={400}>
              <List spacing="sm" size="sm">
                <List.Item icon={<IconCheck size={16} color="var(--mantine-color-green-6)" />}>
                  Customize colors and fonts to match your brand
                </List.Item>
                <List.Item icon={<IconCheck size={16} color="var(--mantine-color-green-6)" />}>
                  Add and arrange sections with drag & drop
                </List.Item>
                <List.Item icon={<IconCheck size={16} color="var(--mantine-color-green-6)" />}>
                  Preview your changes in real-time
                </List.Item>
              </List>
            </Box>
          </Stack>
        )}

        {step === 1 && (
          <Stack gap="md" ta="center">
            <ThemeIcon size={60} radius="xl" variant="light" color="blue">
              <IconPalette size={30} />
            </ThemeIcon>
            <Title order={2}>Customize Your Theme</Title>
            <Text c="dimmed">
              Start by setting your brand colors and fonts. These will apply to your entire profile
              and create a cohesive look.
            </Text>
            <Box ta="left" mx="auto" maw={400}>
              <List spacing="sm" size="sm">
                <List.Item>
                  <strong>Background color</strong> - The main page background
                </List.Item>
                <List.Item>
                  <strong>Brand color</strong> - Buttons, links, and accents
                </List.Item>
                <List.Item>
                  <strong>Text color</strong> - All text on your profile
                </List.Item>
                <List.Item>
                  <strong>Fonts</strong> - Headers and body text styles
                </List.Item>
              </List>
            </Box>
          </Stack>
        )}

        {step === 2 && (
          <Stack gap="md" ta="center">
            <ThemeIcon size={60} radius="xl" variant="light" color="teal">
              <IconLayoutList size={30} />
            </ThemeIcon>
            <Title order={2}>Arrange Your Sections</Title>
            <Text c="dimmed">
              Your profile is made up of sections. Drag and drop to reorder them, toggle visibility,
              and customize each section's content.
            </Text>
            <Box ta="left" mx="auto" maw={400}>
              <List spacing="sm" size="sm">
                <List.Item>
                  <strong>Drag handle</strong> - Reorder sections by dragging
                </List.Item>
                <List.Item>
                  <strong>Eye icon</strong> - Show or hide a section
                </List.Item>
                <List.Item>
                  <strong>Expand</strong> - Click a section to edit its settings
                </List.Item>
                <List.Item>
                  <strong>Add Section</strong> - Add new sections to your profile
                </List.Item>
              </List>
            </Box>
          </Stack>
        )}

        {step === 3 && (
          <Stack gap="md" ta="center">
            <ThemeIcon size={60} radius="xl" variant="light" color="grape">
              <IconRocket size={30} />
            </ThemeIcon>
            <Title order={2}>Save & Publish</Title>
            <Text c="dimmed">
              Your changes are saved as a draft until you publish. This lets you experiment without
              affecting your live profile.
            </Text>
            <Box ta="left" mx="auto" maw={400}>
              <List spacing="sm" size="sm">
                <List.Item>
                  <strong>Save Draft</strong> - Save your work without publishing
                </List.Item>
                <List.Item>
                  <strong>Publish</strong> - Make your changes live for everyone to see
                </List.Item>
                <List.Item>
                  <strong>Discard</strong> - Revert to your last published version
                </List.Item>
              </List>
            </Box>
          </Stack>
        )}

        <Group justify="space-between" mt="md">
          <Button variant="subtle" color="gray" onClick={handleSkip}>
            Skip tour
          </Button>
          <Group>
            {step > 0 && (
              <Button variant="default" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button onClick={handleNext}>{step === 3 ? "Let's go!" : 'Next'}</Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}

// Hook to manage onboarding state
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const checkFirstVisit = useCallback(() => {
    if (typeof window === 'undefined') return;

    const hasSeenOnboarding = localStorage.getItem('profile_builder_onboarding_complete');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem('profile_builder_onboarding_complete', 'true');
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem('profile_builder_onboarding_complete');
    setShowOnboarding(true);
  }, []);

  const closeOnboarding = useCallback(() => setShowOnboarding(false), []);

  return {
    showOnboarding,
    checkFirstVisit,
    completeOnboarding,
    resetOnboarding,
    closeOnboarding,
  };
}
