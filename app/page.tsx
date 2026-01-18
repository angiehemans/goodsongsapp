import Link from 'next/link';
import {
  IconBrandLastfm,
  IconCheck,
  IconChevronRight,
  IconHeart,
  IconMessageCircleHeart,
  IconMicrophone2,
  IconMusic,
  IconSearch,
} from '@tabler/icons-react';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Group,
  List,
  ListItem,
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
      {/* Hero Section - Full viewport */}
      <Box className={styles.hero}>
        <Stack align="center" justify="space-around" gap="xl" h="80vh" w="100%">
          <Flex direction="column" align="center" gap="md">
            <Title c="blue.9" className={styles.heroTitle}>
              goodsongs
            </Title>
            <Title order={1} fw={400} c="grape.6">
              Where bands and fans belong.
            </Title>
            <Text maw={500} size="lg">
              A platform that brings artists and fans together by giving bands the tools to manage
              their business and fans a community to share music and connect with the artists they
              love.
            </Text>
          </Flex>

          <Flex gap="md" justify="center">
            <Button
              component={Link}
              href="/signup"
              size="lg"
              color="blue.9"
              rightSection={<IconChevronRight size={20} />}
            >
              Start Discovering
            </Button>
            <Button component={Link} href="/login" size="lg" variant="outline" color="blue">
              Sign In
            </Button>
          </Flex>
        </Stack>
      </Box>

      {/* Features Section */}
      <Box bg="blue.9" py={80}>
        <Container size="lg">
          <Stack align="center" gap="xl" mb={60}>
            <Title order={2} size="2.5rem" ta="center" c="white">
              Everything fans need to share the music they love.
            </Title>
            <Text size="lg" ta="center" c="grape.3" maw={600}>
              Discover new sounds, connect with the artists behind them, and share your taste with
              the world.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
            <Card
              padding="xl"
              radius="md"
              bg="blue.2"
              style={{ border: '2px solid var(--mantine-color-blue-3)' }}
            >
              <Group gap="sm" mb="sm">
                <IconBrandLastfm size={28} color="var(--mantine-color-blue-7)" />
                <Title order={3} size="1.4rem" c="blue.9">
                  Last.fm Integration
                </Title>
              </Group>
              <Text lh={1.6}>
                Connect your Last.fm account to see your recently played tracks and get personalized
                recommendations based on what you already love.
              </Text>
            </Card>

            <Card
              padding="xl"
              radius="md"
              bg="blue.2"
              style={{ border: '2px solid var(--mantine-color-blue-3)' }}
            >
              <Group gap="sm" mb="sm">
                <IconMessageCircleHeart size={28} color="var(--mantine-color-blue-7)" />
                <Title order={3} size="1.4rem" c="blue.9">
                  Recommend Songs
                </Title>
              </Group>
              <Text lh={1.6}>
                Share the songs you can't stop playing. Highlight what you love and help others
                discover their next favorite track.
              </Text>
            </Card>

            <Card
              padding="xl"
              radius="md"
              bg="blue.2"
              style={{ border: '2px solid var(--mantine-color-blue-3)' }}
            >
              <Group gap="sm" mb="sm">
                <IconSearch size={28} color="var(--mantine-color-blue-7)" />
                <Title order={3} size="1.4rem" c="blue.9">
                  Discover Music
                </Title>
              </Group>
              <Text lh={1.6}>
                Find your next obsession through community recommendations, trending tracks, and
                personalized suggestions.
              </Text>
            </Card>

            <Card
              padding="xl"
              radius="md"
              bg="blue.2"
              style={{ border: '2px solid var(--mantine-color-blue-3)' }}
            >
              <Group gap="sm" mb="sm">
                <IconHeart size={28} color="var(--mantine-color-blue-7)" />
                <Title order={3} size="1.4rem" c="blue.9">
                  Build Your Profile
                </Title>
              </Group>
              <Text lh={1.6}>
                Create a musical identity that reflects your taste. Showcase your recommendations,
                favorite artists, and discoveries.
              </Text>
            </Card>
          </SimpleGrid>
        </Container>
      </Box>

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
                  <IconBrandLastfm size={24} color="var(--mantine-color-red-6)" />
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
                  <IconBrandLastfm size={24} color="var(--mantine-color-red-6)" />
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

      {/* For Bands Pricing Section */}
      <Container size="lg" py={80}>
        <Stack align="center" gap="xl" mb={60}>
          <Group gap="sm">
            <ThemeIcon size={48} radius="xl" color="grape.6">
              <IconMicrophone2 size={24} />
            </ThemeIcon>
            <Title order={2} size="2.5rem" c="grape.9">
              For Bands
            </Title>
          </Group>
          <Text size="lg" ta="center" c="dimmed" maw={600}>
            Whether you're just starting out or touring the world, we have tools to help you connect
            with your fans.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
          {/* Free Tier */}
          <Card
            padding="xl"
            radius="md"
            style={{ border: '2px solid var(--mantine-color-grape-3)' }}
          >
            <Stack gap="md">
              <div>
                <Text size="lg" fw={600} c="grape.7">
                  Free
                </Text>
                <Group align="baseline" gap={4}>
                  <Text size="2.5rem" fw={700} c="grape.9">
                    $0
                  </Text>
                  <Text c="dimmed">/month</Text>
                </Group>
              </div>

              <Text c="dimmed" size="sm">
                Get started with the essentials
              </Text>

              <Button component={Link} href="/signup" variant="outline" color="grape" fullWidth>
                Get Started
              </Button>

              <List
                spacing="sm"
                size="sm"
                icon={
                  <ThemeIcon color="grape" size={20} radius="xl">
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                <ListItem>Basic band profile</ListItem>
                <ListItem>Fan recommendations</ListItem>
                <ListItem>
                  <Group gap={6}>
                    Events calendar
                    <Badge size="xs" color="grape" variant="light">
                      Coming Soon
                    </Badge>
                  </Group>
                </ListItem>
              </List>
            </Stack>
          </Card>

          {/* Starter Tier */}
          <Card
            padding="xl"
            radius="md"
            style={{ border: '2px solid var(--mantine-color-violet-4)' }}
            bg="violet.0"
          >
            <Stack gap="md">
              <div>
                <Group justify="space-between">
                  <Text size="lg" fw={600} c="violet.7">
                    Starter
                  </Text>
                  <Badge color="violet" variant="light">
                    Coming Soon
                  </Badge>
                </Group>
                <Group align="baseline" gap={4}>
                  <Text size="2.5rem" fw={700} c="violet.9">
                    $15
                  </Text>
                  <Text c="dimmed">/month</Text>
                </Group>
              </div>

              <Text c="dimmed" size="sm">
                Everything in Free, plus more tools to grow
              </Text>

              <Button variant="filled" color="violet" fullWidth disabled>
                Coming Soon
              </Button>

              <List
                spacing="sm"
                size="sm"
                icon={
                  <ThemeIcon color="violet" size={20} radius="xl">
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                <ListItem>Everything in Free</ListItem>
                <ListItem>Custom profile templates</ListItem>
                <ListItem>Merch store integration</ListItem>
                <ListItem>100 mailing list contacts</ListItem>
                <ListItem>Social media integration</ListItem>
              </List>
            </Stack>
          </Card>

          {/* Pro Tier */}
          <Card
            padding="xl"
            radius="md"
            style={{ border: '2px solid var(--mantine-color-grape-5)' }}
            bg="grape.1"
          >
            <Stack gap="md">
              <div>
                <Group justify="space-between">
                  <Text size="lg" fw={600} c="grape.8">
                    Pro
                  </Text>
                  <Badge color="grape">Coming Soon</Badge>
                </Group>
                <Group align="baseline" gap={4}>
                  <Text size="2.5rem" fw={700} c="grape.9">
                    $45
                  </Text>
                  <Text c="dimmed">/month</Text>
                </Group>
              </div>

              <Text c="dimmed" size="sm">
                For serious artists ready to scale
              </Text>

              <Button variant="filled" color="grape" fullWidth disabled>
                Coming Soon
              </Button>

              <List
                spacing="sm"
                size="sm"
                icon={
                  <ThemeIcon color="grape" size={20} radius="xl">
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                <ListItem>Everything in Starter</ListItem>
                <ListItem>Unlimited mailing list contacts</ListItem>
                <ListItem>Fan metrics & analytics</ListItem>
                <ListItem>Priority support</ListItem>
                <ListItem>And more...</ListItem>
              </List>
            </Stack>
          </Card>
        </SimpleGrid>
      </Container>

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
