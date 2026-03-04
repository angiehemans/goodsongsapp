import Link from 'next/link';
import { PostsContent, PostsData, PostsSettings, SectionProps } from '@/lib/site-builder/types';
import { fixImageUrl } from '@/lib/utils';

type PostsSectionProps = SectionProps<PostsContent, PostsData, PostsSettings>;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Simple calendar icon
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function PostsSection({ content, data, settings, isPreview }: PostsSectionProps) {
  const posts = data?.posts || [];
  const displayLimit = settings?.display_limit || 6;
  const displayedPosts = posts.slice(0, displayLimit);

  if (displayedPosts.length === 0 && !isPreview) {
    return null;
  }

  return (
    <div>
      <h2 className="profile-section__heading">Posts</h2>

      {displayedPosts.length > 0 ? (
        <div className="profile-grid profile-grid--3">
          {displayedPosts.map((post) => {
            const cardContent = (
              <>
                {post.featured_image_url && (
                  <img
                    src={fixImageUrl(post.featured_image_url)}
                    alt={post.title}
                    className="profile-card__image"
                  />
                )}
                <div className="profile-card__body">
                  <h3 className="profile-card__title">{post.title}</h3>
                  {post.excerpt && (
                    <p className="profile-card__subtitle profile-text--clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                  <div className="profile-card__meta">
                    <CalendarIcon />
                    <span>{formatDate(post.publish_date)}</span>
                  </div>
                </div>
              </>
            );

            if (isPreview) {
              return (
                <div key={post.id} className="profile-card">
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="profile-card profile-card--link"
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="profile-section__empty">
          No posts yet.
        </div>
      )}
    </div>
  );
}
