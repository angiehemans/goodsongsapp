import { MusicContent, MusicData, MusicSettings, ProfileTheme, SectionProps } from '@/lib/site-builder/types';

type MusicSectionProps = SectionProps<MusicContent, MusicData, MusicSettings>;

// Detect embed type from the content
type EmbedType = 'bandcamp' | 'spotify' | 'apple-music' | 'soundcloud' | 'youtube' | 'youtube-music' | 'unknown';

// Apply theme colors to Bandcamp embed
function applyBandcampTheme(embedCode: string, theme: ProfileTheme): string {
  // Convert hex colors to bandcamp format (without #)
  const bgHex = theme.background_color.replace('#', '');
  const linkHex = theme.brand_color.replace('#', '');

  // Check if it's an iframe
  if (!embedCode.includes('<iframe')) {
    return embedCode;
  }

  // Extract the src URL from the iframe
  const srcMatch = embedCode.match(/src="([^"]+)"/);
  if (!srcMatch) return embedCode;

  let srcUrl = srcMatch[1];

  // Remove existing color params and add new ones
  srcUrl = srcUrl.replace(/\/bgcol=[a-fA-F0-9]+/g, '');
  srcUrl = srcUrl.replace(/\/linkcol=[a-fA-F0-9]+/g, '');

  // Add color params before the trailing slash or at the end
  if (srcUrl.endsWith('/')) {
    srcUrl = srcUrl.slice(0, -1);
  }
  srcUrl = `${srcUrl}/bgcol=${bgHex}/linkcol=${linkHex}/`;

  // Replace the src in the iframe
  return embedCode.replace(/src="[^"]+"/, `src="${srcUrl}"`);
}

function detectEmbedType(embedCode: string): EmbedType {
  const trimmed = embedCode.trim();

  // Check for Bandcamp iframe embed
  if (trimmed.includes('bandcamp.com/EmbeddedPlayer') || trimmed.includes('<iframe') && trimmed.includes('bandcamp')) {
    return 'bandcamp';
  }

  // Check for Spotify URL or embed
  if (trimmed.includes('spotify.com') || trimmed.includes('open.spotify.com')) {
    return 'spotify';
  }

  // Check for Apple Music URL or embed
  if (trimmed.includes('music.apple.com') || trimmed.includes('embed.music.apple.com')) {
    return 'apple-music';
  }

  // Check for SoundCloud URL or embed
  if (trimmed.includes('soundcloud.com') || trimmed.includes('w.soundcloud.com')) {
    return 'soundcloud';
  }

  // Check for YouTube Music URL or embed (must check before regular YouTube)
  if (trimmed.includes('music.youtube.com')) {
    return 'youtube-music';
  }

  // Check for YouTube URL or embed
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    return 'youtube';
  }

  return 'unknown';
}

// Convert a Spotify URL to an embed URL
function getSpotifyEmbed(url: string): string | null {
  // Handle different Spotify URL formats
  // https://open.spotify.com/album/xxx -> https://open.spotify.com/embed/album/xxx
  // https://open.spotify.com/track/xxx -> https://open.spotify.com/embed/track/xxx
  // https://open.spotify.com/artist/xxx -> https://open.spotify.com/embed/artist/xxx
  // https://open.spotify.com/playlist/xxx -> https://open.spotify.com/embed/playlist/xxx

  const match = url.match(/open\.spotify\.com\/(album|track|artist|playlist)\/([a-zA-Z0-9]+)/);
  if (match) {
    const [, type, id] = match;
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }

  // Already an embed URL
  if (url.includes('/embed/')) {
    return url;
  }

  return null;
}

// Convert an Apple Music URL to an embed URL
function getAppleMusicEmbed(url: string): string | null {
  // https://music.apple.com/us/album/xxx/123 -> https://embed.music.apple.com/us/album/xxx/123
  // https://music.apple.com/us/playlist/xxx/pl.xxx -> https://embed.music.apple.com/us/playlist/xxx/pl.xxx

  if (url.includes('embed.music.apple.com')) {
    return url;
  }

  const match = url.match(/music\.apple\.com\/([a-z]{2})\/(album|playlist|artist)\/([^?]+)/);
  if (match) {
    const [, country, type, path] = match;
    return `https://embed.music.apple.com/${country}/${type}/${path}`;
  }

  return null;
}

