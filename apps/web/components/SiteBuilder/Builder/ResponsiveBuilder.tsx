'use client';

import { ReactNode } from 'react';
import { BuilderLayout } from './BuilderLayout';
import { MobileBuilderLayout } from './MobileBuilderLayout';

interface ResponsiveBuilderProps {
  editor: ReactNode;
  preview: ReactNode;
}

/**
 * Responsive builder wrapper that renders both desktop and mobile layouts.
 * CSS media queries handle showing/hiding the appropriate layout.
 */
export function ResponsiveBuilder({ editor, preview }: ResponsiveBuilderProps) {
  return (
    <>
      {/* Desktop layout - hidden on mobile via CSS */}
      <BuilderLayout editor={editor} preview={preview} />

      {/* Mobile layout - hidden on desktop via CSS */}
      <MobileBuilderLayout editor={editor} preview={preview} />
    </>
  );
}
