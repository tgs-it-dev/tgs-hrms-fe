import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Single source of truth for the active theme mode.
 *
 * Connected to AppThemeProvider (src/theme/ThemeProvider.tsx): the provider
 * reads `mode` directly from this store via useThemeStore(), so calling
 * toggleMode() or setMode() here is the ONLY way to switch the theme.
 *
 * Persisted to localStorage under the key "theme-mode" by zustand/persist.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      mode: 'light',
      toggleMode: () =>
        set(state => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
      setMode: mode => set({ mode }),
    }),
    { name: 'theme-mode' }
  )
);
