import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import timesheetApi from '../../api/timesheetApi';

export const TIMESHEET_KEYS = {
  all: ['timesheets'] as const,
  lists: () => [...TIMESHEET_KEYS.all, 'list'] as const,
  list: (params: unknown) => [...TIMESHEET_KEYS.lists(), params] as const,
  detail: (id: string | number) =>
    [...TIMESHEET_KEYS.all, 'detail', id] as const,
  summary: (params: unknown) =>
    [...TIMESHEET_KEYS.all, 'summary', params] as const,
};

export function useUserTimesheet(page: number) {
  return useQuery({
    queryKey: TIMESHEET_KEYS.list({ page }),
    queryFn: () => timesheetApi.getUserTimesheet(page),
    staleTime: 1000 * 30, // timesheet data is time-sensitive
    placeholderData: prev => prev,
  });
}

export function useTimesheetSummary(
  from?: string,
  to?: string,
  page: number = 1
) {
  return useQuery({
    queryKey: TIMESHEET_KEYS.summary({ from, to, page }),
    queryFn: () => timesheetApi.getSummary(from, to, page),
    staleTime: 1000 * 60, // 1 minute
    placeholderData: prev => prev,
  });
}

export function useStartWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => timesheetApi.startWork(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIMESHEET_KEYS.lists() });
    },
  });
}

export function useEndWork() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => timesheetApi.endWork(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TIMESHEET_KEYS.lists() });
    },
  });
}
