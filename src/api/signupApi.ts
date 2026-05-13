// src/api/signupApi.ts
import axiosInstance from './axiosInstance';
import type { UserProfile } from '../types/user';

export interface PersonalDetailsRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface PersonalDetailsResponse {
  signupSessionId: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  stripePriceId: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface StripePriceInfo {
  priceId: string;
  currency: string; // e.g. "usd"
  unit_amount: number; // in minor units, e.g. cents
  interval?: 'day' | 'week' | 'month' | 'year';
}

export interface CompanyDetailsRequest {
  signupSessionId: string;
  companyName: string;
  domain: string;
  planId: string;
}

export interface CompanyDetailsResponse {
  message: string;
  status: string;
}

export interface PaymentRequest {
  signupSessionId: string | null; // String for signup flow, null for login flow
  mode: 'checkout'; // Add mode field
}

export interface PaymentResponse {
  checkoutSessionId?: string;
  url?: string;
  subscriptionId?: string;
  status?: string;
}

// Accept either checkout session id (Stripe Checkout) or payment intent id (alt flows)
export interface PaymentConfirmRequest {
  signupSessionId: string | null; // String for signup flow, null for login flow
  checkoutSessionId?: string;
  paymentIntentId?: string;
}

export interface PaymentConfirmResponse {
  status: 'succeeded' | 'failed';
  transactionId: string;
}

export interface CompleteSignupRequest {
  signupSessionId: string;
}

export interface CompleteSignupResponse {
  message: string;
  userId: string;
  plan: string;
  status: 'active';
}

export interface LogoUploadRequest {
  signupSessionId: string;
  logo: File;
}

export interface LogoUploadResponse {
  logoUrl: string;
  signupSessionId: string;
}

export interface GoogleSignupInitResponse {
  alreadyRegistered?: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: Partial<UserProfile>;
  permissions?: string[];
  signupSessionId?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  suggested?: Record<string, unknown>;
}

class SignupApiService {
  private baseUrl = '/signup';

  async initGoogleSignup(idToken: string): Promise<GoogleSignupInitResponse> {
    const response = await axiosInstance.post(`${this.baseUrl}/google-init`, {
      idToken,
    });
    return response.data;
  }

  // Step 1: Personal Details
  async createPersonalDetails(
    data: PersonalDetailsRequest
  ): Promise<PersonalDetailsResponse> {
    const response = await axiosInstance.post(
      `${this.baseUrl}/personal-details`,
      data
    );
    return response.data;
  }

  // Get Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const response = await axiosInstance.get('/subscription-plans');
    return response.data;
  }

  // Get Stripe prices for a list of price IDs (server must proxy this)
  async getStripePrices(priceIds: string[]): Promise<StripePriceInfo[]> {
    // Try the new endpoint first
    const params = new URLSearchParams();
    params.set('ids', priceIds.join(','));
    const response = await axiosInstance.get(
      `/subscription-plans/prices?${params.toString()}`
    );
    return response.data;
  }

  // Get prices by plan IDs (backend supports this)
  async getStripePricesByPlanIds(
    planIds: string[]
  ): Promise<StripePriceInfo[]> {
    const params = new URLSearchParams();
    params.set('planIds', planIds.join(','));
    const response = await axiosInstance.get(
      `/subscription-plans/prices-by-plans?${params.toString()}`
    );
    return response.data;
  }

  // Step 2: Company Details
  async createCompanyDetails(
    data: CompanyDetailsRequest
  ): Promise<CompanyDetailsResponse> {
    // Validate required fields before sending
    if (
      !data.signupSessionId ||
      typeof data.signupSessionId !== 'string' ||
      data.signupSessionId.trim().length === 0
    ) {
      throw new Error(
        'signupSessionId is required and must be a non-empty string'
      );
    }
    if (
      !data.companyName ||
      typeof data.companyName !== 'string' ||
      data.companyName.trim().length === 0
    ) {
      throw new Error('companyName is required and must be a non-empty string');
    }
    if (
      !data.domain ||
      typeof data.domain !== 'string' ||
      data.domain.trim().length === 0
    ) {
      throw new Error('domain is required and must be a non-empty string');
    }
    if (
      !data.planId ||
      typeof data.planId !== 'string' ||
      data.planId.trim().length === 0
    ) {
      throw new Error('planId is required and must be a non-empty string');
    }

    const response = await axiosInstance.post(
      `${this.baseUrl}/company-details`,
      data
    );
    return response.data;
  }

  // Step 3: Create Payment Intent
  async createPayment(data: PaymentRequest): Promise<PaymentResponse> {
    const response = await axiosInstance.post(`${this.baseUrl}/payment`, data);
    return response.data;
  }

  // Step 4: Confirm Payment
  async confirmPayment(
    data: PaymentConfirmRequest
  ): Promise<PaymentConfirmResponse> {
    const response = await axiosInstance.post(
      `${this.baseUrl}/payment/confirm`,
      data
    );
    return response.data;
  }

  // Step 5: Complete Signup
  async completeSignup(
    data: CompleteSignupRequest
  ): Promise<CompleteSignupResponse> {
    const response = await axiosInstance.post(`${this.baseUrl}/complete`, data);
    return response.data;
  }

  // Upload Company Logo
  async uploadLogo(data: LogoUploadRequest): Promise<LogoUploadResponse> {
    const formData = new FormData();
    formData.append('signupSessionId', data.signupSessionId);
    formData.append('file', data.logo); // Changed from 'logo' to 'file'

    const response = await axiosInstance.post(
      `${this.baseUrl}/upload-logo`,
      formData
    );
    return response.data;
  }
}

const signupApi = new SignupApiService();
export default signupApi;
