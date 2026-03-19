'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconBrandAndroid,
  IconBrandApple,
  IconCalendarEvent,
  IconChartBar,
  IconDeviceDesktop,
  IconHeart,
  IconMessageCircle,
  IconMusic,
  IconPalette,
  IconSearch,
  IconUsers,
} from '@tabler/icons-react';
import { Box, Button, Container, Grid, Group, Stack, Text, Title } from '@mantine/core';
import styles from './page.module.css';

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight - 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <Box component="nav" className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ''}`}>
        <Container size="xl">
          <Group justify="space-between" align="center" h={60}>
            <Link href="/" className={styles.logo}>
              <IconMusic size={24} />
              <Text fw={700} size="lg">
                goodsongs
              </Text>
            </Link>
            <Group gap="sm">
              <Button
                component={Link}
                href="/login"
                variant="subtle"
                size="sm"
                className={styles.navLoginBtn}
              >
                Log In
              </Button>
              <Button component={Link} href="/signup" size="sm" className={styles.navSignupBtn}>
                Sign Up
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box className={styles.hero}>
        <Container size="xl" className={styles.heroContent}>
          <div data-animate className={styles.animateSection}>
            <div className={styles.heroGrid}>
              <div className={styles.heroRight}>
                <div className={styles.spinningRecord}>
                  <img src="/logo.svg" alt="Goodsongs logo" className={styles.recordLogo} />
                </div>
              </div>
              <Stack gap={0} className={styles.heroLeft}>
                <Title className={styles.heroTitle}>
                  Discover only the
                  <span className={styles.heroAccent}> goodest</span> songs
                </Title>
                <Text size="xl" mt="xl" className={styles.heroTagline}>
                  The best music recommendations have always come from friends. GoodSongs is built
                  on that idea. A place where fans share what they love and discover music through
                  people whose taste they actually trust. For bands, it means real fans, real
                  connections, and a community built on genuine word-of-mouth.
                </Text>
                <Group mt={40} gap="md">
                  <Button component={Link} href="/signup" size="lg" variant="white" color="dark">
                    Get Started Free
                  </Button>
                  <Button
                    component={Link}
                    href="/discover"
                    size="lg"
                    variant="outline"
                    color="white"
                  >
                    Explore Music
                  </Button>
                </Group>
              </Stack>
            </div>
          </div>
        </Container>
      </Box>

      {/* For Fans Section */}
      <Box component="section" className={styles.section} py={100}>
        <Container size="lg">
          <div data-animate className={styles.animateSection}>
            <Stack align="center" mb={60}>
              <div className={styles.sectionLabel}>
                <IconHeart size={16} />
                For Fans
              </div>
              <Title order={2} size="2.75rem" ta="center" className={styles.sectionTitle}>
                Your music, your way
              </Title>
              <Text size="lg" className={styles.sectionSubtitle} ta="center">
                Everything you need to share the songs you love and discover what's next.
              </Text>
            </Stack>
          </div>

          <div data-animate className={styles.animateSection}>
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Box className={styles.featureCard}>
                  <Box className={styles.featureIcon}>
                    <IconHeart size={28} />
                  </Box>
                  <Title order={3} size="1.25rem" className={styles.featureTitle} mb="sm">
                    Recommend Songs
                  </Title>
                  <Text className={styles.featureText}>
                    Share the tracks you can't stop playing. Tell people what you love about them
                    and help others discover their next favorite song.
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Box className={styles.featureCard}>
                  <Box className={styles.featureIcon}>
                    <IconSearch size={28} />
                  </Box>
                  <Title order={3} size="1.25rem" className={styles.featureTitle} mb="sm">
                    Discover Music
                  </Title>
                  <Text className={styles.featureText}>
                    Find your next obsession through community recommendations, trending tracks, and
                    a feed curated from people you follow.
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 4 }}>
                <Box className={styles.featureCard}>
                  <Box className={styles.featureIcon}>
                    <IconUsers size={28} />
                  </Box>
                  <Title order={3} size="1.25rem" className={styles.featureTitle} mb="sm">
                    Follow & Connect
                  </Title>
                  <Text className={styles.featureText}>
                    Follow friends and tastemakers. Build a feed of recommendations from people
                    whose taste you trust.
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>
          </div>
        </Container>
      </Box>

      {/* For Bands Section */}
      <Box component="section" className={styles.sectionAlt} py={100}>
        <Container size="lg">
          <div data-animate className={styles.animateSection}>
            <Stack align="center" mb={60}>
              <div className={styles.sectionLabel}>
                <IconMusic size={16} />
                For Bands
              </div>
              <Title order={2} size="2.75rem" ta="center" className={styles.sectionTitle}>
                Built for independent artists
              </Title>
              <Text size="lg" className={styles.sectionSubtitle} ta="center">
                Tools to grow your audience, manage your presence, and connect with fans who
                actually care.
              </Text>
            </Stack>
          </div>

          <div data-animate className={styles.animateSection}>
            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Box className={styles.featureCardBand}>
                  <Box className={styles.featureIconBand}>
                    <IconPalette size={24} />
                  </Box>
                  <Title order={3} size="1.25rem" className={styles.featureTitle} mb="sm">
                    Custom Profile Pages
                  </Title>
                  <Text className={styles.featureText}>
                    Build a beautiful profile with our site builder. Custom themes, embedded music,
                    events, blog posts, and merch links — all in one place.
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Box className={styles.featureCardBand}>
                  <Box className={styles.featureIconBand}>
                    <IconMessageCircle size={24} />
                  </Box>
                  <Title order={3} size="1.25rem" className={styles.featureTitle} mb="sm">
                    Real Fan Feedback
                  </Title>
                  <Text className={styles.featureText}>
                    See what fans love about your music. Get genuine reviews that highlight what
                    resonates — vocals, lyrics, production, and more.
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Box className={styles.featureCardBand}>
                  <Box className={styles.featureIconBand}>
                    <IconCalendarEvent size={24} />
                  </Box>
                  <Title order={3} size="1.25rem" className={styles.featureTitle} mb="sm">
                    Events & Shows
                  </Title>
                  <Text className={styles.featureText}>
                    List your upcoming shows, manage venues, sell tickets, and let fans know where
                    to find you live.
                  </Text>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Box className={styles.featureCardBand}>
                  <Box className={styles.featureIconBand}>
                    <IconChartBar size={24} />
                  </Box>
                  <Title order={3} size="1.25rem" className={styles.featureTitle} mb="sm">
                    Analytics & Mailing Lists
                  </Title>
                  <Text className={styles.featureText}>
                    Understand your audience. See who's recommending your music, build your mailing
                    list, and grow your fanbase.
                  </Text>
                </Box>
              </Grid.Col>
            </Grid>
          </div>

          <div data-animate className={styles.animateSection}>
            <Group justify="center" mt={48}>
              <Button component={Link} href="/signup" size="lg">
                Create Your Band Profile
              </Button>
            </Group>
          </div>
        </Container>
      </Box>

      {/* Platform Availability */}
      <Box component="section" className={styles.section} py={100}>
        <Container size="lg">
          <div data-animate className={styles.animateSection}>
            <Stack align="center" mb={60}>
              <Title order={2} size="2.75rem" ta="center" className={styles.sectionTitle}>
                Available everywhere
              </Title>
              <Text size="lg" className={styles.sectionSubtitle} ta="center">
                Use Goodsongs on your favorite platform.
              </Text>
            </Stack>
          </div>

          <div data-animate className={styles.animateSection}>
            <Grid gutter="xl" justify="center">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Box className={styles.platformCard}>
                  <Box className={styles.platformIcon}>
                    <IconDeviceDesktop size={32} />
                  </Box>
                  <Text className={styles.platformName}>Web</Text>
                  <span className={styles.platformAvailable}>Available Now</span>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Box className={styles.platformCard}>
                  <Box className={styles.platformIcon}>
                    <IconBrandAndroid size={32} />
                  </Box>
                  <Text className={styles.platformName}>Android</Text>
                  <span className={styles.platformAvailable}>Available Now</span>
                </Box>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Box className={styles.platformCard}>
                  <Box className={styles.platformIcon}>
                    <IconBrandApple size={32} />
                  </Box>
                  <Text className={styles.platformName}>iOS</Text>
                  <span className={styles.platformSoon}>Coming Soon</span>
                </Box>
              </Grid.Col>
            </Grid>
          </div>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box component="section" className={styles.sectionAlt} py={100}>
        <Container size="sm">
          <div data-animate className={styles.animateSection}>
            <Box className={styles.ctaBox}>
              <Stack align="center" gap="lg">
                <Title order={2} size="2.5rem" ta="center" className={styles.sectionTitle}>
                  Ready to find your next favorite song?
                </Title>
                <Text size="lg" className={styles.sectionSubtitle} ta="center">
                  Join thousands of fans and artists sharing the music they love.
                </Text>
                <Group mt="md" gap="md">
                  <Button component={Link} href="/signup" size="lg">
                    Get Started Free
                  </Button>
                  <Button component={Link} href="/discover" size="lg" variant="default">
                    Browse Recommendations
                  </Button>
                </Group>
              </Stack>
            </Box>
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
                  <IconMusic size={24} color="var(--gs-text-heading)" />
                  <Text
                    c="var(--gs-text-heading)"
                    fw={700}
                    size="lg"
                    style={{ fontFamily: 'var(--gs-font-display)' }}
                  >
                    goodsongs
                  </Text>
                </Group>
                <Text c="var(--gs-text-tertiary)" size="sm">
                  Where bands and fans belong. Share the music you love, discover what's next.
                </Text>
              </Grid.Col>

              <Grid.Col span={{ base: 6, sm: 4 }}>
                <Text c="var(--gs-text-heading)" fw={600} mb="md">
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
                <Text c="var(--gs-text-heading)" fw={600} mb="md">
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
            <Text c="var(--gs-text-muted)" size="sm" ta="center">
              &copy; 2026 Goodsongs. Made for music lovers, by music lovers.
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
