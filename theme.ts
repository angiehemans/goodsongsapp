'use client';

import { createTheme } from '@mantine/core';
import { generateColors } from '@mantine/colors-generator';

export const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Aesthet Nova, serif' },
  colors: {
            'blue': generateColors('#0124B0'),
            'grape': [
    '#FAF5FD', // 0 - lightest
    '#F8F0FC', // 1
    '#F1E9F5', // 2
    '#DBC8E5', // 3
    '#C0A3CD', // 4
    '#AE8BBC', // 5
    '#8C5B9E', // 6
    '#723886', // 7
    '#580D6C', // 8
    '#420154'  // 9 - darkest
  ]
            
          },
  primaryColor: 'grape',
  primaryShade: 9,
  other: {
    borderWidth: '2px',
  },
 components: {
    Title: {
      defaultProps: {
        c: 'goodsongs.6', // This sets all titles to use your blue color
      },
    },
    AppShell: {
      styles: {
        main: {
          backgroundColor: 'var(--mantine-color-grape-0)',
        },
      },
    },
    Paper: {
      defaultProps: {
        withBorder: true,
      },
      styles: {
        root: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-3)',
          backgroundColor: 'var(--mantine-color-grape-1)',
        },
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
      },
      styles: {
        root: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-3)',
          backgroundColor: 'var(--mantine-color-grape-1)',
        },
      },
    },
    TextInput: {
      defaultProps: {
        style: { '--input-bd-width': '2px'},
      
      },
    },
    PasswordInput: {
      defaultProps: {
        style: { '--input-bd-width': '2px' },
      },
    },
    Button: {
      defaultProps: {
        style: { 
          borderWidth: '2px',
          fontFamily: 'Aesthet Nova, sans-serif',
        },
      },
      
    },
  },
});
