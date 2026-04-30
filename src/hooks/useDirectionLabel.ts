import { useTheme } from '@mui/material';

export function useDirectionLabel() {
  const { direction } = useTheme();
  return (en: string, ar: string) => (direction === 'rtl' ? ar : en);
}
