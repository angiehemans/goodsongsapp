'use client';

import { CSSProperties, useEffect } from 'react';
import { getFontFamily, getGoogleFontsUrl } from '@/lib/site-builder/fonts';
import { ProfileTheme, SinglePostLayout } from '@/lib/site-builder/types';
import { ProfileFooter } from './ProfileFooter';

import './profile-theme.css';

interface SinglePostPreviewProps {
  theme: ProfileTheme;
  layout: SinglePostLayout;
}

const SAMPLE_POST = {
  title: 'Vocalismus tremulat supra stratum instrumentale',
  author: 'Jamie Rivera',
  date: 'February 18, 2026',
  song: {
    name: 'Decrescendo',
    artist: 'RX Bandits',
  },
  body: `<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Voxtrum melodiae inserit cantalum brevitas, sed profundis sonoris extendum quasi per vacuam amplitudinem. Frequentia tonalis vibramenta crepusculi in aurem descendit, ubi rhythmus pulsatile et bassorum gravitas undulant sine fine. Harmonicum velum transparet inter notae altissimae et subsurrus infimus, creando texturam audiorum that plectris et tympanis coalescit. Intervallis brevibus, silentium ipse fit instrumentum, pausando ut reverberatio decrescat et nova melodia emergat.</p>
<blockquote><p>Voxtrum melodiae inserit cantalum brevitas, sed profundis sonoris extendum quasi per vacuam amplitudinem.</p></blockquote>
  <p>Crescendum fortissimo accelerat per viam sonoram, ubi percussio et chordae simultaneo impactu convergunt in culmen auditivum. Vocalismus tremulat supra stratum instrumentale, portando lyricum intensitatem quae pectora tangit et memoriam excitat. Decrescendo lente subsidit in murmurationem finalem, quasi ultima nota suspensa manet in aere — nec resoluta, nec extincta, sed perpetuo vibrans in spatio inter sonum et silentium. Modulatio transit, tempus fluit, et cantus remanet.</p>`,
  featuredImagePlaceholder: true,
  comments: [
    {
      id: 1,
      author: 'Alex Chen',
      date: 'February 19, 2026',
      body: 'Completely agree about the bridge — that music box moment gives me chills every time. Have you heard their earlier EP? Similar vibes but rawer.',
    },
    {
      id: 2,
      author: 'Sam Okafor',
      date: 'February 20, 2026',
      body: 'Just listened to this based on your rec and wow. Adding it to every playlist I have. The production really is something else.',
    },
    {
      id: 3,
      author: 'Morgan Ellis',
      date: 'February 21, 2026',
      body: 'That desert drive description is so perfect. Some songs just need the right setting to click. Great write-up.',
    },
  ],
  relatedPosts: [
    { id: 1, title: '5 Underrated Shoegaze Tracks from 2025' },
    { id: 2, title: 'The Art of the Album Closer' },
    { id: 3, title: 'When a B-Side Steals the Show' },
  ],
  navigation: {
    prev: { title: 'Songs That Sound Like Rain' },
    next: { title: 'My Top 10 Debut Albums' },
  },
};

