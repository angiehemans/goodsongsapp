import { getGoogleFontsUrl } from '@/lib/site-builder/fonts';

/**
 * Server component that renders <link> tags for Google Fonts preloading.
 * Next.js hoists these to <head> automatically, so fonts start loading
 * during initial HTML parsing — eliminating the flash of unstyled text (FOUT).
 */
export function FontPreload({ fonts }: { fonts: string[] }) {
  const uniqueFonts = fonts.filter(Boolean);
  if (uniqueFonts.length === 0) return null;

  const fontsUrl = getGoogleFontsUrl(uniqueFonts);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preload" href={fontsUrl} as="style" />
      <link rel="stylesheet" href={fontsUrl} />
    </>
  );
}
