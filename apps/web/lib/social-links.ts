import { SocialLinkType } from './site-builder/types';

export interface SocialPlatform {
  name: string;
  placeholder: string;
  urlPattern: string;
  fieldName: string;
}

export const SOCIAL_PLATFORMS: Record<SocialLinkType, SocialPlatform> = {
  instagram: {
    name: 'Instagram',
    placeholder: 'https://instagram.com/username',
    urlPattern: 'https://instagram.com/',
    fieldName: 'instagram_url',
  },
  threads: {
    name: 'Threads',
    placeholder: 'https://threads.net/@username',
    urlPattern: 'https://threads.net/@',
    fieldName: 'threads_url',
  },
  bluesky: {
    name: 'Bluesky',
    placeholder: 'https://bsky.app/profile/username',
    urlPattern: 'https://bsky.app/profile/',
    fieldName: 'bluesky_url',
  },
  twitter: {
    name: 'X (Twitter)',
    placeholder: 'https://twitter.com/username',
    urlPattern: 'https://twitter.com/',
    fieldName: 'twitter_url',
  },
  tumblr: {
    name: 'Tumblr',
    placeholder: 'https://username.tumblr.com',
    urlPattern: 'https://',
    fieldName: 'tumblr_url',
  },
  tiktok: {
    name: 'TikTok',
    placeholder: 'https://tiktok.com/@username',
    urlPattern: 'https://tiktok.com/@',
    fieldName: 'tiktok_url',
  },
  facebook: {
    name: 'Facebook',
    placeholder: 'https://facebook.com/username',
    urlPattern: 'https://facebook.com/',
    fieldName: 'facebook_url',
  },
  youtube: {
    name: 'YouTube',
    placeholder: 'https://youtube.com/@username',
    urlPattern: 'https://youtube.com/',
    fieldName: 'youtube_url',
  },
};

export const SOCIAL_LINK_ORDER: SocialLinkType[] = [
  'instagram',
  'threads',
  'bluesky',
  'twitter',
  'tiktok',
  'youtube',
  'facebook',
  'tumblr',
];
