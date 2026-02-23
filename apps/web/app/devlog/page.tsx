'use client';

import Link from 'next/link';
import {
  IconBrandAndroid,
  IconCalendarEvent,
  IconCheck,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconHome,
  IconKey,
  IconMusic,
  IconRadar,
  IconRocket,
  IconSearch,
  IconUser,
  IconUsers,
  IconVinyl,
} from '@tabler/icons-react';
import { Box, Container, Flex, Grid, Group, Stack, Text, Title } from '@mantine/core';
import styles from './page.module.css';

type Platform = 'web' | 'mobile' | 'both';

interface Feature {
  name: string;
  description: string;
  platform: Platform;
}

interface FeatureCategory {
  title: string;
  icon: React.ReactNode;
  features: Feature[];
}

interface RoadmapItem {
  title: string;
  description: string;
  items: string[];
}

const builtFeatures: FeatureCategory[] = [
  {
    title: 'Authentication & Accounts',
    icon: <IconKey size={24} />,
    features: [
      {
        name: 'User Registration',
        description: 'Email-based signup with password confirmation',
        platform: 'both',
      },
      {
        name: 'User Login',
        description: 'Secure email and password authentication',
        platform: 'both',
      },
      {
        name: 'Email Confirmation',
        description: 'Verify email with resend capability',
        platform: 'both',
      },
      {
        name: 'Account Type Selection',
        description: 'Choose between fan or band account',
        platform: 'both',
      },
      { name: 'Profile Onboarding', description: 'Guided setup for new users', platform: 'both' },
    ],
  },
  {
    title: 'User Profiles',
    icon: <IconUser size={24} />,
    features: [
      {
        name: 'Profile Picture Upload',
        description: 'Upload and manage profile images',
        platform: 'both',
      },
      { name: 'Profile Information', description: 'Edit bio, city, and region', platform: 'both' },
      {
        name: 'View User Profiles',
        description: "See other users' profiles and reviews",
        platform: 'both',
      },
      {
        name: 'Followers & Following',
        description: 'Track follower counts and lists',
        platform: 'both',
      },
    ],
  },
  {
    title: 'Social Features',
    icon: <IconUsers size={24} />,
    features: [
      {
        name: 'Follow/Unfollow Users',
        description: 'Build your network of music lovers',
        platform: 'both',
      },
      {
        name: 'Like Reviews',
        description: 'Show appreciation for recommendations',
        platform: 'both',
      },
      {
        name: 'Comment on Reviews',
        description: 'Discuss and engage with recommendations',
        platform: 'both',
      },
      {
        name: 'Notifications',
        description: 'Get notified for follows, likes, and comments',
        platform: 'both',
      },
      {
        name: 'Following Feed',
        description: 'See reviews from people you follow',
        platform: 'both',
      },
    ],
  },
  {
    title: 'Reviews & Content',
    icon: <IconVinyl size={24} />,
    features: [
      {
        name: 'Create Reviews',
        description: 'Write reviews with song details and artwork',
        platform: 'both',
      },
      {
        name: 'Review Details Page',
        description: 'View full review with comments and likes',
        platform: 'both',
      },
      {
        name: 'Liked Aspects Tags',
        description: 'Highlight what you love about a song',
        platform: 'both',
      },
      {
        name: 'Song Links',
        description: 'Link to Spotify, Apple Music, and more',
        platform: 'both',
      },
    ],
  },
  {
    title: 'Band Features',
    icon: <IconMusic size={24} />,
    features: [
      { name: 'Create Bands', description: 'Create and name your band profiles', platform: 'both' },
      {
        name: 'Band Profiles',
        description: 'Manage bio, location, and profile picture',
        platform: 'both',
      },
      {
        name: 'Music Platform Links',
        description: 'Add Spotify, Bandcamp, Apple Music links',
        platform: 'both',
      },
      {
        name: 'Bandcamp Embeds',
        description: 'Embed Bandcamp players on band pages',
        platform: 'both',
      },
      {
        name: 'Band Dashboard',
        description: 'Manage your band from a central hub',
        platform: 'both',
      },
    ],
  },
  {
    title: 'Events',
    icon: <IconCalendarEvent size={24} />,
    features: [
      {
        name: 'Create Events',
        description: 'Add shows with date, venue, and details',
        platform: 'both',
      },
      {
        name: 'Event Details',
        description: 'View full event info with tickets and pricing',
        platform: 'both',
      },
      {
        name: 'Venue Management',
        description: 'Create venues with addresses and coordinates',
        platform: 'both',
      },
      { name: 'Discover Events', description: 'Browse upcoming shows', platform: 'both' },
    ],
  },
  {
    title: 'Music Integration',
    icon: <IconRadar size={24} />,
    features: [
      { name: 'Last.fm Connection', description: 'Link your Last.fm account', platform: 'both' },
      {
        name: 'Recently Played Tracks',
        description: 'View your listening history',
        platform: 'both',
      },
      {
        name: 'Discogs Search',
        description: 'Search songs and albums via Discogs',
        platform: 'both',
      },
      {
        name: 'MusicBrainz Search',
        description: 'Search using MusicBrainz database',
        platform: 'both',
      },
      {
        name: 'Music Scrobbling',
        description: 'Auto-capture music plays from Android apps',
        platform: 'mobile',
      },
    ],
  },
  {
    title: 'Discovery',
    icon: <IconSearch size={24} />,
    features: [
      { name: 'Discover Users', description: 'Browse and find new users', platform: 'both' },
      { name: 'Discover Bands', description: 'Explore band profiles', platform: 'both' },
      {
        name: 'Discover Reviews',
        description: 'Browse all reviews with pagination',
        platform: 'both',
      },
    ],
  },
];

