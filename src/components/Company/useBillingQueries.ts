/**
 * Query key factory and hooks for the Billing feature.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import billingApi, {
  type ConfirmEmployeePaymentRequest,
  type CreateAddonOrderRequest,
  type CaptureAddonRequest,
} from '../../api/billingApi';

export const BILLING_KEYS = {
  all: ['billing'] as const,
  payments: () => [...BILLING_KEYS.all, 'payments'] as const,
  payment: (sessionId: string) =>
    [...BILLING_KEYS.payments(), sessionId] as const,
  subscriptions: () => [...BILLING_KEYS.all, 'subscriptions'] as const,
  subscription: (tenantId: string) =>
    [...BILLING_KEYS.subscriptions(), tenantId] as const,
};

export function useCreateAddonOrder() {
  return useMutation({
    mutationFn: (data: CreateAddonOrderRequest) =>
      billingApi.createAddonOrder(data),
  });
}

export function useCaptureAddon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CaptureAddonRequest) => billingApi.captureAddon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.all });
    },
  });
}

/** @deprecated Stripe compat — prefer useCaptureAddon for PayPal flows */
export function useConfirmEmployeePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfirmEmployeePaymentRequest) =>
      billingApi.confirmEmployeePayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.all });
    },
  });
}
