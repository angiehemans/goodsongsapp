import type { Metadata } from "next";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import classes from './styles.module.css'
import { Providers } from './providers';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: "Goodsongs",
  description: "Your music discovery platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={classes.background}>
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