const roadmap: RoadmapItem[] = [
  {
    title: 'Coming Soon',
    description: 'Features actively in development',
    items: [
      'Push notifications for mobile',
      'Search functionality for users, bands, and reviews',
      // 'Spotify integration for recently played',
      'Apple Music integration',
    ],
  },
  {
    title: 'Planned',
    description: 'On the roadmap for future releases',
    items: [
      'Custom profile themes for bands',
      'Playlist creation and sharing',
      'Follow bands',
      'Bands can post updates',
      'Bands can manage social media accounts',
      'Bands can upload songs directly to goodsongs',
      'Bands merch store',
      'Exclusive content subscriptions',
      'Fan analytics dashboard for bands',
      'Mailing list management for bands',
      'iOS scrobbling support',
      'Concert tickets',
      'Venue pages',
    ],
  },
];

function PlatformBadge({ platform }: { platform: Platform }) {
  if (platform === 'both') {
    return (
      <span className={`${styles.badge} ${styles.badgeBoth}`}>
        <IconCheck size={12} />
        Web & Mobile
      </span>
    );
  }
  if (platform === 'web') {
    return (
      <span className={`${styles.badge} ${styles.badgeWeb}`}>
        <IconDeviceDesktop size={12} />
        Web
      </span>
    );
  }
  return (
    <span className={`${styles.badge} ${styles.badgeMobile}`}>
      <IconDeviceMobile size={12} />
      Mobile
    </span>
  );
}