// Apply theme color to SoundCloud iframe embed
function applySoundCloudTheme(embedCode: string, brandColor: string): string {
  const accentColor = brandColor.replace('#', '');

  // Update the color parameter in the iframe src
  let themed = embedCode.replace(/color=%23[a-fA-F0-9]+/g, `color=%23${accentColor}`);

  // If no color param exists, try to add it to the src URL
  if (!themed.includes('color=')) {
    themed = themed.replace(/src="([^"]+)"/, (match, src) => {
      const separator = src.includes('?') ? '&' : '?';
      return `src="${src}${separator}color=%23${accentColor}"`;
    });
  }

  return themed;
}

// Convert a SoundCloud URL to an embed URL
function getSoundCloudEmbed(url: string, brandColor?: string): string | null {
  // SoundCloud embeds use their widget API
  // Color should be hex without the # prefix
  const accentColor = brandColor ? brandColor.replace('#', '') : 'ff5500';

  if (url.includes('w.soundcloud.com/player')) {
    // Update existing embed URL with theme color
    let updatedUrl = url.replace(/color=%23[a-fA-F0-9]+/, `color=%23${accentColor}`);
    if (!updatedUrl.includes('color=')) {
      updatedUrl += `&color=%23${accentColor}`;
    }
    return updatedUrl;
  }

  // For regular SoundCloud URLs, we'll use the widget with the URL encoded
  if (url.includes('soundcloud.com/') && !url.includes('<iframe')) {
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23${accentColor}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
  }

  return null;
}

// Convert a YouTube URL to an embed URL
function getYouTubeEmbed(url: string): string | null {
  // Handle different YouTube URL formats:
  // https://www.youtube.com/watch?v=VIDEO_ID
  // https://youtu.be/VIDEO_ID
  // https://www.youtube.com/embed/VIDEO_ID
  // https://www.youtube.com/playlist?list=PLAYLIST_ID

  // Already an embed URL
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Playlist
  const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
  }

  // Standard watch URL
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  // Short URL (youtu.be)
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return null;
}

// Convert a YouTube Music URL to an embed URL
function getYouTubeMusicEmbed(url: string): string | null {
  // YouTube Music URLs:
  // https://music.youtube.com/watch?v=VIDEO_ID
  // https://music.youtube.com/playlist?list=PLAYLIST_ID

  // Playlist
  const playlistMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) {
    return `https://www.youtube.com/embed/videoseries?list=${playlistMatch[1]}`;
  }

  // Watch URL
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  return null;
}

