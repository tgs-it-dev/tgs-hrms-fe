import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface ErrorSnackbarProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  autoHideDuration?: number;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

/**
 * Reusable Snackbar component for displaying error messages and notifications.
 * Error severity uses same styling as Employee delete alert (MuiAlert-standardError:
 * light red background, dark red text, error icon, close button).
 */
export const ErrorSnackbar: React.FC<ErrorSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 6000,
  anchorOrigin = { vertical: 'top', horizontal: 'right' },
}) => {
  // Exact same colors as Employee delete alert (MuiAlert-standardError)
  const errorBg = 'rgb(253, 237, 237)';
  const errorText = 'rgb(95, 33, 32)';
  const errorSx =
    severity === 'error'
      ? {
          backgroundColor: errorBg,
          color: errorText,
          '& .MuiAlert-icon': { color: errorText },
          '& .MuiAlert-message': { color: errorText },
          '& .MuiIconButton-root': { color: errorText },
        }
      : undefined;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant='standard'
        sx={{
          width: '100%',
          ...errorSx,
          '& .MuiAlert-message': {
            fontSize: '14px',
            fontWeight: 500,
          },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ErrorSnackbar;
