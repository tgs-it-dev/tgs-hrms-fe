import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  geofencingApi,
  type CreateGeofencePayload,
  type UpdateGeofencePayload,
} from '../../api/geofencingApi';

export const GEOFENCING_KEYS = {
  all: ['geofencing'] as const,
  lists: () => [...GEOFENCING_KEYS.all, 'list'] as const,
  list: (params?: unknown) => [...GEOFENCING_KEYS.lists(), params] as const,
  detail: (id: string | number) =>
    [...GEOFENCING_KEYS.all, 'detail', id] as const,
};

export function useGeofenceList() {
  return useQuery({
    queryKey: GEOFENCING_KEYS.lists(),
    queryFn: () => geofencingApi.getGeofences(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGeofencePayload) =>
      geofencingApi.createGeofence(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GEOFENCING_KEYS.lists() });
    },
  });
}

export function useUpdateGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateGeofencePayload;
    }) => geofencingApi.updateGeofence(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GEOFENCING_KEYS.lists() });
    },
  });
}

export function useDeleteGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => geofencingApi.deleteGeofence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GEOFENCING_KEYS.lists() });
    },
  });
}
