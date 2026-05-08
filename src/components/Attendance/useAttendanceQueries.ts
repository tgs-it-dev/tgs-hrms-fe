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

// TODO: TanStack Query migration pending — complex dependency chain
// AttendanceTable.tsx (2,859 lines) has deeply intertwined data-fetching and UI state:
// - Role detection (isAdmin, isManager, isSystemAdmin etc.) drives which API is called
// - fetchAttendance is called imperatively by 10+ event handlers and useEffect blocks
// - Data building helpers (buildFromEvents, buildFromSummaries, buildFromSystemAll) run
//   inside the same async function that sets loading/data state
// - Team attendance, employee list extraction, and tenant loading are all chained
// - The component uses useRef-based stable callbacks to avoid stale closures
//
// Hooks below are defined for future use when the component is refactored.
// Currently AttendanceTable.tsx still uses its own useEffect + setState for fetching.

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
