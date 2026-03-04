// Section types available in the site builder
export type SectionType =
  | 'hero'
  | 'music'
  | 'events'
  | 'posts'
  | 'about'
  | 'recommendations'
  | 'mailing_list'
  | 'merch'
  | 'custom_text';

// Link types
export type StreamingLinkType = 'spotify' | 'appleMusic' | 'bandcamp' | 'soundcloud' | 'youtubeMusic';
export type SocialLinkType = 'instagram' | 'threads' | 'bluesky' | 'twitter' | 'tumblr' | 'tiktok' | 'facebook' | 'youtube';

// Global theme settings
export interface ProfileTheme {
  background_color: string;
  brand_color: string;
  font_color: string;
  header_font: string;
  body_font: string;
}

// Layout alignment options for hero section
export type HeroLayout = 'left' | 'center' | 'right';
export type HeroJustify = 'top' | 'center' | 'bottom' | 'space-between' | 'space-around';
export type HeroGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type HeroHeight = 'auto' | 'fullscreen';
export type HeroElement = 'profile_image' | 'headline' | 'subtitle' | 'description' | 'social_links';

// Section-specific settings
export interface HeroSettings {
  background_color?: string;
  background_image_url?: string;
  background_overlay?: boolean;
  background_overlay_opacity?: number;
  show_profile_image?: boolean;
  show_headline?: boolean;
  show_subtitle?: boolean;
  show_description?: boolean;
  headline_font_size?: number;
  headline_logo_url?: string;
  headline_logo_width?: number;
  layout?: HeroLayout;
  justify?: HeroJustify;
  gap?: HeroGap;
  height?: HeroHeight;
  element_order?: HeroElement[];
  visible_streaming_links?: StreamingLinkType[] | null;
  visible_social_links?: SocialLinkType[] | null;
  // Menu settings
  show_menu?: boolean;
  menu_title?: string;
  menu_background_color?: string;
}

export interface MusicSettings {
  display_limit?: number;
}

export interface EventsSettings {
  display_limit?: number;
  show_past_events?: boolean;
}

export interface PostsSettings {
  display_limit?: number;
}

export interface AboutSettings {
  show_social_links?: boolean;
  visible_social_links?: SocialLinkType[] | null;
}

export interface RecommendationsSettings {
  display_limit?: number;
}

export interface CustomTextSettings {
  text_align?: 'left' | 'center' | 'right';
  background_color?: string;
}

export interface MailingListSettings {
  provider_url?: string;
}

export interface MerchSettings {
  store_url?: string;
}

// Union type for all section settings
export type SectionSettings =
  | HeroSettings
  | MusicSettings
  | EventsSettings
  | PostsSettings
  | AboutSettings
  | RecommendationsSettings
  | CustomTextSettings
  | MailingListSettings
  | MerchSettings;

// Hero section content
export interface HeroContent {
  headline?: string;
  subtitle?: string;
  description?: string;
}

// Music section content (data hydrated from band)
export interface MusicContent {}

// Events section content (data hydrated from band)
export interface EventsContent {}

// Posts section content (data hydrated from user)
export interface PostsContent {}

// About section content
export interface AboutContent {
  bio?: string;
}

// Recommendations section content (data hydrated from user reviews)
export interface RecommendationsContent {}

// Mailing list section content
export interface MailingListContent {
  heading?: string;
  description?: string;
}

// Merch section content
export interface MerchContent {
  heading?: string;
}

// Custom text section content
export interface CustomTextContent {
  title?: string;
  body?: string;
}

// Union type for all section content types
export type SectionContent =
  | HeroContent
  | MusicContent
  | EventsContent
  | PostsContent
  | AboutContent
  | RecommendationsContent
  | MailingListContent
  | MerchContent
  | CustomTextContent;

// Menu section info for navigation
export interface MenuSectionInfo {
  type: SectionType;
  label: string;
  anchor: string;
}

// Section data (hydrated from API for public profiles)
export interface HeroData {
  display_name?: string;
  profile_image_url?: string;
  location?: string;
  streaming_links?: Record<StreamingLinkType, string>;
  social_links?: Record<SocialLinkType, string>;
  band?: {
    id: number;
    slug: string;
    name: string;
  };
  // Visible sections for menu navigation
  menu_sections?: MenuSectionInfo[];
}

export interface MusicData {
  band?: {
    id: number;
    slug: string;
    name: string;
  };
  tracks?: Array<{
    id: number;
    name: string;
    artwork_url?: string;
  }>;
  bandcamp_embed?: string;
  streaming_links?: Record<StreamingLinkType, string>;
}

export interface EventsData {
  events: Array<{
    id: number;
    name: string;
    event_date: string;
    venue?: {
      name: string;
      city?: string;
    };
    image_url?: string;
  }>;
}

export interface PostsData {
  posts: Array<{
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    featured_image_url?: string;
    publish_date: string;
  }>;
}

export interface AboutData {
  about_me?: string;
}

export interface RecommendationsData {
  recommendations: Array<{
    id: number;
    song_name: string;
    band_name: string;
    artwork_url?: string;
    body?: string;
  }>;
}

export interface MailingListData {}

export interface MerchData {}

export interface CustomTextData {}

export type SectionData =
  | HeroData
  | MusicData
  | EventsData
  | PostsData
  | AboutData
  | RecommendationsData
  | MailingListData
  | MerchData
  | CustomTextData;

// A section in the profile
export interface Section {
  type: SectionType;
  visible: boolean;
  order: number;
  content?: SectionContent;
  settings?: SectionSettings;
  data?: SectionData;
}

// Profile theme configuration from API
export interface ProfileThemeConfig {
  approved_fonts: string[];
  section_types: SectionType[];
  max_sections: number;
  max_custom_text: number;
  section_schemas?: Record<string, unknown>;
  social_link_types?: SocialLinkType[];
  streaming_link_types?: StreamingLinkType[];
}

// Source data from profile theme (user profile info for preview)
export interface ProfileSourceData {
  display_name?: string;
  location?: string;
  about_text?: string;
  profile_image_url?: string;
  social_links?: Record<string, string>;
  streaming_links?: Record<string, string>;
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

// Full profile theme response from GET /api/v1/profile_theme
export interface ProfileThemeResponse {
  data: {
    id: number;
    user_id: number;
    background_color: string;
    brand_color: string;
    font_color: string;
    header_font: string;
    body_font: string;
    sections: Section[];
    draft_sections: Section[] | null;
    has_draft: boolean;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    config: ProfileThemeConfig;
    source_data?: ProfileSourceData;
  };
}

// Profile asset
export interface ProfileAsset {
  id: number;
  purpose: 'background' | 'header' | 'custom';
  url: string;
  thumbnail_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

// Profile assets response
export interface ProfileAssetsResponse {
  data: ProfileAsset[];
  meta: {
    total: number;
    limit: number;
  };
}

// Public profile response from GET /api/v1/profiles/:username
export interface PublicProfileResponse {
  data: {
    user: {
      id: number;
      username: string;
      email?: string;
      display_name?: string;
      about_me?: string;
      profile_image_url?: string;
      location?: string;
      role: string;
      reviews_count?: number;
      followers_count?: number;
      following_count?: number;
      primary_band?: {
        id: number;
        slug: string;
        name: string;
        location?: string;
        profile_picture_url?: string;
      };
    };
    theme: ProfileTheme | null;
    sections: Section[];
  };
}

// Props for section components
export interface SectionProps<C = SectionContent, D = SectionData, S = SectionSettings> {
  content: C;
  data?: D;
  settings?: S;
  theme: ProfileTheme;
  isPreview?: boolean;
}
