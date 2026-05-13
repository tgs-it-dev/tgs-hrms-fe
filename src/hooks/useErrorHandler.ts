import { useState, useCallback } from 'react';
import { extractErrorMessage, handleApiError } from '../utils/errorHandler';

export type ErrorResource =
  | 'employee'
  | 'department'
  | 'designation'
  | 'leave'
  | 'leaveType'
  | 'attendance'
  | 'team'
  | 'announcement'
  | 'notification'
  | 'profile'
  | 'company'
  | 'role'
  | 'geofencing'
  | 'holiday'
  | 'policy'
  | 'report'
  | 'timesheet'
  | 'billing'
  | 'task';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export interface UseErrorHandlerReturn {
  snackbar: SnackbarState;
  showError: (
    error: unknown,
    context?: {
      operation: 'create' | 'update' | 'delete' | 'fetch';
      resource: ErrorResource;
      isGlobal?: boolean;
    }
  ) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  closeSnackbar: () => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'error',
  });

  const showError = useCallback(
    (
      error: unknown,
      context?: {
        operation: 'create' | 'update' | 'delete' | 'fetch';
        resource: ErrorResource;
        isGlobal?: boolean;
      }
    ) => {
      const errorResult = context
        ? handleApiError(error, context)
        : extractErrorMessage(error);

      setSnackbar({
        open: true,
        message: errorResult.message,
        severity: 'error',
      });
    },
    []
  );

  const showSuccess = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
    });
  }, []);

  const showWarning = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'warning',
    });
  }, []);

  const showInfo = useCallback((message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'info',
    });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  return {
    snackbar,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    closeSnackbar,
  };
}
