import { generateColors } from '@mantine/colors-generator';
import { createTheme, CSSVariablesResolver, MantineColorsTuple } from '@mantine/core';

// =============================================================================
// PRIMITIVE TOKENS - Raw color values
// =============================================================================

// Brand purple palette (grape)
const grape: MantineColorsTuple = [
  '#FAF5FD', // 0 - lightest
  '#F8F0FC', // 1
  '#F1E9F5', // 2
  '#DBC8E5', // 3
  '#C0A3CD', // 4
  '#AE8BBC', // 5
  '#8C5B9E', // 6
  '#723886', // 7
  '#580D6C', // 8
  '#420154', // 9 - darkest
];

// Neutral gray palette (for dark mode)
const gray: MantineColorsTuple = [
  '#FAFAFA', // 50
  '#F2F2F2', // 100
  '#E6E6E6', // 200
  '#CCCCCC', // 300
  '#B3B3B3', // 400
  '#808080', // 500
  '#4D4D4D', // 600
  '#333333', // 700
  '#1A1A1A', // 800
  '#141414', // 900
];

// =============================================================================
// SEMANTIC TOKENS - CSS Variables Resolver
// Maps semantic meaning to primitive tokens for light/dark modes
// =============================================================================

export const cssVariablesResolver: CSSVariablesResolver = (theme) => ({
  variables: {
    // These are shared between light and dark
    '--gs-border-width': '2px',
    '--gs-font-display': 'Thecoa, serif',
    '--gs-font-body': 'Inter, sans-serif',
  },
  light: {
    // Background colors
    '--gs-bg-app': theme.colors.grape[0],
    '--gs-bg-surface': theme.colors.grape[1],
    '--gs-bg-surface-alt': theme.colors.grape[2],
    '--gs-bg-surface-hover': theme.colors.grape[2],
    '--gs-bg-elevated': theme.colors.grape[0],
    '--gs-bg-input': theme.colors.grape[0],
    '--gs-bg-pill': theme.colors.grape[2],
    '--gs-bg-accent': theme.colors.grape[6],
    '--gs-bg-placeholder': theme.colors.grape[3],

    // Text colors
    '--gs-text-primary': theme.colors.grape[9],
    '--gs-text-secondary': theme.colors.grape[8],
    '--gs-text-tertiary': theme.colors.grape[6],
    '--gs-text-muted': theme.colors.grape[6],
    '--gs-text-placeholder': theme.colors.grape[4],
    '--gs-text-inverse': theme.colors.grape[0],
    '--gs-text-label': theme.colors.grape[4],
    '--gs-text-tag': theme.colors.grape[4],
    '--gs-text-accent': theme.colors.grape[7],

    // Border colors
    '--gs-border-default': theme.colors.grape[3],
    '--gs-border-strong': theme.colors.grape[6],
    '--gs-border-subtle': theme.colors.grape[2],
    '--gs-border-accent': theme.colors.grape[5],
    '--gs-border-dotted': theme.colors.grape[2],

    // Interactive/Navigation colors
    '--gs-interactive-primary': theme.colors.grape[9],
    '--gs-interactive-hover': theme.colors.grape[8],
    '--gs-interactive-muted': theme.colors.grape[6],
    '--gs-nav-text': theme.colors.grape[6],
    '--gs-nav-text-active': theme.colors.grape[9],
    '--gs-nav-bg-active': theme.colors.grape[2],
    '--gs-nav-bg-hover': theme.colors.grape[1],

    // Component-specific
    '--gs-drawer-header-bg': theme.colors.grape[2],
    '--gs-drawer-header-border': theme.colors.grape[4],
    '--gs-header-bg': theme.colors.grape[0],
    '--gs-header-border': theme.colors.grape[3],
    '--gs-notification-unread': theme.colors.grape[2],
    '--gs-notification-unread-hover': theme.colors.grape[3],

    // Gradient stops for social share images (keep light theme colors)
    '--gs-gradient-start': theme.colors.grape[1],
    '--gs-gradient-mid': theme.colors.grape[2],
    '--gs-gradient-end': theme.colors.grape[3],

    // Headings - blue in light mode
    '--gs-text-heading': theme.colors.blue[9],
    '--gs-text-heading-light': theme.colors.blue[3],

    // Logo color
    '--gs-logo-color': theme.colors.blue[9],

    // Notice/info boxes
    '--gs-bg-notice': theme.colors.blue[0],
    '--gs-text-notice': theme.colors.blue[9],

    // Primary button
    '--gs-btn-primary-bg': theme.colors.grape[9],
    '--gs-btn-primary-text': theme.colors.grape[0],
    '--gs-btn-primary-bg-hover': theme.colors.grape[8],
  },
  dark: {
    // Background colors - using gray palette
    '--gs-bg-app': gray[9], // #212121 - darkest background
    '--gs-bg-surface': gray[8], // #424242 - card/surface background
    '--gs-bg-surface-alt': gray[8], // #616161 - alternate surface
    '--gs-bg-surface-hover': gray[7], // #616161 - hover state
    '--gs-bg-elevated': gray[8], // #424242 - elevated surfaces
    '--gs-bg-input': gray[9], // #212121 - input background
    '--gs-bg-pill': gray[7], // #616161 - pill/tag background
    '--gs-bg-accent': gray[7], // accent background - gray in dark mode
    '--gs-bg-placeholder': gray[7], // #616161 - placeholder backgrounds

    // Text colors - light text on dark background
    '--gs-text-primary': gray[0], // #FAFAFA - primary text
    '--gs-text-secondary': gray[1], // #F5F5F5 - secondary text
    '--gs-text-tertiary': gray[5], // #E0E0E0 - tertiary text
    '--gs-text-muted': gray[5], // #BDBDBD - muted text
    '--gs-text-placeholder': gray[5], // #9E9E9E - placeholder
    '--gs-text-inverse': gray[9], // #212121 - inverse (for light buttons)
    '--gs-text-label': gray[4], // #BDBDBD - form labels
    '--gs-text-tag': gray[4], // #BDBDBD - tag text
    '--gs-text-accent': gray[2], // #E6E6E6 - accent text in dark mode

    // Border colors
    '--gs-border-default': gray[7], // #616161 - default borders
    '--gs-border-strong': gray[5], // #9E9E9E - strong/focus borders
    '--gs-border-subtle': gray[8], // #424242 - subtle borders
    '--gs-border-accent': gray[6], // #757575 - accent borders
    '--gs-border-dotted': gray[7], // #616161 - dotted borders

    // Interactive/Navigation colors
    '--gs-interactive-primary': gray[6],
    '--gs-interactive-hover': gray[5],
    '--gs-interactive-muted': gray[7],
    '--gs-nav-text': gray[4], // #BDBDBD
    '--gs-nav-text-active': gray[0], // #FAFAFA
    '--gs-nav-bg-active': gray[7], // #616161
    '--gs-nav-bg-hover': gray[8], // #424242

    // Component-specific
    '--gs-drawer-header-bg': gray[8],
    '--gs-drawer-header-border': gray[6],
    '--gs-header-bg': gray[9],
    '--gs-header-border': gray[7],
    '--gs-notification-unread': gray[7],
    '--gs-notification-unread-hover': gray[6],

    // Gradient stops for social share images (keep light theme for exports)
    '--gs-gradient-start': theme.colors.grape[1],
    '--gs-gradient-mid': theme.colors.grape[2],
    '--gs-gradient-end': theme.colors.grape[3],

    // Headings - lightest gray in dark mode
    '--gs-text-heading': gray[0], // #FAFAFA
    '--gs-text-heading-light': gray[3], // #CCCCCC

    // Logo color
    '--gs-logo-color': gray[2], // #E6E6E6

    // Notice/info boxes - gray in dark mode
    '--gs-bg-notice': gray[8], // #1A1A1A
    '--gs-text-notice': gray[1], // #F2F2F2

    // Primary button - white on dark background
    '--gs-btn-primary-bg': gray[0], // #FAFAFA - white button
    '--gs-btn-primary-text': gray[9], // #000000 - dark text
    '--gs-btn-primary-bg-hover': gray[2], // #E6E6E6 - slightly darker on hover
  },
});

