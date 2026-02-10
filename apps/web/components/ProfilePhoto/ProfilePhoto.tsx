import Link from 'next/link';
import { Center } from '@mantine/core';
import { fixImageUrl } from '@/lib/utils';
import styles from './ProfilePhoto.module.css';

interface ProfilePhotoProps {
  /** URL of the profile image */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Size of the photo in pixels */
  size?: number;
  /** Fallback letter to show in avatar if no image (deprecated, logo is now used) */
  fallback?: string;
  /** Optional link to wrap the photo */
  href?: string;
}

export function ProfilePhoto({
  src,
  alt = 'Profile photo',
  size = 72,
  fallback = '?',
  href,
}: ProfilePhotoProps) {
  // Calculate logo size - roughly 60% of container size
  const logoSize = Math.round(size * 0.6);

  const photoContent = src ? (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <div className={styles.blend}>
        <img src={fixImageUrl(src)} alt={alt} className={styles.photo} />
      </div>
    </div>
  ) : (
    <Center
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--mantine-color-grape-1)',
        border: '2px solid var(--mantine-color-grape-2)',
      }}
    >
      <img
        src="/logo-grape.svg"
        alt="Good Songs"
        width={logoSize}
        height={logoSize}
        style={{ opacity: 0.8 }}
      />
    </Center>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {photoContent}
      </Link>
    );
  }

  return photoContent;
}
