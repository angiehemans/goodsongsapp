'use client';

import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProfileTheme } from '@/lib/site-builder/types';
import { getFontFamily, getGoogleFontsUrl } from '@/lib/site-builder/fonts';
import { fixImageUrl, formatTimeAgo } from '@/lib/utils';
import { ProfileFooter } from './ProfileFooter';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Event, ReviewComment } from '@/lib/api';
import './profile-theme.css';

interface ThemedEventPageProps {
  theme: ProfileTheme;
  event: Event;
  profileBasePath: string;
  profileName: string;
  profileImageUrl?: string;
}

function formatEventDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEventTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ─── Themed Like Button (no Mantine) ───────────────────────────────
function ThemedLikeButton({ eventId, initialLiked = false, initialLikesCount = 0 }: {
  eventId: number;
  initialLiked?: boolean;
  initialLikesCount?: number;
}) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleClick = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (isLiked) {
        const response = await apiClient.unlikeEvent(eventId);
        setIsLiked(false);
        setLikesCount(response.likes_count);
      } else {
        const response = await apiClient.likeEvent(eventId);
        setIsLiked(true);
        setLikesCount(response.likes_count);
      }
    } catch (error) {
      console.error('Failed to like/unlike event:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLiking}
      aria-label={isLiked ? 'Unlike event' : 'Like event'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: 'var(--gs-radius-xs)',
        color: isLiked ? '#e03131' : 'var(--gs-profile-font)',
        opacity: isLiking ? 0.5 : 0.7,
        transition: 'opacity 0.2s',
        fontFamily: 'var(--gs-profile-body-font)',
        fontSize: '0.875rem',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {likesCount > 0 && <span>{likesCount}</span>}
    </button>
  );
}

// ─── Themed Share Button (no Mantine) ──────────────────────────────
function ThemedShareButton({ postableType, postableId, bgColor, fontColor: themeFontColor, bodyFont, borderRadius }: {
  postableType: 'review' | 'post' | 'event';
  postableId: number;
  bgColor?: string;
  fontColor?: string;
  bodyFont?: string;
  borderRadius?: number;
}) {
  const [open, setOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleThreadsShare = useCallback(async () => {
    try {
      const payload = await apiClient.getSharePayload(postableType, postableId);
      if (payload.threads_intent_url) {
        window.open(payload.threads_intent_url, '_blank', 'noopener');
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // Silent fail
    }
    setOpen(false);
  }, [postableType, postableId]);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  const resolvedBg = bgColor || '#1a1a1a';
  const fontColor = themeFontColor || '#f5f5f5';
  const fontFamily = bodyFont ? `"${bodyFont}", sans-serif` : 'Inter, sans-serif';
  const radius = borderRadius ?? 12;

  // Render dropdown into document.body via DOM portal to escape container-type stacking
  useEffect(() => {
    if (!open || !buttonRef.current) {
      if (portalRef.current) {
        portalRef.current.remove();
        portalRef.current = null;
      }
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const el = document.createElement('div');
    el.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 4}px;
      left: ${Math.max(8, rect.right - 180)}px;
      background-color: ${resolvedBg};
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: ${Math.round(radius * 0.67)}px;
      padding: 0.25rem;
      min-width: 180px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      z-index: 2147483646;
      font-family: ${fontFamily};
    `;
    el.innerHTML = `
      <div style="padding: 0.25rem 0.5rem; font-size: 0.7rem; font-weight: 600; opacity: 0.5; color: ${fontColor}; text-transform: uppercase; letter-spacing: 0.05em;">Share</div>
      <button data-share-threads style="display: flex; align-items: center; gap: 8px; width: 100%; background: none; border: none; cursor: pointer; padding: 0.4rem 0.5rem; border-radius: ${Math.round(radius * 0.33)}px; color: ${fontColor}; font-size: 0.8125rem; font-family: inherit; transition: background 0.15s;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7.5c-1.333 -3 -3.667 -4.5 -7 -4.5c-5 0 -8 2.5 -8 9s3.5 9 8 9s7 -3 7 -5s-1 -5 -7 -5c-2.5 0 -3 1.25 -3 2.5c0 1.5 1 2.5 2.5 2.5c2.5 0 3.5 -1.5 3.5 -5s-2 -4 -3 -4s-1.833 .333 -2.5 1"></path></svg>
        ${shared ? 'Opened in Threads' : 'Share on Threads'}
      </button>
    `;

    const btn = el.querySelector('[data-share-threads]') as HTMLElement;
    btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = 'rgba(255,255,255,0.1)'; });
    btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = 'transparent'; });
    btn.addEventListener('click', () => { handleThreadsShare(); });

    document.body.appendChild(el);
    portalRef.current = el;

    return () => {
      el.remove();
      portalRef.current = null;
    };
  }, [open, shared, resolvedBg, fontColor, fontFamily, handleThreadsShare]);

  // Close on outside click for portal
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        portalRef.current && !portalRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-label="Share"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: 4,
          color: 'var(--gs-profile-font)',
          opacity: 0.7,
          transition: 'opacity 0.2s',
          fontFamily: 'var(--gs-profile-body-font)',
          fontSize: '0.875rem',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
          <path d="M8.7 10.7l6.6 -3.4" />
          <path d="M8.7 13.3l6.6 3.4" />
        </svg>
      </button>
    </div>
  );
}

// ─── Themed Comments Section (no Mantine) ──────────────────────────
function ThemedCommentsSection({ eventId, initialCommentsCount = 0 }: {
  eventId: number;
  initialCommentsCount?: number;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [likingId, setLikingId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments(1, true);
  }, [eventId]);

  const loadComments = async (pageNum: number, reset: boolean = false) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const response = await apiClient.getEventComments(eventId, pageNum);
      if (reset) {
        setComments(response.comments);
        setCommentsCount(response.pagination.total_count);
      } else {
        setComments((prev) => [...prev, ...response.comments]);
      }
      setHasNextPage(response.pagination.has_next_page);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting || !user) return;
    setIsSubmitting(true);
    try {
      const comment = await apiClient.createEventComment(eventId, newComment.trim());
      setComments((prev) => [...prev, comment]);
      setNewComment('');
      setCommentsCount((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    setDeletingId(commentId);
    try {
      const response = await apiClient.deleteEventComment(eventId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount(response.comments_count);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLikeComment = async (comment: ReviewComment) => {
    if (likingId !== null || !user) return;
    setLikingId(comment.id);
    try {
      if (comment.liked_by_current_user) {
        const response = await apiClient.unlikeEventComment(comment.id);
        setComments((prev) => prev.map((c) =>
          c.id === comment.id ? { ...c, liked_by_current_user: false, likes_count: response.likes_count } : c
        ));
      } else {
        const response = await apiClient.likeEventComment(comment.id);
        setComments((prev) => prev.map((c) =>
          c.id === comment.id ? { ...c, liked_by_current_user: true, likes_count: response.likes_count } : c
        ));
      }
    } catch (error) {
      console.error('Failed to like/unlike comment:', error);
    } finally {
      setLikingId(null);
    }
  };

  const handleReply = (username: string) => {
    if (user) {
      setNewComment(`@${username} `);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    fontFamily: 'var(--gs-profile-body-font)',
    fontSize: '0.875rem',
    backgroundColor: 'color-mix(in srgb, var(--gs-card-bg) 60%, transparent)',
    border: '1px solid var(--gs-card-bg)',
    borderRadius: 'var(--gs-radius-sm)',
    color: 'var(--gs-profile-font)',
    outline: 'none',
    resize: 'vertical' as const,
    minHeight: 80,
  };

  const btnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0.4rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 600,
    fontFamily: 'var(--gs-profile-body-font)',
    backgroundColor: 'var(--gs-profile-brand)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--gs-radius-sm)',
    cursor: 'pointer',
    opacity: (!newComment.trim() || isSubmitting) ? 0.5 : 1,
  };

  const commentCardStyle: CSSProperties = {
    background: 'var(--gs-card-bg)',
    borderRadius: 'var(--gs-radius-md)',
    padding: '0.75rem 1rem',
    fontFamily: 'var(--gs-profile-body-font)',
    color: 'var(--gs-profile-font)',
  };

  return (
    <div style={{
      borderTop: '1px solid var(--gs-card-bg)',
      paddingTop: '1.5rem',
      marginTop: '0.5rem',
    }}>
      <h3 style={{
        fontFamily: 'var(--gs-profile-header-font)',
        color: 'var(--gs-profile-font)',
        fontSize: '1.25rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Comments{commentsCount > 0 ? ` (${commentsCount})` : ''}
      </h3>

      {user ? (
        <div style={{ ...commentCardStyle, marginBottom: '1rem' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <textarea
              ref={textareaRef}
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              rows={2}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{newComment.length}/500</span>
            <button onClick={handleSubmit} disabled={!newComment.trim() || isSubmitting} style={btnStyle}>
              Post Comment
            </button>
          </div>
        </div>
      ) : (
        <div style={{ ...commentCardStyle, marginBottom: '1rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            <Link href="/login" style={{ color: 'var(--gs-profile-brand)', textDecoration: 'none', fontWeight: 500 }}>
              Log in
            </Link>{' '}
            to leave a comment
          </span>
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.875rem' }}>
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {comments.map((comment) => {
            const author = comment.author;
            const authorImg = fixImageUrl(author?.profile_image_url);

            return (
              <div key={comment.id} style={commentCardStyle}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {authorImg ? (
                    <img
                      src={authorImg}
                      alt={author?.username || 'User'}
                      style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--gs-profile-brand)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 600, color: '#fff', flexShrink: 0,
                    }}>
                      {(author?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                          {author ? (
                            <Link href={`/users/${author.username}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                              @{author.username}
                            </Link>
                          ) : 'Unknown'}
                        </span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      {user?.id === author?.id && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#e03131', opacity: deletingId === comment.id ? 0.3 : 0.6,
                            padding: 2,
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div style={{ fontSize: '0.875rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {comment.formatted_body || comment.body}
                    </div>

                    {user && (
                      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                        {author && (
                          <button
                            onClick={() => handleReply(author.username)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--gs-profile-font)', opacity: 0.5,
                              fontSize: '0.75rem', fontFamily: 'var(--gs-profile-body-font)',
                              display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 14 4 9 9 4" />
                              <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                            </svg>
                            Reply
                          </button>
                        )}
                        <button
                          onClick={() => handleLikeComment(comment)}
                          disabled={likingId === comment.id}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: comment.liked_by_current_user ? '#e03131' : 'var(--gs-profile-font)',
                            opacity: likingId === comment.id ? 0.3 : (comment.liked_by_current_user ? 0.9 : 0.5),
                            fontSize: '0.75rem', fontFamily: 'var(--gs-profile-body-font)',
                            display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill={comment.liked_by_current_user ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                          </svg>
                          {comment.likes_count > 0 && comment.likes_count}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasNextPage && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => loadComments(page + 1, false)}
                disabled={isLoadingMore}
                style={{
                  background: 'none', border: '1px solid var(--gs-card-bg)',
                  borderRadius: 'var(--gs-radius-sm)', padding: '0.5rem 1.25rem',
                  color: 'var(--gs-profile-font)', opacity: isLoadingMore ? 0.4 : 0.7,
                  cursor: 'pointer', fontFamily: 'var(--gs-profile-body-font)',
                  fontSize: '0.875rem',
                }}
              >
                {isLoadingMore ? 'Loading...' : 'Load more comments'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────

export function ThemedEventPage({
  theme,
  event,
  profileBasePath,
  profileName,
  profileImageUrl,
}: ThemedEventPageProps) {
  useEffect(() => {
    const approvedFonts = [
      theme.header_font_name || theme.header_font,
      theme.body_font_name || theme.body_font,
    ].filter((f) => f && !f.startsWith('https://'));

    if (approvedFonts.length > 0) {
      const fontsUrl = getGoogleFontsUrl(approvedFonts);
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
    }

    if (theme.custom_font_urls) {
      theme.custom_font_urls.forEach((url, i) => {
        const linkId = `profile-custom-font-${i}`;
        if (!document.getElementById(linkId)) {
          const linkEl = document.createElement('link');
          linkEl.id = linkId;
          linkEl.rel = 'stylesheet';
          linkEl.href = url;
          document.head.appendChild(linkEl);
        }
      });
    }
  }, [theme.header_font, theme.body_font, theme.header_font_name, theme.body_font_name, theme.custom_font_urls]);

  const style: CSSProperties & Record<string, string> = {
    '--gs-profile-bg': theme.background_color,
    '--gs-profile-brand': theme.brand_color,
    '--gs-profile-font': theme.font_color,
    '--gs-profile-header-font': getFontFamily(theme.header_font, theme.header_font_name),
    '--gs-profile-body-font': getFontFamily(theme.body_font, theme.body_font_name),
    '--gs-profile-header-font-weight': String(theme.header_font_weight ?? 700),
    '--gs-profile-body-font-weight': String(theme.body_font_weight ?? 400),
    '--gs-profile-content-max-width': `${theme.content_max_width || 1200}px`,
    '--gs-profile-radius': `${theme.border_radius ?? 12}px`,
    '--gs-card-bg': `color-mix(in srgb, ${theme.card_background_color || theme.font_color} ${theme.card_background_opacity ?? 10}%, transparent)`,
  };

  const contentMaxWidth = `${theme.content_max_width || 800}px`;
  const eventDate = new Date(event.event_date);
  const isPastEvent = eventDate < new Date();
  const imageUrl = fixImageUrl(event.image_url);
  const authorImageUrl = fixImageUrl(profileImageUrl);

  return (
    <div className="profile-page" style={style}>
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Back link */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href={profileBasePath}
            style={{
              color: 'var(--gs-profile-font)',
              textDecoration: 'none',
              opacity: 0.7,
              fontFamily: 'var(--gs-profile-body-font)',
              fontSize: '0.875rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to {profileName}
          </Link>
        </div>

        {/* Event Image */}
        {imageUrl && (
          <div style={{
            marginBottom: '1.5rem',
            borderRadius: 'var(--gs-radius-md)',
            overflow: 'hidden',
            position: 'relative',
            height: 280,
          }}>
            <img
              src={imageUrl}
              alt={event.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Event Title */}
        <h1 style={{
          fontFamily: 'var(--gs-profile-header-font)',
          color: 'var(--gs-profile-font)',
          fontSize: '2rem',
          marginBottom: '0.5rem',
          lineHeight: 1.2,
        }}>
          {event.name}
        </h1>

        {/* Past badge */}
        {isPastEvent && (
          <span style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 'var(--gs-radius-xs)',
            backgroundColor: 'var(--gs-card-bg)',
            color: 'var(--gs-profile-font)',
            opacity: 0.7,
            fontSize: '0.75rem',
            fontFamily: 'var(--gs-profile-body-font)',
            fontWeight: 600,
            marginBottom: '1rem',
          }}>
            Past Event
          </span>
        )}

        {/* Author & Like */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: '1.5rem',
          color: 'var(--gs-profile-font)',
          opacity: 0.7,
          fontFamily: 'var(--gs-profile-body-font)',
          fontSize: '0.875rem',
        }}>
          {authorImageUrl ? (
            <img
              src={authorImageUrl}
              alt={profileName}
              style={{
                width: 28, height: 28, borderRadius: '50%',
                objectFit: 'cover', flexShrink: 0,
              }}
            />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--gs-profile-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 600, color: '#fff', flexShrink: 0,
            }}>
              {(profileName || 'E').charAt(0)}
            </div>
          )}
          <Link href={profileBasePath} style={{ color: 'inherit', textDecoration: 'none' }}>
            {profileName}
          </Link>

          <ThemedShareButton postableType="event" postableId={event.id} bgColor={theme.background_color} fontColor={theme.font_color} bodyFont={theme.body_font} borderRadius={theme.border_radius} />
          <ThemedLikeButton
            eventId={event.id}
            initialLiked={event.liked_by_current_user}
            initialLikesCount={event.likes_count}
          />
        </div>

        {/* Event Details Card */}
        <div style={{
          background: 'var(--gs-card-bg)',
          borderRadius: 'var(--gs-radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          fontFamily: 'var(--gs-profile-body-font)',
          color: 'var(--gs-profile-font)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {/* Date & Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>{formatEventDate(event.event_date)}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>{formatEventTime(event.event_date)}</div>
            </div>
          </div>

          {/* Venue */}
          {event.venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <div style={{ fontWeight: 600 }}>{event.venue.name}</div>
                {(event.venue.city || event.venue.region) && (
                  <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                    {[event.venue.address, event.venue.city, event.venue.region].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price */}
          {event.price && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>{event.price}</span>
            </div>
          )}

          {/* Age Restriction */}
          {event.age_restriction && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{event.age_restriction}</span>
            </div>
          )}

          {/* Ticket Link */}
          {event.ticket_link && !isPastEvent && (
            <a
              href={event.ticket_link}
              target="_blank"
              rel="noopener noreferrer"
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
                textDecoration: 'none',
                alignSelf: 'flex-start',
                marginTop: '0.25rem',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
              </svg>
              Get Tickets
            </a>
          )}
        </div>

        {/* Description */}
        {event.description && (
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
            {event.description}
          </div>
        )}

        {/* Comments */}
        <ThemedCommentsSection eventId={event.id} initialCommentsCount={event.comments_count} />
      </div>

      <ProfileFooter />
    </div>
  );
}
