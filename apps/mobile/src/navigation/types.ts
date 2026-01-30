import { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack - screens before login
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
};

// CreateReview params for prefilling
export type CreateReviewParams = {
  song_link?: string;
  band_name?: string;
  song_name?: string;
  artwork_url?: string;
  band_lastfm_artist_name?: string;
  band_musicbrainz_id?: string;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  CreateReview: CreateReviewParams | undefined;
  CreateEvent: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// Home Stack
export type HomeStackParamList = {
  Feed: undefined;
  UserProfile: { username: string };
  BandProfile: { slug: string };
  ReviewDetail: { reviewId: number; username: string };
};

// Discover Stack
export type DiscoverStackParamList = {
  DiscoverHome: undefined;
  UserProfile: { username: string };
  BandProfile: { slug: string };
  ReviewDetail: { reviewId: number; username: string };
};

// Profile Stack
export type ProfileStackParamList = {
  MyProfile: undefined;
  Settings: undefined;
  EditProfile: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  OnboardingAccountType: undefined;
  OnboardingFanProfile: undefined;
  OnboardingBandProfile: undefined;
  Settings: undefined;
  EditProfile: undefined;
  EditBand: { slug: string };
  UserProfile: { username: string };
  BandProfile: { slug: string };
  EventDetails: { eventId: number };
  ScrobblePermission: undefined;
  ScrobbleSettings: undefined;
};

// Global type declaration for navigation
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
