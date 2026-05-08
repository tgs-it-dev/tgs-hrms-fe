import React from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './themeConfig';
import { ThemeContext } from './context';
import type { ThemeContextType } from './context';
import { useThemeStore } from '../store/themeStore';

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * AppThemeProvider reads mode from useThemeStore — the single source of truth.
 * Toggle the theme by calling useThemeStore().toggleMode() anywhere in the app;
 * this provider will re-render and supply the updated MUI theme automatically.
 *
 * NOTE: The Zustand store persists to localStorage under the key "theme-mode"
 * (see src/store/themeStore.ts), so the preference survives page reloads.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Single source of truth: Zustand store (persisted to localStorage "theme-mode")
  const { mode, toggleMode, setMode } = useThemeStore();

  const theme = createAppTheme(mode);

  // Keep body class in sync for any CSS that targets it directly.
  React.useEffect(() => {
    document.body.classList.toggle('dark-mode', mode === 'dark');
    document.body.classList.toggle('light-mode', mode === 'light');
  }, [mode]);

  // Mirror system preference changes only when user has not set a preference.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      // The zustand-persist middleware writes the key on every setMode call, so
      // check the raw stored value to detect "never explicitly set by user".
      const stored = localStorage.getItem('theme-mode');
      if (!stored) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [setMode]);

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme: toggleMode,
    setMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
