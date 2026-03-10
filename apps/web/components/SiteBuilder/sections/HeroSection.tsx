'use client';

import { useState } from 'react';
import { HeroContent, HeroData, HeroSettings, HeroElement, SectionProps, SocialLinkType } from '@/lib/site-builder/types';
import { fixImageUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { SOCIAL_PLATFORMS, SOCIAL_LINK_ORDER } from '@/lib/social-links';

type HeroSectionProps = SectionProps<HeroContent, HeroData, HeroSettings>;

const ALL_HERO_ELEMENTS: HeroElement[] = ['profile_image', 'headline', 'subtitle', 'description', 'social_links'];
const DEFAULT_ELEMENT_ORDER: HeroElement[] = ['profile_image', 'headline', 'subtitle', 'description', 'social_links'];

// SVG icons for social platforms
const SocialIcons: Record<SocialLinkType, React.ReactNode> = {
  instagram: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  ),
  threads: (
    <svg width="20" height="20" viewBox="0 0 192 192" fill="currentColor">
      <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c23.003.173 40.48 7.542 51.936 21.918 5.6 7.024 9.81 15.865 12.54 26.254l15.158-3.97c-3.18-12.153-8.29-22.696-15.244-31.427C147.044 12.085 125.202 3.18 97.063 3 68.672 3.18 47.034 12.103 32.943 29.89 17.96 48.827 10.327 75.124 10.098 96l.001.11c.229 20.876 7.862 47.173 22.845 66.11 14.09 17.787 35.729 26.71 64.12 26.89 24.065-.163 41.073-6.357 55.12-20.39 19.043-19.03 18.464-43.095 12.063-58.029-4.592-10.716-12.876-19.332-24.71-25.703Zm-43.262 42.682c-10.45.572-21.3-4.1-21.8-13.4-.354-6.588 4.67-13.94 22.636-14.977a99 99 0 0 1 6.003-.187c6.004 0 11.596.456 16.749 1.337-1.91 22.512-13.428 26.657-23.588 27.227Z" />
    </svg>
  ),
  bluesky: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/>
    </svg>
  ),
  twitter: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  tumblr: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.941 0 9.999 0h3.517v6.114h4.801v3.633h-4.82v7.47c.016 1.001.375 2.371 2.207 2.371h.09c.631-.02 1.486-.205 1.936-.419l1.156 3.425c-.436.636-2.4 1.374-4.156 1.404h-.211v.002z"/>
    </svg>
  ),
  tiktok: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  facebook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  youtube: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
};

