/**
 * Query key factory and hooks for the Billing feature.
 *
 * Billing currently only has a confirm-payment mutation endpoint.
 * Keys are defined as a factory so future list/detail queries can slot in
 * without renaming anything.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import billingApi, {
  type ConfirmEmployeePaymentRequest,
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

export function useConfirmEmployeePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfirmEmployeePaymentRequest) =>
      billingApi.confirmEmployeePayment(data),
    onSuccess: () => {
      // Invalidate any billing-related queries so UI reflects the confirmed payment
      queryClient.invalidateQueries({ queryKey: BILLING_KEYS.all });
    },
  });
}
