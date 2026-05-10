import { useQuery } from '@tanstack/react-query';
import reportApi from '../../api/reportApi';
import { leaveReportApiService } from '../../api/leaveReportApi';

export const REPORT_KEYS = {
  all: ['reports'] as const,
  lists: () => [...REPORT_KEYS.all, 'list'] as const,
  list: (params: unknown) => [...REPORT_KEYS.lists(), params] as const,
  detail: (id: string | number) => [...REPORT_KEYS.all, 'detail', id] as const,
  attendanceSummary: (params: unknown) =>
    [...REPORT_KEYS.all, 'attendance-summary', params] as const,
  leaveSummary: (params: unknown) =>
    [...REPORT_KEYS.all, 'leave-summary', params] as const,
  leaveBalance: () => [...REPORT_KEYS.all, 'leave-balance'] as const,
  teamLeaveSummary: (params: unknown) =>
    [...REPORT_KEYS.all, 'team-leave-summary', params] as const,
  allLeaveReports: (params: unknown) =>
    [...REPORT_KEYS.all, 'all-leave-reports', params] as const,
};

export function useAttendanceSummaryReport(
  tenantId: string,
  days: number = 30,
  page: number = 1
) {
  return useQuery({
    queryKey: REPORT_KEYS.attendanceSummary({ tenantId, days, page }),
    queryFn: () => reportApi.getAttendanceSummary(tenantId, days, page),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
    placeholderData: prev => prev,
  });
}

export function useLeaveSummary(page: number = 1) {
  return useQuery({
    queryKey: REPORT_KEYS.leaveSummary({ page }),
    queryFn: () => leaveReportApiService.getLeaveSummary(page),
    staleTime: 1000 * 60 * 5,
    placeholderData: prev => prev,
  });
}

export function useLeaveBalance() {
  return useQuery({
    queryKey: REPORT_KEYS.leaveBalance(),
    queryFn: () => leaveReportApiService.getLeaveBalance(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTeamLeaveSummary(month: number, year: number) {
  return useQuery({
    queryKey: REPORT_KEYS.teamLeaveSummary({ month, year }),
    queryFn: () => leaveReportApiService.getTeamLeaveSummary(month, year),
    staleTime: 1000 * 60 * 5,
    placeholderData: prev => prev,
  });
}

export function useAllLeaveReports(
  page: number = 1,
  month?: number,
  year?: number,
  employeeName?: string
) {
  return useQuery({
    queryKey: REPORT_KEYS.allLeaveReports({ page, month, year, employeeName }),
    queryFn: () =>
      leaveReportApiService.getAllLeaveReports(page, month, year, employeeName),
    staleTime: 1000 * 60 * 5,
    placeholderData: prev => prev,
  });
}
