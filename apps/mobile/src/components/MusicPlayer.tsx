import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme, colors } from '@/theme';

interface MusicPlayerProps {
  bandcampEmbed?: string;
  spotifyLink?: string;
  youtubeMusicLink?: string;
  appleMusicLink?: string;
}

// Bandcamp theme colors (matching our grape/purple theme)
const BANDCAMP_THEME = 'bgcol=f8f0fc/linkcol=9c36b5';

// Priority: Bandcamp Embed > Spotify > YouTube Music > Apple Music
export function MusicPlayer({
  bandcampEmbed,
  spotifyLink,
  youtubeMusicLink,
  appleMusicLink,
}: MusicPlayerProps) {
  // Bandcamp embed (highest priority)
  if (bandcampEmbed) {
    const embedUrl = getBandcampEmbedUrl(bandcampEmbed);
    if (embedUrl) {
      return (
        <View style={styles.bandcampContainer}>
          <WebView
            source={{ uri: embedUrl }}
            style={styles.bandcampWebView}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
          />
        </View>
      );
    }
    return null;
  }

  // Spotify embed
  if (spotifyLink) {
    const embedUrl = getSpotifyEmbedUrl(spotifyLink);
    if (embedUrl) {
      return (
        <View style={styles.spotifyContainer}>
          <WebView
            source={{ uri: embedUrl }}
            style={styles.spotifyWebView}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      );
    }
  }

  // YouTube Music embed
  if (youtubeMusicLink) {
    const embedUrl = getYouTubeMusicEmbedUrl(youtubeMusicLink);
    if (embedUrl) {
      return (
        <View style={styles.youtubeContainer}>
          <WebView
            source={{ uri: embedUrl }}
            style={styles.youtubeWebView}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      );
    }
  }

  // Apple Music embed
  if (appleMusicLink) {
    const embedUrl = getAppleMusicEmbedUrl(appleMusicLink);
    if (embedUrl) {
      return (
        <View style={styles.appleMusicContainer}>
          <WebView
            source={{ uri: embedUrl }}
            style={styles.appleMusicWebView}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      );
    }
  }

  return null;
}

// Helper function to convert Bandcamp URL to embed URL
function getBandcampEmbedUrl(bandcampUrl: string): string | null {
  if (bandcampUrl.includes('bandcamp.com/EmbeddedPlayer')) {
    if (bandcampUrl.includes('bgcol=') || bandcampUrl.includes('linkcol=')) {
      return bandcampUrl;
    }
    const baseUrl = bandcampUrl.endsWith('/') ? bandcampUrl : `${bandcampUrl}/`;
    return `${baseUrl}size=large/${BANDCAMP_THEME}/tracklist=false/artwork=small/transparent=true/`;
  }

  if (bandcampUrl.includes('bandcamp.com')) {
    return null;
  }

  return null;
}

// Helper function to convert Spotify URL to embed URL
function getSpotifyEmbedUrl(spotifyUrl: string): string | null {
  if (spotifyUrl.includes('open.spotify.com/embed')) {
    return spotifyUrl;
  }
  if (spotifyUrl.includes('open.spotify.com')) {
    return spotifyUrl.replace('open.spotify.com/', 'open.spotify.com/embed/');
  }
  return null;
}

// Helper function to convert YouTube Music URL to embed URL
function getYouTubeMusicEmbedUrl(youtubeMusicUrl: string): string | null {
  if (youtubeMusicUrl.includes('youtube.com/embed')) {
    return youtubeMusicUrl;
  }

  const channelMatch = youtubeMusicUrl.match(/music\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelMatch) {
    const uploadsPlaylistId = channelMatch[1].replace(/^UC/, 'UU');
    return `https://www.youtube.com/embed/videoseries?list=${uploadsPlaylistId}`;
  }

  const watchMatch = youtubeMusicUrl.match(/music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const playlistMatch = youtubeMusicUrl.match(/music\.youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
  }

  const youtubeChannelMatch = youtubeMusicUrl.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (youtubeChannelMatch) {
    const uploadsPlaylistId = youtubeChannelMatch[1].replace(/^UC/, 'UU');
    return `https://www.youtube.com/embed/videoseries?list=${uploadsPlaylistId}`;
  }

  const youtubeWatchMatch = youtubeMusicUrl.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (youtubeWatchMatch) {
    return `https://www.youtube.com/embed/${youtubeWatchMatch[1]}`;
  }

  const youtubeShortMatch = youtubeMusicUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtubeShortMatch) {
    return `https://www.youtube.com/embed/${youtubeShortMatch[1]}`;
  }

  return null;
}

// Helper function to convert Apple Music URL to embed URL
function getAppleMusicEmbedUrl(appleMusicUrl: string): string | null {
  if (appleMusicUrl.includes('embed.music.apple.com')) {
    return appleMusicUrl;
  }

  if (appleMusicUrl.includes('music.apple.com')) {
    return appleMusicUrl.replace('music.apple.com', 'embed.music.apple.com');
  }

  return null;
}

const styles = StyleSheet.create({
  bandcampContainer: {
    width: '100%',
    height: 120,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: colors.grape[1],
  },
  bandcampWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  spotifyContainer: {
    width: '100%',
    height: 155,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: colors.grape[1],
  },
  spotifyWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  youtubeContainer: {
    width: '100%',
    height: 155,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: colors.grape[1],
  },
  youtubeWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  appleMusicContainer: {
    width: '100%',
    height: 175,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  appleMusicWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
