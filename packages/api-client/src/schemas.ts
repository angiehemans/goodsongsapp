import { z } from 'zod';

// Auth schemas
export const loginCredentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupDataSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

// Review schemas
export const reviewDataSchema = z.object({
  song_link: z.string().url('Invalid URL'),
  band_name: z.string().min(1, 'Band name is required'),
  song_name: z.string().min(1, 'Song name is required'),
  artwork_url: z.string().url().optional().or(z.literal('')),
  review_text: z.string().min(1, 'Review text is required'),
  liked_aspects: z.array(z.union([z.string(), z.object({ name: z.string() })])),
  band_lastfm_artist_name: z.string().optional(),
  band_musicbrainz_id: z.string().optional(),
});

// Band schemas
export const bandDataSchema = z.object({
  name: z.string().min(1, 'Band name is required'),
  slug: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  about: z.string().optional(),
  spotify_link: z.string().url().optional().or(z.literal('')),
  bandcamp_link: z.string().url().optional().or(z.literal('')),
  apple_music_link: z.string().url().optional().or(z.literal('')),
  youtube_music_link: z.string().url().optional().or(z.literal('')),
});

// Venue schemas
export const venueDataSchema = z.object({
  name: z.string().min(1, 'Venue name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region is required'),
});

// Event schemas
export const eventDataSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  event_date: z.string().datetime({ offset: true }),
  ticket_link: z.string().url().optional().or(z.literal('')),
  price: z.string().optional(),
  age_restriction: z.string().optional(),
  venue_id: z.number().optional(),
  venue_attributes: venueDataSchema.optional(),
});

// Profile schemas
export const profileUpdateDataSchema = z.object({
  about_me: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
});

export const completeFanProfileDataSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  about_me: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
});

export const completeBandProfileDataSchema = z.object({
  name: z.string().min(1, 'Band name is required'),
  about: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  spotify_link: z.string().url().optional().or(z.literal('')),
  bandcamp_link: z.string().url().optional().or(z.literal('')),
  apple_music_link: z.string().url().optional().or(z.literal('')),
  youtube_music_link: z.string().url().optional().or(z.literal('')),
});

// Account type schema
export const accountTypeSchema = z.enum(['fan', 'band', 'admin']);

export const setAccountTypeDataSchema = z.object({
  account_type: accountTypeSchema,
});

// Type exports from schemas
export type LoginCredentialsInput = z.infer<typeof loginCredentialsSchema>;
export type SignupDataInput = z.infer<typeof signupDataSchema>;
export type ReviewDataInput = z.infer<typeof reviewDataSchema>;
export type BandDataInput = z.infer<typeof bandDataSchema>;
export type VenueDataInput = z.infer<typeof venueDataSchema>;
export type EventDataInput = z.infer<typeof eventDataSchema>;
export type ProfileUpdateDataInput = z.infer<typeof profileUpdateDataSchema>;
export type CompleteFanProfileDataInput = z.infer<typeof completeFanProfileDataSchema>;
export type CompleteBandProfileDataInput = z.infer<typeof completeBandProfileDataSchema>;
export type AccountTypeInput = z.infer<typeof accountTypeSchema>;
