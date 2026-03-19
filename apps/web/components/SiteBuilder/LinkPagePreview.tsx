'use client';

import { Center, Text } from '@mantine/core';
import { ProfileLink, ProfilePage, ProfileSourceData, ProfileTheme, LinkPageResponse } from '@/lib/site-builder/types';
import { LinkPage } from './LinkPage';

interface LinkPagePreviewProps {
  theme: ProfileTheme;
  pages: ProfilePage[];
  sourceData: ProfileSourceData | null;
  profileLinks: ProfileLink[];
}

export function LinkPagePreview({ theme, pages, sourceData, profileLinks }: LinkPagePreviewProps) {
  const linkPage = pages.find((p) => p.type === 'links');
  const settings = linkPage?.settings || {};

  if (linkPage && !linkPage.visible) {
    return (
      <Center h={400}>
        <Text c="dimmed" ta="center" maw={300}>
          Link page is hidden. Toggle visibility in settings to make it live.
        </Text>
      </Center>
    );
  }

  // Build the data shape expected by LinkPage
  const data: LinkPageResponse['data'] = {
    user: {
      id: sourceData?.user?.id || 0,
      username: sourceData?.user?.username || '',
      display_name: sourceData?.display_name || sourceData?.band?.name || 'Your Name',
      profile_image_url: sourceData?.profile_image_url || sourceData?.band?.profile_picture_url,
      location: sourceData?.location || sourceData?.band?.location,
      role: sourceData?.user?.role || 'band',
    },
    theme,
    page_settings: settings,
    profile: {
      display_name: sourceData?.display_name || sourceData?.band?.name || 'Your Name',
      about: sourceData?.about_text || sourceData?.band?.about,
      profile_image_url: sourceData?.profile_image_url || sourceData?.band?.profile_picture_url,
      location: sourceData?.location || sourceData?.band?.location,
    },
    custom_links: profileLinks
      .filter((l) => l.visible)
      .sort((a, b) => a.position - b.position)
      .map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        icon: l.icon,
        thumbnail_url: l.thumbnail_url,
        position: l.position,
      })),
    social_links: sourceData?.social_links || {},
    streaming_links: sourceData?.streaming_links || {},
  };

  return <LinkPage data={data} isPreview />;
}
