import axiosInstance from './axiosInstance';

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
  async confirmEmployeePayment(
    data: ConfirmEmployeePaymentRequest
  ): Promise<ConfirmEmployeePaymentResponse> {
    // Backend contract says "param: checkoutSessionId". Some implementations use query params,
    // others use JSON body. We send both for maximum compatibility.
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
