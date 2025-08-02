import {
  Container,
  Title,
  Text,
  Stack,
  Avatar,
  Paper,
  Group,
  Badge,
  Alert,
  Center,
  Button,
  SimpleGrid,
} from '@mantine/core';
import { IconAlertCircle, IconMapPin, IconMusic, IconBrandSpotify, IconBrandApple, IconBrandYoutube } from '@tabler/icons-react';
import { Band } from '@/lib/api';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
      description: band.about || `Check out ${band.name} on Goodsongs. ${band.reviews_count} review${band.reviews_count !== 1 ? 's' : ''} and counting.`,
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
    const response = await fetch(`${API_BASE_URL}/bands/${slug}`, {
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

export default async function BandProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  let band: Band;
  
  try {
    band = await getBand(slug);
  } catch (error) {
    return (
      <Container>
        <Alert 
          icon={<IconAlertCircle size="1rem" />} 
          title="Error" 
          color="red" 
          mt="xl"
        >
          Failed to load band profile. Please try again later.
        </Alert>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const streamingLinks = [
    { url: band.spotify_link, icon: IconBrandSpotify, label: 'Spotify', color: '#1DB954' },
    { url: band.apple_music_link, icon: IconBrandApple, label: 'Apple Music', color: '#000000' },
    { url: band.youtube_music_link, icon: IconBrandYoutube, label: 'YouTube Music', color: '#FF0000' },
    { url: band.bandcamp_link, icon: IconMusic, label: 'Bandcamp', color: '#629aa0' },
  ].filter(link => link.url);

  return (
    <Container size="md" py="xl">
      <Stack>
        {/* Band Header */}
        <Paper p="lg" radius="md">
          <Group align="flex-start">
            {band.profile_picture_url ? (
              <img
                src={band.profile_picture_url}
                alt={`${band.name} profile`}
                style={{ width: 120, height: 120, borderRadius: 12, objectFit: 'cover' }}
              />
            ) : (
              <Avatar size={120} color="grape.6">
                {band.name.charAt(0).toUpperCase()}
              </Avatar>
            )}
            
            <Stack flex={1} gap="xs">
              <Group justify="space-between" align="flex-start">
                <div>
                  <Title order={1}>{band.name}</Title>
                  {band.location && (
                    <Group gap="xs" mt="xs">
                      <IconMapPin size={16} />
                      <Text c="dimmed">{band.location}</Text>
                    </Group>
                  )}
                </div>
                
                <Badge variant="light" color="grape">
                  {band.reviews_count} review{band.reviews_count !== 1 ? 's' : ''}
                </Badge>
              </Group>

              <Text size="sm" c="dimmed">
                Created by @{band.owner.username} • {formatDate(band.created_at)}
              </Text>
            </Stack>
          </Group>
        </Paper>

        {/* About Section */}
        {band.about && (
          <Paper p="lg" radius="md">
            <Title order={3} mb="md">About</Title>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{band.about}</Text>
          </Paper>
        )}

        {/* Streaming Links */}
        {streamingLinks.length > 0 && (
          <Paper p="lg" radius="md">
            <Title order={3} mb="md">Listen On</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              {streamingLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={index}
                    component="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    leftSection={<Icon size={18} />}
                    style={{ color: link.color, borderColor: link.color }}
                  >
                    {link.label}
                  </Button>
                );
              })}
            </SimpleGrid>
          </Paper>
        )}

        {/* Reviews Section */}
        <Paper p="lg" radius="md">
          <Title order={3} mb="md">Reviews</Title>
          
          {band.reviews_count === 0 ? (
            <Center py="xl">
              <Stack align="center">
                <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" ta="center">
                  No reviews yet. Be the first to review {band.name}!
                </Text>
                <Button
                  component={Link}
                  href="/user/create-review"
                  variant="outline"
                >
                  Write a Review
                </Button>
              </Stack>
            </Center>
          ) : (
            <Stack>
              <Text c="dimmed">
                {band.reviews_count} review{band.reviews_count !== 1 ? 's' : ''} for this band.
              </Text>
              {/* TODO: Add actual reviews list when backend provides it */}
              <Button
                component={Link}
                href="/user/create-review"
                variant="outline"
              >
                Write a Review
              </Button>
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}