// Render the appropriate embed based on type
function renderEmbed(embedCode: string, embedType: EmbedType, theme: ProfileTheme) {
  const trimmed = embedCode.trim();

  switch (embedType) {
    case 'bandcamp': {
      // Apply theme colors to Bandcamp embed
      const themedEmbed = applyBandcampTheme(trimmed, theme);
      return (
        <div
          className="music-embed music-embed--bandcamp"
          dangerouslySetInnerHTML={{ __html: themedEmbed }}
        />
      );
    }

    case 'spotify': {
      // Check if it's already an iframe embed code
      if (trimmed.includes('<iframe')) {
        return (
          <div
            className="music-embed music-embed--spotify"
            dangerouslySetInnerHTML={{ __html: trimmed }}
          />
        );
      }

      const embedUrl = getSpotifyEmbed(trimmed);
      if (!embedUrl) return null;

      return (
        <div className="music-embed music-embed--spotify">
          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: 'var(--gs-radius-lg)' }}
          />
        </div>
      );
    }

    case 'apple-music': {
      // Check if it's already an iframe embed code
      if (trimmed.includes('<iframe')) {
        return (
          <div
            className="music-embed music-embed--apple-music"
            dangerouslySetInnerHTML={{ __html: trimmed }}
          />
        );
      }

      const embedUrl = getAppleMusicEmbed(trimmed);
      if (!embedUrl) return null;

      return (
        <div className="music-embed music-embed--apple-music">
          <iframe
            src={embedUrl}
            width="100%"
            height="450"
            frameBorder="0"
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            loading="lazy"
            style={{ borderRadius: 'var(--gs-radius-lg)', overflow: 'hidden', background: 'transparent' }}
          />
        </div>
      );
    }

    case 'soundcloud': {
      // Check if it's already an iframe - apply theme color to src URL
      if (trimmed.includes('<iframe')) {
        const themedEmbed = applySoundCloudTheme(trimmed, theme.brand_color);
        return (
          <div
            className="music-embed music-embed--soundcloud"
            dangerouslySetInnerHTML={{ __html: themedEmbed }}
          />
        );
      }

      const embedUrl = getSoundCloudEmbed(trimmed, theme.brand_color);
      if (!embedUrl) return null;

      return (
        <div className="music-embed music-embed--soundcloud">
          <iframe
            src={embedUrl}
            width="100%"
            height="300"
            frameBorder="0"
            allow="autoplay"
            loading="lazy"
            scrolling="no"
          />
        </div>
      );
    }

    case 'youtube': {
      // Check if it's already an iframe embed code
      if (trimmed.includes('<iframe')) {
        return (
          <div
            className="music-embed music-embed--youtube"
            dangerouslySetInnerHTML={{ __html: trimmed }}
          />
        );
      }

      const embedUrl = getYouTubeEmbed(trimmed);
      if (!embedUrl) return null;

      return (
        <div className="music-embed music-embed--youtube">
          <iframe
            src={embedUrl}
            width="100%"
            height="315"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ borderRadius: 'var(--gs-radius-lg)' }}
          />
        </div>
      );
    }

    case 'youtube-music': {
      // Check if it's already an iframe embed code
      if (trimmed.includes('<iframe')) {
        return (
          <div
            className="music-embed music-embed--youtube-music"
            dangerouslySetInnerHTML={{ __html: trimmed }}
          />
        );
      }

      const embedUrl = getYouTubeMusicEmbed(trimmed);
      if (!embedUrl) return null;

      return (
        <div className="music-embed music-embed--youtube-music">
          <iframe
            src={embedUrl}
            width="100%"
            height="315"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            style={{ borderRadius: 'var(--gs-radius-lg)' }}
          />
        </div>
      );
    }

    default:
      // Unknown type - if it looks like an iframe, try to render it
      if (trimmed.startsWith('<iframe')) {
        return (
          <div
            className="music-embed music-embed--unknown"
            dangerouslySetInnerHTML={{ __html: trimmed }}
          />
        );
      }
      return null;
  }
}

export function MusicSection({ content, data, settings, theme, isPreview }: MusicSectionProps) {
  // Get embeds array - support both new array and legacy single embed
  const getEmbeds = (): string[] => {
    if (content.embed_codes && content.embed_codes.length > 0) {
      return content.embed_codes;
    }
    // Legacy single embed fallback
    if (content.embed_code) {
      return [content.embed_code];
    }
    // Default from data
    if (data?.bandcamp_embed) {
      return [data.bandcamp_embed];
    }
    return [];
  };

  const embeds = getEmbeds();
  const tracks = data?.tracks || [];
  const displayLimit = settings?.display_limit || 6;

  // Layout settings
  const playerLayout = settings?.player_layout || 'center';
  const titleAlign = settings?.title_align || 'left';
  const gap = settings?.gap || 'md';
  const heading = content.heading || 'Music';

  // Show section if there are embeds, tracks, or in preview mode
  const hasContent = embeds.length > 0 || tracks.length > 0;

  if (!hasContent && !isPreview) {
    return null;
  }

  const sectionClasses = [
    'music-section',
    `music-section--player-${playerLayout}`,
    `music-section--title-${titleAlign}`,
    `music-section--gap-${gap}`,
  ].join(' ');

  return (
    <div className={sectionClasses}>
      <h2 className="profile-section__heading">{heading}</h2>

      {embeds.length > 0 ? (
        <div className="music-section__players">
          {embeds.map((embedCode, index) => {
            const embedType = detectEmbedType(embedCode);
            if (embedType === 'unknown') return null;
            return (
              <div key={index} className="music-section__player">
                {renderEmbed(embedCode, embedType, theme)}
              </div>
            );
          })}
        </div>
      ) : tracks.length > 0 ? (
        <div className="profile-stack profile-stack--gap-md">
          {tracks.slice(0, displayLimit).map((track) => (
            <div key={track.id} className="profile-track">
              {track.artwork_url && (
                <img
                  src={track.artwork_url}
                  alt={track.name}
                  className="profile-track__artwork"
                />
              )}
              <span className="profile-track__name">{track.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="profile-section__empty">
          Add a music embed or link to display your music here.
        </div>
      )}
    </div>
  );
}
