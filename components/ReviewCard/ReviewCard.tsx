import { Badge, Card, Flex, Group, Stack, Text, Title } from '@mantine/core';
import { Review } from '@/lib/api';

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card key={review.id} p="md">
      <Flex direction="column" gap="sm">
        <Flex gap="sm">
          {review.artwork_url ? (
            <img
              src={review.artwork_url}
              alt={`${review.song_name} artwork`}
              style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                backgroundColor: 'var(--mantine-color-grape-3)',
              }}
            />
          )}
          <div>
            <Title order={5}>{review.song_name}</Title>
            <Text size="sm" c="dimmed">
              {review.band_name}
            </Text>
          </div>
        </Flex>
        <Stack gap="xs">
          <Text size="sm" lineClamp={2}>
            {review.review_text}
          </Text>
          {review.liked_aspects.length > 0 && (
            <Group gap="xs">
              {review.liked_aspects.slice(0, 3).map((aspect, index) => (
                <Badge key={index} size="sm" variant="light" color="grape">
                  {typeof aspect === 'string' ? aspect : aspect.name || String(aspect)}
                </Badge>
              ))}
              {review.liked_aspects.length > 3 && (
                <Text size="xs" c="dimmed">
                  +{review.liked_aspects.length - 3} more
                </Text>
              )}
            </Group>
          )}
        </Stack>
      </Flex>
    </Card>
  );
}
