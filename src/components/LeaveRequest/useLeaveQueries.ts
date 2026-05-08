import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi, type LeaveTypeListResponse } from '../../api/leaveApi';
import employeeApi from '../../api/employeeApi';

export const LEAVE_KEYS = {
  all: ['leaves'] as const,
  lists: () => [...LEAVE_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...LEAVE_KEYS.lists(), filters] as const,
  types: () => [...LEAVE_KEYS.all, 'types'] as const,
  balances: (employeeId: string) =>
    [...LEAVE_KEYS.all, 'balances', employeeId] as const,
};

export const LEAVE_EMPLOYEE_KEYS = {
  all: ['leave-employees'] as const,
  list: () => [...LEAVE_EMPLOYEE_KEYS.all, 'list'] as const,
};

export function useLeaveTypes() {
  return useQuery<LeaveTypeListResponse>({
    queryKey: LEAVE_KEYS.types(),
    queryFn: () => leaveApi.getLeaveTypes({ page: 1, limit: 50 }),
    staleTime: 1000 * 60 * 10, // leave types rarely change
  });
}

/**
 * Fetches all employees for admin/hr-admin roles to use in the leave application form.
 * Only enabled when the role is 'admin' or 'hr-admin'.
 */
export function useLeaveEmployeeList(role: string) {
  const isAdminRole = role === 'admin' || role === 'hr-admin';
  return useQuery<{ id: string; userId: string; name: string }[]>({
    queryKey: LEAVE_EMPLOYEE_KEYS.list(),
    queryFn: async () => {
      const res = await employeeApi.getAllEmployeesWithoutPagination();
      return res
        .filter(e => e.user_id)
        .map(e => ({
          id: e.id,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- user_id is guaranteed by .filter(e => e.user_id) above
          userId: e.user_id!,
          name: e.name,
        }));
    },
    enabled: isAdminRole,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      leaveApi.approveLeave(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_KEYS.lists() });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
      leaveApi.rejectLeave(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_KEYS.lists() });
    },
  });
}

export function useCancelLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveApi.cancelLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_KEYS.lists() });
    },
  });
}
