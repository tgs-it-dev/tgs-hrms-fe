import { useQuery } from '@tanstack/react-query';
import systemDashboardApiService from '../../api/systemDashboardApi';
import { getDashboardKpi, getAttendanceSummary } from '../../api/dashboardApi';

export const DASHBOARD_KEYS = {
  all: ['dashboard'] as const,
  systemDashboard: () => [...DASHBOARD_KEYS.all, 'system'] as const,
  systemLogs: (page: number) =>
    [...DASHBOARD_KEYS.all, 'system-logs', page] as const,
  kpi: () => [...DASHBOARD_KEYS.all, 'kpi'] as const,
  attendanceSummary: () =>
    [...DASHBOARD_KEYS.all, 'attendance-summary'] as const,
};

export function useSystemDashboard(enabled: boolean) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.systemDashboard(),
    queryFn: () => systemDashboardApiService.getSystemDashboard(),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useSystemLogs(page: number, enabled: boolean) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.systemLogs(page),
    queryFn: () => systemDashboardApiService.getSystemLogs(page),
    enabled,
    staleTime: 1000 * 30, // 30 seconds — logs are more time-sensitive
  });
}

export function useDashboardKpi(enabled: boolean) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.kpi(),
    queryFn: getDashboardKpi,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAttendanceSummary(enabled: boolean) {
  return useQuery({
    queryKey: DASHBOARD_KEYS.attendanceSummary(),
    queryFn: getAttendanceSummary,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
