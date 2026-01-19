import Link from 'next/link';
import { Avatar } from '@mantine/core';
import { fixImageUrl } from '@/lib/utils';
import styles from './ProfilePhoto.module.css';

interface ProfilePhotoProps {
  /** URL of the profile image */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Size of the photo in pixels */
  size?: number;
  /** Fallback letter to show in avatar if no image */
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
  const photoContent = src ? (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <div className={styles.blend}>
        <img src={fixImageUrl(src)} alt={alt} className={styles.photo} />
      </div>
    </div>
  ) : (
    <Avatar size={size} color="grape.6">
      {fallback.charAt(0).toUpperCase()}
    </Avatar>
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
