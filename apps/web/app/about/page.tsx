'use client';

import Link from 'next/link';
import { IconHome, IconMail, IconMusic } from '@tabler/icons-react';
import { Box, Button, Container, Grid, Group, Stack, Text, Title } from '@mantine/core';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <Box className={styles.page}>
      {/* Fixed Navigation */}
      <Box component="nav" className={styles.navbar}>
        <Container size="xl">
          <Group justify="space-between" align="center" h={60}>
            <Link href="/" className={styles.logo}>
              <IconMusic size={24} />
              <Text fw={700} size="lg">
                goodsongs
              </Text>
            </Link>
            <Group gap="sm">
              <Button component={Link} href="/" variant="default" size="sm" leftSection={<IconHome size={16} />}>
                Home
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box className={styles.hero}>
        <Container size="md">
          <Stack align="center" gap="md">
            <Title order={1} size="3rem" className={styles.heroTitle} ta="center">
              About GoodSongs
            </Title>
            <Text size="lg" className={styles.heroSubtitle} ta="center">
              A community built on the belief that the best music discovery comes from people, not algorithms.
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* What is GoodSongs Section */}
      <Box component="section" className={styles.section} py={60}>
        <Container size="md">
          <Box className={styles.contentCard}>
            <Title order={2} className={styles.sectionTitle}>
              What is GoodSongs?
            </Title>
            <Text className={styles.paragraph}>
              GoodSongs is a community for people who love sharing music. No star ratings, no critiques, no algorithms deciding what you should hear. Just real people sharing real enthusiasm for music they can&apos;t stop listening to.
            </Text>
            <Text className={styles.paragraph}>
              Follow listeners whose taste you trust, discover independent artists who deserve your attention, and build a feed of recommendations that actually mean something. Every song on GoodSongs is there because someone loved it enough to share it.
            </Text>
            <div className={styles.highlight}>
              <Text className={styles.paragraph}>
                &ldquo;The best music recommendations come from people who care, not algorithms that optimize for engagement.&rdquo;
              </Text>
            </div>
          </Box>
        </Container>
      </Box>

      {/* Meet the Founder Section */}
      <Box component="section" className={styles.sectionAlt} py={60}>
        <Container size="md">
          <Box className={styles.contentCard}>
            <Title order={2} className={styles.sectionTitle}>
              Meet the Founder
            </Title>
            <Text className={styles.paragraph}>
              GoodSongs was created by Angie, a product designer and musician who has spent 20 years touring and 10 years building digital products.
            </Text>
            <Text className={styles.paragraph}>
              After two decades of playing in bands and watching the music industry evolve, she saw a gap: independent artists and their fans were scattered across too many platforms, and the tools that existed were built for major labels, not working musicians. The best music discovery still happens through word of mouth, but there wasn&apos;t a dedicated space for that online.
            </Text>
            <Text className={styles.paragraph}>
              GoodSongs brings together her experience on both sides of the equation. As a musician, she understands what artists need to connect with fans. As a product designer, she knows how to build tools that people actually want to use.
            </Text>
            <div className={styles.highlight}>
              <Text className={styles.paragraph}>
                The goal is simple: create a place where passionate fans can share the music they love, and independent artists can find the audience they deserve.
              </Text>
            </div>
          </Box>
        </Container>
      </Box>

      {/* Get in Touch Section */}
      <Box component="section" className={styles.section} py={60}>
        <Container size="md">
          <Box className={styles.contentCard}>
            <Title order={2} className={styles.sectionTitle}>
              Get in Touch
            </Title>
            <Text className={styles.paragraph}>
              Have questions, feedback, or just want to say hello? We&apos;d love to hear from you.
            </Text>
            <div className={styles.contactCard}>
              <IconMail size={20} />
              <Text size="sm">
                <a href="mailto:support@goodsongs.app" className={styles.link}>
                  support@goodsongs.app
                </a>
              </Text>
            </div>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box component="footer" className={styles.footer}>
        <Container size="lg">
          <Grid gutter="xl" py={60}>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Group gap="sm" mb="md">
                <IconMusic size={24} color="var(--gs-text-heading)" />
                <Text c="var(--gs-text-heading)" fw={700} size="lg" style={{ fontFamily: 'var(--gs-font-display)' }}>
                  goodsongs
                </Text>
              </Group>
              <Text c="var(--gs-text-tertiary)" size="sm">
                Where bands and fans belong. Share the music you love, discover what&apos;s next.
              </Text>
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 4 }}>
              <Text c="var(--gs-text-heading)" fw={600} mb="md">
                Quick Links
              </Text>
              <Stack gap="xs">
                <Link href="/" className={styles.footerLink}>Home</Link>
                <Link href="/signup" className={styles.footerLink}>Sign Up</Link>
                <Link href="/login" className={styles.footerLink}>Log In</Link>
                <Link href="/discover" className={styles.footerLink}>Discover</Link>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 6, sm: 4 }}>
              <Text c="var(--gs-text-heading)" fw={600} mb="md">
                Legal
              </Text>
              <Stack gap="xs">
                <Link href="/about" className={styles.footerLink}>About</Link>
                <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
              </Stack>
            </Grid.Col>
          </Grid>

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