// =============================================================================
// THEME CONFIGURATION
// =============================================================================

export const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Thecoa, serif' },
  colors: {
    blue: generateColors('#0124B0'),
    grape,
    gray,
  },
  primaryColor: 'grape',
  primaryShade: { light: 9, dark: 6 }, // Different shades for light/dark
  other: {
    borderWidth: '2px',
  },
  components: {
    Title: {
      styles: {
        root: {
          color: 'var(--gs-text-primary)',
        },
      },
    },
    AppShell: {
      styles: {
        main: {
          backgroundColor: 'var(--gs-bg-app)',
        },
        header: {
          borderBottomWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-default)',
        },
        navbar: {
          borderRightWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-default)',
        },
        aside: {
          borderLeftWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-default)',
        },
        footer: {
          borderTopWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-default)',
        },
      },
    },
    Paper: {
      defaultProps: {
        withBorder: true,
      },
      styles: {
        root: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-default)',
          backgroundColor: 'var(--gs-bg-surface)',
        },
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
      },
      styles: {
        root: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-default)',
          backgroundColor: 'var(--gs-bg-surface)',
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          backgroundColor: 'var(--gs-bg-input)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
          paddingTop: '2px',
          '&::placeholder': {
            color: 'var(--gs-text-placeholder)',
          },
        },
        label: {
          color: 'var(--gs-text-label)',
        },
      },
    },
    PasswordInput: {
      styles: {
        input: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          backgroundColor: 'var(--gs-bg-input)',
          fontFamily: 'var(--gs-font-display)',
          paddingTop: '2px',
          color: 'var(--gs-text-secondary)',
          '&::placeholder': {
            color: 'var(--gs-text-placeholder)',
          },
        },
        label: {
          color: 'var(--gs-text-label)',
        },
      },
    },
    Textarea: {
      styles: {
        input: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          backgroundColor: 'var(--gs-bg-input)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
          '&::placeholder': {
            color: 'var(--gs-text-placeholder)',
          },
        },
        label: {
          color: 'var(--gs-text-label)',
        },
      },
    },
    MultiSelect: {
      styles: {
        input: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          backgroundColor: 'var(--gs-bg-input)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
          '&::placeholder': {
            color: 'var(--gs-text-placeholder)',
          },
        },
        label: {
          color: 'var(--gs-text-label)',
        },
        dropdown: {
          backgroundColor: 'var(--gs-bg-elevated)',
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
        },
        option: {
          color: 'var(--gs-text-secondary)',
          '&:hover': {
            backgroundColor: 'var(--gs-bg-surface-hover)',
          },
        },
        pill: {
          backgroundColor: 'var(--gs-bg-pill)',
          color: 'var(--gs-text-secondary)',
        },
      },
    },
    Combobox: {
      styles: {
        input: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          backgroundColor: 'var(--gs-bg-input)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
          '&::placeholder': {
            color: 'var(--gs-text-placeholder)',
          },
        },
        label: {
          color: 'var(--gs-text-label)',
        },
        dropdown: {
          backgroundColor: 'var(--gs-bg-elevated)',
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
        },
        option: {
          color: 'var(--gs-text-secondary)',
          '&:hover': {
            backgroundColor: 'var(--gs-bg-surface-hover)',
          },
        },
        pill: {
          backgroundColor: 'var(--gs-bg-pill)',
          color: 'var(--gs-text-secondary)',
        },
      },
    },
    DateTimePicker: {
      styles: {
        input: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          backgroundColor: 'var(--gs-bg-input)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
          '&::placeholder': {
            color: 'var(--gs-text-placeholder)',
          },
        },
        label: {
          color: 'var(--gs-text-label)',
        },
        dropdown: {
          backgroundColor: 'var(--gs-bg-elevated)',
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
        },
        option: {
          color: 'var(--gs-text-secondary)',
          '&:hover': {
            backgroundColor: 'var(--gs-bg-surface-hover)',
          },
        },
        pill: {
          backgroundColor: 'var(--gs-bg-pill)',
          color: 'var(--gs-text-secondary)',
        },
      },
    },
    Select: {
      styles: {
        input: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          backgroundColor: 'var(--gs-bg-input)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
          paddingTop: '2px',
          '&::placeholder': {
            color: 'var(--gs-text-placeholder)',
          },
        },
        label: {
          color: 'var(--gs-text-label)',
        },
        dropdown: {
          backgroundColor: 'var(--gs-bg-elevated)',
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
        },
        option: {
          color: 'var(--gs-text-secondary)',
          '&:hover': {
            backgroundColor: 'var(--gs-bg-surface-hover)',
          },
        },
        pill: {
          backgroundColor: 'var(--gs-bg-pill)',
          color: 'var(--gs-text-secondary)',
        },
      },
    },
    FileInput: {
      styles: {
        input: {
          borderWidth: 'var(--gs-border-width)',
          borderColor: 'var(--gs-border-strong)',
          backgroundColor: 'var(--gs-bg-input)',
          fontFamily: 'var(--gs-font-display)',
          color: 'var(--gs-text-secondary)',
          '&::placeholder': {
            color: 'var(--gs-text-placeholder)',
          },
        },
        label: {
          color: 'var(--gs-text-label)',
        },
      },
    },
    Button: {
      defaultProps: {
        style: {
          borderWidth: 'var(--gs-border-width)',
          fontFamily: 'var(--gs-font-display)',
          fontWeight: 400,
        },
      },
      styles: {
        label: {
          transform: 'translateY(2px)',
        },
      },
    },
    Drawer: {
      styles: {
        header: {
          backgroundColor: 'var(--gs-drawer-header-bg)',
          borderBottom: '2px solid var(--gs-drawer-header-border)',
          padding: 'var(--mantine-spacing-md)',
        },
        title: {
          fontFamily: 'var(--gs-font-display)',
          fontSize: 'var(--mantine-font-size-xl)',
          fontWeight: 600,
          color: 'var(--gs-text-primary)',
        },
        close: {
          color: 'var(--gs-text-muted)',
          '&:hover': {
            backgroundColor: 'var(--gs-bg-surface-hover)',
          },
        },
        body: {
          backgroundColor: 'var(--gs-bg-app)',
        },
        content: {
          backgroundColor: 'var(--gs-bg-app)',
        },
      },
    },
    Modal: {
      styles: {
        header: {
          backgroundColor: 'var(--gs-bg-surface)',
        },
        title: {
          color: 'var(--gs-text-primary)',
        },
        body: {
          backgroundColor: 'var(--gs-bg-surface)',
        },
        content: {
          backgroundColor: 'var(--gs-bg-surface)',
        },
      },
    },
    Text: {
      styles: {
        root: {
          color: 'var(--gs-text-secondary)',
        },
      },
    },
    RichTextEditor: {
      styles: {
        root: {
          borderWidth: 0,
        },
        toolbar: {
          borderBottomWidth: 0,

          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        },
        content: {
          backgroundColor: 'var(--gs-bg-app)',
        },
      },
    },
    Table: {
      styles: {
        table: {
          borderWidth: 'var(--gs-border-width)',
        },
        th: {
          borderBottomWidth: 'var(--gs-border-width)',
        },
        td: {
          borderBottomWidth: 'var(--gs-border-width)',
        },
      },
    },
  },
});
