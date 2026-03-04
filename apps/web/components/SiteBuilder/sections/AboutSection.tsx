import ReactMarkdown from 'react-markdown';
import { AboutContent, AboutData, SectionProps } from '@/lib/site-builder/types';

type AboutSectionProps = SectionProps<AboutContent, AboutData>;

// Allowed markdown elements for security
const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'a', 'br', 'ul', 'ol', 'li'];

export function AboutSection({ content, data, isPreview }: AboutSectionProps) {
  // Use content bio or fall back to profile about_me
  const body = content.bio || data?.about_me;

  if (!body && !isPreview) {
    return null;
  }

  return (
    <div>
      <h2 className="profile-section__heading">About</h2>

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
