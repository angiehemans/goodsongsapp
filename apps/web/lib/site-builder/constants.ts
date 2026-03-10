import { ProfileTheme, Section, SectionType } from './types';

// Default theme values
export const DEFAULT_THEME: ProfileTheme = {
  background_color: '#121212',
  brand_color: '#6366f1',
  font_color: '#f5f5f5',
  header_font: 'Inter',
  body_font: 'Inter',
  card_background_color: '',
  card_background_opacity: 10,
};

// Section type metadata
export interface SectionTypeMeta {
  type: SectionType;
  label: string;
  description: string;
  singleton: boolean; // Can only have one of this type
  plans: string[]; // Which plans can use this section
}

export const SECTION_TYPES: SectionTypeMeta[] = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Profile header with name, image, and call-to-action',
    singleton: true,
    plans: ['band_starter', 'band_pro', 'blogger', 'blogger_pro'],
  },
  {
    type: 'music',
    label: 'Music',
    description: 'Showcase your music with embeds from Bandcamp, Spotify, etc.',
    singleton: true,
    plans: ['band_starter', 'band_pro', 'blogger', 'blogger_pro'],
  },
  {
    type: 'events',
    label: 'Events',
    description: 'Display your upcoming and past events',
    singleton: true,
    plans: ['band_starter', 'band_pro', 'blogger', 'blogger_pro'],
  },
  {
    type: 'posts',
    label: 'Posts',
    description: 'Show your latest blog posts',
    singleton: true,
    plans: ['band_starter', 'band_pro', 'blogger', 'blogger_pro'],
  },
  {
    type: 'about',
    label: 'About',
    description: 'Tell visitors about yourself',
    singleton: true,
    plans: ['band_starter', 'band_pro', 'blogger', 'blogger_pro'],
  },
  {
    type: 'recommendations',
    label: 'Recommendations',
    description: 'Display your song recommendations',
    singleton: true,
    plans: ['band_starter', 'band_pro', 'blogger', 'blogger_pro'],
  },
  {
    type: 'custom_text',
    label: 'Custom Text',
    description: 'Add custom text sections (up to 3)',
    singleton: false,
    plans: ['band_starter', 'band_pro', 'blogger', 'blogger_pro'],
  },
  {
    type: 'mailing_list',
    label: 'Mailing List',
    description: 'Collect email subscribers',
    singleton: true,
    plans: ['band_pro', 'blogger_pro'],
  },
  {
    type: 'merch',
    label: 'Merch',
    description: 'Link to your merchandise store',
    singleton: true,
    plans: ['band_pro'],
  },
];

// Get section type metadata
export function getSectionTypeMeta(type: SectionType): SectionTypeMeta | undefined {
  return SECTION_TYPES.find((s) => s.type === type);
}

// Check if a section type is available for a plan
export function isSectionAvailableForPlan(type: SectionType, planKey: string): boolean {
  const meta = getSectionTypeMeta(type);
  return meta ? meta.plans.includes(planKey) : false;
}

// Default sections for different roles
export const DEFAULT_BAND_SECTIONS: Section[] = [
  { type: 'hero', visible: true, order: 0, content: {}, settings: { show_profile_image: true } },
  { type: 'music', visible: true, order: 1, content: {}, settings: { display_limit: 6 } },
  { type: 'events', visible: true, order: 2, content: {}, settings: { display_limit: 6, show_past_events: false } },
  { type: 'about', visible: true, order: 3, content: {}, settings: { show_social_links: true } },
  { type: 'recommendations', visible: true, order: 4, content: {}, settings: { display_limit: 12 } },
];

export const DEFAULT_BLOGGER_SECTIONS: Section[] = [
  { type: 'hero', visible: true, order: 0, content: {}, settings: { show_profile_image: true } },
  { type: 'posts', visible: true, order: 1, content: {}, settings: { display_limit: 6 } },
  { type: 'about', visible: true, order: 2, content: {}, settings: { show_social_links: true } },
  { type: 'recommendations', visible: true, order: 3, content: {}, settings: { display_limit: 12 } },
];

// Character limits (per API spec)
export const CHAR_LIMITS = {
  hero_headline: 120,
  hero_subtitle: 200,
  hero_description: 300,
  cta_text: 40,
  section_heading: 120,
  about_body: 2000,
  mailing_list_description: 500,
  custom_text_body: 5000,
};

// Display limits (per API spec)
export const DISPLAY_LIMITS = {
  music: { min: 1, max: 24, default: 6 },
  events: { min: 1, max: 24, default: 6 },
  posts: { min: 1, max: 24, default: 6 },
  recommendations: { min: 1, max: 24, default: 12 },
};

// Max custom text sections
export const MAX_CUSTOM_TEXT_SECTIONS = 3;

// Max total sections
export const MAX_SECTIONS = 12;

// Section labels for UI display
export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Hero',
  music: 'Music',
  events: 'Events',
  posts: 'Posts',
  about: 'About',
  recommendations: 'Recommendations',
  mailing_list: 'Mailing List',
  merch: 'Merch',
  custom_text: 'Custom Text',
};

// Default sections (general purpose)
export const DEFAULT_SECTIONS: Section[] = DEFAULT_BAND_SECTIONS;

// Image upload limits
export const IMAGE_UPLOAD = {
  maxSizeMB: 5,
  maxSizeBytes: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  recommendedSize: '2400×800px or wider',
  maxAssets: 20,
};

// Link types
export const STREAMING_LINK_TYPES = ['spotify', 'appleMusic', 'bandcamp', 'soundcloud', 'youtubeMusic'] as const;
export const SOCIAL_LINK_TYPES = ['instagram', 'twitter', 'facebook', 'tiktok', 'youtube', 'website'] as const;
