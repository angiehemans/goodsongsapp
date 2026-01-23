import { Box } from '@mantine/core';
import styles from './MusicPlayer.module.css';

interface MusicPlayerProps {
  bandcampEmbed?: string;
  bandcampLink?: string;
  spotifyLink?: string;
  youtubeMusicLink?: string;
  appleMusicLink?: string;
  className?: string;
}

// Priority: Bandcamp Embed > Bandcamp Link > Spotify > YouTube Music > Apple Music
// If bandcampEmbed is set, ONLY show Bandcamp player (no fallback to other players)
export function MusicPlayer({
  bandcampEmbed,
  bandcampLink,
  spotifyLink,
  youtubeMusicLink,
  appleMusicLink,
  className,
}: MusicPlayerProps) {
  // Bandcamp embed URL (direct embed, highest priority)
  // If bandcampEmbed is set, only show Bandcamp player - no other players
  if (bandcampEmbed) {
    const embedUrl = getBandcampEmbedUrl(bandcampEmbed);
    if (embedUrl) {
      return (
        <Box className={`${styles.bandcampContainer} ${className || ''}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="120"
            seamless={true}
            style={{ border: 0, width: '100%', height: 120 }}
            loading="lazy"
            title="Bandcamp Player"
          />
        </Box>
      );
    }
    // If bandcampEmbed is set but invalid, don't fall through to other players
    return null;
  }

  // Bandcamp link (fallback from old field)
  if (bandcampLink) {
    const embedUrl = getBandcampEmbedUrl(bandcampLink);
    if (embedUrl) {
      return (
        <Box className={`${styles.bandcampContainer} ${className || ''}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="120"
            seamless={true}
            style={{ border: 0, width: '100%', height: 120 }}
            loading="lazy"
            title="Bandcamp Player"
          />
        </Box>
      );
    }
  }

  // Spotify embed
  if (spotifyLink) {
    const embedUrl = getSpotifyEmbedUrl(spotifyLink);
    if (embedUrl) {
      return (
        <Box className={`${styles.embedContainer} ${className || ''}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="155"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: 13, border: 'none' }}
          />
        </Box>
      );
    }
  }

  // YouTube Music embed
  if (youtubeMusicLink) {
    const embedUrl = getYouTubeMusicEmbedUrl(youtubeMusicLink);
    if (embedUrl) {
      return (
        <Box className={`${styles.embedContainer} ${className || ''}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="155"
            allow="autoplay; clipboard-write; encrypted-media"
            loading="lazy"
            style={{ borderRadius: 13, border: 'none' }}
          />
        </Box>
      );
    }
  }

  // Apple Music embed
  if (appleMusicLink) {
    const embedUrl = getAppleMusicEmbedUrl(appleMusicLink);
    if (embedUrl) {
      return (
        <Box className={`${styles.embedContainer} ${className || ''}`}>
          <iframe
            src={embedUrl}
            width="100%"
            height="175"
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            loading="lazy"
            style={{ borderRadius: 10, border: 'none', overflow: 'hidden', background: 'transparent' }}
          />
        </Box>
      );
    }
  }

  return null;
}

// Bandcamp theme colors (matching our grape/purple theme)
// bgcol = background color (grape-0 equivalent: f8f0fc)
// linkcol = link color (grape-6 equivalent: 9c36b5)
const BANDCAMP_THEME = 'bgcol=f8f0fc/linkcol=9c36b5';

// Helper function to convert Bandcamp URL to embed URL
function getBandcampEmbedUrl(bandcampUrl: string): string | null {
  // If it's already an embed URL, add our theme colors if not present
  // Format: https://bandcamp.com/EmbeddedPlayer/album=XXXX/size=large/...
  if (bandcampUrl.includes('bandcamp.com/EmbeddedPlayer')) {
    // Check if it already has color settings
    if (bandcampUrl.includes('bgcol=') || bandcampUrl.includes('linkcol=')) {
      return bandcampUrl;
    }
    // Add our theme colors and other settings
    // Ensure URL ends with / before adding params
    const baseUrl = bandcampUrl.endsWith('/') ? bandcampUrl : `${bandcampUrl}/`;
    return `${baseUrl}size=large/${BANDCAMP_THEME}/tracklist=false/artwork=small/transparent=true/`;
  }

  // For regular bandcamp URLs (e.g., https://artist.bandcamp.com/album/name)
  // We can't extract the album ID without an API call, so fall through to next platform
  // Users should paste the embed URL directly from Bandcamp's embed generator
  if (bandcampUrl.includes('bandcamp.com')) {
    return null;
  }

  return null;
}

// Helper function to convert Spotify URL to embed URL
function getSpotifyEmbedUrl(spotifyUrl: string): string | null {
  // e.g., https://open.spotify.com/artist/xyz -> https://open.spotify.com/embed/artist/xyz
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
  // YouTube Music URLs can be converted to YouTube embeds
  // https://music.youtube.com/watch?v=XXX -> https://www.youtube.com/embed/XXX
  // https://music.youtube.com/playlist?list=XXX -> https://www.youtube.com/embed/videoseries?list=XXX
  // https://music.youtube.com/channel/UCXXX -> Channel embed (shows recent uploads)

  if (youtubeMusicUrl.includes('youtube.com/embed')) {
    return youtubeMusicUrl;
  }

  // Extract channel ID from music.youtube.com/channel/UCXXX
  // Channel IDs start with "UC" and are 24 characters total
  const channelMatch = youtubeMusicUrl.match(/music\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelMatch) {
    // Use the channel's uploads playlist (replace UC with UU to get uploads playlist)
    const uploadsPlaylistId = channelMatch[1].replace(/^UC/, 'UU');
    return `https://www.youtube.com/embed/videoseries?list=${uploadsPlaylistId}`;
  }

  // Extract video ID from music.youtube.com/watch?v=XXX
  const watchMatch = youtubeMusicUrl.match(/music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // Extract playlist ID from music.youtube.com/playlist?list=XXX
  const playlistMatch = youtubeMusicUrl.match(/music\.youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
  }

  // Handle regular YouTube channel URLs
  const youtubeChannelMatch = youtubeMusicUrl.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (youtubeChannelMatch) {
    const uploadsPlaylistId = youtubeChannelMatch[1].replace(/^UC/, 'UU');
    return `https://www.youtube.com/embed/videoseries?list=${uploadsPlaylistId}`;
  }

  // Handle regular YouTube URLs as fallback
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
  // Apple Music embed URL format:
  // https://music.apple.com/us/album/xxx -> https://embed.music.apple.com/us/album/xxx
  // https://music.apple.com/us/artist/xxx -> https://embed.music.apple.com/us/artist/xxx

  if (appleMusicUrl.includes('embed.music.apple.com')) {
    return appleMusicUrl;
  }

  if (appleMusicUrl.includes('music.apple.com')) {
    return appleMusicUrl.replace('music.apple.com', 'embed.music.apple.com');
  }

  return null;
}
