import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { authService } from './authService';
import { axiosErrorHandler } from './axiosErrorHandler';

const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token and handle FormData header
axiosInstance.interceptors.request.use(
  config => {
    try {
      const token = authService.getAccessToken();
      if (token) {
        (config.headers as Record<string, unknown>).Authorization =
          `Bearer ${token}`;
      }

      // If payload is FormData, remove Content-Type so browser/axios adds boundary
      if (config.data instanceof FormData) {
        delete (config.headers as Record<string, unknown>)['Content-Type'];
      }
    } catch (e) {
      void e;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor: use centralized axiosErrorHandler with safe try/catch
axiosInstance.interceptors.response.use(undefined, async (error: unknown) => {
  try {
    if (!axiosErrorHandler.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const axiosError = error as AxiosError;
    const originalRequest =
      (axiosError.config as AxiosRequestConfig & {
        _retry?: boolean;
      }) || undefined;

    const handlerResult = axiosErrorHandler.handleError(
      axiosError,
      originalRequest ?? null
    );

    if (handlerResult.shouldLogout) {
      return Promise.reject(handlerResult.error ?? axiosError);
    }

    if (handlerResult.shouldRetry && originalRequest) {
      return handleTokenRefresh(originalRequest);
    }

    return Promise.reject(handlerResult.error ?? axiosError);
  } catch (err) {
    return Promise.reject(err);
  }
});

// Helper to refresh token and retry the original request
async function handleTokenRefresh(
  originalRequest: AxiosRequestConfig & { _retry?: boolean }
): Promise<unknown> {
  originalRequest._retry = true;

  if (authService.isTokenRefreshing()) {
    return new Promise<string>((resolve, reject) => {
      authService.addToQueue(resolve, reject);
    })
      .then(token => {
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${token}`,
        };
        return axiosInstance(originalRequest);
      })
      .catch(err => Promise.reject(err));
  }

  try {
    const newToken = await authService.startTokenRefresh();

    authService.processQueueSuccess(newToken);

    axiosInstance.defaults.headers.common['Authorization'] =
      `Bearer ${newToken}`;

    originalRequest.headers = {
      ...(originalRequest.headers ?? {}),
      Authorization: `Bearer ${newToken}`,
    };

    return axiosInstance(originalRequest);
  } catch (refreshError) {
    authService.processQueueError(refreshError);

    if (axiosErrorHandler.shouldTriggerLogout(refreshError)) {
      axiosErrorHandler.handleLogout();
    } else {
      authService.clearTokens();
      window.location.href = '/';
    }
    return Promise.reject(refreshError);
  }
}

export default axiosInstance;
