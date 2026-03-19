'use client';

import { CSSProperties, useEffect, useMemo } from 'react';
import { ProfileTheme, Section, HeroData, AboutData, PostsData, RecommendationsData, EventsData, ProfileSourceData } from '@/lib/site-builder/types';
import { getFontFamily, getGoogleFontsUrl } from '@/lib/site-builder/fonts';
import { ProfileFooter } from './ProfileFooter';
import { ProfileSections } from './SectionRenderer';
import './profile-theme.css';

interface ProfilePageProps {
  theme: ProfileTheme;
  sections: Section[];
  sourceData?: ProfileSourceData | null;
  isPreview?: boolean;
  className?: string;
}

export function ProfilePage({
  theme,
  sections,
  sourceData,
  isPreview = false,
  className = ''
}: ProfilePageProps) {
  // Load Google Fonts for the selected fonts
  useEffect(() => {
    const fonts = [theme.header_font, theme.body_font].filter(Boolean);
    if (fonts.length === 0) return;

    const fontsUrl = getGoogleFontsUrl(fonts);
    const linkId = 'profile-google-fonts';

    // Check if the link already exists
    let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;

    if (linkEl) {
      // Update href if fonts changed
      if (linkEl.href !== fontsUrl) {
        linkEl.href = fontsUrl;
      }
    } else {
      // Create new link element
      linkEl = document.createElement('link');
      linkEl.id = linkId;
      linkEl.rel = 'stylesheet';
      linkEl.href = fontsUrl;
      document.head.appendChild(linkEl);
    }
  }, [theme.header_font, theme.body_font]);

  // Build CSS custom properties from theme
  const style: CSSProperties & Record<string, string> = {
    '--gs-profile-bg': theme.background_color,
    '--gs-profile-brand': theme.brand_color,
    '--gs-profile-font': theme.font_color,
    '--gs-profile-header-font': getFontFamily(theme.header_font),
    '--gs-profile-body-font': getFontFamily(theme.body_font),
    '--gs-profile-content-max-width': `${theme.content_max_width || 1200}px`,
    '--gs-profile-radius': `${theme.border_radius ?? 12}px`,
    '--gs-card-bg': `color-mix(in srgb, ${theme.card_background_color || theme.font_color} ${theme.card_background_opacity ?? 10}%, transparent)`,
  };

  // Inject source data into sections for preview
  const sectionsWithData = useMemo(() => {
    if (!sourceData) return sections;

    // Compute post_base_path from sourceData
    // Band profiles use /bands/{slug}, user profiles use /blog/{username}
    const postBasePath = sourceData.band?.slug
      ? `/bands/${sourceData.band.slug}`
      : sourceData.user?.username
        ? `/blog/${sourceData.user.username}`
        : undefined;

    return sections.map((section) => {
      // For posts sections, always inject post_base_path even if data exists
      if (section.type === 'posts' && section.data && postBasePath) {
        return {
          ...section,
          data: { ...section.data, post_base_path: postBasePath },
        };
      }
      // For hero sections, always inject owner_user_id even if data exists
      if (section.type === 'hero' && section.data && sourceData.user?.id) {
        return {
          ...section,
          data: { ...section.data, owner_user_id: sourceData.user.id },
        };
      }
      // If section already has data, use it
      if (section.data) return section;

      // Otherwise, inject source data based on section type
      switch (section.type) {
        case 'hero': {
          const heroData: HeroData = {
            display_name: sourceData.display_name,
            profile_image_url: sourceData.profile_image_url || sourceData.band?.profile_picture_url,
            location: sourceData.location,
            streaming_links: sourceData.streaming_links as any,
            social_links: sourceData.social_links as any,
            owner_user_id: sourceData.user?.id,
          };
          return { ...section, data: heroData };
        }
        case 'about': {
          const aboutData: AboutData = {
            about_me: sourceData.about_text,
          };
          return { ...section, data: aboutData };
        }
        case 'posts': {
          if (!sourceData.posts || sourceData.posts.length === 0) return section;
          const postsData: PostsData = {
            posts: sourceData.posts,
            post_base_path: postBasePath,
          };
          return { ...section, data: postsData };
        }
        case 'events': {
          if (!sourceData.events || sourceData.events.length === 0) return section;
          const eventsData: EventsData = {
            events: sourceData.events,
          };
          return { ...section, data: eventsData };
        }
        case 'recommendations': {
          if (!sourceData.recommendations || sourceData.recommendations.length === 0) return section;
          const recommendationsData: RecommendationsData = {
            recommendations: sourceData.recommendations,
          };
          return { ...section, data: recommendationsData };
        }
        default:
          return section;
      }
    });
  }, [sections, sourceData]);

  return (
    <div className={`profile-page ${className}`} style={style}>
      <ProfileSections sections={sectionsWithData} theme={theme} isPreview={isPreview} />
      <ProfileFooter isPreview={isPreview} />
    </div>
  );
}
