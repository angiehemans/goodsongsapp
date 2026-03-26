import { getGoogleFontsUrl } from '@/lib/site-builder/fonts';

/**
 * Server component that renders <link> tags for Google Fonts preloading.
 * Next.js hoists these to <head> automatically, so fonts start loading
 * during initial HTML parsing — eliminating the flash of unstyled text (FOUT).
 *
 * `fonts` — font names (from approved list or resolved names)
 * `customFontUrls` — full Google Fonts CSS URLs for custom fonts (from backend)
 */
export function FontPreload({ fonts, customFontUrls }: { fonts: string[]; customFontUrls?: string[] }) {
  // Filter out any URLs from the font names list (those go in customFontUrls)
  const approvedFonts = fonts.filter((f) => f && !f.startsWith('https://'));

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {approvedFonts.length > 0 && (
        <>
          <link rel="preload" href={getGoogleFontsUrl(approvedFonts)} as="style" />
          <link rel="stylesheet" href={getGoogleFontsUrl(approvedFonts)} />
        </>
      )}

      {customFontUrls?.map((url, i) => (
        <link key={i} rel="stylesheet" href={url} />
      ))}
    </>
  );
}
