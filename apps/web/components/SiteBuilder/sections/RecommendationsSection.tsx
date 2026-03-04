import { RecommendationsContent, RecommendationsData, RecommendationsSettings, SectionProps } from '@/lib/site-builder/types';
import { fixImageUrl } from '@/lib/utils';

type RecommendationsSectionProps = SectionProps<RecommendationsContent, RecommendationsData, RecommendationsSettings>;

export function RecommendationsSection({ content, data, settings, isPreview }: RecommendationsSectionProps) {
  const recommendations = data?.recommendations || [];
  const displayLimit = settings?.display_limit || 6;
  const displayedRecs = recommendations.slice(0, displayLimit);

  if (displayedRecs.length === 0 && !isPreview) {
    return null;
  }

  return (
    <div>
      <h2 className="profile-section__heading">Recommendations</h2>

      {displayedRecs.length > 0 ? (
        <div className="profile-grid profile-grid--4">
          {displayedRecs.map((rec) => (
            <div key={rec.id} className="profile-card">
              <div className="profile-card__image--square">
                <img
                  src={fixImageUrl(rec.artwork_url) || '/placeholder-album.png'}
                  alt={rec.song_name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-album.png';
                  }}
                />
              </div>
              <div className="profile-card__body">
                <h3 className="profile-card__title profile-text--clamp-1">{rec.song_name}</h3>
                <p className="profile-card__subtitle">{rec.band_name}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="profile-section__empty">
          No recommendations yet.
        </div>
      )}
    </div>
  );
}
