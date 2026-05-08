import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi, type LeaveTypeListResponse } from '../../api/leaveApi';
import type { LeaveWithUser, LeaveResponse } from '../../api/leaveApi';
import employeeApi from '../../api/employeeApi';
import type { Leave } from '../../types/leave';

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

// ---------------------------------------------------------------------------
// Shared helper: normalize a raw API leave item to the canonical Leave shape.
// Mirrors the mapping logic from LeaveRequestPage.loadLeaves so that a single
// place owns the transformation.
// ---------------------------------------------------------------------------
const ITEMS_PER_PAGE = 25;

function normalizeLeave(leaveRaw: unknown): Leave {
  const leave = (leaveRaw || {}) as Record<string, unknown>;

  const employeeObj =
    leave.employee && typeof leave.employee === 'object'
      ? (leave.employee as Record<string, unknown>)
      : undefined;
  const userObj =
    leave.user && typeof leave.user === 'object'
      ? (leave.user as Record<string, unknown>)
      : undefined;

  const getString = (v: unknown) =>
    v === null || typeof v === 'undefined' ? '' : String(v);

  const employeeId =
    (typeof leave.employeeId === 'string' && leave.employeeId) ||
    (typeof leave.employeeId === 'number' && String(leave.employeeId)) ||
    (employeeObj && typeof employeeObj.id === 'string' && employeeObj.id) ||
    (userObj && typeof userObj.id === 'string' && userObj.id) ||
    '';

  const userId =
    (userObj && typeof userObj.id === 'string' && userObj.id) ||
    (employeeObj && typeof employeeObj.id === 'string' && employeeObj.id) ||
    '';

  const employeeFirstName =
    (employeeObj &&
      typeof employeeObj.first_name === 'string' &&
      employeeObj.first_name) ||
    (userObj && typeof userObj.first_name === 'string' && userObj.first_name) ||
    'You';

  const employeeLastName =
    (employeeObj &&
      typeof employeeObj.last_name === 'string' &&
      employeeObj.last_name) ||
    (userObj && typeof userObj.last_name === 'string' && userObj.last_name) ||
    undefined;

  const employeeEmail =
    (employeeObj &&
      typeof employeeObj.email === 'string' &&
      employeeObj.email) ||
    (userObj && typeof userObj.email === 'string' && userObj.email) ||
    '';

  const leaveTypeName =
    (leave.leaveType &&
    typeof leave.leaveType === 'object' &&
    typeof (leave.leaveType as Record<string, unknown>).name === 'string'
      ? ((leave.leaveType as Record<string, unknown>).name as string)
      : undefined) || 'Unknown';

  return {
    id: getString(leave.id),
    employeeId: getString(employeeId),
    employee: {
      id: getString(employeeObj?.id) || getString(userId),
      first_name: employeeFirstName,
      last_name: employeeLastName as string | undefined,
      email: employeeEmail,
    },
    leaveTypeId: getString(leave.leaveTypeId),
    leaveType: { id: '', name: leaveTypeName },
    reason: getString(leave.reason),
    remarks: typeof leave.remarks === 'string' ? leave.remarks : undefined,
    startDate: getString(leave.startDate),
    endDate: getString(leave.endDate),
    status: (getString(leave.status) as Leave['status']) || 'pending',
    createdAt: leave.createdAt as string | undefined,
    updatedAt: leave.updatedAt as string | undefined,
    documents: Array.isArray(leave.documents)
      ? (leave.documents as string[])
      : [],
  } as Leave;
}

export interface LeaveListParams {
  role: string;
  viewMode: 'team' | 'you';
  page: number;
  dateFilter: string;
  currentUserId: string;
}

export interface LeaveListResult {
  leaves: Leave[];
  totalPages: number;
  totalItems: number;
}

/**
 * Unified parameterized leave list query.
 *
 * All branching logic (role / viewMode / dateFilter) lives here so
 * LeaveRequestPage only needs to manage the parameters as state.
 */
export function useLeaveList(params: LeaveListParams) {
  const { role, viewMode, page, dateFilter, currentUserId } = params;

  return useQuery<LeaveListResult>({
    queryKey: LEAVE_KEYS.list({
      role,
      viewMode,
      page,
      dateFilter,
      currentUserId,
    }),
    queryFn: async () => {
      let queryParams: { month?: number; year?: number } = {};

      if (dateFilter && /^\d{4}-\d{2}$/.test(dateFilter)) {
        const [yStr, mStr] = dateFilter.split('-');
        queryParams = {
          year: parseInt(yStr, 10),
          month: parseInt(mStr, 10),
        };
      } else {
        // No filter — admins see all, non-admins fall back to current month
        const now = new Date();
        queryParams = { year: now.getFullYear(), month: now.getMonth() + 1 };
      }

      let res: {
        items: (LeaveResponse | LeaveWithUser)[];
        totalPages?: number;
        total?: number;
      };

      const isAdminRole = [
        'system-admin',
        'network-admin',
        'admin',
        'hr-admin',
        'oe-admin',
      ].includes(role);

      if (isAdminRole) {
        if (dateFilter && /^\d{4}-\d{2}$/.test(dateFilter)) {
          res = await leaveApi.getAllLeaves(page, queryParams);
        } else {
          res = await leaveApi.getAllLeaves(page);
        }
      } else if (role === 'manager') {
        res =
          viewMode === 'you'
            ? await leaveApi.getUserLeaves(currentUserId, page)
            : await leaveApi.getTeamLeaves(page);
      } else {
        res = await leaveApi.getUserLeaves(currentUserId, page);
      }

      const leavesData: Leave[] = Array.from(
        new Map(
          (Array.isArray(res.items) ? res.items : [])
            .map(normalizeLeave)
            .map(l => [l.id, l])
        ).values()
      );

      const hasMorePages = leavesData.length === ITEMS_PER_PAGE;
      let totalPages: number;
      let totalItems: number;

      if (res.totalPages && res.total) {
        totalPages = res.totalPages;
        totalItems = res.total;
      } else {
        totalPages = hasMorePages ? page + 1 : page;
        totalItems = hasMorePages
          ? page * ITEMS_PER_PAGE
          : (page - 1) * ITEMS_PER_PAGE + leavesData.length;
      }

      return { leaves: leavesData, totalPages, totalItems };
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: prev => prev,
  });
}
