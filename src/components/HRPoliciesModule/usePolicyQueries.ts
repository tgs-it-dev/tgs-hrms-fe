/**
 * Query key factory and hooks for the HR Policies feature.
 *
 * PolicyList currently uses local mock data. These keys are defined now so
 * that future API integration can be wired in without touching consumers.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import type { Policy } from '../../types/policy';
import { featureFlags } from '../../config/featureFlags';

export interface PolicyListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export const POLICY_KEYS = {
  all: ['policy'] as const,
  lists: () => [...POLICY_KEYS.all, 'list'] as const,
  list: (params?: PolicyListParams) =>
    [...POLICY_KEYS.lists(), params] as const,
  detail: (id: string | number) => [...POLICY_KEYS.all, 'detail', id] as const,
};

async function fetchPolicies(): Promise<Policy[]> {
  const res = await axiosInstance.get<Policy[]>('/policies');
  return res.data;
}

async function createPolicy(payload: Omit<Policy, 'id'>): Promise<Policy> {
  const res = await axiosInstance.post<Policy>('/policies', payload);
  return res.data;
}

async function updatePolicy(
  id: string,
  payload: Partial<Omit<Policy, 'id'>>
): Promise<Policy> {
  const res = await axiosInstance.put<Policy>(`/policies/${id}`, payload);
  return res.data;
}

async function deletePolicy(id: string): Promise<void> {
  await axiosInstance.delete(`/policies/${id}`);
}

export function usePolicies() {
  return useQuery({
    queryKey: POLICY_KEYS.lists(),
    queryFn: featureFlags.useMockPolicies
      ? () => Promise.resolve([] as Policy[])
      : fetchPolicies,
    staleTime: 1000 * 60 * 5, // 5 minutes — policies change infrequently
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Policy, 'id'>) => createPolicy(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POLICY_KEYS.lists() });
    },
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<Policy, 'id'>>;
    }) => updatePolicy(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POLICY_KEYS.lists() });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POLICY_KEYS.lists() });
    },
  });
}
