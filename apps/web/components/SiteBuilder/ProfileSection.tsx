import { CSSProperties, ReactNode } from 'react';
import { SectionSettings, SectionType } from '@/lib/site-builder/types';

interface ProfileSectionProps {
  type: SectionType;
  settings?: SectionSettings;
  children: ReactNode;
  className?: string;
}

// Type for appearance properties that may exist on some section settings
interface AppearanceSettings {
  background_color?: string;
  background_image_url?: string;
  background_overlay?: boolean;
  background_overlay_opacity?: number;
  font_color?: string;
  height?: 'auto' | 'fullscreen';
}

export function ProfileSection({ type, settings, children, className = '' }: ProfileSectionProps) {
  // Cast to appearance settings to access optional appearance properties
  const appearance = settings as AppearanceSettings | undefined;

  const hasBackgroundImage = !!appearance?.background_image_url;
  const isFullscreen = appearance?.height === 'fullscreen';
  // Overlay defaults to true when there's a background image
  const hasOverlay = hasBackgroundImage && appearance?.background_overlay !== false;
  const overlayOpacity = appearance?.background_overlay_opacity ?? 85;

  // Build inline styles for section-level overrides
  const style: CSSProperties & Record<string, string | undefined> = {};

  if (appearance?.background_color) {
    style['--gs-section-bg'] = appearance.background_color;
  }

  if (appearance?.font_color) {
    style['--gs-section-font'] = appearance.font_color;
  }

  if (appearance?.background_image_url) {
    style.backgroundImage = `url(${appearance.background_image_url})`;
  }

  if (hasOverlay) {
    style['--gs-overlay-opacity'] = String(overlayOpacity / 100);
  }

  const sectionClasses = [
    'profile-section',
    `profile-section--${type}`,
    hasBackgroundImage ? 'profile-section--has-bg-image' : '',
    hasBackgroundImage && hasOverlay ? 'profile-section--has-overlay' : '',
    isFullscreen ? 'profile-section--fullscreen' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Generate section anchor ID for navigation
  const sectionId = `section-${type}`;

  return (
    <section id={sectionId} className={sectionClasses} style={style}>
      <div className="profile-section__content">{children}</div>
    </section>
  );
}
