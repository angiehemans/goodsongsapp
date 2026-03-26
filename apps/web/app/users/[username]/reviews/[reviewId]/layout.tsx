import { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function getReviewData(reviewId: string) {
  try {
    const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; reviewId: string }>;
}): Promise<Metadata> {
  const { username, reviewId } = await params;
  const review = await getReviewData(reviewId);

  if (!review) {
    return {
      title: 'Review - Goodsongs',
      description: 'A song recommendation on Goodsongs',
    };
  }

  const title = `"${review.song_name}" by ${review.band_name} - Recommended by @${username}`;
  const description = review.review_text
    ? review.review_text.slice(0, 200)
    : `@${username} recommends "${review.song_name}" by ${review.band_name} on Goodsongs`;
  const url = `https://goodsongs.app/users/${username}/reviews/${reviewId}`;
  const imageUrl = review.artwork_url || null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Goodsongs',
      type: 'article',
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 500,
            height: 500,
            alt: `${review.song_name} by ${review.band_name}`,
          },
        ],
      }),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(imageUrl && {
        images: [imageUrl],
      }),
    },
  };
}

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
