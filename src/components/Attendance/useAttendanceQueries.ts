import { useQuery } from '@tanstack/react-query';
import attendanceApi from '../../api/attendanceApi';
import type {
  AttendanceResponse,
  SystemAllAttendanceResponse,
} from '../../api/attendanceApi';

export const ATTENDANCE_KEYS = {
  all: ['attendance'] as const,
  records: (filters: Record<string, unknown>) =>
    [...ATTENDANCE_KEYS.all, 'records', filters] as const,
  summary: (employeeId: string, period: string) =>
    [...ATTENDANCE_KEYS.all, 'summary', employeeId, period] as const,
  allAttendance: (filters: Record<string, unknown>) =>
    [...ATTENDANCE_KEYS.all, 'all', filters] as const,
  systemAll: (startDate?: string, endDate?: string) =>
    [...ATTENDANCE_KEYS.all, 'system-all', startDate, endDate] as const,
  teamAttendance: (filters: Record<string, unknown>) =>
    [...ATTENDANCE_KEYS.all, 'team', filters] as const,
};

// ---------------------------------------------------------------------------
// Raw-data hooks for the attendance data layer.
//
// AttendanceTable.tsx migration status:
//
// BLOCKED by three internal data-builder helpers (buildFromEvents, buildFromSummaries,
// buildFromSystemAll) that close over toDisplayTime(), dateFnsFormat(), and other
// component-local utilities. Those helpers cannot be moved into this file without
// either: (a) duplicating/exporting ~300 lines of transformation logic, or
// (b) passing them as parameters to the hook, which defeats the encapsulation goal.
//
// Additionally, fetchAttendance sets role flags (setIsManager, setIsAdminUser, etc.)
// as side effects — mixing data fetching with local state mutation in a way that
// useQuery cannot replicate without a larger component restructure.
//
// The hooks below expose the raw API response (no data building).  When
// AttendanceTable is refactored into smaller sub-components the plan is:
//   1. Move the three builder helpers to a shared attendanceUtils.ts
//   2. Replace fetchAttendance + fetchAttendanceByDate with useAttendanceData()
//   3. Replace fetchTeamAttendance with useTeamAttendance()
//   4. Replace fetchTenantsFromSystemAttendance with useTenants()
// ---------------------------------------------------------------------------

export function useAllAttendance(
  page: number,
  startDate?: string,
  endDate?: string,
  selectedEmployee?: string,
  tenantId?: string,
  enabled = true
) {
  return useQuery<AttendanceResponse>({
    queryKey: ATTENDANCE_KEYS.allAttendance({
      page,
      startDate,
      endDate,
      selectedEmployee,
      tenantId,
    }),
    queryFn: () =>
      attendanceApi.getAllAttendance(
        page,
        startDate,
        endDate,
        selectedEmployee,
        tenantId
      ),
    enabled,
    staleTime: 1000 * 30, // attendance data is time-sensitive
  });
}

export function useSystemAllAttendance(
  startDate?: string,
  endDate?: string,
  enabled = true
) {
  return useQuery<SystemAllAttendanceResponse>({
    queryKey: ATTENDANCE_KEYS.systemAll(startDate, endDate),
    queryFn: () => attendanceApi.getSystemAllAttendance(startDate, endDate),
    enabled,
    staleTime: 1000 * 30,
  });
}

// ---------------------------------------------------------------------------
// Prepared hooks — ready for AttendanceTable refactor (see migration plan above).
//
// useAttendanceData: unified, role-aware attendance query.
//   - isSystemAdmin + view='all'  → getSystemAllAttendance
//   - canViewAll + view='all' + employee selected → getAttendanceEvents(employee)
//   - canViewAll + view='all' + no employee → getAllAttendance
//   - all others (my, manager)    → getAttendanceEvents(userId)
//
// Returns the raw API response only; the caller is responsible for converting
// to AttendanceRecord[] via buildFromEvents / buildFromSummaries / buildFromSystemAll.
// ---------------------------------------------------------------------------

export interface AttendanceDataParams {
  userId: string;
  view: 'my' | 'all';
  isSystemAdmin: boolean;
  canViewAll: boolean;
  startDate?: string;
  endDate?: string;
  selectedEmployee?: string;
  tenantId?: string;
  enabled?: boolean;
}

export function useAttendanceData(params: AttendanceDataParams) {
  const {
    userId,
    view,
    isSystemAdmin: isSystemAdminRole,
    canViewAll,
    startDate,
    endDate,
    selectedEmployee,
    tenantId,
    enabled = true,
  } = params;

  return useQuery<AttendanceResponse | SystemAllAttendanceResponse>({
    queryKey: ATTENDANCE_KEYS.records({
      userId,
      view,
      isSystemAdmin: isSystemAdminRole,
      canViewAll,
      startDate,
      endDate,
      selectedEmployee,
      tenantId,
    }),
    queryFn: async (): Promise<
      AttendanceResponse | SystemAllAttendanceResponse
    > => {
      if (isSystemAdminRole && view === 'all') {
        return attendanceApi.getSystemAllAttendance(
          startDate || undefined,
          endDate || undefined
        );
      }

      if (canViewAll && view === 'all') {
        if (selectedEmployee) {
          return attendanceApi.getAttendanceEvents(
            selectedEmployee,
            1,
            startDate || undefined,
            endDate || undefined,
            tenantId
          );
        }
        return attendanceApi.getAllAttendance(
          1,
          startDate || undefined,
          endDate || undefined,
          undefined,
          tenantId
        );
      }

      // 'my' view — fetch the current user's own events
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      const resolvedStart =
        startDate ||
        `${oneYearAgo.getFullYear()}-${String(oneYearAgo.getMonth() + 1).padStart(2, '0')}-${String(oneYearAgo.getDate()).padStart(2, '0')}`;
      const resolvedEnd =
        endDate ||
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      return attendanceApi.getAttendanceEvents(
        userId,
        1,
        resolvedStart,
        resolvedEnd,
        tenantId
      );
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 30,
  });
}
