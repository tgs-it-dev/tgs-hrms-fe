import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// Light theme palette
const lightPalette = {
  mode: 'light' as 'light' | 'dark',
  primary: {
    main: '#3083DC',
    light: '#5ba0f0',
    dark: '#2462a5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#464b8a',
    light: '#6b6fa8',
    dark: '#2f3345',
    contrastText: '#ffffff',
  },
  background: {
    default: '#f5f5f5',
    paper: '#ffffff',
  },
  text: {
    primary: '#000000',
    secondary: '#666666',
  },
  divider: '#e0e0e0',
  action: {
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
  },
  card: {
    background: '#ffffff',
    border: '#f0f0f0',
    text: '#000000',
  },
  table: {
    background: '#ffffff',
    headerBackground: '#fafafa',
    border: '#e0e0e0',
  },
  form: {
    background: '#ffffff',
    border: '#ccc',
    text: '#000000',
    label: '#000000',
  },
  button: {
    primary: '#3083DC',
    primaryHover: '#5ba0f0',
    secondary: '#464b8a',
    secondaryHover: '#6b6fa8',
  },
  status: {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  },
};

// Dark theme palette
const darkPalette = {
  mode: 'dark' as 'light' | 'dark',
  primary: {
    main: '#2462a5', // --primary-light-color
    light: '#5ba0f0',
    dark: '#1a4d7a',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#6b6fa8',
    light: '#8a8fc7',
    dark: '#4f527a',
    contrastText: '#ffffff',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  text: {
    primary: '#8f8f8f',
    secondary: '#8f8f8f',
  },
  divider: '#333333',
  action: {
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
  },
  card: {
    background: '#222222',
    border: '#333333',
    text: '#ffffff',
  },
  table: {
    background: '#333333',
    headerBackground: '#2a2a2a',
    border: '#555555',
  },
  form: {
    background: '#2e2e2e',
    border: '#555555',
    text: '#ffffff',
    label: '#cccccc',
  },
  button: {
    primary: '#2462a5', // --primary-light-color
    primaryHover: '#5ba0f0',
    secondary: '#6b6fa8',
    secondaryHover: '#8a8fc7',
  },
  status: {
    success: '#66bb6a',
    error: '#ef5350',
    warning: '#ffb74d',
    info: '#42a5f5',
  },
};

// Common options for both themes
const commonThemeOptions: ThemeOptions = {
  typography: {
    // Use global SF Pro Display font (loaded in App.css)
    fontFamily:
      '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid var(--mui-palette-card-border)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'var(--mui-palette-form-background)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'var(--mui-palette-form-background)',
            color: 'var(--mui-palette-form-text)',
            '& fieldset': {
              borderColor: 'var(--mui-palette-divider)',
            },
            '&:hover fieldset': {
              borderColor: 'var(--mui-palette-primary-main)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'var(--mui-palette-primary-main)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'var(--mui-palette-form-label)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          backgroundColor: 'var(--mui-palette-form-background)',
          color: 'var(--mui-palette-form-text)',
        },
        icon: {
          color: 'var(--mui-palette-form-text)',
        },
        outlined: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--mui-palette-divider)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--mui-palette-primary-main)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--mui-palette-primary-main)',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            backgroundColor: 'var(--mui-palette-table-headerBackground)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'var(--mui-palette-table-border)',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--mui-palette-table-background)',
        },
      },
    },
  },
};

export const createAppTheme = (mode: 'light' | 'dark') => {
  const palette = mode === 'dark' ? darkPalette : lightPalette;

  return createTheme({
    ...commonThemeOptions,
    palette,
    components: {
      ...commonThemeOptions.components,

      // MuiPickersDay styleOverrides should be applied via ThemeProvider from @mui/x-date-pickers in your app entry point.

      // CSS Variables
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--mui-palette-divider': palette.divider,
            '--mui-palette-table-background': palette.table.background,
            '--mui-palette-table-headerBackground':
              palette.table.headerBackground,
            '--mui-palette-table-border': palette.table.border,
            '--mui-palette-card-background': palette.card.background,
            '--mui-palette-card-border': palette.card.border,
            '--mui-palette-card-text': palette.card.text,
            '--mui-palette-form-background': palette.form.background,
            '--mui-palette-form-border': palette.form.border,
            '--mui-palette-form-text': palette.form.text,
            '--mui-palette-form-label': palette.form.label,
            '--mui-palette-button-primary': palette.button.primary,
            '--mui-palette-button-primaryHover': palette.button.primaryHover,
            '--mui-palette-button-secondary': palette.button.secondary,
            '--mui-palette-button-secondaryHover':
              palette.button.secondaryHover,
            '--mui-palette-status-success': palette.status.success,
            '--mui-palette-status-error': palette.status.error,
            '--mui-palette-status-warning': palette.status.warning,
            '--mui-palette-status-info': palette.status.info,
            '--mui-palette-primary-main': palette.primary.main,
          },
          body: {
            color: palette.text.primary,
          },
          '.MuiTooltip-tooltip': {
            backgroundColor: '#c0bdbd !important',
            color: '#000000 !important',
          },
          '.MuiTooltip-arrow': {
            color: '#c0bdbd !important',
          },
        },
      },
      MuiDialog: {
        defaultProps: {
          fullWidth: true,
        },
        styleOverrides: {
          paper: {
            maxWidth: '900px',
            width: '92%',
            maxHeight: '85vh',
            // ensure on very large screens the dialog doesn't get too wide
            '@media (min-width:1200px)': {
              width: '900px',
            },
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '24px',
            overflowY: 'auto',
          },
        },
      },
    },
  });
};

export type AppTheme = ReturnType<typeof createAppTheme>;
export type AppPalette = typeof lightPalette | typeof darkPalette;

export const TASK_CARD_CONFIG = {
  TITLE_LIMIT: 20,
  DESCRIPTION_LIMIT: 40,
};

