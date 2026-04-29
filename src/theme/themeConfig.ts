import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { colorTokens as t } from './tokens';

// ── Palettes ──────────────────────────────────────────────────────────────────

const lightPalette = {
  mode: 'light' as const,
  primary: {
    main: t.brand.primary,
    light: t.brand.primaryLight,
    dark: t.brand.primaryDark,
    contrastText: t.neutral.white,
  },
  secondary: {
    main: t.brand.secondary,
    light: t.brand.secondaryLight,
    dark: t.brand.secondaryDark,
    contrastText: t.neutral.white,
  },
  background: {
    default: t.surface.light.bgDefault,
    paper: t.surface.light.bgPaper,
  },
  text: {
    primary: t.surface.light.textPrimary,
    secondary: t.surface.light.textSecondary,
  },
  divider: t.surface.light.divider,
  success: { main: t.semantic.successLight },
  error: { main: t.semantic.errorLight },
  warning: { main: t.semantic.warningLight, contrastText: t.neutral.white },
  info: { main: t.semantic.infoLight },
  action: {
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
  },
};

const darkPalette = {
  mode: 'dark' as const,
  primary: {
    main: t.brand.primary,
    light: t.brand.primaryMedium, // lighter variant for dark-bg contrast
    dark: t.brand.primaryDark,
    contrastText: t.neutral.white,
  },
  secondary: {
    main: t.brand.secondary,
    light: t.brand.secondaryLight,
    dark: t.brand.secondaryDark,
    contrastText: t.neutral.white,
  },
  background: {
    default: t.surface.dark.bgDefault,
    paper: t.surface.dark.bgPaper,
  },
  text: {
    primary: t.surface.dark.textPrimary,
    secondary: t.surface.dark.textSecondary,
  },
  divider: t.surface.dark.divider,
  success: { main: t.semantic.successDark },
  error: { main: t.semantic.errorDark },
  warning: { main: t.semantic.warningDark, contrastText: t.neutral.white },
  info: { main: t.semantic.infoDark },
  action: {
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.16)',
  },
};

// ── Shared component / typography options ─────────────────────────────────────

const commonThemeOptions: ThemeOptions = {
  typography: {
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
          border: '1px solid var(--app-divider)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'var(--app-form-bg)',
            color: 'var(--app-text-primary)',
            '& fieldset': {
              borderColor: 'var(--app-divider)',
            },
            '&:hover fieldset': {
              borderColor: 'var(--app-primary)',
            },
            '&.Mui-focused fieldset': {
              borderColor: 'var(--app-primary)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'var(--app-text-secondary)',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          backgroundColor: 'var(--app-form-bg)',
          color: 'var(--app-text-primary)',
        },
        icon: {
          color: 'var(--app-text-primary)',
        },
        outlined: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--app-divider)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--app-primary)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--app-primary)',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            fontWeight: 700,
            backgroundColor: 'var(--app-table-header-bg)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'var(--app-divider)',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--app-bg-paper)',
        },
      },
    },
  },
};

// ── Theme factory ─────────────────────────────────────────────────────────────

export const createAppTheme = (mode: 'light' | 'dark') => {
  const palette = mode === 'dark' ? darkPalette : lightPalette;

  return createTheme({
    ...commonThemeOptions,
    palette,
    components: {
      ...commonThemeOptions.components,

      MuiCssBaseline: {
        styleOverrides: {
          // CSS custom properties derived from the active palette.
          // Renamed to `--app-*` to avoid conflicts with MUI internal vars.
          // These are the only CSS variables components & CSS files should use.
          ':root': {
            '--app-primary': palette.primary.main,
            '--app-primary-light': palette.primary.light,
            '--app-primary-dark': palette.primary.dark,
            '--app-secondary': palette.secondary.main,
            '--app-bg-default': palette.background.default,
            '--app-bg-paper': palette.background.paper,
            '--app-text-primary': palette.text.primary,
            '--app-text-secondary': palette.text.secondary,
            '--app-divider': palette.divider,
            '--app-form-bg': palette.background.paper,
            '--app-table-header-bg':
              mode === 'dark' ? t.neutral.grey800 : t.neutral.grey50,
            '--app-success': palette.success.main,
            '--app-error': palette.error.main,
            '--app-warning': palette.warning.main,
            '--app-info': palette.info.main,
            // Backwards-compat aliases for CSS files that still use old names.
            '--mui-palette-divider': palette.divider,
            '--mui-palette-primary-main': palette.primary.main,
            '--mui-palette-table-background': palette.background.paper,
            '--mui-palette-table-headerBackground':
              mode === 'dark' ? t.neutral.grey800 : t.neutral.grey50,
            '--mui-palette-table-border': palette.divider,
            '--mui-palette-card-background': palette.background.paper,
            '--mui-palette-card-border': palette.divider,
            '--mui-palette-form-background': palette.background.paper,
            '--mui-palette-form-border': palette.divider,
            '--mui-palette-form-text': palette.text.primary,
            '--mui-palette-form-label': palette.text.secondary,
            '--mui-palette-status-success': palette.success.main,
            '--mui-palette-status-error': palette.error.main,
            '--mui-palette-status-warning': palette.warning.main,
            '--mui-palette-status-info': palette.info.main,
          },
          body: {
            color: palette.text.primary,
          },
          '.MuiTooltip-tooltip': {
            backgroundColor: `${t.neutral.tooltip} !important`,
            color: `${t.neutral.black} !important`,
          },
          '.MuiTooltip-arrow': {
            color: `${t.neutral.tooltip} !important`,
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

export const ASSET_TABLE_CONFIG = {
  NAME_LIMIT: 25,
};
