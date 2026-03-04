import ReactMarkdown from 'react-markdown';
import { CustomTextContent, CustomTextData, CustomTextSettings, SectionProps } from '@/lib/site-builder/types';

type CustomTextSectionProps = SectionProps<CustomTextContent, CustomTextData, CustomTextSettings>;

// Allowed markdown elements for security
const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'a', 'br', 'ul', 'ol', 'li', 'h3', 'h4'];

export function CustomTextSection({ content, settings, isPreview }: CustomTextSectionProps) {
  const title = content.title;
  const body = content.body;
  const textAlign = settings?.text_align || 'left';

  if (!title && !body && !isPreview) {
    return null;
  }

  return (
    <div style={{ textAlign }}>
      {title && (
        <h2 className="profile-section__heading">{title}</h2>
      )}

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
          Add your custom content here.
        </div>
      )}
    </div>
  );
}
