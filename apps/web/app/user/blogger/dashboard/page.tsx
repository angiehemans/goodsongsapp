'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconEdit,
  IconEye,
  IconFileText,
  IconMessageCircle,
  IconPlus,
  IconTrendingUp,
  IconUsers,
} from '@tabler/icons-react';
import { AreaChart, BarChart, DonutChart } from '@mantine/charts';
import {
  ActionIcon,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Grid,
  Group,
  Loader,
  Paper,
  Progress,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';
import {
  apiClient,
  BlogDashboardResponse,
  BlogDashboardTopPost,
} from '@/lib/api';
import { fixImageUrl } from '@/lib/utils';

// Color mapping for traffic sources
const SOURCE_COLORS: Record<string, string> = {
  google: 'blue.6',
  direct: 'grape.6',
  goodsongs: 'teal.6',
  twitter: 'cyan.6',
  facebook: 'indigo.6',
  instagram: 'pink.6',
  reddit: 'orange.6',
  other: 'gray.6',
};

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source.toLowerCase()] || SOURCE_COLORS.other;
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  icon: typeof IconEye;
  color: string;
  loading?: boolean;
}) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {title}
          </Text>
          {loading ? (
            <Skeleton height={28} width={80} mt={4} />
          ) : (
            <Text size="xl" fw={700} mt={4}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Text>
          )}
        </div>
        <ThemeIcon size="lg" radius="md" variant="light" color={color}>
          <Icon size={20} />
        </ThemeIcon>
      </Group>
    </Paper>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'published':
      return 'green';
    case 'draft':
      return 'gray';
    case 'scheduled':
      return 'blue';
    default:
      return 'gray';
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getNotificationText(type: string, actorName: string): { action: string; target: string | null } {
  switch (type) {
    case 'post_like':
      return { action: 'liked your post', target: null };
    case 'post_comment':
      return { action: 'commented on your post', target: null };
    case 'follow':
      return { action: 'started following you', target: null };
    case 'mention':
      return { action: 'mentioned you', target: null };
    default:
      return { action: 'interacted with your content', target: null };
  }
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
}

