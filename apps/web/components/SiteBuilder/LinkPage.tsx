'use client';

import { CSSProperties, useEffect, useMemo } from 'react';
import {
  IconBrandApple,
  IconBrandBandcamp,
  IconBrandBluesky,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandSoundcloud,
  IconBrandSpotify,
  IconBrandThreads,
  IconBrandTiktok,
  IconBrandTumblr,
  IconBrandX,
  IconBrandYoutube,
  IconHeart,
  IconLink,
  IconMail,
  IconMusic,
  IconShoppingBag,
  IconStar,
  IconVideo,
  IconWorld,
} from '@tabler/icons-react';
import { getFontFamily, getGoogleFontsUrl } from '@/lib/site-builder/fonts';
import {
  LinkPageHeaderElement,
  LinkPageResponse,
  LinkPageSettings,
  ProfileTheme,
} from '@/lib/site-builder/types';
import { fixImageUrl } from '@/lib/utils';
import { ProfileFooter } from './ProfileFooter';

import './profile-theme.css';

interface LinkPageProps {
  data: LinkPageResponse['data'];
  isPreview?: boolean;
}

const LINK_ICON_MAP: Record<string, React.ReactNode> = {
  link: <IconLink size={20} />,
  music: <IconMusic size={20} />,
  shop: <IconShoppingBag size={20} />,
  video: <IconVideo size={20} />,
  heart: <IconHeart size={20} />,
  star: <IconStar size={20} />,
  globe: <IconWorld size={20} />,
  mail: <IconMail size={20} />,
};

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <IconBrandInstagram size={22} />,
  threads: <IconBrandThreads size={22} />,
  bluesky: <IconBrandBluesky size={22} />,
  twitter: <IconBrandX size={22} />,
  tumblr: <IconBrandTumblr size={22} />,
  tiktok: <IconBrandTiktok size={22} />,
  facebook: <IconBrandFacebook size={22} />,
  youtube: <IconBrandYoutube size={22} />,
};

const STREAMING_ICONS: Record<string, React.ReactNode> = {
  spotify: <IconBrandSpotify size={22} />,
  appleMusic: <IconBrandApple size={22} />,
  bandcamp: <IconBrandBandcamp size={22} />,
  soundcloud: <IconBrandSoundcloud size={22} />,
  youtubeMusic: <IconBrandYoutube size={22} />,
};

const STREAMING_LABELS: Record<string, string> = {
  spotify: 'Spotify',
  appleMusic: 'Apple Music',
  bandcamp: 'Bandcamp',
  soundcloud: 'SoundCloud',
  youtubeMusic: 'YouTube Music',
};

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  threads: 'Threads',
  bluesky: 'Bluesky',
  twitter: 'X',
  tumblr: 'Tumblr',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  youtube: 'YouTube',
};

const DEFAULT_ELEMENT_ORDER: LinkPageHeaderElement[] = [
  'profile_image',
  'headline',
  'subtitle',
  'description',
  'social_links',
];
const ALL_HEADER_ELEMENTS: LinkPageHeaderElement[] = [
  'profile_image',
  'headline',
  'subtitle',
  'description',
  'social_links',
];

const GAP_VALUES: Record<string, string> = {
  none: '0',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2.5rem',
};

const JUSTIFY_VALUES: Record<string, string> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
  'space-between': 'space-between',
};

