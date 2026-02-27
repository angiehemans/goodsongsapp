'use client';

import dynamic from 'next/dynamic';
import { Center, Loader } from '@mantine/core';

const PostEditor = dynamic(
  () => import('@/components/Posts/PostEditor').then((mod) => mod.PostEditor),
  {
    ssr: false,
    loading: () => (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    ),
  }
);

export default function BloggerPostEditorPage() {
  return <PostEditor />;
}
