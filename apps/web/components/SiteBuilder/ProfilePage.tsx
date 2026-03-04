'use client';

import { CSSProperties, useEffect, useMemo } from 'react';
import { ProfileTheme, Section, HeroData, AboutData, ProfileSourceData } from '@/lib/site-builder/types';
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
  };

  // Inject source data into sections for preview
  const sectionsWithData = useMemo(() => {
    if (!sourceData) return sections;

    return sections.map((section) => {
      // If section already has data, use it
      if (section.data) return section;

      // Otherwise, inject source data based on section type
      switch (section.type) {
        case 'hero': {
          const heroData: HeroData = {
            display_name: sourceData.display_name,
            profile_image_url: sourceData.profile_image_url,
            location: sourceData.location,
            streaming_links: sourceData.streaming_links as any,
            social_links: sourceData.social_links as any,
          };
          return { ...section, data: heroData };
        }
        case 'about': {
          const aboutData: AboutData = {
            about_me: sourceData.about_text,
          };
          return { ...section, data: aboutData };
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
