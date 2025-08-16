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
  Avatar,
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

export default function HomePage() {
  return (
    <Box>
      {/* Top Menu Bar */}
      <Box bg="grape.0" p="md" style={{ borderBottom: '2px solid var(--mantine-color-grape-3)' }}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group align="center">
              <IconMusic size={32} color="var(--mantine-color-grape-9)" />
              <Title order={2} c="grape.9">
                Goodsongs
              </Title>
            </Group>
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
      <Box
        bg="linear-gradient(135deg, var(--mantine-color-grape-1) 0%, var(--mantine-color-violet-1) 100%)"
        py={80}
      >
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
                <Text size="xl" c="dimmed" lh={1.6}>
                  Connect your Spotify, discover new bands, write reviews, and build your musical
                  identity. Join a community of music lovers sharing their favorite songs.
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
              <Center>
                <Box pos="relative">
                  <ThemeIcon size={200} radius="xl" color="grape.1" variant="light">
                    <IconMusic size={100} color="var(--mantine-color-grape-7)" />
                  </ThemeIcon>
                  <Box pos="absolute" top={-20} right={-20}>
                    <ThemeIcon size={60} radius="xl" color="green">
                      <IconBrandSpotify size={30} />
                    </ThemeIcon>
                  </Box>
                  <Box pos="absolute" bottom={-10} left={-10}>
                    <ThemeIcon size={50} radius="xl" color="violet.6">
                      <IconStar size={25} />
                    </ThemeIcon>
                  </Box>
                </Box>
              </Center>
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
              Write Reviews
            </Title>
            <Text c="dimmed" lh={1.6}>
              Share your thoughts on your favorite songs. Rate tracks, highlight what you love, and
              help others discover great music.
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
              Explore new artists and songs through community reviews, trending tracks, and
              personalized recommendations.
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
              Create a musical identity that reflects your taste. Show off your reviews, bands, and
              favorite discoveries.
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

      {/* Sample Reviews Section */}
      <Box bg="grape.0" py={80}>
        <Container size="lg">
          <Stack align="center" gap="xl" mb={60}>
            <Title order={2} size="2.5rem" ta="center" c="grape.9">
              See what others are saying
            </Title>
            <Text size="lg" ta="center" c="dimmed" maw={600}>
              Join thousands of music enthusiasts sharing their favorite discoveries
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
            <Paper p="xl" radius="md" style={{ border: '2px solid var(--mantine-color-grape-3)' }}>
              <Group mb="md">
                <Avatar size="md" color="blue">
                  MJ
                </Avatar>
                <div>
                  <Text fw={600}>musicjunkie92</Text>
                </div>
              </Group>
              <Title order={4} mb="xs">
                Bohemian Rhapsody - Queen
              </Title>
              <Text c="dimmed" mb="md">
                "This song is an absolute masterpiece. The way it transitions between different
                musical styles is incredible. Freddie's vocals are otherworldly..."
              </Text>
              <Group gap="xs">
                <Badge size="sm" variant="light" color="grape">
                  Vocals
                </Badge>
                <Badge size="sm" variant="light" color="violet">
                  Creativity
                </Badge>
                <Badge size="sm" variant="light" color="blue">
                  Production
                </Badge>
              </Group>
            </Paper>

            <Paper p="xl" radius="md" style={{ border: '2px solid var(--mantine-color-violet-3)' }}>
              <Group mb="md">
                <Avatar size="md" color="green">
                  AL
                </Avatar>
                <div>
                  <Text fw={600}>alexlistens</Text>
                </div>
              </Group>
              <Title order={4} mb="xs">
                Blinding Lights - The Weeknd
              </Title>
              <Text c="dimmed" mb="md">
                "Perfect blend of retro and modern. The synths take me back to the 80s but with a
                fresh twist. Can't stop playing this on repeat!"
              </Text>
              <Group gap="xs">
                <Badge size="sm" variant="light" color="green">
                  Beat
                </Badge>
                <Badge size="sm" variant="light" color="orange">
                  Energy
                </Badge>
                <Badge size="sm" variant="light" color="pink">
                  Melody
                </Badge>
              </Group>
            </Paper>
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
