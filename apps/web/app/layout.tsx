import type { Metadata } from 'next';

import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/tiptap/styles.css';
import './globals.css';

import { LazyMobileNav } from '@/components/UserSidebar/LazyMobileNav';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider } from '@/hooks/useAuth';
import { Providers } from './providers';
import classes from './styles.module.css';

export const metadata: Metadata = {
  title: 'Goodsongs',
  description:
    'Your music discovery platform - Discover and share amazing music with the community',
  icons: {
    icon: [
      {
        url: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon.png',
    apple: [
      {
        url: '/favicon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Goodsongs',
    description:
      'Your music discovery platform - Discover and share amazing music with the community',
    url: 'https://www.goodsongs.app',
    siteName: 'Goodsongs',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Goodsongs',
    description:
      'Your music discovery platform - Discover and share amazing music with the community',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={classes.background}>
        <Providers>
          <AuthProvider>
            <NotificationProvider>
              {children}
              <LazyMobileNav />
            </NotificationProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
