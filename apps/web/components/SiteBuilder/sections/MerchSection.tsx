import { MerchContent, MerchData, MerchSettings, SectionProps } from '@/lib/site-builder/types';

type MerchSectionProps = SectionProps<MerchContent, MerchData, MerchSettings>;

// Simple shopping bag icon
function ShoppingBagIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

// Simple external link icon
function ExternalLinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export function MerchSection({ content, settings, isPreview }: MerchSectionProps) {
  const heading = content.heading || 'Merch';
  const storeUrl = settings?.store_url;

  return (
    <div className="profile-centered">
      <div className="profile-centered__icon">
        <ShoppingBagIcon />
      </div>

      <h2 className="profile-section__heading" style={{ marginBottom: 0 }}>
        {heading}
      </h2>

      {storeUrl ? (
        <a
          href={isPreview ? '#' : storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="profile-btn profile-btn--primary profile-btn--lg"
          onClick={isPreview ? (e) => e.preventDefault() : undefined}
        >
          Visit Store
          <ExternalLinkIcon />
        </a>
      ) : (
        <div className="profile-section__empty">
          Add a link to your merch store.
        </div>
      )}
    </div>
  );
}
