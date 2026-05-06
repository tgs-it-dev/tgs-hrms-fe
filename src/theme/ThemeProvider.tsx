import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './themeConfig';
import { ThemeContext } from './context';
import type { ThemeContextType } from './context';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get initial theme from localStorage or default to 'light'
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-mode');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }

      // Check system preference
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        return 'dark';
      }
    }
    return 'light';
  };

  const [mode, setMode] = useState<'light' | 'dark'>(getInitialTheme);

  // Create theme based on current mode
  const theme = createAppTheme(mode);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  // Update theme mode
  const updateMode = (newMode: 'light' | 'dark') => {
    setMode(newMode);
  };

  // Save theme preference to localStorage and sync body class for CSS var overrides
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', mode);
      document.body.classList.toggle('dark-mode', mode === 'dark');
      document.body.classList.toggle('light-mode', mode === 'light');
    }
  }, [mode]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent) => {
        // Only auto-switch if user hasn't manually set a preference
        const savedTheme = localStorage.getItem('theme-mode');
        if (!savedTheme) {
          setMode(e.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const contextValue: ThemeContextType = {
    mode,
    toggleTheme,
    setMode: updateMode,
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
