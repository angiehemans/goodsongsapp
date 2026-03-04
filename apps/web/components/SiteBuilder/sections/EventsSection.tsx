import Link from 'next/link';
import { EventsContent, EventsData, EventsSettings, SectionProps } from '@/lib/site-builder/types';
import { fixImageUrl } from '@/lib/utils';

type EventsSectionProps = SectionProps<EventsContent, EventsData, EventsSettings>;

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
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

// Simple map pin icon
function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function EventsSection({ content, data, settings, isPreview }: EventsSectionProps) {
  const events = data?.events || [];
  const displayLimit = settings?.display_limit || 6;
  const showPastEvents = settings?.show_past_events ?? false;

  // Filter events based on settings
  const now = new Date();
  const filteredEvents = showPastEvents
    ? events
    : events.filter((event) => new Date(event.event_date) >= now);

  const displayedEvents = filteredEvents.slice(0, displayLimit);

  if (displayedEvents.length === 0 && !isPreview) {
    return null;
  }

  return (
    <div>
      <h2 className="profile-section__heading">Events</h2>

      {displayedEvents.length > 0 ? (
        <div className="profile-grid profile-grid--3">
          {displayedEvents.map((event) => {
            const isPast = new Date(event.event_date) < now;
            const cardClasses = `profile-card${isPast ? ' profile-card--faded' : ''}`;

            const cardContent = (
              <>
                {event.image_url && (
                  <img
                    src={fixImageUrl(event.image_url)}
                    alt={event.name}
                    className="profile-card__image"
                  />
                )}
                <div className="profile-card__body">
                  <h3 className="profile-card__title">{event.name}</h3>
                  <div className="profile-card__meta">
                    <CalendarIcon />
                    <span>{formatEventDate(event.event_date)}</span>
                  </div>
                  {event.venue && (
                    <div className="profile-card__meta">
                      <MapPinIcon />
                      <span className="profile-text--clamp-1">
                        {event.venue.name}
                        {event.venue.city && `, ${event.venue.city}`}
                      </span>
                    </div>
                  )}
                </div>
              </>
            );

            if (isPreview) {
              return (
                <div key={event.id} className={cardClasses}>
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className={`${cardClasses} profile-card--link`}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="profile-section__empty">
          No upcoming events.
        </div>
      )}
    </div>
  );
}
