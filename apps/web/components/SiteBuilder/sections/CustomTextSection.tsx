import ReactMarkdown from 'react-markdown';
import { CustomTextContent, CustomTextData, CustomTextSettings, SectionProps } from '@/lib/site-builder/types';
import { fixImageUrl } from '@/lib/utils';

type CustomTextSectionProps = SectionProps<CustomTextContent, CustomTextData, CustomTextSettings>;

// Allowed markdown elements for security
const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'a', 'br', 'ul', 'ol', 'li', 'h3', 'h4'];

export function CustomTextSection({ content, settings, isPreview }: CustomTextSectionProps) {
  const title = content.title;
  const body = content.body;
  const textAlign = settings?.text_align || 'left';
  const layout = settings?.layout || 'row';
  const imageUrl = content.image_url ? fixImageUrl(content.image_url) : null;
  const buttonText = content.button_text;
  const buttonUrl = content.button_url;

  if (!title && !body && !imageUrl && !buttonText && !isPreview) {
    return null;
  }

  const imageElement = imageUrl ? (
    <div className={`custom-section__image custom-section__image--${layout}`}>
      <img
        src={imageUrl}
        alt={title || 'Section image'}
      />
    </div>
  ) : null;

  const textContent = (
    <div className="custom-section__text" style={{ textAlign }}>
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
      ) : isPreview && !imageUrl && !buttonText ? (
        <div className="profile-section__empty">
          Add your custom content here.
        </div>
      ) : null}

      {buttonText && buttonUrl && (
        <div style={{ marginTop: '1rem' }}>
          <a
            href={isPreview ? '#' : buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={isPreview ? (e) => e.preventDefault() : undefined}
            className="profile-action-button"
          >
            {buttonText}
          </a>
        </div>
      )}
    </div>
  );

  if (layout === 'row' && imageUrl) {
    return (
      <div className="custom-section custom-section--row">
        {textContent}
        {imageElement}
      </div>
    );
  }

  if (layout === 'row-reverse' && imageUrl) {
    return (
      <div className="custom-section custom-section--row">
        {imageElement}
        {textContent}
      </div>
    );
  }

  return (
    <div className="custom-section custom-section--stack">
      {imageElement}
      {textContent}
    </div>
  );
}
