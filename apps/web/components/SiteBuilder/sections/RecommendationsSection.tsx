import { RecommendationsContent, RecommendationsData, RecommendationsSettings, SectionProps } from '@/lib/site-builder/types';
import { fixImageUrl } from '@/lib/utils';

type RecommendationsSectionProps = SectionProps<RecommendationsContent, RecommendationsData, RecommendationsSettings>;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function RecommendationsSection({ content, data, settings, isPreview }: RecommendationsSectionProps) {
  // Support both 'recommendations' and 'reviews' keys (backend uses 'reviews')
  const recommendations = data?.recommendations || data?.reviews || [];
  const displayLimit = settings?.display_limit || 6;
  const displayedRecs = recommendations.slice(0, displayLimit);

  // Layout settings
  const layout = settings?.layout || 'grid';
  const titleAlign = settings?.title_align || 'left';
  const gap = settings?.gap || 'md';

  if (displayedRecs.length === 0 && !isPreview) {
    return null;
  }

  const sectionClasses = [
    'recommendations-section',
    `recommendations-section--layout-${layout}`,
    `recommendations-section--title-${titleAlign}`,
    `recommendations-section--gap-${gap}`,
  ].join(' ');

  const gridClasses = layout === 'grid'
    ? 'profile-grid profile-grid--3'
    : 'profile-stack profile-stack--gap-md';

  return (
    <div className={sectionClasses}>
      <h2 className="profile-section__heading">Recommendations</h2>

      {displayedRecs.length > 0 ? (
        <div className={gridClasses}>
          {displayedRecs.map((rec) => {
            const bandName = rec.band_name || rec.track?.artist;
            const reviewText = rec.review_text || rec.body;

            const authorUrl = rec.author?.username ? `/user/${rec.author.username}` : undefined;

            return (
              <div key={rec.id} className="recommendation-card">
                {(rec.author || rec.created_at) && (
                  <div className="recommendation-card__meta">
                    {rec.author ? (
                      <a
                        className="recommendation-card__author"
                        href={authorUrl}
                        onClick={isPreview ? (e) => e.preventDefault() : undefined}
                      >
                        {rec.author.profile_image_url ? (
                          <img
                            className="recommendation-card__author-avatar"
                            src={fixImageUrl(rec.author.profile_image_url)}
                            alt={rec.author.display_name || rec.author.username}
                          />
                        ) : (
                          <div className="recommendation-card__author-avatar recommendation-card__author-avatar--placeholder">
                            {(rec.author.display_name || rec.author.username || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="recommendation-card__author-name">
                          {rec.author.display_name || rec.author.username}
                        </span>
                      </a>
                    ) : <span />}
                    {rec.created_at && (
                      <p className="recommendation-card__date">{formatDate(rec.created_at)}</p>
                    )}
                  </div>
                )}
                <div className="recommendation-card__header">
                  <div className="recommendation-card__artwork">
                    {rec.artwork_url ? (
                      <img
                        src={fixImageUrl(rec.artwork_url)}
                        alt={rec.song_name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="recommendation-card__artwork-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="recommendation-card__info">
                    <h3 className="recommendation-card__song">{rec.song_name}</h3>
                    {bandName && <p className="recommendation-card__artist">{bandName}</p>}
                  </div>
                </div>
                {reviewText && (
                  <p className="recommendation-card__review">{reviewText}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="profile-section__empty">
          No recommendations yet.
        </div>
      )}
    </div>
  );
}
