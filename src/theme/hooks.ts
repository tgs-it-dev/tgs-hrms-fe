import { useContext } from 'react';
import { ThemeContext, type ThemeContextType } from './context';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useThemeMode = (): 'light' | 'dark' => {
  const { mode } = useTheme();
  return mode;
};

export const useIsDarkMode = (): boolean => {
  const { mode } = useTheme();
  return mode === 'dark';
};
