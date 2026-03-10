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
  const displayedPosts = posts.slice(0, Math.min(displayLimit, 9));

  // Layout settings
  const layout = settings?.layout || 'grid';
  const titleAlign = settings?.title_align || 'left';
  const gap = settings?.gap || 'md';
  const heading = content.heading || 'Posts';

  if (displayedPosts.length === 0 && !isPreview) {
    return null;
  }

  const sectionClasses = [
    'posts-section',
    `posts-section--layout-${layout}`,
    `posts-section--title-${titleAlign}`,
    `posts-section--gap-${gap}`,
  ].join(' ');

  const gridClasses = layout === 'grid'
    ? 'profile-grid profile-grid--3'
    : 'profile-stack profile-stack--gap-md';

  return (
    <div className={sectionClasses}>
      <h2 className="profile-section__heading">{heading}</h2>

      {displayedPosts.length > 0 ? (
        <div className={gridClasses}>
          {displayedPosts.map((post) => {
            const cardContent = layout === 'grid' ? (
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
            ) : (
              // Stack layout - horizontal card
              <div className="posts-section__stack-item">
                {post.featured_image_url && (
                  <img
                    src={fixImageUrl(post.featured_image_url)}
                    alt={post.title}
                    className="posts-section__stack-image"
                  />
                )}
                <div className="posts-section__stack-content">
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
              </div>
            );

            if (isPreview) {
              return (
                <div key={post.id} className={layout === 'grid' ? 'profile-card' : ''}>
                  {cardContent}
                </div>
              );
            }

            const postHref = data?.post_base_path
              ? `${data.post_base_path}/${post.slug}`
              : `/posts/${post.slug}`;

            return (
              <Link
                key={post.id}
                href={postHref}
                className={layout === 'grid' ? 'profile-card profile-card--link' : 'posts-section__stack-link'}
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
