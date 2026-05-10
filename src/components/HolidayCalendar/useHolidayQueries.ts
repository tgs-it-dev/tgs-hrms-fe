/**
 * Query key factory and hooks for the Holiday Calendar feature.
 *
 * These hooks provide the TanStack Query layer for holiday data.
 * Components should prefer these over direct axios calls.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axiosInstance';
import type { Holiday } from '../../types/holiday';

export const HOLIDAY_KEYS = {
  all: ['holidays'] as const,
  lists: () => [...HOLIDAY_KEYS.all, 'list'] as const,
  list: (params?: unknown) => [...HOLIDAY_KEYS.lists(), params] as const,
  detail: (id: string | number) => [...HOLIDAY_KEYS.all, 'detail', id] as const,
};

interface HolidayListResponse {
  items: Holiday[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function fetchHolidays(): Promise<Holiday[]> {
  const res = await axiosInstance.get<HolidayListResponse | Holiday[]>(
    '/holidays'
  );
  const data = res.data as unknown;
  if (Array.isArray(data)) return data as Holiday[];
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { items?: unknown }).items)
  ) {
    return (data as { items: Holiday[] }).items;
  }
  return [];
}

export function useHolidayList() {
  return useQuery({
    queryKey: HOLIDAY_KEYS.lists(),
    queryFn: fetchHolidays,
    staleTime: 1000 * 60 * 60, // holidays rarely change
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<Holiday, 'id'>) =>
      axiosInstance.post<Holiday>('/holidays', payload).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() });
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<Holiday, 'id'>>;
    }) =>
      axiosInstance
        .patch<Holiday>(`/holidays/${id}`, payload)
        .then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      axiosInstance.delete(`/holidays/${id}`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOLIDAY_KEYS.lists() });
    },
  });
}
