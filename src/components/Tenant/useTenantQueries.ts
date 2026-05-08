/**
 * Query key factory and hooks for the Tenant (System Admin) feature.
 *
 * These hooks wrap `SystemTenantApi` so that components never call the API
 * directly — only via TanStack Query.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SystemTenantApi,
  type SystemTenant,
  type SystemTenantDetail,
  type SystemTenantFilters,
} from '../../api/systemTenantApi';

export const TENANT_KEYS = {
  all: ['tenants'] as const,
  lists: () => [...TENANT_KEYS.all, 'list'] as const,
  list: (filters?: SystemTenantFilters) =>
    [...TENANT_KEYS.lists(), filters] as const,
  detail: (id: string) => [...TENANT_KEYS.all, 'detail', id] as const,
};

export function useSystemTenants(
  filters: SystemTenantFilters = { page: 1, limit: 25 }
) {
  return useQuery({
    queryKey: TENANT_KEYS.list(filters),
    queryFn: () => SystemTenantApi.getAll(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    placeholderData: prev => prev,
  });
}

export function useSystemTenantDetail(id: string, enabled = true) {
  return useQuery<SystemTenantDetail>({
    queryKey: TENANT_KEYS.detail(id),
    queryFn: () => SystemTenantApi.getById(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof SystemTenantApi.create>[0]) =>
      SystemTenantApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_KEYS.lists() });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof SystemTenantApi.update>[0]) =>
      SystemTenantApi.update(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: TENANT_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: TENANT_KEYS.detail(variables.tenantId),
      });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SystemTenantApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_KEYS.lists() });
    },
  });
}

export function useUpdateTenantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: SystemTenant['status'];
    }) => SystemTenantApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANT_KEYS.lists() });
    },
  });
}
