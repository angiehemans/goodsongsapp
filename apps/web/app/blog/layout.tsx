'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { createTheme, MantineProvider } from '@mantine/core';
import styles from './layout.module.css';

// Create a dark theme for blog pages
const blogTheme = createTheme({
  primaryColor: 'grape',
});

export default function BlogLayout({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure dark mode attribute stays set
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.setAttribute('data-mantine-color-scheme', 'dark');
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.blogLayout}
      data-mantine-color-scheme="dark"
    >
      <MantineProvider theme={blogTheme} forceColorScheme="dark">
        {children}
      </MantineProvider>
    </div>
  );
}
