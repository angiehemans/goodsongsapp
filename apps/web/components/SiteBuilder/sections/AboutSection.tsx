import ReactMarkdown from 'react-markdown';
import { AboutContent, AboutData, AboutSettings, SectionProps } from '@/lib/site-builder/types';

type AboutSectionProps = SectionProps<AboutContent, AboutData, AboutSettings>;

// Allowed markdown elements for security
const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'a', 'br', 'ul', 'ol', 'li', 'h3', 'h4', 'blockquote'];

export function AboutSection({ content, data, settings, isPreview }: AboutSectionProps) {
  // Use content bio or fall back to profile about_me
  const body = content.bio || data?.about_me;
  const heading = content.heading || 'About';
  const titleAlign = settings?.title_align || 'left';
  const gap = settings?.gap || 'md';

  if (!body && !isPreview) {
    return null;
  }

  const sectionClasses = [
    'about-section',
    `about-section--title-${titleAlign}`,
    `about-section--gap-${gap}`,
  ].join(' ');

  return (
    <div className={sectionClasses}>
      <h2 className="profile-section__heading">{heading}</h2>

      {body ? (
        <div className="profile-markdown">
          <ReactMarkdown
            allowedElements={ALLOWED_ELEMENTS}
            unwrapDisallowed
            components={{
              a: ({ href, children }) => (
                <a
                  href={isPreview ? '#' : href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={isPreview ? (e) => e.preventDefault() : undefined}
                >
                  {children}
                </a>
              ),
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="profile-section__empty">
          Tell visitors about yourself.
        </div>
      )}
    </div>
  );
}
