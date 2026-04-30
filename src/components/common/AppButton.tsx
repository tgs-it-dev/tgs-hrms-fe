import React from 'react';
import {
  Button,
  useTheme,
  type ButtonProps,
  type SxProps,
  type Theme,
} from '@mui/material';

type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface AppButtonProps extends Omit<ButtonProps, 'children'> {
  variantType?: AppButtonVariant;
  text?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

export function AppButton({
  variantType = 'primary',
  sx,
  text,
  loading = false,
  children,
  disabled,
  ...rest
}: AppButtonProps) {
  const theme = useTheme();

  const getVariantStyles = (): SxProps<Theme> => {
    const isDark = theme.palette.mode === 'dark';

    const common: SxProps<Theme> = {
      // Typography: use CSS variables so our mobile typography scale applies everywhere.
      fontSize: 'var(--body-font-size)',
      lineHeight: 'var(--body-line-height)',
      letterSpacing: 'var(--body-letter-spacing)',
      textTransform: 'none',
      borderRadius: '12px',
      fontWeight: 400,
      // Sizing/padding: comfortable defaults on small screens.
      minHeight: { xs: 40, sm: 44 },
      px: { xs: 2, sm: 3 },
      py: { xs: 0.75, sm: 1 },
      position: 'relative',
      // Keep icon sizing aligned with text scale
      '& .MuiButton-startIcon, & .MuiButton-endIcon': {
        '& > *:nth-of-type(1)': {
          fontSize: '1.25em',
        },
      },
    };

    const baseStyles: Record<AppButtonVariant, SxProps<Theme>> = {
      primary: {
        ...common,
        backgroundColor: 'primary.main',
        color: 'common.white',
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
        '&:disabled': {
          backgroundColor: 'action.disabledBackground',
          color: 'action.disabled',
        },
      },
      secondary: {
        ...common,
        // Cancel button style (light theme): use App.css variable for #2C2C2C
        borderColor: isDark ? theme.palette.divider : 'var(--black-color)',
        borderWidth: 1,
        borderStyle: 'solid',
        color: isDark ? theme.palette.text.primary : 'var(--black-color)',
        '&:hover': {
          borderColor: isDark ? theme.palette.divider : 'var(--black-color)',
          backgroundColor: 'action.hover',
        },
        '&:disabled': {
          borderColor: 'action.disabledBackground',
          color: 'action.disabled',
        },
      },
      danger: {
        ...common,
        backgroundColor: 'error.main',
        color: 'common.white',
        '&:hover': {
          backgroundColor: 'error.dark',
        },
        '&:disabled': {
          backgroundColor: 'error.light',
          color: 'action.disabled',
        },
      },
      ghost: {
        ...common,
        borderColor: 'transparent',
        color: 'text.primary',
        '&:disabled': {
          color: 'action.disabled',
        },
        '&:hover': {
          backgroundColor: 'action.hover',
          borderColor: 'transparent',
        },
      },
    };

    return baseStyles[variantType] || {};
  };

  const baseSx = getVariantStyles();

  return (
    <Button
      {...rest}
      disabled={disabled || loading}
      sx={[baseSx as SxProps<Theme>, sx as SxProps<Theme>]}
    >
      {text || children}
    </Button>
  );
}

export default AppButton;
