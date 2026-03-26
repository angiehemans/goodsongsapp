'use client';

import { CSSProperties, useEffect } from 'react';
import { getFontFamily, getGoogleFontsUrl } from '@/lib/site-builder/fonts';
import { ProfileTheme } from '@/lib/site-builder/types';
import { ProfileFooter } from './ProfileFooter';

import './profile-theme.css';

interface SingleEventPreviewProps {
  theme: ProfileTheme;
}

const SAMPLE_EVENT = {
  name: 'Summer Solstice Live',
  date: 'Saturday, June 20, 2026',
  time: '8:00 PM',
  venue: {
    name: 'The Fillmore',
    address: '1805 Geary Blvd, San Francisco, California',
  },
  price: '$25',
  ageRestriction: 'All Ages',
  description:
    'Join us for an unforgettable night of live music as we celebrate the longest day of the year. Doors open at 7:00 PM with an opening set from local favorites. Expect a full two-hour headlining performance featuring songs from the new album plus fan-favorite deep cuts.\n\nFood and drinks available on site. Limited VIP meet & greet packages available at the door.',
  author: 'Jamie Rivera',
  comments: [
    {
      id: 1,
      author: 'Alex Chen',
      date: '2 days ago',
      body: 'Just got my tickets! Cannot wait for this show. Anyone else driving up from LA?',
    },
    {
      id: 2,
      author: 'Sam Okafor',
      date: '1 day ago',
      body: 'The Fillmore is such a perfect venue for this. The sound there is always incredible.',
    },
    {
      id: 3,
      author: 'Morgan Ellis',
      date: '5 hours ago',
      body: 'Will the new album tracks be on the setlist? Hoping to hear the single live!',
    },
  ],
};

export function SingleEventPreview({ theme }: SingleEventPreviewProps) {
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
    '--gs-profile-bg': theme.background_color,
    '--gs-profile-brand': theme.brand_color,
    '--gs-profile-font': theme.font_color,
    '--gs-profile-header-font': getFontFamily(theme.header_font, theme.header_font_name),
    '--gs-profile-body-font': getFontFamily(theme.body_font, theme.body_font_name),
    '--gs-profile-header-font-weight': String(theme.header_font_weight ?? 700),
    '--gs-profile-body-font-weight': String(theme.body_font_weight ?? 400),
    '--gs-profile-content-max-width': `${theme.content_max_width || 1200}px`,
    '--gs-card-bg': `color-mix(in srgb, ${theme.card_background_color || theme.font_color} ${theme.card_background_opacity ?? 10}%, transparent)`,
    '--gs-profile-radius': `${theme.border_radius ?? 12}px`,
  };

  const contentMaxWidth = `${theme.content_max_width || 800}px`;

  return (
    <div className="profile-page" style={style}>
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Back link */}
        <div
          style={{
            marginBottom: '1.5rem',
            color: 'var(--gs-profile-font)',
            opacity: 0.7,
            fontFamily: 'var(--gs-profile-body-font)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to profile
        </div>

        {/* Event Image Placeholder */}
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>

        {/* Event Title */}
        <h1
          style={{
            fontFamily: 'var(--gs-profile-header-font)',
            color: 'var(--gs-profile-font)',
            fontSize: '2rem',
            marginBottom: '0.5rem',
            lineHeight: 1.2,
          }}
        >
          {SAMPLE_EVENT.name}
        </h1>

        {/* Author & Like */}
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
            {SAMPLE_EVENT.author.charAt(0)}
          </div>
          <span>{SAMPLE_EVENT.author}</span>
          {/* Fake like button */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>12</span>
          </span>
        </div>

        {/* Event Details Card */}
        <div
          style={{
            background: 'var(--gs-card-bg)',
            borderRadius: 'var(--gs-radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            fontFamily: 'var(--gs-profile-body-font)',
            color: 'var(--gs-profile-font)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {/* Date & Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>{SAMPLE_EVENT.date}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>{SAMPLE_EVENT.time}</div>
            </div>
          </div>

          {/* Venue */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>{SAMPLE_EVENT.venue.name}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>{SAMPLE_EVENT.venue.address}</div>
            </div>
          </div>

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            <span>{SAMPLE_EVENT.price}</span>
          </div>

          {/* Age Restriction */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{SAMPLE_EVENT.ageRestriction}</span>
          </div>

          {/* Ticket Button */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0.5rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: 'var(--gs-profile-body-font)',
              backgroundColor: 'var(--gs-profile-brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--gs-radius-sm)',
              alignSelf: 'flex-start',
              marginTop: '0.25rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
            </svg>
            Get Tickets
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontFamily: 'var(--gs-profile-body-font)',
            color: 'var(--gs-profile-font)',
            fontSize: '1rem',
            lineHeight: 1.7,
            marginBottom: '2rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {SAMPLE_EVENT.description}
        </div>

        {/* Comments */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            style={{
              fontFamily: 'var(--gs-profile-header-font)',
              color: 'var(--gs-profile-font)',
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Comments ({SAMPLE_EVENT.comments.length})
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
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
            {SAMPLE_EVENT.comments.map((comment) => (
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
                  <span style={{ fontWeight: 400, opacity: 0.5, marginLeft: 8, fontSize: '0.75rem' }}>
                    {comment.date}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{comment.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProfileFooter isPreview />
    </div>
  );
}
