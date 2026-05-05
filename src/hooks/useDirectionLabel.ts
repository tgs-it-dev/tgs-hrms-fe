import { useTheme } from '@mui/material';
import { useCallback } from 'react';

export function useDirectionLabel() {
  const { direction } = useTheme();
  return useCallback(
    (en: string, ar: string) => (direction === 'rtl' ? ar : en),
    [direction]
  );
}
