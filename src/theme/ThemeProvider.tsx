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
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-mode');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }

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

  const theme = createAppTheme(mode);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
  };

  const updateMode = (newMode: 'light' | 'dark') => {
    setMode(newMode);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', mode);
      document.body.classList.toggle('dark-mode', mode === 'dark');
      document.body.classList.toggle('light-mode', mode === 'light');
    }
  }, [mode]);

  // Only auto-switch when no manual preference has been saved
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent) => {
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
