'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ProfileTheme, SinglePostLayout, ThemedPostResponse } from '@/lib/site-builder/types';
import { getFontFamily, getGoogleFontsUrl } from '@/lib/site-builder/fonts';
import { fixImageUrl, formatTimeAgo } from '@/lib/utils';
import { STREAMING_PLATFORMS } from '@/lib/streaming';
import type { StreamingPlatform } from '@/lib/streaming';
import { ProfileFooter } from './ProfileFooter';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, PostComment } from '@/lib/api';
import './profile-theme.css';

type ThemedPost = ThemedPostResponse['data']['post'];
type ThemedRelatedPost = ThemedPostResponse['data']['related_posts'][number];
type ThemedNavigation = ThemedPostResponse['data']['navigation'];

interface ThemedPostPageProps {
  theme: ProfileTheme;
  layout: SinglePostLayout;
  post: ThemedPost;
  relatedPosts: ThemedRelatedPost[];
  navigation: ThemedNavigation;
  postBasePath: string;
  authorImageOverride?: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getAvailableStreamingLinks(
  streamingLinks?: Record<string, string>
): Array<{ platform: StreamingPlatform; url: string }> {
  if (!streamingLinks) return [];
  return (Object.entries(streamingLinks) as [StreamingPlatform, string | undefined][])
    .filter(([_, url]) => url)
    .map(([platform, url]) => ({ platform, url: url! }));
}

// ─── Themed Like Button (no Mantine) ───────────────────────────────
function ThemedLikeButton({ postId, initialLiked = false, initialLikesCount = 0 }: {
  postId: number;
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
        const response = await apiClient.unlikePost(postId);
        setIsLiked(false);
        setLikesCount(response.likes_count);
      } else {
        const response = await apiClient.likePost(postId);
        setIsLiked(true);
        setLikesCount(response.likes_count);
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLiking}
      aria-label={isLiked ? 'Unlike post' : 'Like post'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: 4,
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

// ─── Themed Comments Section (no Mantine) ──────────────────────────
function ThemedCommentsSection({ postId, initialCommentsCount = 0 }: {
  postId: number;
  initialCommentsCount?: number;
}) {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
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
  }, [postId]);

  const loadComments = async (pageNum: number, reset: boolean = false) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const response = await apiClient.getPostComments(postId, pageNum);
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
      const response = await apiClient.createPostComment(postId, { body: newComment.trim() });
      setComments((prev) => [...prev, response.comment]);
      setNewComment('');
      setCommentsCount(response.comments_count);
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    setDeletingId(commentId);
    try {
      const response = await apiClient.deletePostComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentsCount(response.comments_count);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLikeComment = async (comment: PostComment) => {
    if (likingId !== null || !user) return;
    setLikingId(comment.id);
    try {
      if (comment.liked_by_current_user) {
        const response = await apiClient.unlikePostComment(comment.id);
        setComments((prev) => prev.map((c) =>
          c.id === comment.id ? { ...c, liked_by_current_user: false, likes_count: response.likes_count } : c
        ));
      } else {
        const response = await apiClient.likePostComment(comment.id);
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
    borderRadius: 6,
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
    borderRadius: 6,
    cursor: 'pointer',
    opacity: (!newComment.trim() || isSubmitting) ? 0.5 : 1,
  };

  const commentCardStyle: CSSProperties = {
    background: 'var(--gs-card-bg)',
    borderRadius: 8,
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
      {/* Header */}
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

      {/* Comment Input */}
      {user ? (
        <div style={{
          ...commentCardStyle,
          marginBottom: '1rem',
        }}>
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

      {/* Comments List */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.875rem' }}>
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {comments.map((comment) => {
            const isAnonymous = comment.anonymous;
            const author = comment.author;
            const authorImg = fixImageUrl(author?.profile_image_url);

            return (
              <div key={comment.id} style={commentCardStyle}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {isAnonymous ? (
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--gs-card-bg)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      opacity: 0.6,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  ) : authorImg ? (
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
                          {isAnonymous ? (comment.guest_name || 'Anonymous') : (
                            author ? (
                              <Link href={`/users/${author.username}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                @{author.username}
                              </Link>
                            ) : 'Unknown'
                          )}
                        </span>
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      {!isAnonymous && user?.id === author?.id && (
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

                    {/* Comment actions */}
                    {user && (
                      <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                        {!isAnonymous && author && (
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

          {/* Load More */}
          {hasNextPage && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => loadComments(page + 1, false)}
                disabled={isLoadingMore}
                style={{
                  background: 'none', border: '1px solid var(--gs-card-bg)',
                  borderRadius: 6, padding: '0.5rem 1.25rem',
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

export function ThemedPostPage({
  theme,
  layout,
  post,
  relatedPosts,
  navigation,
  postBasePath,
  authorImageOverride,
}: ThemedPostPageProps) {
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
    '--gs-profile-header-font': getFontFamily(theme.header_font),
    '--gs-profile-body-font': getFontFamily(theme.body_font),
    '--gs-profile-content-max-width': layout.max_width
      ? `${layout.max_width}px`
      : `${theme.content_max_width || 1200}px`,
    '--gs-card-bg': `color-mix(in srgb, ${theme.card_background_color || theme.font_color} ${theme.card_background_opacity ?? 10}%, transparent)`,
  };

  const contentMaxWidth = layout.max_width
    ? `${layout.max_width}px`
    : `${theme.content_max_width || 800}px`;

  const featuredImageUrl = fixImageUrl(post.featured_image_url);
  const authorImageUrl = fixImageUrl(authorImageOverride || post.author.profile_image_url);

  return (
    <div className="profile-page" style={style}>
      <div style={{ maxWidth: contentMaxWidth, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Featured Image */}
        {layout.show_featured_image && featuredImageUrl && (
          <div style={{
            marginBottom: '1.5rem',
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
            height: 280,
          }}>
            <img
              src={featuredImageUrl}
              alt={post.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--gs-profile-header-font)',
          color: 'var(--gs-profile-font)',
          fontSize: '2rem',
          marginBottom: '0.5rem',
          lineHeight: 1.2,
        }}>
          {post.title}
        </h1>

        {/* Author & Date */}
        {layout.show_author && (
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
                alt={post.author.display_name || post.author.username || 'Author'}
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
                {(post.author.display_name || post.author.username || 'A').charAt(0)}
              </div>
            )}
            <span>{post.author.display_name || post.author.username || 'Author'}</span>
            <span style={{ opacity: 0.5 }}>{formatDate(post.publish_date)}</span>

            <ThemedLikeButton
              postId={post.id}
              initialLiked={post.liked_by_current_user}
              initialLikesCount={post.likes_count}
            />
          </div>
        )}

        {/* Song Embed */}
        {layout.show_song_embed && post.song && (
          <div style={{
            background: 'var(--gs-card-bg)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: 'var(--gs-profile-body-font)',
            color: 'var(--gs-profile-font)',
          }}>
            {post.song.artwork_url ? (
              <img
                src={fixImageUrl(post.song.artwork_url)}
                alt={`${post.song.song_name} artwork`}
                style={{
                  width: 48, height: 48, borderRadius: 4,
                  objectFit: 'cover', flexShrink: 0,
                }}
              />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: 4,
                background: 'var(--gs-profile-brand)', opacity: 0.6,
                flexShrink: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#fff' }}>
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{post.song.song_name}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{post.song.band_name}</div>
            </div>

            {/* Streaming links */}
            {(() => {
              const availableLinks = getAvailableStreamingLinks(post.song?.streaming_links);
              const singleUrl =
                post.song?.preferred_link ||
                availableLinks[0]?.url ||
                post.song?.songlink_url ||
                post.song?.song_link;

              if (availableLinks.length > 1) {
                return (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {availableLinks.slice(0, 4).map(({ platform, url }) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={STREAMING_PLATFORMS[platform]?.name || platform}
                        style={{
                          width: 24, height: 24, borderRadius: '50%',
                          backgroundColor: STREAMING_PLATFORMS[platform]?.color || '#666',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </a>
                    ))}
                  </div>
                );
              }

              if (singleUrl) {
                return (
                  <a
                    href={singleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--gs-profile-brand)', opacity: 0.8 }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </a>
                );
              }

              return null;
            })()}
          </div>
        )}

        {/* Post Body */}
        {post.body && (
          <div
            style={{
              fontFamily: 'var(--gs-profile-body-font)',
              color: 'var(--gs-profile-font)',
              fontSize: '1rem',
              lineHeight: 1.7,
              marginBottom: '2rem',
            }}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        )}

        {/* Navigation */}
        {layout.show_navigation && (navigation.previous_post || navigation.next_post) && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--gs-card-bg)',
            paddingTop: '1rem',
            marginBottom: '1.5rem',
            fontFamily: 'var(--gs-profile-body-font)',
            color: 'var(--gs-profile-font)',
            fontSize: '0.875rem',
          }}>
            <div>
              {navigation.previous_post && (
                <Link
                  href={`${postBasePath}/${navigation.previous_post.slug}`}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {`\u2190 ${navigation.previous_post.title}`}
                </Link>
              )}
            </div>
            <div>
              {navigation.next_post && (
                <Link
                  href={`${postBasePath}/${navigation.next_post.slug}`}
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {`${navigation.next_post.title} \u2192`}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Related Posts */}
        {layout.show_related_posts && relatedPosts.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              fontFamily: 'var(--gs-profile-header-font)',
              color: 'var(--gs-profile-font)',
              fontSize: '1.25rem',
              marginBottom: '0.75rem',
            }}>
              Related Posts
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {relatedPosts.map((rp) => {
                const rpImage = fixImageUrl(rp.featured_image_url);
                return (
                  <Link
                    key={rp.id}
                    href={`${postBasePath}/${rp.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{
                      background: 'var(--gs-card-bg)',
                      borderRadius: 8,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: 100,
                        background: rpImage ? undefined : 'color-mix(in srgb, var(--gs-card-bg) 60%, transparent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        overflow: 'hidden',
                      }}>
                        {rpImage ? (
                          <img
                            src={rpImage}
                            alt={rp.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gs-profile-font)', opacity: 0.15 }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        )}
                      </div>
                      <div style={{
                        padding: '0.5rem 0.75rem',
                        fontFamily: 'var(--gs-profile-body-font)',
                        color: 'var(--gs-profile-font)',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}>
                        {rp.title}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Comments */}
        {layout.show_comments && (
          <ThemedCommentsSection postId={post.id} initialCommentsCount={post.comments_count} />
        )}
      </div>

      <ProfileFooter />
    </div>
  );
}
