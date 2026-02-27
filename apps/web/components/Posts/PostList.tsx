'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconCalendar, IconEdit, IconFileText, IconPlus, IconStar } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Button,
  Center,
  Group,
  Loader,
  Pagination,
  Paper,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, PostListItem, PostListPagination, PostStatus } from '@/lib/api';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: PostStatus }) {
  const colors: Record<PostStatus, string> = {
    draft: 'gray',
    published: 'green',
    scheduled: 'blue',
  };

  return (
    <Badge color={colors[status]} variant="light" size="sm">
      {status}
    </Badge>
  );
}

export function PostList() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [pagination, setPagination] = useState<PostListPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const getPostUrl = (post: PostListItem) => {
    if (post.status === 'published' && user?.username) {
      return `/blog/${user.username}/${post.slug}`;
    }
    return `/user/blogger/posts/editor?id=${post.id}`;
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; status?: PostStatus } = { page };
      if (statusFilter !== 'all') {
        params.status = statusFilter as PostStatus;
      }
      const response = await apiClient.getMyPosts(params);
      setPosts(response.posts);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <Stack gap="md" p="md">
      {/* Header */}
      <Group justify="space-between" align="center">
        <Title order={2}>Posts</Title>
        <Button
          component={Link}
          href="/user/blogger/posts/editor"
          leftSection={<IconPlus size={16} />}
          color="grape"
        >
          New Post
        </Button>
      </Group>

      {/* Filters */}
      <Group>
        <SegmentedControl
          value={statusFilter}
          onChange={handleStatusFilterChange}
          data={[
            { label: 'All', value: 'all' },
            { label: 'Drafts', value: 'draft' },
            { label: 'Published', value: 'published' },
            { label: 'Scheduled', value: 'scheduled' },
          ]}
        />
      </Group>

      {/* Content */}
      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : posts.length === 0 ? (
        <Paper p="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <IconFileText size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" ta="center">
                {statusFilter === 'all'
                  ? "You haven't created any posts yet."
                  : `No ${statusFilter} posts found.`}
              </Text>
              <Button
                component={Link}
                href="/user/blogger/posts/editor"
                leftSection={<IconPlus size={16} />}
                color="grape"
              >
                Create your first post
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Title</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Authors</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th w={80}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {posts.map((post) => (
                <Table.Tr
                  key={post.id}
                  onClick={() => router.push(getPostUrl(post))}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Group gap="xs">
                      {post.featured && (
                        <IconStar size={14} color="var(--mantine-color-yellow-6)" />
                      )}
                      <Text fw={500}>{post.title}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge status={post.status} />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {post.authors.map((a) => a.name).join(', ')}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {post.status === 'scheduled' && post.publish_date ? (
                        <>
                          <IconCalendar size={14} />
                          <Text size="sm">{formatDate(post.publish_date)}</Text>
                        </>
                      ) : (
                        <Text size="sm" c="dimmed">
                          {formatDate(post.updated_at)}
                        </Text>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      component={Link}
                      href={`/user/blogger/posts/editor?id=${post.id}`}
                      variant="subtle"
                      color="grape"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <Center>
              <Pagination
                value={page}
                onChange={setPage}
                total={pagination.total_pages}
                color="grape"
              />
            </Center>
          )}
        </>
      )}
    </Stack>
  );
}
