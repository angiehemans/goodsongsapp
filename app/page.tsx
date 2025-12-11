import Image from 'next/image';
import Link from 'next/link';
import {
  IconBrandSpotify,
  IconChevronRight,
  IconHeart,
  IconMusic,
  IconSearch,
  IconShare,
  IconStar,
  IconUsers,
} from '@tabler/icons-react';
import {
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Grid,
  GridCol,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <Box>
      {/* Top Menu Bar */}
      <Box className={styles.header} p="md">
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Link href="/" className={styles.headerLink}>
              <Group gap="xs" align="center">
                <Image src="/logo.svg" alt="goodsongs" width={28} height={28} />
                <Title order={2} c="blue.9">
                  goodsongs
                </Title>
              </Group>
            </Link>
            <Group>
              <Button component={Link} href="/login" variant="outline" size="md" color="grape">
                Sign In
              </Button>
              <Button component={Link} href="/signup" size="md" color="grape.9">
                Get Started
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box className={styles.hero} py={80}>
        <Container size="lg">
          <Grid align="center">
            <GridCol span={{ base: 12, md: 6 }}>
              <Stack gap="xl">
                <Title order={1} size="3.5rem" c="grape.9" lh={1.1}>
                  Your Music,
                  <br />
                  <Text span c="violet.8" inherit>
                    Amplified
                  </Text>
                </Title>
                <Text size="xl" lh={1.6}>
                  Connect your Spotify, discover new bands, share recommendations, and build your
                  musical identity. Join a community of music lovers sharing their favorite songs.
                </Text>
                <Group>
                  <Button
                    component={Link}
                    href="/signup"
                    size="lg"
                    color="grape.9"
                    rightSection={<IconChevronRight size={20} />}
                  >
                    Start Discovering
                  </Button>
                  <Button component={Link} href="/login" size="lg" variant="outline" color="grape">
                    Sign In
                  </Button>
                </Group>
              </Stack>
            </GridCol>
            <GridCol span={{ base: 12, md: 6 }}>
              <Center></Center>
            </GridCol>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container size="lg" py={80}>
        <Stack align="center" gap="xl" mb={60}>
          <Title order={2} size="2.5rem" ta="center" c="grape.9">
            Everything you need to explore music
          </Title>
          <Text size="lg" ta="center" c="dimmed" maw={600}>
            From discovering new artists to sharing your favorite tracks, Goodsongs brings all your
            music experiences together in one place.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
          <Card
            padding="xl"
            radius="md"
            style={{ border: '2px solid var(--mantine-color-grape-2)' }}
          >
            <ThemeIcon size={60} radius="xl" color="green" mb="md">
              <IconBrandSpotify size={30} />
            </ThemeIcon>
            <Title order={3} size="xl" mb="sm">
              Spotify Integration
            </Title>
            <Text c="dimmed" lh={1.6}>
              Connect your Spotify account to see your recently played tracks and get personalized
              recommendations based on your listening history.
            </Text>
          </Card>

          <Card
            padding="xl"
            radius="md"
            style={{ border: '2px solid var(--mantine-color-violet-2)' }}
          >
            <ThemeIcon size={60} radius="xl" color="violet.6" mb="md">
              <IconStar size={30} />
            </ThemeIcon>
            <Title order={3} size="xl" mb="sm">
              Share Recommendations
            </Title>
            <Text c="dimmed" lh={1.6}>
              Share your favorite songs with the community. Highlight what you love and help others
              discover great music.
            </Text>
          </Card>

          <Card
            padding="xl"
            radius="md"
            style={{ border: '2px solid var(--mantine-color-grape-2)' }}
          >
            <ThemeIcon size={60} radius="xl" color="grape.6" mb="md">
              <IconUsers size={30} />
            </ThemeIcon>
            <Title order={3} size="xl" mb="sm">
              Create Bands
            </Title>
            <Text c="dimmed" lh={1.6}>
              Showcase your musical projects, connect with other artists, and build your band's
              presence across multiple platforms.
            </Text>
          </Card>

          <Card
            padding="xl"
            radius="md"
            style={{ border: '2px solid var(--mantine-color-blue-2)' }}
          >
            <ThemeIcon size={60} radius="xl" color="blue.6" mb="md">
              <IconSearch size={30} />
            </ThemeIcon>
            <Title order={3} size="xl" mb="sm">
              Discover Music
            </Title>
            <Text c="dimmed" lh={1.6}>
              Explore new artists and songs through community recommendations, trending tracks, and
              personalized suggestions.
            </Text>
          </Card>

          <Card
            padding="xl"
            radius="md"
            style={{ border: '2px solid var(--mantine-color-pink-2)' }}
          >
            <ThemeIcon size={60} radius="xl" color="pink.6" mb="md">
              <IconHeart size={30} />
            </ThemeIcon>
            <Title order={3} size="xl" mb="sm">
              Build Your Profile
            </Title>
            <Text c="dimmed" lh={1.6}>
              Create a musical identity that reflects your taste. Show off your recommendations,
              bands, and favorite discoveries.
            </Text>
          </Card>

          <Card
            padding="xl"
            radius="md"
            style={{ border: '2px solid var(--mantine-color-orange-2)' }}
          >
            <ThemeIcon size={60} radius="xl" color="orange.6" mb="md">
              <IconShare size={30} />
            </ThemeIcon>
            <Title order={3} size="xl" mb="sm">
              Share & Connect
            </Title>
            <Text c="dimmed" lh={1.6}>
              Connect with fellow music lovers, share your discoveries, and build a community around
              your musical passions.
            </Text>
          </Card>
        </SimpleGrid>
      </Container>

      {/* Sample Recommendations Section */}
      <Box bg="grape.0" py={80}>
        <Container size="lg">
          <Stack align="center" gap="xl" mb={60}>
            <Title order={2} size="2.5rem" ta="center" c="grape.9">
              See what others are saying
            </Title>
            <Text size="lg" ta="center" c="dimmed" maw={600}>
              Join thousands of music enthusiasts sharing their favorite songs
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            {/* Sample Review 1 */}
            <Card p="md" bd="0" bg="grape.2" radius="md">
              <Stack gap="sm">
                <Group gap="sm" pb="sm" className={styles.userInfo}>
                  <Box
                    className={styles.avatar}
                    style={{ backgroundColor: 'var(--mantine-color-blue-6)' }}
                  >
                    MJ
                  </Box>
                  <Text size="sm" fw={500} c="grape.6">
                    @musicjunkie92
                  </Text>
                </Group>

                <Group gap="sm" justify="space-between" align="flex-start">
                  <Group gap="sm">
                    <Box
                      className={styles.artwork}
                      style={{
                        backgroundImage:
                          'linear-gradient(135deg, var(--mantine-color-grape-4), var(--mantine-color-violet-5))',
                      }}
                    />
                    <Stack gap={2}>
                      <Text size="md" fw={500} c="gray.9">
                        Bohemian Rhapsody
                      </Text>
                      <Text size="sm" c="grape.6">
                        Queen
                      </Text>
                    </Stack>
                  </Group>
                  <IconBrandSpotify size={24} color="var(--mantine-color-green-6)" />
                </Group>

                <Text size="sm" c="dark">
                  This song is an absolute masterpiece. The way it transitions between different
                  musical styles is incredible. Freddie's vocals are otherworldly...
                </Text>

                <Group gap="xs">
                  <Badge size="sm" variant="light" color="grape">
                    Vocals
                  </Badge>
                  <Badge size="sm" variant="light" color="grape">
                    Creativity
                  </Badge>
                  <Badge size="sm" variant="light" color="grape">
                    Production
                  </Badge>
                </Group>
              </Stack>
            </Card>

            {/* Sample Review 2 */}
            <Card p="md" bd="0" bg="grape.2" radius="md">
              <Stack gap="sm">
                <Group gap="sm" pb="sm" className={styles.userInfo}>
                  <Box
                    className={styles.avatar}
                    style={{ backgroundColor: 'var(--mantine-color-green-6)' }}
                  >
                    AL
                  </Box>
                  <Text size="sm" fw={500} c="grape.6">
                    @alexlistens
                  </Text>
                </Group>

                <Group gap="sm" justify="space-between" align="flex-start">
                  <Group gap="sm">
                    <Box
                      className={styles.artwork}
                      style={{
                        backgroundImage:
                          'linear-gradient(135deg, var(--mantine-color-orange-4), var(--mantine-color-red-5))',
                      }}
                    />
                    <Stack gap={2}>
                      <Text size="md" fw={500} c="gray.9">
                        Blinding Lights
                      </Text>
                      <Text size="sm" c="grape.6">
                        The Weeknd
                      </Text>
                    </Stack>
                  </Group>
                  <IconBrandSpotify size={24} color="var(--mantine-color-green-6)" />
                </Group>

                <Text size="sm" c="dark">
                  Perfect blend of retro and modern. The synths take me back to the 80s but with a
                  fresh twist. Can't stop playing this on repeat!
                </Text>

                <Group gap="xs">
                  <Badge size="sm" variant="light" color="grape">
                    Beat
                  </Badge>
                  <Badge size="sm" variant="light" color="grape">
                    Energy
                  </Badge>
                  <Badge size="sm" variant="light" color="grape">
                    Melody
                  </Badge>
                </Group>
              </Stack>
            </Card>
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container size="lg" py={80}>
        <Paper
          p={60}
          radius="xl"
          bg="linear-gradient(135deg, var(--mantine-color-grape-6) 0%, var(--mantine-color-violet-6) 100%)"
        >
          <Stack align="center" gap="xl">
            <Title order={2} size="2.5rem" ta="center" c="white">
              Ready to amplify your music experience?
            </Title>
            <Text size="xl" ta="center" c="grape.1" maw={600}>
              Join the community of music lovers and start sharing your discoveries today.
            </Text>
            <Group>
              <Button
                component={Link}
                href="/signup"
                size="xl"
                color="white"
                c="grape.9"
                rightSection={<IconChevronRight size={24} />}
              >
                Get Started Free
              </Button>
            </Group>
          </Stack>
        </Paper>
      </Container>

      {/* Footer */}
      <Box bg="grape.9" py={40}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group align="center">
              <IconMusic size={24} color="white" />
              <Text c="white" fw={600}>
                Goodsongs
              </Text>
            </Group>
            <Text c="grape.3" size="sm">
              © 2024 Goodsongs. Made for music lovers, by music lovers.
            </Text>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
