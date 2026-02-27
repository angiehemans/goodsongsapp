'use client';

import Link from 'next/link';
import {
  IconArrowDownRight,
  IconArrowUpRight,
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
  Grid,
  Group,
  Paper,
  Progress,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';

// Sample data - would come from API in production
const SAMPLE_STATS = {
  totalViews: 24892,
  viewsChange: 12.5,
  totalPosts: 47,
  postsChange: 3,
  subscribers: 1284,
  subscribersChange: 8.2,
  comments: 342,
  commentsChange: -2.4,
};

const SAMPLE_VIEWS_DATA = [
  { date: 'Jan 1', views: 1200 },
  { date: 'Jan 8', views: 1450 },
  { date: 'Jan 15', views: 1380 },
  { date: 'Jan 22', views: 1890 },
  { date: 'Jan 29', views: 2100 },
  { date: 'Feb 5', views: 1950 },
  { date: 'Feb 12', views: 2400 },
  { date: 'Feb 19', views: 2780 },
  { date: 'Feb 26', views: 3100 },
];

const SAMPLE_AUDIENCE_DATA = [
  { month: 'Oct', subscribers: 890 },
  { month: 'Nov', subscribers: 1020 },
  { month: 'Dec', subscribers: 1150 },
  { month: 'Jan', subscribers: 1284 },
];

const SAMPLE_TRAFFIC_SOURCES = [
  { name: 'Direct', value: 42, color: 'grape.6' },
  { name: 'Social', value: 28, color: 'blue.6' },
  { name: 'Search', value: 18, color: 'teal.6' },
  { name: 'Referral', value: 12, color: 'orange.6' },
];

const SAMPLE_RECENT_POSTS = [
  {
    id: '1',
    title: 'The Evolution of Indie Rock in 2024',
    status: 'published',
    views: 2341,
    comments: 23,
    publishDate: '2024-02-15',
  },
  {
    id: '2',
    title: 'Album Review: New Horizons by The Wanderers',
    status: 'published',
    views: 1876,
    comments: 15,
    publishDate: '2024-02-10',
  },
  {
    id: '3',
    title: 'Top 10 Underground Artists to Watch',
    status: 'draft',
    views: 0,
    comments: 0,
    publishDate: null,
  },
  {
    id: '4',
    title: 'Concert Review: Live at the Fillmore',
    status: 'published',
    views: 1234,
    comments: 8,
    publishDate: '2024-02-05',
  },
  {
    id: '5',
    title: 'The Return of Vinyl: Why Records Matter',
    status: 'scheduled',
    views: 0,
    comments: 0,
    publishDate: '2024-03-01',
  },
];

const SAMPLE_ACTIVITY = [
  {
    id: '1',
    type: 'comment',
    user: 'Sarah M.',
    avatar: null,
    action: 'commented on',
    target: 'The Evolution of Indie Rock',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'subscriber',
    user: 'Alex K.',
    avatar: null,
    action: 'subscribed to your blog',
    target: null,
    time: '4 hours ago',
  },
  {
    id: '3',
    type: 'comment',
    user: 'Mike R.',
    avatar: null,
    action: 'replied to your comment on',
    target: 'Album Review: New Horizons',
    time: '6 hours ago',
  },
  {
    id: '4',
    type: 'subscriber',
    user: 'Emma L.',
    avatar: null,
    action: 'subscribed to your blog',
    target: null,
    time: '1 day ago',
  },
  {
    id: '5',
    type: 'comment',
    user: 'Jordan T.',
    avatar: null,
    action: 'commented on',
    target: 'Concert Review: Live at the Fillmore',
    time: '1 day ago',
  },
];

const SAMPLE_TOP_POSTS = [
  { title: 'Best Albums of 2023: A Retrospective', views: 8420, percentage: 100 },
  { title: 'The Evolution of Indie Rock in 2024', views: 6234, percentage: 74 },
  { title: 'Interview: Rising Star Maya Chen', views: 4521, percentage: 54 },
  { title: 'Festival Season Guide 2024', views: 3890, percentage: 46 },
  { title: 'Album Review: New Horizons', views: 2876, percentage: 34 },
];

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  change: number;
  icon: typeof IconEye;
  color: string;
}) {
  const isPositive = change >= 0;

  return (
    <Paper p="md" radius="md" withBorder>
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {title}
          </Text>
          <Text size="xl" fw={700} mt={4}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
          <Group gap={4} mt={4}>
            {isPositive ? (
              <IconArrowUpRight size={16} color="var(--mantine-color-teal-6)" />
            ) : (
              <IconArrowDownRight size={16} color="var(--mantine-color-red-6)" />
            )}
            <Text size="xs" c={isPositive ? 'teal' : 'red'} fw={500}>
              {isPositive ? '+' : ''}
              {change}%
            </Text>
            <Text size="xs" c="dimmed">
              vs last month
            </Text>
          </Group>
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

export default function BloggerDashboardPage() {
  const { user } = useAuth();

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
            value={SAMPLE_STATS.totalViews}
            change={SAMPLE_STATS.viewsChange}
            icon={IconEye}
            color="grape"
          />
          <StatCard
            title="Total Posts"
            value={SAMPLE_STATS.totalPosts}
            change={SAMPLE_STATS.postsChange}
            icon={IconFileText}
            color="blue"
          />
          <StatCard
            title="Subscribers"
            value={SAMPLE_STATS.subscribers}
            change={SAMPLE_STATS.subscribersChange}
            icon={IconUsers}
            color="teal"
          />
          <StatCard
            title="Comments"
            value={SAMPLE_STATS.comments}
            change={SAMPLE_STATS.commentsChange}
            icon={IconMessageCircle}
            color="orange"
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
                <Badge variant="light" color="grape" leftSection={<IconTrendingUp size={12} />}>
                  +23% this month
                </Badge>
              </Group>
              <AreaChart
                h={250}
                data={SAMPLE_VIEWS_DATA}
                dataKey="date"
                series={[{ name: 'views', color: 'grape.6' }]}
                curveType="natural"
                gridAxis="x"
                withDots={false}
              />
            </Paper>
          </Grid.Col>

          {/* Traffic Sources */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Paper p="md" radius="md" withBorder h="100%">
              <Text fw={600} mb="md">
                Traffic Sources
              </Text>
              <DonutChart
                data={SAMPLE_TRAFFIC_SOURCES}
                size={160}
                thickness={24}
                mx="auto"
                tooltipDataSource="segment"
                chartLabel="Sources"
              />
              <Stack gap="xs" mt="md">
                {SAMPLE_TRAFFIC_SOURCES.map((source) => (
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
                      {source.value}%
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Posts and Activity Row */}
        <Grid>
          {/* Recent Posts */}
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Paper p="md" radius="md" withBorder>
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
              <Table.ScrollContainer minWidth={500}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Title</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th ta="right">Views</Table.Th>
                      <Table.Th ta="right">Comments</Table.Th>
                      <Table.Th />
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {SAMPLE_RECENT_POSTS.map((post) => (
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
                          <Text size="sm">{post.views.toLocaleString()}</Text>
                        </Table.Td>
                        <Table.Td ta="right">
                          <Text size="sm">{post.comments}</Text>
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
            </Paper>
          </Grid.Col>

          {/* Recent Activity */}
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Paper p="md" radius="md" withBorder h="100%">
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
              <Stack gap="sm">
                {SAMPLE_ACTIVITY.map((activity) => (
                  <Group key={activity.id} gap="sm" wrap="nowrap">
                    <Avatar size="sm" radius="xl" color="grape">
                      {activity.user.charAt(0)}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" lineClamp={2}>
                        <Text span fw={500}>
                          {activity.user}
                        </Text>{' '}
                        {activity.action}
                        {activity.target && (
                          <>
                            {' '}
                            <Text span fw={500}>
                              {activity.target}
                            </Text>
                          </>
                        )}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {activity.time}
                      </Text>
                    </div>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Bottom Row */}
        <Grid>
          {/* Audience Growth */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="md">
                Subscriber Growth
              </Text>
              <BarChart
                h={200}
                data={SAMPLE_AUDIENCE_DATA}
                dataKey="month"
                series={[{ name: 'subscribers', color: 'teal.6' }]}
                gridAxis="y"
              />
            </Paper>
          </Grid.Col>

          {/* Top Posts */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Paper p="md" radius="md" withBorder>
              <Text fw={600} mb="md">
                Top Performing Posts
              </Text>
              <Stack gap="md">
                {SAMPLE_TOP_POSTS.map((post, index) => (
                  <div key={post.title}>
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
                    <Progress value={post.percentage} color="grape" size="sm" />
                  </div>
                ))}
              </Stack>
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