export default function DevlogPage() {
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
            <Link href="/" className={styles.logo}>
              <IconHome size={20} />
              <Text size="sm">Home</Text>
            </Link>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box className={styles.hero}>
        <Container size="lg">
          <Stack align="center" gap="md">
            <Title order={1} size="3.5rem" style={{ color: 'var(--gs-text-heading)' }} ta="center">
              Development Log
            </Title>
            <Text size="xl" style={{ color: 'var(--gs-text-secondary)' }} ta="center" maw={600}>
              Track our progress as we build the ultimate music discovery platform. See what&apos;s
              live and what&apos;s coming next.
            </Text>
            <Group gap="lg" mt="sm">
              <Group gap={6}>
                <IconCheck size={18} color="var(--mantine-color-green-6)" />
                <Text size="sm" c="dimmed">
                  {builtFeatures.reduce((acc, cat) => acc + cat.features.length, 0)} Features Built
                </Text>
              </Group>
              <Group gap={6}>
                <IconRocket size={18} color="var(--mantine-color-grape-6)" />
                <Text size="sm" c="dimmed">
                  {roadmap.reduce((acc, item) => acc + item.items.length, 0)} Features Planned
                </Text>
              </Group>
            </Group>
          </Stack>
        </Container>
      </Box>

      {/* Built Features Section */}
      <Box className={styles.sectionLight} py={60}>
        <Container size="lg">
          <Stack align="center" mb={40}>
            <Title order={2} size="2.5rem" ta="center" style={{ color: 'var(--gs-text-heading)' }}>
              What We&apos;ve Built
            </Title>
            <Text size="lg" style={{ color: 'var(--gs-text-accent)' }} ta="center" maw={500}>
              Features available now on web and mobile
            </Text>
          </Stack>

          <Grid gutter="xl">
            {builtFeatures.map((category) => (
              <Grid.Col key={category.title} span={{ base: 12, md: 6 }}>
                <Box mb="xl">
                  <Box className={styles.categoryHeader}>
                    <Box className={styles.categoryIcon}>{category.icon}</Box>
                    <Title order={3} size="1.5rem" style={{ color: 'var(--gs-text-heading)' }}>
                      {category.title}
                    </Title>
                  </Box>

                  <Stack gap={0}>
                    {category.features.map((feature) => (
                      <Box key={feature.name} className={styles.featureItem}>
                        <Box style={{ flex: 1 }}>
                          <Group justify="space-between" align="flex-start" mb={4}>
                            <Text fw={600} style={{ color: 'var(--gs-text-heading)' }} size="sm">
                              {feature.name}
                            </Text>
                            <PlatformBadge platform={feature.platform} />
                          </Group>
                          <Text size="xs" style={{ color: 'var(--gs-text-secondary)' }}>
                            {feature.description}
                          </Text>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Roadmap Section */}
      <Box className={styles.sectionDark} py={60}>
        <Container size="lg">
          <Stack align="center" mb={40}>
            <Title order={2} size="2.5rem" ta="center" style={{ color: 'var(--gs-text-inverse)' }}>
              Roadmap
            </Title>
            <Text size="lg" style={{ color: 'var(--gs-text-heading-light)' }} ta="center" maw={500}>
              What&apos;s next for Goodsongs
            </Text>
          </Stack>

          <Grid gutter="xl">
            {roadmap.map((phase) => (
              <Grid.Col key={phase.title} span={{ base: 12, md: 4 }}>
                <Box className={styles.timelineItemDark}>
                  <Box className={styles.timelineDotDark} />
                  <Title order={3} size="1.25rem" style={{ color: 'var(--gs-text-inverse)' }} mb="xs">
                    {phase.title}
                  </Title>
                  <Text size="sm" style={{ color: 'var(--gs-text-heading-light)' }} mb="md">
                    {phase.description}
                  </Text>
                  <Stack gap="sm">
                    {phase.items.map((item) => (
                      <Box key={item} className={styles.featureItemDark}>
                        <IconRocket
                          size={16}
                          color="var(--gs-text-heading-light)"
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <Text size="sm" style={{ color: 'var(--gs-text-inverse)' }}>
                          {item}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Platform Stats */}
      <Box className={styles.sectionLight} py={60}>
        <Container size="lg">
          <Stack align="center" mb={40}>
            <Title order={2} size="2rem" ta="center" style={{ color: 'var(--gs-text-heading)' }}>
              Platform Coverage
            </Title>
          </Stack>

          <Grid gutter="xl" justify="center">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Box
                className={styles.featureItem}
                style={{ justifyContent: 'center', padding: '2rem' }}
              >
                <Stack align="center" gap="xs">
                  <IconDeviceDesktop size={48} color="var(--mantine-color-blue-6)" />
                  <Title order={3} style={{ color: 'var(--gs-text-heading)' }}>
                    Web App
                  </Title>
                  <Text style={{ color: 'var(--gs-text-secondary)' }} ta="center" size="sm">
                    Full-featured Next.js application with admin panel
                  </Text>
                </Stack>
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Box
                className={styles.featureItem}
                style={{ justifyContent: 'center', padding: '2rem' }}
              >
                <Stack align="center" gap="xs">
                  <IconBrandAndroid size={48} color="var(--mantine-color-green-6)" />
                  <Title order={3} style={{ color: 'var(--gs-text-heading)' }}>
                    Android
                  </Title>
                  <Text style={{ color: 'var(--gs-text-secondary)' }} ta="center" size="sm">
                    React Native app with scrobbling support
                  </Text>
                </Stack>
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Box
                className={styles.featureItem}
                style={{ justifyContent: 'center', padding: '2rem' }}
              >
                <Stack align="center" gap="xs">
                  <IconDeviceMobile size={48} color="var(--mantine-color-grape-6)" />
                  <Title order={3} style={{ color: 'var(--gs-text-heading)' }}>
                    iOS
                  </Title>
                  <Text style={{ color: 'var(--gs-text-secondary)' }} ta="center" size="sm">
                    React Native app (scrobbling coming soon)
                  </Text>
                </Stack>
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" className={styles.footer}>
        <Container size="lg">
          <Grid gutter="xl" py={60}>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Group gap="sm" mb="md">
                <IconMusic size={28} color="var(--mantine-color-grape-0)" />
                <Text style={{ color: 'var(--gs-text-inverse)' }} fw={700} size="xl">
                  goodsongs
                </Text>
              </Group>
              <Text style={{ color: 'var(--gs-text-heading-light)' }} size="sm">
                Where bands and fans belong. Share the music you love, discover what&apos;s next.
              </Text>
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text style={{ color: 'var(--gs-text-inverse)' }} fw={600} mb="md">
                Quick Links
              </Text>
              <Stack gap="xs">
                <Link href="/" className={styles.footerLink}>
                  Home
                </Link>
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

            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Text style={{ color: 'var(--gs-text-inverse)' }} fw={600} mb="md">
                Resources
              </Text>
              <Stack gap="xs">
                <Link href="/about" className={styles.footerLink}>
                  About
                </Link>
                <Link href="/devlog" className={styles.footerLink}>
                  Development Log
                </Link>
                <Link href="/privacy" className={styles.footerLink}>
                  Privacy Policy
                </Link>
              </Stack>
            </Grid.Col>
          </Grid>

          <Box className={styles.footerBottom}>
            <Text style={{ color: 'var(--gs-text-heading-light)' }} size="sm" ta="center">
              &copy; 2026 Goodsongs. Made for music lovers, by music lovers.
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
