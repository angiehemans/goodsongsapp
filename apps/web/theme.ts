import { generateColors } from '@mantine/colors-generator';
import { Combobox, createTheme } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';

export const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'aesthet-nova, serif' },
  colors: {
    blue: generateColors('#0124B0'),
    grape: [
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
    ],
    grey: [
      '#F9F9FA',
      '#F6F5F6',
      '#ECEAED',
      '#DAD7DC',
      '#C2BCC5',
      '#968E9A',
      '#7A717D',
      '#514755',
      '#352C38',
      '#1B151D',
    ],
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
      styles: {
        input: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          backgroundColor: 'var(--mantine-color-grape-0)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
          '&[placeholder]': {
            color: 'var(--mantine-color-grape-4)',
          },
        },
        label: {
          color: 'var(--mantine-color-grape-4)',
        },
      },
    },
    PasswordInput: {
      styles: {
        input: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          backgroundColor: 'var(--mantine-color-grape-0)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
          '&[placeholder]': {
            color: 'var(--mantine-color-grape-4)',
          },
        },
        label: {
          color: 'var(--mantine-color-grape-4)',
        },
      },
    },
    Textarea: {
      styles: {
        input: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          backgroundColor: 'var(--mantine-color-grape-0)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
          '&[placeholder]': {
            color: 'var(--mantine-color-grape-4)',
          },
        },
        label: {
          color: 'var(--mantine-color-grape-4)',
        },
      },
    },
    MultiSelect: {
      styles: {
        input: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          backgroundColor: 'var(--mantine-color-grape-0)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
          '&[placeholder]': {
            color: 'var(--mantine-color-grape-4)',
          },
        },
        label: {
          color: 'var(--mantine-color-grape-4)',
        },
        dropdown: {
          backgroundColor: 'var(--mantine-color-grape-0)',
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
        },
        option: {
          color: 'var(--mantine-color-grape-8)',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-grape-2)',
          },
        },
        pill: {
          backgroundColor: 'var(--mantine-color-grape-2)',
          color: 'var(--mantine-color-grape-8)',
        },
      },
    },
    Combobox: {
      styles: {
        input: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          backgroundColor: 'var(--mantine-color-grape-0)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
          '&[placeholder]': {
            color: 'var(--mantine-color-grape-4)',
          },
        },
        label: {
          color: 'var(--mantine-color-grape-4)',
        },
        dropdown: {
          backgroundColor: 'var(--mantine-color-grape-0)',
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
        },
        option: {
          color: 'var(--mantine-color-grape-8)',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-grape-4)',
          },
        },
        pill: {
          backgroundColor: 'var(--mantine-color-grape-2)',
          color: 'var(--mantine-color-grape-8)',
        },
      },
    },
    DateTimePicker: {
      styles: {
        input: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          backgroundColor: 'var(--mantine-color-grape-0)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
          '&[placeholder]': {
            color: 'var(--mantine-color-grape-4)',
          },
        },
        label: {
          color: 'var(--mantine-color-grape-4)',
        },
        dropdown: {
          backgroundColor: 'var(--mantine-color-grape-0)',
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
        },
        option: {
          color: 'var(--mantine-color-grape-8)',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-grape-2)',
          },
        },
        pill: {
          backgroundColor: 'var(--mantine-color-grape-2)',
          color: 'var(--mantine-color-grape-8)',
        },
      },
    },
    Select: {
      styles: {
        input: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          backgroundColor: 'var(--mantine-color-grape-0)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
          '&[placeholder]': {
            color: 'var(--mantine-color-grape-4)',
          },
        },
        label: {
          color: 'var(--mantine-color-grape-4)',
        },
        dropdown: {
          backgroundColor: 'var(--mantine-color-grape-0)',
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
        },
        option: {
          color: 'var(--mantine-color-grape-8)',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-grape-2)',
          },
        },
        pill: {
          backgroundColor: 'var(--mantine-color-grape-2)',
          color: 'var(--mantine-color-grape-8)',
        },
      },
    },
    FileInput: {
      styles: {
        input: {
          borderWidth: '2px',
          borderColor: 'var(--mantine-color-grape-6)',
          backgroundColor: 'var(--mantine-color-grape-0)',
          fontFamily: 'aesthet-nova, sans-serif',
          color: 'var(--mantine-color-grape-8)',
          '&[placeholder]': {
            color: 'var(--mantine-color-grape-4)',
          },
        },
        label: {
          color: 'var(--mantine-color-grape-4)',
        },
      },
    },
    Button: {
      defaultProps: {
        style: {
          borderWidth: '2px',
          fontFamily: 'aesthet-nova, sans-serif',
        },
      },
    },
    Drawer: {
      styles: {
        header: {
          backgroundColor: 'var(--mantine-color-grape-2)',
          borderBottom: '2px solid var(--mantine-color-grape-4)',
          padding: 'var(--mantine-spacing-md)',
        },
        title: {
          fontFamily: 'aesthet-nova, serif',
          fontSize: 'var(--mantine-font-size-xl)',
          fontWeight: 600,
          color: 'var(--mantine-color-grape-9)',
        },
        close: {
          color: 'var(--mantine-color-grape-6)',
          '&:hover': {
            backgroundColor: 'var(--mantine-color-grape-3)',
          },
        },
        body: {
          backgroundColor: 'var(--mantine-color-grape-0)',
        },
        content: {
          backgroundColor: 'var(--mantine-color-grape-0)',
        },
      },
    },
  },
});