export default function BloggerDashboardPage() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<BlogDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const data = await apiClient.getBlogDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  // Transform page views data for chart
  const viewsChartData = dashboardData?.page_views_over_time.map((item) => ({
    date: formatDate(item.date),
    views: item.views,
  })) || [];

  // Transform traffic sources for donut chart
  const trafficSourcesData = dashboardData?.traffic_sources.map((source) => ({
    name: source.source.charAt(0).toUpperCase() + source.source.slice(1),
    value: source.percentage,
    color: getSourceColor(source.source),
  })) || [];

  // Transform follower growth for bar chart
  const followerGrowthData = dashboardData?.follower_growth.map((item) => ({
    week: formatDate(item.week),
    followers: item.new_followers,
  })) || [];

  // Calculate max views for top posts progress bars
  const maxEngagement = dashboardData?.top_performing_posts[0]?.engagement_score || 1;

  if (error) {
    return (
      <ScrollArea h="calc(100vh - 60px)" p="md">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Text c="red">{error}</Text>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Stack>
        </Center>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea h="calc(100vh - 60px)" p="md">
      <Stack gap="lg" maw={1200}>
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2} style={{ color: 'var(--gs-text-heading)' }} fw={500}>
              Dashboard
            </Title>
            <Text size="sm" c="dimmed">
              Welcome back, {user?.display_name || user?.username}
            </Text>
          </div>
          <Button
            component={Link}
            href="/user/blogger/posts/editor"
            leftSection={<IconPlus size={16} />}
            color="grape"
          >
            New Post
          </Button>
        </Group>

        {/* Stats Grid */}
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
          <StatCard
            title="Page Views"
            value={dashboardData?.totals.page_views || 0}
            icon={IconEye}
            color="grape"
            loading={loading}
          />
          <StatCard
            title="Total Posts"
            value={dashboardData?.totals.posts || 0}
            icon={IconFileText}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Followers"
            value={dashboardData?.totals.followers || 0}
            icon={IconUsers}
            color="teal"
            loading={loading}
          />
          <StatCard
            title="Comments"
            value={dashboardData?.totals.comments || 0}
            icon={IconMessageCircle}
            color="orange"
            loading={loading}
          />
        </SimpleGrid>

        {/* Charts Row */}
        <Grid>
          {/* Views Chart */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Paper p="md" radius="md" withBorder h="100%">
              <Group justify="space-between" mb="md">
                <div>
                  <Text fw={600}>Page Views</Text>
                  <Text size="xs" c="dimmed">
                    Last 60 days
                  </Text>
                </div>
                {dashboardData && viewsChartData.length > 1 && (
                  <Badge variant="light" color="grape" leftSection={<IconTrendingUp size={12} />}>
                    {dashboardData.totals.page_views.toLocaleString()} total
                  </Badge>
                )}
              </Group>
              {loading ? (
                <Skeleton height={250} />
              ) : viewsChartData.length > 0 ? (
                <AreaChart
                  h={250}
                  data={viewsChartData}
                  dataKey="date"
                  series={[{ name: 'views', color: 'grape.6' }]}
                  curveType="natural"
                  gridAxis="x"
                  withDots={false}
                />
              ) : (
                <Center h={250}>
                  <Text c="dimmed">No page view data yet</Text>
                </Center>
              )}
            </Paper>
          </Grid.Col>

          {/* Traffic Sources */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" radius="md" withBorder h="100%">
              <Text fw={600} mb="md">
                Traffic Sources
              </Text>
              {loading ? (
                <Center h={200}>
                  <Loader size="sm" />
                </Center>
              ) : trafficSourcesData.length > 0 ? (
                <>
                  <DonutChart
                    data={trafficSourcesData}
                    size={160}
                    thickness={24}
                    mx="auto"
                    tooltipDataSource="segment"
                    chartLabel="Sources"
                  />
                  <Stack gap="xs" mt="md">
                    {trafficSourcesData.map((source) => (
                      <Group key={source.name} justify="space-between">
                        <Group gap="xs">
                          <Box
                            w={10}
                            h={10}
                            style={{
                              borderRadius: '50%',
                              backgroundColor: `var(--mantine-color-${source.color})`,
                            }}
                          />
                          <Text size="sm">{source.name}</Text>
                        </Group>
                        <Text size="sm" fw={500}>
                          {source.value.toFixed(1)}%
                        </Text>
                      </Group>
                    ))}
                  </Stack>
                </>
              ) : (
                <Center h={200}>
                  <Text c="dimmed" size="sm">No traffic data yet</Text>
                </Center>
              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Posts and Activity Row */}
        <Grid>
          {/* Recent Posts */}
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Paper p="md" radius="md" withBorder style={{ height: '-webkit-fill-available' }}>
              <Group justify="space-between" mb="md">
                <Text fw={600}>Recent Posts</Text>
                <Button
                  component={Link}
                  href="/user/blogger/posts"
                  variant="subtle"
                  color="grape"
                  size="xs"
                >
                  View all
                </Button>
              </Group>
              {loading ? (
                <Stack gap="sm">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} height={40} />
                  ))}
                </Stack>
              ) : dashboardData?.recent_posts && dashboardData.recent_posts.length > 0 ? (
                <Table.ScrollContainer minWidth={500}>
                  <Table verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Title</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th ta="right">Likes</Table.Th>
                        <Table.Th ta="right">Comments</Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {dashboardData.recent_posts.map((post) => (
                        <Table.Tr key={post.id}>
                          <Table.Td>
                            <Text size="sm" lineClamp={1} maw={250}>
                              {post.title}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge
                              variant="light"
                              color={getStatusColor(post.status)}
                              size="sm"
                              tt="capitalize"
                            >
                              {post.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text size="sm">{post.likes_count.toLocaleString()}</Text>
                          </Table.Td>
                          <Table.Td ta="right">
                            <Text size="sm">{post.comments_count}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Tooltip label="Edit post">
                              <ActionIcon
                                component={Link}
                                href={`/user/blogger/posts/editor?id=${post.id}`}
                                variant="subtle"
                                color="gray"
                                size="sm"
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              ) : (
                <Center py="xl">
                  <Stack align="center" gap="xs">
                    <Text c="dimmed">No posts yet</Text>
                    <Button
                      component={Link}
                      href="/user/blogger/posts/editor"
                      variant="light"
                      color="grape"
                      size="xs"
                    >
                      Create your first post
                    </Button>
                  </Stack>
                </Center>
              )}
            </Paper>
          </Grid.Col>

          {/* Recent Activity */}
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Paper p="md" radius="md" withBorder style={{ height: '-webkit-fill-available' }}>
              <Group justify="space-between" mb="md">
                <Text fw={600}>Recent Activity</Text>
                <Button
                  component={Link}
                  href="/user/blogger/notifications"
                  variant="subtle"
                  color="grape"
                  size="xs"
                >
                  View all
                </Button>
              </Group>
              {loading ? (
                <Stack gap="sm">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Group key={i} gap="sm">
                      <Skeleton circle height={32} />
                      <Skeleton height={32} style={{ flex: 1 }} />
                    </Group>
                  ))}
                </Stack>
              ) : dashboardData?.recent_notifications && dashboardData.recent_notifications.length > 0 ? (
                <Stack gap="sm">
                  {dashboardData.recent_notifications.map((notification) => {
                    // Get actor name from actor or anonymous_commenter
                    const actorName = notification.actor?.display_name
                      || notification.actor?.username
                      || notification.anonymous_commenter?.name
                      || 'Someone';
                    const actorImage = notification.actor?.profile_image_url;

                    return (
                      <Group key={notification.id} gap="sm" wrap="nowrap">
                        <Avatar
                          src={actorImage ? fixImageUrl(actorImage) : undefined}
                          size="sm"
                          radius="xl"
                          color="grape"
                        >
                          {actorName.charAt(0)}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {actorName}
                          </Text>
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {notification.message || getNotificationText(notification.type, actorName).action}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {timeAgo(notification.created_at)}
                          </Text>
                        </div>
                        {!notification.read && (
                          <Box
                            w={8}
                            h={8}
                            style={{
                              borderRadius: '50%',
                              backgroundColor: 'var(--mantine-color-grape-6)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Group>
                    );
                  })}
                </Stack>
              ) : (
                <Center py="xl">
                  <Text c="dimmed">No recent activity</Text>
                </Center>
              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Bottom Row */}
        <Grid>
          {/* Follower Growth */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper p="md" radius="md" withBorder style={{ height: '-webkit-fill-available' }}>
              <Text fw={600} mb="md">
                Follower Growth
              </Text>
              {loading ? (
                <Skeleton height={200} />
              ) : followerGrowthData.length > 0 ? (
                <BarChart
                  h={200}
                  data={followerGrowthData}
                  dataKey="week"
                  series={[{ name: 'followers', color: 'teal.6' }]}
                  gridAxis="y"
                />
              ) : (
                <Center h={200}>
                  <Text c="dimmed" size="sm">No follower data yet</Text>
                </Center>
              )}
            </Paper>
          </Grid.Col>

          {/* Top Posts */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper p="md" radius="md" withBorder style={{ height: '-webkit-fill-available' }}>
              <Text fw={600} mb="md">
                Top Performing Posts
              </Text>
              {loading ? (
                <Stack gap="md">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} height={40} />
                  ))}
                </Stack>
              ) : dashboardData?.top_performing_posts && dashboardData.top_performing_posts.length > 0 ? (
                <Stack gap="md">
                  {dashboardData.top_performing_posts.map((post: BlogDashboardTopPost, index: number) => (
                    <div key={post.id}>
                      <Group justify="space-between" mb={4}>
                        <Group gap="xs">
                          <Text size="sm" c="dimmed" w={20}>
                            {index + 1}.
                          </Text>
                          <Text size="sm" lineClamp={1}>
                            {post.title}
                          </Text>
                        </Group>
                        <Text size="sm" fw={500}>
                          {post.views.toLocaleString()} views
                        </Text>
                      </Group>
                      <Progress
                        value={(post.engagement_score / maxEngagement) * 100}
                        color="grape"
                        size="sm"
                      />
                    </div>
                  ))}
                </Stack>
              ) : (
                <Center py="xl">
                  <Text c="dimmed">No posts with engagement data yet</Text>
                </Center>
              )}
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Quick Tips Card */}
        <Card p="lg" radius="md" withBorder bg="var(--mantine-color-grape-light)">
          <Group justify="space-between" wrap="nowrap">
            <div>
              <Text fw={600} mb={4}>
                Ready to grow your audience?
              </Text>
              <Text size="sm" c="dimmed">
                Connect your social accounts and enable email notifications to reach more readers.
              </Text>
            </div>
            <Button
              component={Link}
              href="/user/blogger/settings"
              variant="filled"
              color="grape"
              style={{ flexShrink: 0 }}
            >
              Go to Settings
            </Button>
          </Group>
        </Card>
      </Stack>
    </ScrollArea>
  );
}
