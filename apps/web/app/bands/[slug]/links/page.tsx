import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBandLinkPage } from '@/lib/site-builder/api';
import { LinkPage } from '@/components/SiteBuilder/LinkPage';
import { FontPreload } from '@/components/SiteBuilder/FontPreload';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBandLinkPage(slug);

  if (!data) {
    return { title: 'Not Found' };
  }

  return {
    title: `${data.data.profile.display_name} - Links`,
    description: data.data.page_settings.description || `Links for ${data.data.profile.display_name}`,
    alternates: {
      canonical: `https://${slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'goodsongs.app'}/links`,
    },
    openGraph: {
      title: `${data.data.profile.display_name} - Links`,
      description: data.data.page_settings.description || `Links for ${data.data.profile.display_name}`,
      ...(data.data.profile.profile_image_url && {
        images: [{ url: data.data.profile.profile_image_url }],
      }),
    },
  };
}

export default async function BandLinksPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getBandLinkPage(slug);

  if (!data) notFound();

  return (
    <>
      {data.data.theme && (
        <FontPreload fonts={[data.data.theme.header_font_name || data.data.theme.header_font, data.data.theme.body_font_name || data.data.theme.body_font]} customFontUrls={data.data.theme.custom_font_urls} />
      )}
      <LinkPage data={data.data} />
    </>
  );
}
