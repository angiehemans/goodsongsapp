import Link from 'next/link';
import { Logo } from '@/components/Logo';

interface ProfileFooterProps {
  isPreview?: boolean;
}

export function ProfileFooter({ isPreview = false }: ProfileFooterProps) {
  const content = (
    <span className="profile-footer__content">
      <span className="profile-footer__text">Powered by</span>
      <Logo size={16} />
      <span className="profile-footer__brand">GoodSongs</span>
    </span>
  );

  if (isPreview) {
    return <footer className="profile-footer">{content}</footer>;
  }

  return (
    <footer className="profile-footer">
      <Link
        href="https://goodsongs.app"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {content}
      </Link>
    </footer>
  );
}
