import React from 'react';
import { IconButton, Tooltip, useTheme as useMuiTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useTheme } from './hooks';
interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  tooltipText?: {
    light: string;
    dark: string;
  };
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'medium',
  showTooltip = true,
  tooltipText = {
    light: 'Switch to dark mode',
    dark: 'Switch to light mode',
  },
}) => {
  const { mode, toggleTheme } = useTheme();
  const theme = useMuiTheme();

  const isDark = mode === 'dark';
  const tooltipContent = isDark ? tooltipText.light : tooltipText.dark;

  const button = (
    <IconButton
      onClick={toggleTheme}
      size={size}
      sx={{
        color: theme.palette.text.primary,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      }}
      aria-label={tooltipContent}
    >
      {isDark ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={tooltipContent} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default ThemeToggle;
