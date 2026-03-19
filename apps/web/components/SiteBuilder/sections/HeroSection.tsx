'use client';

import { useEffect, useState } from 'react';
import {
  IconBrandInstagram,
  IconBrandThreads,
  IconBrandBluesky,
  IconBrandX,
  IconBrandTumblr,
  IconBrandTiktok,
  IconBrandFacebook,
  IconBrandYoutube,
} from '@tabler/icons-react';
import { HeroContent, HeroData, HeroSettings, HeroElement, SectionProps, SocialLinkType } from '@/lib/site-builder/types';
import { fixImageUrl } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { notifications } from '@mantine/notifications';
import { SOCIAL_PLATFORMS, SOCIAL_LINK_ORDER } from '@/lib/social-links';

type HeroSectionProps = SectionProps<HeroContent, HeroData, HeroSettings>;

const ALL_HERO_ELEMENTS: HeroElement[] = ['profile_image', 'headline', 'subtitle', 'description', 'social_links'];
const DEFAULT_ELEMENT_ORDER: HeroElement[] = ['profile_image', 'headline', 'subtitle', 'description', 'social_links'];

const SocialIcons: Record<SocialLinkType, React.ReactNode> = {
  instagram: <IconBrandInstagram size={20} />,
  threads: <IconBrandThreads size={20} />,
  bluesky: <IconBrandBluesky size={20} />,
  twitter: <IconBrandX size={20} />,
  tumblr: <IconBrandTumblr size={20} />,
  tiktok: <IconBrandTiktok size={20} />,
  facebook: <IconBrandFacebook size={20} />,
  youtube: <IconBrandYoutube size={20} />,
};

export function HeroSection({ content, data, settings, isPreview }: HeroSectionProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  // Follow button settings
  const showFollowButton = settings?.show_follow_button !== false;
  const ownerUserId = data?.owner_user_id;
  const isOwnProfile = user?.id != null && ownerUserId != null && user.id === ownerUserId;

  // Check initial follow status
  useEffect(() => {
    if (isAuthLoading || !user || !ownerUserId || isOwnProfile || isPreview) return;

    const checkFollowStatus = async () => {
      try {
        const following = await apiClient.getFollowing();
        const followingArray = Array.isArray(following) ? following : [];
        setIsFollowing(followingArray.some((f) => f.id === ownerUserId));
      } catch {
        // silently fail
      }
    };

    checkFollowStatus();
  }, [user, isAuthLoading, ownerUserId, isOwnProfile, isPreview]);

  const handleFollow = async () => {
    if (!ownerUserId || isPreview) return;
    if (!user) {
      notifications.show({
        title: 'Sign in required',
        message: 'Please sign in to follow this artist.',
        color: 'yellow',
      });
      return;
    }
    try {
      if (isFollowing) {
        await apiClient.unfollowUser(ownerUserId);
        setIsFollowing(false);
        notifications.show({
          title: 'Unfollowed',
          message: 'You are no longer following this artist.',
          color: 'gray',
        });
      } else {
        await apiClient.followUser(ownerUserId);
        setIsFollowing(true);
        notifications.show({
          title: 'Following',
          message: 'You are now following this artist!',
          color: 'green',
        });
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      notifications.show({
        title: 'Error',
        message: 'Could not complete the action. Please try again.',
        color: 'red',
      });
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
