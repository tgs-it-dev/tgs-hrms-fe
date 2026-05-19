import axios from 'axios';
import { env } from '../config/env';

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

class AuthService {
  private isRefreshing = false;
  private failedQueue: {
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
  }[] = [];

  getRefreshToken(): string | null {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) return refreshToken;

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.refresh_token) return user.refresh_token;
      } catch {
        // Ignore parsing errors
      }
    }
    return null;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  storeTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  async refreshAccessToken(): Promise<TokenRefreshResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await axios.post<TokenRefreshResponse>(
      `${env.apiBaseUrl}/auth/refresh`,
      { refreshToken }
    );

    return response.data;
  }

  isTokenRefreshing(): boolean {
    return this.isRefreshing;
  }

  async startTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      throw new Error('Token refresh already in progress');
    }

    this.isRefreshing = true;

    try {
      const data = await this.refreshAccessToken();
      this.storeTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } finally {
      this.isRefreshing = false;
    }
  }

  processQueueSuccess(token: string): void {
    this.processQueue(null, token);
  }

  processQueueError(error: unknown): void {
    this.processQueue(error, null);
  }

  addToQueue(
    resolve: (token: string) => void,
    reject: (err: unknown) => void
  ): void {
    this.failedQueue.push({ resolve, reject });
  }

  private processQueue(error: unknown, token: string | null = null): void {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- token is non-null when error is falsy (checked above)
        prom.resolve(token!);
      }
    });
    this.failedQueue = [];
  }
}

export const authService = new AuthService();
