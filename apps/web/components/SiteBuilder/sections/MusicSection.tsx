import { MusicContent, MusicData, MusicSettings, SectionProps } from '@/lib/site-builder/types';

type MusicSectionProps = SectionProps<MusicContent, MusicData, MusicSettings>;

export function MusicSection({ content, data, settings, isPreview }: MusicSectionProps) {
  const bandcampEmbed = data?.bandcamp_embed;
  const tracks = data?.tracks || [];
  const displayLimit = settings?.display_limit || 6;
  const hasMusic = bandcampEmbed || tracks.length > 0;

  if (!hasMusic && !isPreview) {
    return null;
  }

  return (
    <div>
      <h2 className="profile-section__heading">Music</h2>

      {bandcampEmbed ? (
        <div
          dangerouslySetInnerHTML={{ __html: bandcampEmbed }}
          style={{ width: '100%', maxWidth: '700px' }}
        />
      ) : tracks.length > 0 ? (
        <div className="profile-stack profile-stack--gap-md">
          {tracks.slice(0, displayLimit).map((track) => (
            <div key={track.id} className="profile-track">
              <span className="profile-track__name">{track.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="profile-section__empty">
          Add your music to see it here.
        </div>
      )}
    </div>
  );
}
