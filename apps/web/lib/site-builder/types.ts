// Single post layout types
export type SinglePostContentLayout = 'default' | 'wide' | 'narrow';

export interface SinglePostLayout {
  show_featured_image: boolean;
  show_author: boolean;
  show_song_embed: boolean;
  show_comments: boolean;
  show_related_posts: boolean;
  show_navigation: boolean;
  content_layout: SinglePostContentLayout;
  background_color: string | null;
  font_color: string | null;
  max_width: number | null;
}

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
  content_max_width?: number; // Max width for section content in pixels, default 1200
  card_background_color?: string | null; // Card/surface background color, defaults to font_color. null/'' = inherit
  card_background_opacity?: number; // Card bg opacity 0-100, defaults to 10
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
  show_follow_button?: boolean;
}

export type MusicPlayerLayout = 'left' | 'center' | 'right';
export type MusicTitleAlign = 'left' | 'center' | 'right';
export type MusicGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface MusicSettings {
  display_limit?: number;
  player_layout?: MusicPlayerLayout;
  title_align?: MusicTitleAlign;
  gap?: MusicGap;
  // Appearance
  background_color?: string;
  background_image_url?: string;
  background_overlay?: boolean;
  background_overlay_opacity?: number;
}

export type EventsLayout = 'grid' | 'stack';
export type EventsTitleAlign = 'left' | 'center' | 'right';
export type EventsGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface EventsSettings {
  display_limit?: number;
  show_past_events?: boolean;
  layout?: EventsLayout;
  title_align?: EventsTitleAlign;
  gap?: EventsGap;
  background_color?: string;
  background_image_url?: string;
  background_overlay?: boolean;
  background_overlay_opacity?: number;
}

export type PostsLayout = 'grid' | 'stack';
export type PostsTitleAlign = 'left' | 'center' | 'right';
export type PostsGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface PostsSettings {
  display_limit?: number;
  layout?: PostsLayout;
  title_align?: PostsTitleAlign;
  gap?: PostsGap;
  // Appearance
  background_color?: string;
  background_image_url?: string;
  background_overlay?: boolean;
  background_overlay_opacity?: number;
}

export type AboutTitleAlign = 'left' | 'center' | 'right';
export type AboutGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface AboutSettings {
  show_social_links?: boolean;
  title_align?: AboutTitleAlign;
  gap?: AboutGap;
  background_color?: string;
  background_image_url?: string;
  background_overlay?: boolean;
  background_overlay_opacity?: number;
}

export type RecommendationsLayout = 'grid' | 'stack';
export type RecommendationsTitleAlign = 'left' | 'center' | 'right';
export type RecommendationsGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface RecommendationsSettings {
  display_limit?: number;
  layout?: RecommendationsLayout;
  title_align?: RecommendationsTitleAlign;
  gap?: RecommendationsGap;
  // Appearance
  background_color?: string;
  background_image_url?: string;
  background_overlay?: boolean;
  background_overlay_opacity?: number;
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
export interface MusicContent {
  heading?: string;
  embed_code?: string; // Legacy single embed (for backwards compatibility)
  embed_codes?: string[]; // Multiple embeds (up to 8)
}

// Events section content (data hydrated from band)
export interface EventsContent {}

// Posts section content (data hydrated from user)
export interface PostsContent {
  heading?: string;
}

// About section content
export interface AboutContent {
  heading?: string;
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
  owner_user_id?: number;
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
  post_base_path?: string; // e.g. "/blog/username" or "/bands/slug"
}

export interface AboutData {
  about_me?: string;
}

// Recommendation/review item shape
export interface RecommendationItem {
  id: number;
  song_name: string;
  band_name?: string;
  artwork_url?: string;
  body?: string;
  review_text?: string;
  created_at?: string;
  track?: {
    id: string;
    name: string;
    artist?: string;
  };
}

export interface RecommendationsData {
  // Frontend uses 'recommendations', backend may return 'reviews'
  recommendations?: RecommendationItem[];
  reviews?: RecommendationItem[];
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
  single_post_content_layouts?: string[];
  single_post_layout_schema?: Record<string, unknown>;
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
  band?: {
    id: number;
    slug: string;
    name: string;
    location?: string;
    about?: string;
    profile_picture_url?: string;
  };
  posts?: Array<{
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    featured_image_url?: string;
    publish_date: string;
  }>;
  events?: Array<{
    id: number;
    name: string;
    event_date: string;
    venue?: { name: string; city?: string };
    image_url?: string;
  }>;
  recommendations?: Array<{
    id: number;
    song_name: string;
    band_name?: string;
    artwork_url?: string;
    body?: string;
    review_text?: string;
    created_at?: string;
    track?: {
      id: string;
      name: string;
      artist?: string;
    };
  }>;
  sample_post?: {
    id: number;
    title: string;
    slug: string;
    body: string;
    excerpt?: string;
    featured_image_url?: string;
    publish_date: string;
    song?: { name: string; artist?: string; artwork_url?: string };
    author: { username: string; display_name?: string; profile_image_url?: string };
    comments?: Array<{ id: number; body: string; author: string; created_at: string }>;
    related_posts?: Array<{ id: number; title: string; slug: string; featured_image_url?: string }>;
    navigation?: { prev?: { title: string; slug: string }; next?: { title: string; slug: string } };
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
    content_max_width?: number;
    card_background_color?: string;
    card_background_opacity?: number;
    sections: Section[];
    single_post_layout: SinglePostLayout;
    draft_single_post_layout: SinglePostLayout | null;
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
      social_links?: Record<string, string>;
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

// Themed single post response from GET /api/v1/profiles/bands/:slug/posts/:post_slug
// or GET /api/v1/profiles/users/:username/posts/:post_slug
export interface ThemedPostResponse {
  data: {
    post: {
      id: number;
      title: string;
      slug: string;
      excerpt?: string;
      body?: string;
      featured_image_url?: string;
      publish_date: string;
      tags?: string[];
      likes_count?: number;
      liked_by_current_user?: boolean;
      comments_count?: number;
      can_edit?: boolean;
      song?: {
        song_name: string;
        band_name: string;
        album_name?: string;
        artwork_url?: string;
        song_link?: string;
        streaming_links?: Record<string, string>;
        preferred_link?: string;
        songlink_url?: string;
      };
      author: {
        id: number;
        username: string | null;
        display_name?: string;
        profile_image_url?: string | null;
      };
    };
    user: {
      id: number;
      username: string | null;
      display_name?: string;
      profile_image_url?: string | null;
      primary_band?: {
        id: number;
        slug: string;
        name: string;
        location?: string;
        profile_picture_url?: string;
      };
    };
    theme: (ProfileTheme & {
      single_post_layout?: SinglePostLayout | null;
    }) | null;
    comments: {
      data: Array<{
        id: number;
        body: string;
        author: string;
        created_at: string;
      }>;
      pagination?: {
        current_page: number;
        total_count: number;
        total_pages: number;
        per_page: number;
      };
    };
    related_posts: Array<{
      id: number;
      title: string;
      slug: string;
      featured_image_url?: string;
      publish_date?: string;
    }>;
    navigation: {
      previous_post?: { title: string; slug: string } | null;
      next_post?: { title: string; slug: string } | null;
    };
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
