import axiosInstance from './axiosInstance';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user?: Record<string, unknown>;
  permissions?: unknown[];
  employee?: { id?: string | number } | null;
  requiresPayment?: boolean;
  session_id?: string;
  signupSessionId?: string;
  company?: Record<string, unknown>;
}

class AuthApiService {
  private baseUrl = '/auth';

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await axiosInstance.post<LoginResponse>(
      `${this.baseUrl}/login`,
      data
    );
    return response.data;
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        `${this.baseUrl}/forgot-password`,
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { data: AuthResponse } };
        return apiError.response.data;
      }
      throw new Error('Failed to send password reset link');
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        `${this.baseUrl}/reset-password`,
        data
      );
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response: { data: AuthResponse } };
        return apiError.response.data;
      }
      throw new Error('Failed to reset password');
    }
  }
}

const authApi = new AuthApiService();
export default authApi;
