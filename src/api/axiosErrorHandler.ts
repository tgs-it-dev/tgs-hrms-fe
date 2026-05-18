import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { shouldLogout, forceLogout } from '../utils/authValidation';
import { authService } from './authService';

export interface ErrorHandlerResult {
  shouldRetry: boolean;
  shouldLogout: boolean;
  error: unknown;
}

class AxiosErrorHandler {
  shouldTriggerLogout(
    error: unknown,
    originalRequest?: AxiosRequestConfig & { _retry?: boolean }
  ): boolean {
    if (this.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const isRetry = originalRequest?._retry === true;
      const isRefreshRequest =
        originalRequest?.url?.includes('/auth/refresh') === true;
      const hasRefreshToken = Boolean(authService.getRefreshToken());

      // If it's a 401, but it's not a retry, not a refresh request, and we have a refresh token,
      // do not logout immediately; we should try to refresh the token first.
      if (status === 401 && !isRetry && !isRefreshRequest && hasRefreshToken) {
        return false;
      }
    }
    return shouldLogout(error);
  }

  handleLogout(): void {
    forceLogout();
  }

  shouldRefreshToken(
    error: unknown,
    originalRequest?: AxiosRequestConfig & { _retry?: boolean }
  ): boolean {
    if (!this.isAxiosError(error)) {
      return false;
    }

    const axiosError = error as AxiosError;
    return (
      axiosError.response?.status === 401 &&
      originalRequest !== undefined &&
      !originalRequest._retry
    );
  }

  isAxiosError(error: unknown): boolean {
    return axios.isAxiosError(error);
  }

  handleError(
    error: unknown,
    originalRequest?: AxiosRequestConfig & { _retry?: boolean }
  ): ErrorHandlerResult {
    if (this.shouldTriggerLogout(error, originalRequest)) {
      this.handleLogout();
      return { shouldRetry: false, shouldLogout: true, error };
    }

    if (this.shouldRefreshToken(error, originalRequest)) {
      return { shouldRetry: true, shouldLogout: false, error };
    }

    return { shouldRetry: false, shouldLogout: false, error };
  }
}

export const axiosErrorHandler = new AxiosErrorHandler();
