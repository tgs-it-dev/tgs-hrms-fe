import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { shouldLogout, forceLogout } from '../utils/authValidation';

export interface ErrorHandlerResult {
  shouldRetry: boolean;
  shouldLogout: boolean;
  error: unknown;
}

class AxiosErrorHandler {
  shouldTriggerLogout(error: unknown): boolean {
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
    if (this.shouldTriggerLogout(error)) {
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
