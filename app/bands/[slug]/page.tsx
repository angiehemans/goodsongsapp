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
  Card,
  Rating,
  Divider,
} from '@mantine/core';
import { IconAlertCircle, IconMapPin, IconMusic, IconBrandSpotify, IconBrandApple, IconBrandYoutube, IconPlus, IconCalendar } from '@tabler/icons-react';
import { Band } from '@/lib/api';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';


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
    // For server components, we need to use the full URL to the Next.js API route
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
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
                Created by @{band.owner?.username || 'Unknown'} • {formatDate(band.created_at)}
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
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>Reviews</Title>
            <Button
              component={Link}
              href="/user/create-review"
              variant="outline"
              leftSection={<IconPlus size={16} />}
            >
              Write a Review
            </Button>
          </Group>
          
          {!band.reviews || band.reviews.length === 0 ? (
            <Center py="xl">
              <Stack align="center">
                <IconMusic size={48} color="var(--mantine-color-dimmed)" />
                <Text c="dimmed" ta="center">
                  No reviews yet. Be the first to review {band.name}!
                </Text>
                <Button
                  component={Link}
                  href="/user/create-review"
                  variant="filled"
                >
                  Write the First Review
                </Button>
              </Stack>
            </Center>
          ) : (
            <Stack>
              <Text size="sm" c="dimmed" mb="md">
                {band.reviews_count} review{band.reviews_count !== 1 ? 's' : ''} for this band
              </Text>
              
              {band.reviews.map((review) => (
                <Card key={review.id} p="lg">
                  <Stack>
                    {/* Review Header */}
                    <Group justify="space-between" align="flex-start">
                      <Group>
                        {review.artwork_url && (
                          <img
                            src={review.artwork_url}
                            alt={`${review.song_name} artwork`}
                            style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }}
                          />
                        )}
                        <Stack gap="xs">
                          <div>
                            <Title order={4}>{review.song_name}</Title>
                            <Text size="sm" c="dimmed">{review.band_name}</Text>
                          </div>
                          <Group gap="xs">
                            <Text size="sm" fw={500}>by</Text>
                            <Text 
                              size="sm" 
                              component={Link} 
                              href={`/users/${review.user?.username || 'unknown'}`}
                              c="grape.6"
                              style={{ textDecoration: 'none' }}
                            >
                              @{review.user?.username || 'Unknown User'}
                            </Text>
                          </Group>
                        </Stack>
                      </Group>
                      <Group align="center" gap="xs">
                        <Rating value={review.overall_rating} readOnly size="sm" />
                        <Text size="sm" c="dimmed">
                          {review.overall_rating}/5
                        </Text>
                      </Group>
                    </Group>

                    <Divider />

                    {/* Review Content */}
                    <Text>{review.review_text}</Text>

                    {/* Liked Aspects */}
                    {review.liked_aspects.length > 0 && (
                      <Group>
                        <Text size="sm" fw={500}>Liked:</Text>
                        <Group gap="xs">
                          {review.liked_aspects.map((aspect, index) => (
                            <Badge key={index} variant="light" color="grape">
                              {typeof aspect === 'string' ? aspect : aspect.name || String(aspect)}
                            </Badge>
                          ))}
                        </Group>
                      </Group>
                    )}

                    {/* Review Footer */}
                    <Group justify="space-between" align="center">
                      <Group gap="xs">
                        <IconCalendar size={14} />
                        <Text size="xs" c="dimmed">
                          {formatDate(review.created_at)}
                        </Text>
                      </Group>
                      
                      {review.song_link && (
                        <Button
                          component="a"
                          href={review.song_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="subtle"
                          size="xs"
                        >
                          Listen
                        </Button>
                      )}
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}