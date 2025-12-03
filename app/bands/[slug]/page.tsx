import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  IconAlertCircle,
  IconArrowNarrowRight,
  IconMenu2,
} from '@tabler/icons-react';
import {
  Alert,
  BackgroundImage,
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  Image,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { ReviewCard } from '@/components/ReviewCard/ReviewCard';
import { Band } from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';
import styles from './page.module.css';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const band = await getBand(slug);
    return {
      title: `${band.name} - Goodsongs`,
      description:
        band.about ||
        `Check out ${band.name} on Goodsongs. ${band.reviews_count} recommendation${band.reviews_count !== 1 ? 's' : ''} and counting.`,
    };
  } catch {
    return {
      title: 'Band Not Found - Goodsongs',
      description: 'The requested band profile could not be found.',
    };
  }
}

async function getBand(slug: string): Promise<Band> {
  try {
    const baseUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'https://www.goodsongs.app'
        : 'http://localhost:3001';

    const response = await fetch(`${baseUrl}/api/bands/${slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error('Failed to fetch band');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching band:', error);
    throw error;
  }
}

// Placeholder data for sections without API endpoints
const placeholderShows = [
  {
    id: 1,
    date: 'Nov 17, 2025',
    city: 'Sacramento, CA',
    venue: 'The Press Club',
    price: '$20',
    moreInfoUrl: '#',
  },
  {
    id: 2,
    date: 'Nov 18, 2025',
    city: 'Portland, OR',
    venue: 'The Hawthorne Theater',
    price: '$20',
    moreInfoUrl: '#',
  },
];

export default async function BandProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let band: Band;

  try {
    band = await getBand(slug);
  } catch (error) {
    return (
      <Container>
        <Alert icon={<IconAlertCircle size="1rem" />} title="Error" color="red" mt="xl">
          Failed to load band profile. Please try again later.
        </Alert>
      </Container>
    );
  }

  return (
    <Box className={styles.pageBackground}>
      <Container size="sm" p={0} className={styles.container}>
        {/* Header */}
        <Flex justify="center" align="center" py="md" pos="relative" direction="column" gap={4}>
          <UnstyledButton pos="absolute" right={20} top={20}>
            <IconMenu2 size={24} color="var(--mantine-color-blue-8)" />
          </UnstyledButton>
          <Title order={1} size="36px" c="blue.8" ta="center">
            {band.name}
          </Title>
          {(band.city || band.region || band.location) && (
            <Text size="md" c="blue.6" ta="center">
              {band.city || band.region
                ? [band.city, band.region].filter(Boolean).join(', ')
                : band.location}
            </Text>
          )}
        </Flex>
        <Stack gap={36} align="center" pb="xl">
          {/* Hero Image & Follow Button */}
          {band.profile_picture_url ? (
            <BackgroundImage src={fixImageUrl(band.profile_picture_url)!}>
              <Flex direction="column" h={220} p={20} align="center" justify="flex-end" w="100%">
                <Button
                  w={{ base: '100%', sm: 300 }}
                  variant="filled"
                  color="blue.1"
                  c="blue.8"
                  radius={4}
                  h={36}
                >
                  Follow
                </Button>
              </Flex>
            </BackgroundImage>
          ) : (
            <Flex w="100%" p={20} justify="center">
              <Button
                w={{ base: '100%', sm: 300 }}
                variant="filled"
                color="blue.1"
                c="blue.8"
                radius={4}
                h={36}
              >
                Follow
              </Button>
            </Flex>
          )}

          {/* Listen Section */}
          {band.spotify_link && (
            <Stack align="center" w="100%" px={20}>
              <Title order={2} size="24px" c="blue.8">
                Listen
              </Title>
              <Box className={styles.spotifyEmbed}>
                <iframe
                  src={getSpotifyEmbedUrl(band.spotify_link)}
                  width="100%"
                  height="155"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: 13, border: 'none' }}
                />
              </Box>
            </Stack>
          )}

          {/* Shows Section */}
          {/* <Stack align="center" w="100%" px={20}>
            <Title order={2} size="24px" c="blue.8">
              Shows
            </Title>
            <Stack w="100%" gap={0}>
              {placeholderShows.map((show) => (
                <Box key={show.id} py="md">
                  <Flex justify="space-between" align="center" mb="md">
                    <Text fw={600} size="16px" c="blue.8">
                      {show.date}
                    </Text>
                    <Text size="16px" c="gray.6">
                      {show.city}
                    </Text>
                  </Flex>
                  <Text size="20px" c="blue.8" ta="center" mb="md">
                    {show.venue}
                  </Text>
                  <Flex justify="space-between" align="center">
                    <Badge
                      variant="filled"
                      color="blue.1"
                      c="blue.8"
                      radius={13}
                      px={10}
                      py={6}
                      styles={{ root: { border: 'none', textTransform: 'none' } }}
                    >
                      {show.price}
                    </Badge>
                    <UnstyledButton component="a" href={show.moreInfoUrl}>
                      <Group gap={4}>
                        <Text size="16px" c="blue.4">
                          More Info
                        </Text>
                        <IconArrowNarrowRight size={24} color="var(--mantine-color-blue-4)" />
                      </Group>
                    </UnstyledButton>
                  </Flex>
                  <Divider mt="md" color="blue.3" size={2} />
                </Box>
              ))}
              <Flex justify="center" mt="sm">
                <UnstyledButton>
                  <Group gap={4}>
                    <Text size="16px" c="blue.4">
                      More Shows
                    </Text>
                    <IconArrowNarrowRight size={24} color="var(--mantine-color-blue-4)" />
                  </Group>
                </UnstyledButton>
              </Flex>
            </Stack>
          </Stack> */}

          {/* Mailing List Section */}
          {/* <Stack align="center" w="100%" px={20}>
            <Title order={2} size="24px" c="blue.8">
              Join Mailing list
            </Title>
            <Stack w="100%" gap="md" mt="sm">
              <TextInput
                label="Name"
                placeholder="Your name"
                styles={{
                  label: { color: 'var(--mantine-color-blue-4)', marginBottom: 8 },
                  input: {
                    borderColor: 'var(--mantine-color-blue-4)',
                    borderWidth: 2,
                    backgroundColor: 'white',
                    color: 'var(--mantine-color-blue-8)',
                  },
                }}
              />
              <TextInput
                label="Email"
                placeholder="your@email.com"
                styles={{
                  label: { color: 'var(--mantine-color-blue-4)', marginBottom: 8 },
                  input: {
                    borderColor: 'var(--mantine-color-blue-4)',
                    borderWidth: 2,
                    backgroundColor: 'white',
                    color: 'var(--mantine-color-blue-8)',
                  },
                }}
              />
              <Checkbox
                label={`I agree to be emailed by ${band.name}`}
                color="blue.8"
                styles={{
                  label: { color: 'var(--mantine-color-blue-4)' },
                }}
              />
            </Stack>
          </Stack> */}

          {/* About Section */}
          {band.about && (
            <Stack align="center" w="100%" px={20}>
              <Title order={2} size="24px" c="blue.8">
                About
              </Title>
              <Text size="16px" lh="22px" c="blue.8" style={{ whiteSpace: 'pre-wrap' }}>
                {band.about}
              </Text>
            </Stack>
          )}

          {/* Recommendations Section */}
          <Stack align="center" w="100%" px={20}>
            <Title order={2} size="24px" c="blue.8">
              Recommendations
            </Title>
            {band.reviews && band.reviews.length > 0 ? (
              <Stack w="100%" gap="md">
                {band.reviews.slice(0, 2).map((review) => (
                  <ReviewCard key={review.id} review={review} variant="band-page" bandName={band.name} />
                ))}
              </Stack>
            ) : (
              <Text c="dimmed" ta="center">
                No recommendations yet. Be the first to recommend {band.name}!
              </Text>
            )}
          </Stack>

          {/* Merch Section */}
          {/* <Stack align="center" w="100%" px={20}>
            <Title order={2} size="24px" c="blue.8">
              Merch
            </Title>
            <Box w="100%">
              <Flex gap={20} mb="sm">
                <Box className={styles.merchItem}>
                  <Box className={styles.merchImagePlaceholder} />
                </Box>
                <Box className={styles.merchItem}>
                  <Box className={styles.merchImagePlaceholder} />
                </Box>
              </Flex>
              <Flex justify="space-between" mb="lg">
                <Text size="16px" c="gray.6">
                  Unisex T-Shirt
                </Text>
                <Text size="16px" c="blue.8">
                  $25
                </Text>
                <Text size="16px" c="gray.6">
                  Vinyl Record
                </Text>
                <Text size="16px" c="blue.8">
                  $20
                </Text>
              </Flex>
              <Flex gap={20} mb="sm">
                <Box className={styles.merchItem}>
                  <Box className={styles.merchImagePlaceholder} />
                </Box>
                <Box className={styles.merchItem}>
                  <Box className={styles.merchImagePlaceholder} />
                </Box>
              </Flex>
              <Flex justify="space-between">
                <Text size="16px" c="gray.6">
                  Hoodie
                </Text>
                <Text size="16px" c="blue.8">
                  $40
                </Text>
                <Text size="16px" c="gray.6">
                  Button Pack
                </Text>
                <Text size="16px" c="blue.8">
                  $15
                </Text>
              </Flex>
            </Box>
          </Stack> */}

          {/* Footer */}
          <Stack align="center" w="100%" px={20} pb="xl">
            <Flex direction="column" align="center" gap={10}>
              <Text size="16px" c="blue.3" ta="center">
                Built With
              </Text>
              <Link
                href="/user/dashboard"
                style={{
                  textDecoration: 'none',
                  alignItems: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Image radius="sm" src="/logo.svg" w={40} />
                <Title order={2} size="28px" c="blue.8" ta="center">
                  GoodSongs
                </Title>
              </Link>
            </Flex>

            <Button
              w={{ base: '100%', sm: 300 }}
              variant="filled"
              color="blue.1"
              c="blue.8"
              radius={4}
              h={36}
              component={Link}
              href="/signup"
            >
              Create Your Account!
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

// Helper function to convert Spotify URL to embed URL
function getSpotifyEmbedUrl(spotifyUrl: string): string {
  // Convert regular Spotify URL to embed URL
  // e.g., https://open.spotify.com/artist/xyz -> https://open.spotify.com/embed/artist/xyz
  if (spotifyUrl.includes('open.spotify.com')) {
    return spotifyUrl.replace('open.spotify.com/', 'open.spotify.com/embed/');
  }
  return spotifyUrl;
}
