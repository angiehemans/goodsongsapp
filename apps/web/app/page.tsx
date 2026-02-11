'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  IconCalendarEvent,
  IconChartBar,
  IconHeart,
  IconMail,
  IconMessageCircle,
  IconMusic,
  IconSearch,
  IconUsers,
} from '@tabler/icons-react';
import { Box, Button, Container, Flex, Grid, Group, Stack, Text, Title } from '@mantine/core';
import styles from './page.module.css';

export default function HomePage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <Box className={styles.page}>
      {/* Fixed Navigation */}
      <Box component="nav" className={styles.navbar}>
        <Container size="xl">
          <Flex justify="space-between" align="center" h={60}>
            <Link href="/" className={styles.logo}>
              <IconMusic size={24} />
              <Text fw={700} size="lg">
                goodsongs
              </Text>
            </Link>
            <Group gap="sm">
              <Button component={Link} href="/login" variant="outline" color="blue.9" size="sm">
                Log In
              </Button>
              <Button component={Link} href="/signup" color="blue.9" size="sm">
                Sign Up
              </Button>
            </Group>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box className={styles.hero}>
        <Container size="xl" className={styles.heroContent}>
          <div data-animate className={styles.animateSection}>
            <Stack align="center" gap={0}>
              <Title className={styles.heroTitle}>share some</Title>
              <Title className={styles.heroTitle}>goodsongs</Title>
              <Text size="lg" mt="xl" maw={600} ta="center" c="grape.7">
                A platform that brings artists and fans together. Share the songs you love. Discover
                your next obsession. Connect with the music community.
              </Text>
              <Group mt="xl" gap="md">
                <Button component={Link} href="/signup" size="lg" color="blue.9">
                  Start Discovering
                </Button>
                <Button component={Link} href="/login" size="lg" variant="outline" color="blue.9">
                  Log In
                </Button>
              </Group>
            </Stack>
          </div>
        </Container>
      </Box>

      {/* For Fans Section */}
      <Box className={styles.sectionLight} py={80}>
        <Container size="lg">
          <div data-animate className={styles.animateSection}>
            <Stack align="center" mb={60}>
              <Title order={2} size="3rem" ta="center" c="blue.9">
                For Fans
              </Title>
              <Text size="lg" c="grape.6" ta="center" maw={500}>
                Everything you need to share the music you love and discover what's next.
              </Text>
            </Stack>
          </div>

          <div data-animate className={styles.animateSection}>
            <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Box className={styles.featureCard}>
                <Box className={styles.featureIcon}>
                  <IconHeart size={32} />
                </Box>
                <Title order={3} size="1.5rem" c="blue.9" mb="sm">
                  Recommend Songs
                </Title>
                <Text c="grape.7">
                  Share the tracks you can't stop playing. Highlight what you love and help others
                  discover their next favorite song.
                </Text>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Box className={styles.featureCard}>
                <Box className={styles.featureIcon}>
                  <IconSearch size={32} />
                </Box>
                <Title order={3} size="1.5rem" c="blue.9" mb="sm">
                  Discover Music
                </Title>
                <Text c="grape.7">
                  Find your next obsession through community recommendations, trending tracks, and
                  personalized suggestions.
                </Text>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Box className={styles.featureCard}>
                <Box className={styles.featureIcon}>
                  <IconUsers size={32} />
                </Box>
                <Title order={3} size="1.5rem" c="blue.9" mb="sm">
                  Follow Friends
                </Title>
                <Text c="grape.7">
                  Follow friends and tastemakers to see what they're listening to. Build a feed of
                  recommendations from people you trust.
                </Text>
              </Box>
            </Grid.Col>
            </Grid>
          </div>
        </Container>
      </Box>

      {/* For Bands Section - Dark */}
      <Box className={styles.sectionDark} py={80}>
        <Container size="lg">
          <div data-animate className={styles.animateSection}>
            <Stack align="center" mb={60}>
              <Title order={2} size="3rem" ta="center" c="grape.0">
                For Bands
              </Title>
              <Text size="lg" c="blue.3" ta="center" maw={500}>
                Tools to manage your music career and connect with fans who love what you do.
              </Text>
            </Stack>
          </div>

          <div data-animate className={styles.animateSection}>
            <Grid gutter="xl">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box className={styles.featureCardDark}>
                <Box className={styles.featureIconDark}>
                  <IconMessageCircle size={28} />
                </Box>
                <Title order={3} size="1.25rem" c="grape.0" mb="xs">
                  See Fan Feedback
                </Title>
                <Text size="sm" c="blue.3">
                  Get real feedback from fans who love your music. See what aspects resonate most.
                </Text>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box className={styles.featureCardDark}>
                <Box className={styles.featureIconDark}>
                  <IconCalendarEvent size={28} />
                </Box>
                <Title order={3} size="1.25rem" c="grape.0" mb="xs">
                  Event Management
                </Title>
                <Text size="sm" c="blue.3">
                  List your shows, manage venues, and let fans know where to find you.
                </Text>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box className={styles.featureCardDark}>
                <Box className={styles.featureIconDark}>
                  <IconChartBar size={28} />
                </Box>
                <Title order={3} size="1.25rem" c="grape.0" mb="xs">
                  Fan Analytics
                </Title>
                <Text size="sm" c="blue.3">
                  Understand your audience. See who's recommending your music and where they're
                  located.
                </Text>
              </Box>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Box className={styles.featureCardDark}>
                <Box className={styles.featureIconDark}>
                  <IconMail size={28} />
                </Box>
                <Title order={3} size="1.25rem" c="grape.0" mb="xs">
                  Mailing Lists
                </Title>
                <Text size="sm" c="blue.3">
                  Build your mailing list and keep fans updated on new releases and shows.
                </Text>
              </Box>
            </Grid.Col>
            </Grid>
          </div>

          <div data-animate className={styles.animateSection}>
            <Flex justify="center" mt={60}>
              <Button component={Link} href="/signup" size="lg" color="grape.3" c="blue.9">
                Create Band Profile
              </Button>
            </Flex>
          </div>
        </Container>
      </Box>

      {/* Waitlist/CTA Section */}
      <Box className={styles.sectionLight} py={80}>
        <Container size="sm">
          <div data-animate className={styles.animateSection}>
            <Stack align="center">
              <Title order={2} size="2.5rem" ta="center" c="blue.9">
                Join the Community
              </Title>
              <Text size="lg" c="grape.6" ta="center" maw={450}>
                Sign up now to start sharing your favorite songs!
              </Text>

              <Group mt="xl" gap="lg">
                <Button component={Link} href="/signup" size="lg" color="blue.9">
                  Get Started Free
                </Button>
              </Group>
            </Stack>
          </div>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" className={styles.footer}>
        <Container size="lg">
          <div data-animate className={styles.animateSection}>
            <Grid gutter="xl" py={60}>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Group gap="sm" mb="md">
                <IconMusic size={28} color="var(--mantine-color-grape-0)" />
                <Text c="grape.0" fw={700} size="xl">
                  goodsongs
                </Text>
              </Group>
              <Text c="blue.3" size="sm">
                Where bands and fans belong. Share the music you love, discover what's next.
              </Text>
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 4 }}>
              <Text c="grape.0" fw={600} mb="md">
                Quick Links
              </Text>
              <Stack gap="xs">
                <Link href="/signup" className={styles.footerLink}>
                  Sign Up
                </Link>
                <Link href="/login" className={styles.footerLink}>
                  Log In
                </Link>
                <Link href="/discover" className={styles.footerLink}>
                  Discover
                </Link>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 4 }}>
              <Text c="grape.0" fw={600} mb="md">
                Legal
              </Text>
              <Stack gap="xs">
                <Link href="/about" className={styles.footerLink}>
                  About
                </Link>
                <Link href="/privacy" className={styles.footerLink}>
                  Privacy Policy
                </Link>
              </Stack>
            </Grid.Col>
            </Grid>
          </div>

          <Box className={styles.footerBottom}>
            <Text c="blue.4" size="sm" ta="center">
              &copy; 2026 Goodsongs. Made for music lovers, by music lovers.
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