export function HeroSection({ content, data, settings, isPreview }: HeroSectionProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  // Follow button settings
  const showFollowButton = settings?.show_follow_button !== false;
  const ownerUserId = data?.owner_user_id;
  const isOwnProfile = user?.id != null && ownerUserId != null && user.id === ownerUserId;

  const handleFollow = async () => {
    if (!ownerUserId || isPreview) return;
    try {
      if (isFollowing) {
        await apiClient.unfollowUser(ownerUserId);
        setIsFollowing(false);
      } else {
        await apiClient.followUser(ownerUserId);
        setIsFollowing(true);
      }
    } catch {
      // silently fail
    }
  };

  // Use content values or fall back to data (profile info)
  const headline = content.headline || data?.display_name || 'Welcome';
  const subtitle = content.subtitle || data?.location || '';
  const description = content.description || '';
  const profileImage = data?.profile_image_url;
  const socialLinks: Partial<Record<SocialLinkType, string>> = data?.social_links || {};

  // Menu settings
  const showMenu = settings?.show_menu === true;
  const menuTitle = settings?.menu_title || data?.band?.name || data?.display_name || '';
  const menuSections = data?.menu_sections || [];
  const menuBackgroundColor = settings?.menu_background_color;

  // Visibility settings (default to true)
  const showProfileImage = settings?.show_profile_image !== false;
  const showHeadline = settings?.show_headline !== false;
  const showSubtitle = settings?.show_subtitle !== false;
  const showDescription = settings?.show_description !== false;

  // Social links visibility (default to showing all available)
  const visibleSocialLinks = settings?.visible_social_links;

  // Layout settings (defaults)
  const layout = settings?.layout || 'center';
  const justify = settings?.justify || 'center';
  const gap = settings?.gap || 'lg';

  // Element order (ensure all elements are present for migration)
  const savedOrder = settings?.element_order || DEFAULT_ELEMENT_ORDER;
  const missingElements = ALL_HERO_ELEMENTS.filter(el => !savedOrder.includes(el));
  const elementOrder = [...savedOrder, ...missingElements];

  // Custom headline font size - use CSS variable for container query support
  const headlineStyle = settings?.headline_font_size
    ? { '--headline-size': `${settings.headline_font_size}px` } as React.CSSProperties
    : undefined;

  const heroClasses = [
    'hero',
    `hero--align-${layout}`,
    `hero--justify-${justify}`,
    `hero--gap-${gap}`,
  ].join(' ');

  // Filter and render social links
  const renderSocialLinks = () => {
    const availableLinks = SOCIAL_LINK_ORDER.filter(key => socialLinks[key]);

    if (availableLinks.length === 0) return null;

    // Filter by visibility settings if set
    // "configured" means show all available links (same as null/undefined)
    const linksToShow = Array.isArray(visibleSocialLinks)
      ? availableLinks.filter(key => visibleSocialLinks.includes(key))
      : availableLinks;

    if (linksToShow.length === 0) return null;

    return (
      <div key="social_links" className="hero__social-links">
        {linksToShow.map(key => (
          <a
            key={key}
            href={socialLinks[key]}
            target="_blank"
            rel="noopener noreferrer"
            className="hero__social-link"
            title={SOCIAL_PLATFORMS[key].name}
          >
            {SocialIcons[key]}
          </a>
        ))}
      </div>
    );
  };

  const renderElement = (element: HeroElement) => {
    switch (element) {
      case 'profile_image':
        return showProfileImage && profileImage ? (
          <img
            key="profile_image"
            src={fixImageUrl(profileImage)}
            alt={headline}
            className="hero__avatar"
          />
        ) : null;

      case 'headline':
        if (!showHeadline) return null;

        // If logo URL is set, render image instead of text
        if (settings?.headline_logo_url) {
          const logoStyle: React.CSSProperties = settings.headline_logo_width
            ? { width: settings.headline_logo_width, height: 'auto' }
            : { maxWidth: 300, height: 'auto' };
          return (
            <img
              key="headline"
              src={settings.headline_logo_url}
              alt={headline}
              className="hero__logo"
              style={logoStyle}
            />
          );
        }

        return (
          <h1 key="headline" className="hero__headline" style={headlineStyle}>
            {headline}
          </h1>
        );

      case 'subtitle':
        return showSubtitle && subtitle ? (
          <p key="subtitle" className="hero__subtitle">{subtitle}</p>
        ) : null;

      case 'description':
        return showDescription && description ? (
          <p key="description" className="hero__description">{description}</p>
        ) : null;

      case 'social_links':
        return renderSocialLinks();

      default:
        return null;
    }
  };

  const menuStyle: React.CSSProperties = menuBackgroundColor
    ? { backgroundColor: menuBackgroundColor }
    : {};

  return (
    <>
      {showMenu && (
        <nav className="hero-menu" style={menuStyle}>
          <div className="hero-menu__content">
            {menuTitle && (
              <span className="hero-menu__title">{menuTitle}</span>
            )}
            <ul className="hero-menu__links">
              {menuSections.map((section) => (
                <li key={section.anchor}>
                  <a
                    href={`#${section.anchor}`}
                    className="hero-menu__link"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(section.anchor)?.scrollIntoView({
                        behavior: 'smooth',
                      });
                    }}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
              {showFollowButton && (!isOwnProfile || isPreview) && (
                <li>
                  <button
                    className={`hero-menu__follow-btn ${isFollowing ? 'hero-menu__follow-btn--following' : ''}`}
                    onClick={handleFollow}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </li>
              )}
            </ul>
          </div>
        </nav>
      )}
      <div className={heroClasses}>
        {elementOrder.map(renderElement)}
      </div>
    </>
  );
}
