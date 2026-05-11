import axiosInstance from './axiosInstance';

// ── Employee addon (PayPal) ──────────────────────────────────────────────────

export interface CreateAddonOrderRequest {
  employeeCount: number;
}

export interface CreateAddonOrderResponse {
  orderId: string;
  approvalUrl: string;
  purchaseId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface CaptureAddonRequest {
  orderId: string;
  purchaseId: string;
}

export interface CaptureAddonResponse {
  captureId: string;
  status: string;
  amount: number;
  currency: string;
  employeeCount: number;
}

// ── Legacy Stripe compat ─────────────────────────────────────────────────────

export interface ConfirmEmployeePaymentRequest {
  checkoutSessionId: string;
}

export type ConfirmEmployeePaymentResponse =
  | {
      status?: 'succeeded' | 'failed' | string;
      success?: boolean;
      message?: string;
      transactionId?: string;
    }
  | Record<string, unknown>;

class BillingApiService {
  async createAddonOrder(
    data: CreateAddonOrderRequest
  ): Promise<CreateAddonOrderResponse> {
    const response = await axiosInstance.post(
      '/payments/addons/create-order',
      data
    );
    return response.data as CreateAddonOrderResponse;
  }

  async captureAddon(data: CaptureAddonRequest): Promise<CaptureAddonResponse> {
    const response = await axiosInstance.post('/payments/addons/capture', data);
    return response.data as CaptureAddonResponse;
  }

  async confirmEmployeePayment(
    data: ConfirmEmployeePaymentRequest
  ): Promise<ConfirmEmployeePaymentResponse> {
    const response = await axiosInstance.post(
      '/billing/employees/confirm-payment',
      { checkoutSessionId: data.checkoutSessionId },
      { params: { checkoutSessionId: data.checkoutSessionId } }
    );
    return response.data as ConfirmEmployeePaymentResponse;
  }
}

const billingApi = new BillingApiService();
export default billingApi;
