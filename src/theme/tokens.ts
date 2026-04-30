/**
 * Design token definitions — single source of truth for all raw color values.
 *
 * These names mirror the Figma variable naming convention 1-to-1.
 * This is the ONLY file in the codebase that may contain raw hex values.
 *
 * How to update colors:
 *   1. Designer updates Figma.
 *   2. Update the token(s) here.
 *   3. Every component that reads from the MUI theme picks up the change automatically.
 *
 * Components must NEVER import from this file directly — they should always
 * consume colors via `theme.palette.*` or MUI sx shorthand (`'primary.main'`).
 */

export const colorTokens = {
  // ── Brand ─────────────────────────────────────────────────────────────────
  // Figma page: Foundations / Colors / Brand
  brand: {
    primary: '#2680D9', // Figma: Primary Blue
    primaryLight: '#E9F2FB', // Figma: Light Blue  (tint, hover bg, chip bg)
    primaryDark: '#0059B2', // Figma: Dark Blue   (pressed / AAA text)
    primaryMedium: '#5ba0f0', // mid-range for dark-mode `primary.light` slot

    secondary: '#E51A5D', // Figma: Secondary
    secondaryLight: '#F06A92', // ~lighten(secondary, 20%)
    secondaryDark: '#B3154A', // ~darken(secondary, 20%)

    accent: '#F19828', // warm amber — charts, highlights, warning accents
  },

  // ── Neutral scale ─────────────────────────────────────────────────────────
  // Figma page: Foundations / Colors / Neutral
  neutral: {
    white: '#ffffff',
    grey0: '#fafafa',
    grey50: '#f9f9f9',
    grey100: '#f5f5f5',
    grey200: '#f0f0f0',
    grey300: '#e0e0e0',
    grey400: '#cccccc',
    grey500: '#8f8f8f',
    grey600: '#666666',
    grey700: '#555555',
    grey800: '#2c2c2c',
    black: '#000000',

    // Dark-mode surface divider (heavier than grey300)
    darkDivider: '#333333',
    // Tooltip background (neutral warm-grey)
    tooltip: '#c0bdbd',
  },

  // ── Semantic status ────────────────────────────────────────────────────────
  // Separate light/dark variants so the theme can swap correctly per mode.
  semantic: {
    successLight: '#4caf50',
    successDark: '#66bb6a',
    errorLight: '#f44336',
    errorDark: '#ef5350',
    warningLight: '#ff9800',
    warningDark: '#ffb74d',
    infoLight: '#2196f3',
    infoDark: '#42a5f5',
  },

  // ── Surface (mode-specific) ────────────────────────────────────────────────
  surface: {
    light: {
      bgDefault: '#f5f5f5',
      bgPaper: '#ffffff',
      textPrimary: '#000000',
      textSecondary: '#666666',
      divider: '#e0e0e0',
    },
    dark: {
      bgDefault: '#121212',
      bgPaper: '#1e1e1e',
      textPrimary: '#8f8f8f',
      textSecondary: '#8f8f8f',
      divider: '#333333',
    },
  },

  // ── Data visualisation ─────────────────────────────────────────────────────
  // Ordered palette for charts — brand colors first, then complementary.
  chart: [
    '#2680D9', // primary
    '#E51A5D', // secondary
    '#F19828', // accent
    '#4caf50', // success-green
    '#9c27b0', // purple
    '#00bcd4', // cyan
    '#8884d8', // soft indigo
    '#82ca9d', // soft green
  ] as readonly string[],

  // ── Avatar initials backgrounds ────────────────────────────────────────────
  avatar: [
    '#2680D9',
    '#E51A5D',
    '#F19828',
    '#4caf50',
    '#9c27b0',
    '#00bcd4',
    '#795548',
    '#607d8b',
    '#f44336',
    '#3f51b5',
    '#009688',
    '#ff5722',
  ] as readonly string[],
} as const;

export type ColorTokens = typeof colorTokens;