export function LinkPage({ data, isPreview }: LinkPageProps) {
  const { theme, page_settings, profile, custom_links, social_links, streaming_links, user } = data;
  const settings: LinkPageSettings = page_settings || {};

  // For band pages, profile_image_url may be null — fall back to band profile picture
  const profileImageUrl = profile.profile_image_url || user?.primary_band?.profile_picture_url;

  // Load Google Fonts (approved + custom)
  useEffect(() => {
    if (!theme) return;

    const approvedFonts = [
      theme.header_font_name || theme.header_font,
      theme.body_font_name || theme.body_font,
      settings.link_font_family,
    ].filter((f): f is string => !!f && !f.startsWith('https://'));

    if (approvedFonts.length > 0) {
      const fontsUrl = getGoogleFontsUrl(approvedFonts);
      const linkId = 'profile-google-fonts';
      let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;
      if (linkEl) {
        if (linkEl.href !== fontsUrl) linkEl.href = fontsUrl;
      } else {
        linkEl = document.createElement('link');
        linkEl.id = linkId;
        linkEl.rel = 'stylesheet';
        linkEl.href = fontsUrl;
        document.head.appendChild(linkEl);
      }
    }

    if (theme.custom_font_urls) {
      theme.custom_font_urls.forEach((url, i) => {
        const linkId = `profile-custom-font-${i}`;
        if (!document.getElementById(linkId)) {
          const linkEl = document.createElement('link');
          linkEl.id = linkId;
          linkEl.rel = 'stylesheet';
          linkEl.href = url;
          document.head.appendChild(linkEl);
        }
      });
    }
  }, [theme, settings.link_font_family]);

  const cssVars: CSSProperties & Record<string, string> = theme
    ? {
        '--gs-profile-bg': theme.background_color,
        '--gs-profile-brand': theme.brand_color,
        '--gs-profile-font': theme.font_color,
        '--gs-profile-header-font': getFontFamily(theme.header_font, theme.header_font_name),
        '--gs-profile-body-font': getFontFamily(theme.body_font, theme.body_font_name),
        '--gs-profile-header-font-weight': String(theme.header_font_weight ?? 700),
        '--gs-profile-body-font-weight': String(theme.body_font_weight ?? 400),
        '--gs-profile-content-max-width': `${theme.content_max_width || 1200}px`,
        '--gs-profile-radius': `${theme.border_radius ?? 12}px`,
        '--gs-card-bg': `color-mix(in srgb, ${theme.card_background_color || theme.font_color} ${theme.card_background_opacity ?? 10}%, transparent)`,
      }
    : {};

  const visibleLinks = custom_links.filter((l: any) => l.visible !== false);
  const isGrid = settings.layout === 'grid';

  // Filter social/streaming to only those with values
  const activeSocialLinks = Object.entries(social_links || {}).filter(([, url]) => url);
  const activeStreamingLinks = Object.entries(streaming_links || {}).filter(([, url]) => url);
  const showSocial = settings.show_social_links !== false && activeSocialLinks.length > 0;
  const showStreaming = settings.show_streaming_links !== false && activeStreamingLinks.length > 0;

  // Header settings
  const headerLayout = settings.header_layout || 'center';
  const headerJustify = settings.header_justify || 'center';
  const headerGap = settings.header_gap || 'lg';
  const headerHeight = settings.header_height || 'auto';
  const textAlign = headerLayout as 'left' | 'center' | 'right';

  // Element order
  const savedOrder = settings.element_order || DEFAULT_ELEMENT_ORDER;
  const missingElements = ALL_HEADER_ELEMENTS.filter((el) => !savedOrder.includes(el));
  const elementOrder = useMemo(
    () => [...savedOrder, ...missingElements],
    [savedOrder, missingElements]
  );

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isPreview) e.preventDefault();
  };

  // Render a single header element
  const renderHeaderElement = (element: LinkPageHeaderElement) => {
    switch (element) {
      case 'profile_image':
        if (settings.show_profile_image === false || !profileImageUrl) return null;
        return (
          <div
            key="profile_image"
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid var(--gs-profile-brand)',
              flexShrink: 0,
            }}
          >
            <img
              src={fixImageUrl(profileImageUrl) || profileImageUrl}
              alt={profile.display_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        );

      case 'headline':
        if (settings.show_headline === false) return null;
        if (settings.headline_logo_url) {
          return (
            <img
              key="headline"
              src={fixImageUrl(settings.headline_logo_url) || settings.headline_logo_url}
              alt={profile.display_name}
              style={{
                maxWidth: settings.headline_logo_width
                  ? `${settings.headline_logo_width}px`
                  : '280px',
                height: 'auto',
              }}
            />
          );
        }
        const headlineText = settings.headline_text || profile.display_name;
        return (
          <h1
            key="headline"
            style={{
              fontFamily: 'var(--gs-profile-header-font)',
              fontSize: settings.headline_font_size ? `${settings.headline_font_size}px` : '1.5rem',
              fontWeight: 700,
              margin: 0,
              textAlign,
            }}
          >
            {headlineText}
          </h1>
        );

      case 'subtitle':
        if (settings.show_subtitle === false) return null;
        const subtitleText = settings.subtitle_text || profile.location;
        if (!subtitleText) return null;
        return (
          <p key="subtitle" style={{ margin: 0, opacity: 0.7, fontSize: '0.875rem', textAlign }}>
            {subtitleText}
          </p>
        );

      case 'description':
        if (settings.show_description === false) return null;
        const descText = settings.description_text || settings.description;
        if (!descText) return null;
        return (
          <p
            key="description"
            style={{
              margin: 0,
              opacity: 0.8,
              fontSize: '0.875rem',
              textAlign,
              lineHeight: 1.5,
              maxWidth: 480,
            }}
          >
            {descText}
          </p>
        );

      case 'social_links':
        if (!showStreaming && !showSocial) return null;
        return (
          <div
            key="social_links"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent:
                headerLayout === 'left'
                  ? 'flex-start'
                  : headerLayout === 'right'
                    ? 'flex-end'
                    : 'center',
              gap: '0.75rem',
            }}
          >
            {showStreaming &&
              activeStreamingLinks.map(([key, url]) => (
                <a
                  key={`streaming-${key}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  title={STREAMING_LABELS[key] || key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--gs-card-bg)',
                    color: 'var(--gs-profile-font)',
                    textDecoration: 'none',
                    transition: 'transform 0.15s ease',
                    cursor: isPreview ? 'default' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPreview) e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                >
                  {STREAMING_ICONS[key] || <IconMusic size={20} />}
                </a>
              ))}
            {showSocial &&
              activeSocialLinks.map(([key, url]) => (
                <a
                  key={`social-${key}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  title={SOCIAL_LABELS[key] || key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--gs-card-bg)',
                    color: 'var(--gs-profile-font)',
                    textDecoration: 'none',
                    transition: 'transform 0.15s ease',
                    cursor: isPreview ? 'default' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPreview) e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                  }}
                >
                  {SOCIAL_ICONS[key] || <IconWorld size={20} />}
                </a>
              ))}
          </div>
        );

      default:
        return null;
    }
  };

  // Background image styles
  const backgroundUrl = fixImageUrl(settings.background_image_url);
  const hasBackground = !!backgroundUrl;
  const headerBgStyle: CSSProperties = hasBackground
    ? {
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }
    : {};

  return (
    <div className="profile-page" style={cssVars}>
      {/* Header Section */}
      <div style={headerBgStyle}>
        {hasBackground && settings.background_overlay !== false && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'var(--gs-profile-bg)',
              opacity: (settings.background_overlay_opacity ?? 85) / 100,
            }}
          />
        )}
        <div
          style={{
            position: 'relative',
            maxWidth: 640,
            margin: '0 auto',
            padding: '3rem 1.25rem 1.5rem',
            minHeight: headerHeight === 'fullscreen' ? '100vh' : undefined,
            display: 'flex',
            flexDirection: 'column',
            alignItems:
              headerLayout === 'left'
                ? 'flex-start'
                : headerLayout === 'right'
                  ? 'flex-end'
                  : 'center',
            justifyContent: JUSTIFY_VALUES[headerJustify] || 'center',
            gap: GAP_VALUES[headerGap] || '1.5rem',
            fontFamily: 'var(--gs-profile-body-font)',
            color: 'var(--gs-profile-font)',
          }}
        >
          {elementOrder.map(renderHeaderElement)}
        </div>
      </div>

      {/* Content Section */}
      <div
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '1rem 1.25rem 2rem',
          minHeight: hasBackground || headerHeight === 'fullscreen' ? undefined : '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          fontFamily: 'var(--gs-profile-body-font)',
          color: 'var(--gs-profile-font)',
        }}
      >
        {/* Custom Links */}
        {visibleLinks.length > 0 && (
          <div
            style={{
              width: '100%',
              marginTop: '1.5rem',
              display: isGrid ? 'grid' : 'flex',
              flexDirection: isGrid ? undefined : 'column',
              gridTemplateColumns: isGrid ? 'repeat(2, 1fr)' : undefined,
              gap: '0.625rem',
            }}
          >
            {visibleLinks.map((link) => {
              // Link card style overrides from settings
              const linkBg = settings.link_bg_color || 'var(--gs-card-bg)';
              const linkColor = settings.link_font_color || 'var(--gs-profile-font)';
              const linkFontSize = settings.link_font_size ? `${settings.link_font_size}px` : '0.9375rem';
              const borderWidth = settings.link_border_width || 0;
              const borderStyle = settings.link_border_style || 'solid';
              const borderColor = settings.link_border_color || 'var(--gs-profile-brand)';
              const hoverBg = settings.link_hover_bg_color;
              const hoverColor = settings.link_hover_font_color;
              const linkFontFamily = settings.link_font_family ? `"${settings.link_font_family}", sans-serif` : undefined;

              return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.5rem',
                  minHeight: 56,
                  borderRadius: 'var(--gs-radius-lg)',
                  background: linkBg,
                  color: linkColor,
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: linkFontSize,
                  fontFamily: linkFontFamily,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, color 0.15s ease',
                  cursor: isPreview ? 'default' : 'pointer',
                  border: borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px color-mix(in srgb, var(--gs-profile-brand) 25%, transparent)`;
                  if (hoverBg) e.currentTarget.style.background = hoverBg;
                  if (hoverColor) e.currentTarget.style.color = hoverColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.background = linkBg;
                  e.currentTarget.style.color = linkColor;
                }}
              >
                {link.thumbnail_url ? (
                  <img
                    src={fixImageUrl(link.thumbnail_url) || link.thumbnail_url}
                    alt=""
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--gs-radius-sm)',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <span
                    style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.8 }}
                  >
                    {LINK_ICON_MAP[link.icon || 'link'] || <IconLink size={20} />}
                  </span>
                )}
                <span style={{ flex: 1, textAlign: 'center' }}>{link.title}</span>
              </a>
              );
            })}
          </div>
        )}

        {visibleLinks.length === 0 && !isPreview && (
          <p style={{ marginTop: '2rem', opacity: 0.5, fontSize: '0.875rem' }}>
            No links to show yet.
          </p>
        )}

        {/* Spacer to push footer down */}
        <div style={{ flex: 1, minHeight: '2rem' }} />
      </div>

      <ProfileFooter isPreview={isPreview} />
    </div>
  );
}
