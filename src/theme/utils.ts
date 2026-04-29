import type { SxProps, Theme } from '@mui/material/styles';

// Theme-aware styling utilities
export const themeStyles = {
  // Card styles
  card: (theme: Theme): SxProps<Theme> => ({
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
  }),

  // Table styles
  table: (theme: Theme): SxProps<Theme> => ({
    backgroundColor: theme.palette.background.paper,
    '& .MuiTableCell-root': {
      borderColor: theme.palette.divider,
      color: theme.palette.text.primary,
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
      backgroundColor: theme.palette.action.hover,
      fontWeight: 700,
    },
  }),

  // Form styles
  form: (theme: Theme): SxProps<Theme> => ({
    '& .MuiTextField-root': {
      '& .MuiOutlinedInput-root': {
        backgroundColor: theme.palette.background.paper,
        '& fieldset': {
          borderColor: theme.palette.divider,
        },
        '&:hover fieldset': {
          borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused fieldset': {
          borderColor: theme.palette.primary.main,
        },
      },
      '& .MuiInputLabel-root': {
        color: theme.palette.text.secondary,
      },
      '& .MuiInputBase-input': {
        color: theme.palette.text.primary,
      },
    },
    '& .MuiSelect-root': {
      backgroundColor: theme.palette.background.paper,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.divider,
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
      },
    },
  }),

  // Button styles
  button: {
    primary: (theme: Theme): SxProps<Theme> => ({
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    }),
    secondary: (theme: Theme): SxProps<Theme> => ({
      backgroundColor: theme.palette.secondary.main,
      color: theme.palette.secondary.contrastText,
      '&:hover': {
        backgroundColor: theme.palette.secondary.dark,
      },
    }),
    outlined: (theme: Theme): SxProps<Theme> => ({
      borderColor: theme.palette.divider,
      color: theme.palette.text.primary,
      '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.action.hover,
      },
    }),
  },

  // Text styles
  text: {
    primary: (theme: Theme): SxProps<Theme> => ({
      color: theme.palette.text.primary,
    }),
    secondary: (theme: Theme): SxProps<Theme> => ({
      color: theme.palette.text.secondary,
    }),
  },

  // Container styles
  container: (theme: Theme): SxProps<Theme> => ({
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    minHeight: '100vh',
  }),

  // Paper styles
  paper: (theme: Theme): SxProps<Theme> => ({
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
  }),

  // Divider styles
  divider: (theme: Theme): SxProps<Theme> => ({
    borderColor: theme.palette.divider,
  }),

  // Icon button styles
  iconButton: {
    primary: (theme: Theme): SxProps<Theme> => ({
      color: theme.palette.primary.main,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    }),
    error: (theme: Theme): SxProps<Theme> => ({
      color: theme.palette.error.main,
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    }),
  },

  // Loading and empty states
  loading: (theme: Theme): SxProps<Theme> => ({
    color: theme.palette.text.secondary,
  }),

  // Modal styles
  modal: (theme: Theme): SxProps<Theme> => ({
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
  }),

  // Snackbar styles
  snackbar: (theme: Theme): SxProps<Theme> => ({
    '& .MuiAlert-root': {
      backgroundColor: theme.palette.background.paper,
      color: theme.palette.text.primary,
    },
  }),
};

/**
 * Returns a hex string for a given index in the chart color palette.
 * Import colorTokens.chart directly if you need the full array.
 */
export { colorTokens } from './tokens';

// CSS Custom Properties for theme values
export const cssVars = {
  // Get CSS custom property value
  get: (property: string): string => {
    if (typeof window !== 'undefined') {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(property)
        .trim();
    }
    return '';
  },

  // Set CSS custom property value
  set: (property: string, value: string): void => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty(property, value);
    }
  },
};

// Theme-aware color functions
export const themeColors = {
  // Get color based on theme mode
  getColor: (
    lightColor: string,
    darkColor: string,
    isDark: boolean
  ): string => {
    return isDark ? darkColor : lightColor;
  },

  // Get contrast color for background
  getContrastText: (backgroundColor: string): string => {
    // Simple contrast calculation
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  },
};

// Responsive theme utilities
export const responsiveTheme = {
  // Get theme-aware spacing
  spacing: (theme: Theme, value: number): string => {
    return theme.spacing(value);
  },

  // Get theme-aware breakpoints
  breakpoint: (
    theme: Theme,
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ): string => {
    return theme.breakpoints.up(breakpoint);
  },
};
