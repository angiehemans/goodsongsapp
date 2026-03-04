import { getGoogleFontsUrl } from '@/lib/site-builder/fonts';

interface ProfileHeadProps {
  headerFont: string;
  bodyFont: string;
}

export function ProfileHead({ headerFont, bodyFont }: ProfileHeadProps) {
  const fonts = [headerFont, bodyFont].filter(Boolean);
  const fontsUrl = getGoogleFontsUrl(fonts);

  return (
    <>
      {/* Preconnect to Google Fonts for faster loading */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* Preload the fonts stylesheet */}
      <link rel="preload" href={fontsUrl} as="style" />

      {/* Load the fonts */}
      <link rel="stylesheet" href={fontsUrl} />
    </>
  );
}

// For use in Next.js metadata
export function getProfileFontLinks(headerFont: string, bodyFont: string) {
  const fonts = [headerFont, bodyFont].filter(Boolean);
  const fontsUrl = getGoogleFontsUrl(fonts);

  return [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'stylesheet', href: fontsUrl },
  ];
}
