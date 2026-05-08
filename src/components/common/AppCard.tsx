import React from 'react';
import {
  Card,
  type CardProps,
  type SxProps,
  type Theme,
  useTheme,
} from '@mui/material';

interface AppCardProps extends CardProps {
  compact?: boolean;
  padding?: number | string;
  noShadow?: boolean;
}

export const AppCard = React.memo(function AppCard({
  compact = false,
  sx,
  padding,
  noShadow = false,
  ...rest
}: AppCardProps) {
  const theme = useTheme(); // access current theme (light/dark)

  const baseSx: SxProps<Theme> = compact
    ? {
        padding: padding !== undefined ? padding : 1,
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 1px 3px rgba(255,255,255,0.05)'
            : '0 1px 3px rgba(16,24,40,0.04)',
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }
    : {
        padding: padding !== undefined ? padding : 2,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      };

  // If caller requests no shadow, explicitly remove any boxShadow
  const effectiveBaseSx: SxProps<Theme> = noShadow
    ? ({ ...(baseSx as object), boxShadow: 'none' } as SxProps<Theme>)
    : baseSx;

  const combinedSx: SxProps<Theme> = sx
    ? ([effectiveBaseSx, sx] as SxProps<Theme>)
    : effectiveBaseSx;

  return <Card {...rest} sx={combinedSx} />;
});

export default AppCard;