export function SinglePostPreview({ theme, layout }: SinglePostPreviewProps) {
  // Load Google Fonts
  useEffect(() => {
    const fonts = [theme.header_font, theme.body_font].filter(Boolean);
    if (fonts.length === 0) return;

    const fontsUrl = getGoogleFontsUrl(fonts);
    const linkId = 'profile-google-fonts';
    let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;

    if (linkEl) {
      if (linkEl.href !== fontsUrl) linkEl.href = fontsUrl;
    } else {
      linkEl = document.createElement('link');
      linkEl.id = linkId;
      linkEl.rel = 'stylesheet';
      linkEl.href = fontsUrl;
      document.head.appendChild(linkEl);
    }
  }, [theme.header_font, theme.body_font]);

  const style: CSSProperties & Record<string, string> = {
    '--gs-profile-bg': layout.background_color || theme.background_color,
    '--gs-profile-brand': theme.brand_color,
    '--gs-profile-font': layout.font_color || theme.font_color,
    '--gs-profile-header-font': getFontFamily(theme.header_font, theme.header_font_name),
    '--gs-profile-body-font': getFontFamily(theme.body_font, theme.body_font_name),
    '--gs-profile-header-font-weight': String(theme.header_font_weight ?? 700),
    '--gs-profile-body-font-weight': String(theme.body_font_weight ?? 400),
    '--gs-profile-content-max-width': layout.max_width
      ? `${layout.max_width}px`
      : `${theme.content_max_width || 1200}px`,
    '--gs-card-bg': `color-mix(in srgb, ${theme.card_background_color || layout.font_color || theme.font_color} ${theme.card_background_opacity ?? 10}%, transparent)`,
    '--gs-profile-radius': `${theme.border_radius ?? 12}px`,
  };

  const contentMaxWidth = layout.max_width
    ? `${layout.max_width}px`
    : `${theme.content_max_width || 800}px`;

  return (
    <div className="profile-page" style={style}>
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Featured Image */}
        {layout.show_featured_image && (
          <div
            style={{
              marginBottom: '1.5rem',
              borderRadius: 'var(--gs-radius-md)',
              overflow: 'hidden',
              background: 'var(--gs-card-bg)',
              height: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--gs-profile-font)', opacity: 0.2 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontFamily: 'var(--gs-profile-header-font)',
            color: 'var(--gs-profile-font)',
            fontSize: '2rem',
            marginBottom: '0.5rem',
            lineHeight: 1.2,
          }}
        >
          {SAMPLE_POST.title}
        </h1>

        {/* Author & Date */}
        {layout.show_author && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: '1.5rem',
              color: 'var(--gs-profile-font)',
              opacity: 0.7,
              fontFamily: 'var(--gs-profile-body-font)',
              fontSize: '0.875rem',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--gs-profile-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {SAMPLE_POST.author.charAt(0)}
            </div>
            <span>{SAMPLE_POST.author}</span>
            <span style={{ opacity: 0.5 }}>{SAMPLE_POST.date}</span>
          </div>
        )}

        {/* Song Embed */}
        {layout.show_song_embed && (
          <div
            style={{
              background: 'var(--gs-card-bg)',
              borderRadius: 'var(--gs-radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: 'var(--gs-profile-body-font)',
              color: 'var(--gs-profile-font)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--gs-radius-xs)',
                background: 'var(--gs-profile-brand)',
                opacity: 0.6,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: '#fff' }}
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{SAMPLE_POST.song.name}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{SAMPLE_POST.song.artist}</div>
            </div>
          </div>
        )}

        {/* Post Body */}
        <div
          style={{
            fontFamily: 'var(--gs-profile-body-font)',
            color: 'var(--gs-profile-font)',
            fontSize: '1rem',
            lineHeight: 1.7,
            marginBottom: '2rem',
          }}
          dangerouslySetInnerHTML={{ __html: SAMPLE_POST.body }}
        />

        {/* Navigation */}
        {layout.show_navigation && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--gs-card-bg)',
              paddingTop: '1rem',
              marginBottom: '1.5rem',
              fontFamily: 'var(--gs-profile-body-font)',
              color: 'var(--gs-profile-font)',
              fontSize: '0.875rem',
            }}
          >
            <div>{`\u2190 ${SAMPLE_POST.navigation.prev.title}`}</div>
            <div>{`${SAMPLE_POST.navigation.next.title} \u2192`}</div>
          </div>
        )}

        {/* Related Posts */}
        {layout.show_related_posts && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontFamily: 'var(--gs-profile-header-font)',
                color: 'var(--gs-profile-font)',
                fontSize: '1.25rem',
                marginBottom: '0.75rem',
              }}
            >
              Related Posts
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '1rem',
              }}
            >
              {SAMPLE_POST.relatedPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: 'var(--gs-card-bg)',
                    borderRadius: 'var(--gs-radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: 100,
                      background: 'color-mix(in srgb, var(--gs-card-bg) 60%, transparent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: 'var(--gs-profile-font)', opacity: 0.15 }}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontFamily: 'var(--gs-profile-body-font)',
                      color: 'var(--gs-profile-font)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  >
                    {post.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {layout.show_comments && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              style={{
                fontFamily: 'var(--gs-profile-header-font)',
                color: 'var(--gs-profile-font)',
                fontSize: '1.25rem',
                marginBottom: '0.75rem',
              }}
            >
              Comments ({SAMPLE_POST.comments.length})
            </h3>

            {/* Leave a comment form */}
            <div
              style={{
                background: 'var(--gs-card-bg)',
                borderRadius: 'var(--gs-radius-md)',
                padding: '1rem',
                marginBottom: '1rem',
                fontFamily: 'var(--gs-profile-body-font)',
                color: 'var(--gs-profile-font)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--gs-card-bg)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '0.8125rem', opacity: 0.5 }}>Leave a comment...</span>
              </div>
              <div
                style={{
                  background: 'color-mix(in srgb, var(--gs-card-bg) 60%, transparent)',
                  border: '1px solid var(--gs-card-bg)',
                  borderRadius: 'var(--gs-radius-sm)',
                  padding: '0.625rem 0.75rem',
                  minHeight: 80,
                  fontSize: '0.875rem',
                  opacity: 0.3,
                  marginBottom: '0.75rem',
                }}
              >
                Write your thoughts...
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    background: 'var(--gs-profile-brand)',
                    color: '#fff',
                    borderRadius: 'var(--gs-radius-sm)',
                    padding: '0.4rem 1rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    opacity: 0.7,
                  }}
                >
                  Post Comment
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {SAMPLE_POST.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    background: 'var(--gs-card-bg)',
                    borderRadius: 'var(--gs-radius-md)',
                    padding: '0.75rem 1rem',
                    fontFamily: 'var(--gs-profile-body-font)',
                    color: 'var(--gs-profile-font)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 4 }}>
                    {comment.author}
                    <span
                      style={{ fontWeight: 400, opacity: 0.5, marginLeft: 8, fontSize: '0.75rem' }}
                    >
                      {comment.date}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{comment.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ProfileFooter isPreview />
    </div>
  );
}
