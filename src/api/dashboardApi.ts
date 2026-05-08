import axiosInstance from './axiosInstance';

export type DashboardKpi = {
  totalEmployees: number;
  salaryPaid: number;
  salaryUnpaid: number;
  presentToday: number;
  onLeave: number;
  timestamp?: string;
};

export async function getDashboardKpi(): Promise<DashboardKpi | null> {
  try {
    const resp =
      await axiosInstance.get<Record<string, unknown>>('/dashboard/kpi');
    const data = resp?.data ?? resp;

    const mapped: DashboardKpi = {
      totalEmployees:
        Number(
          data.total_employees ??
            data.totalEmployees ??
            data.total_employees_count ??
            0
        ) || 0,
      salaryPaid:
        Number(data.salary_paid ?? data.salaryPaid ?? data.total_salary ?? 0) ||
        0,
      salaryUnpaid: Number(data.salary_unpaid ?? data.salaryUnpaid ?? 0) || 0,
      presentToday:
        Number(
          data.employees_present_today ??
            data.presentToday ??
            data.employeesPresent ??
            data.employees_present ??
            0
        ) || 0,
      onLeave:
        Number(
          data.employees_on_leave_today ??
            data.onLeave ??
            data.employeesOnLeave ??
            data.employees_on_leave ??
            0
        ) || 0,
      timestamp: data.timestamp ?? undefined,
    };

    return mapped;
  } catch (err) {
    console.error('[dashboardApi] getDashboardKpi failed', err);
    return null;
  }
}

export type AttendanceRow = {
  department: string;
  total: number;
  present: number;
  absent: number;
};

export async function getAttendanceSummary(): Promise<AttendanceRow[]> {
  try {
    const resp = await axiosInstance.get<Array<Record<string, unknown>>>(
      '/dashboard/attendance-summary'
    );
    const data = resp?.data ?? resp;
    if (!Array.isArray(data)) return [];

    const normalized: AttendanceRow[] = (
      data as Array<Record<string, unknown>>
    ).map(d => ({
      department: String(d.department ?? d.name ?? 'Unknown'),
      total: Number(d.total ?? 0) || 0,
      present: Number(d.present ?? 0) || 0,
      absent: Number(d.absent ?? 0) || 0,
    }));

    return normalized;
  } catch (err) {
    console.error('[dashboardApi] getAttendanceSummary failed', err);
    return [];
  }
}
