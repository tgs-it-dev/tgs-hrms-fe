import axiosInstance from './axiosInstance';
import type { LeaveReportMember } from '../types/team';

export type { LeaveReportMember } from '../types/team';

/** @deprecated Use LeaveReportMember */
export type TeamMember = LeaveReportMember;

export interface LeaveSummaryItem {
  type: string;
  used: number;
  remaining: number;
}

export interface LeaveSummaryResponse {
  year: number;
  summary: LeaveSummaryItem[];
}

export interface TeamLeaveSummaryResponse {
  managerId: string;
  month: number;
  year: number;
  teamMembers: LeaveReportMember[];
  totalTeamMembers: number;
  membersOnLeave: number;
}

export interface LeaveBalanceItem {
  leaveTypeId: string;
  leaveTypeName: string;
  maxDaysPerYear: number;
  used: number;
  remaining: number;
  carryForward: boolean;
}

export interface LeaveBalanceResponse {
  employeeId: string;
  year: number;
  balances: LeaveBalanceItem[];
}

export interface AllLeaveReportsResponse {
  period?: {
    year: number;
    startDate: string;
    endDate: string;
  };
  organizationStats?: {
    totalEmployees: number;
    employeesOnLeave: number;
    totalLeaveDays: number;
    totalPendingDays: number;
    totalLeaveRequests: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
  };
  employeeReports:
    | EmployeeReport[]
    | {
        items: EmployeeReport[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  leaveTypes?: Array<{
    id: string;
    name: string;
    maxDaysPerYear: number;
    carryForward: boolean;
  }>;
}

export interface LeaveRecord {
  id: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number | null;
  status: 'approved' | 'pending' | 'rejected' | 'processing';
  reason?: string;
  appliedDate: string;
  approvedBy?: string | null;
  approvedDate?: string | null;
}

export interface LeaveSummaryItem {
  leaveTypeId: string;
  leaveTypeName: string;
  totalDays: number;
  approvedDays: number;
  pendingDays: number;
  rejectedDays: number;
  maxDaysPerYear: number;
  remainingDays: number;
}

export interface EmployeeReport {
  employeeId: string;
  employeeName: string;
  email?: string;
  department: string;
  designation: string;
  leaveSummary: LeaveSummaryItem[];
  leaveRecords: LeaveRecord[];
  totals: {
    totalLeaveDays: number;
    approvedLeaveDays: number;
    pendingLeaveDays: number;
    totalLeaveRequests: number;
    approvedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
  };
}

class LeaveReportApiService {
  private baseUrl = '/reports';

  async getLeaveSummary(userId: string, page: number): Promise<LeaveSummaryResponse> {
    const response = await axiosInstance.get<LeaveSummaryResponse>(
      `${this.baseUrl}/leave-summary`,
      { params: { userId, page } }
    );
    return response.data;
  }

  async getTeamLeaveSummary(
    managerId: string,
    month: number,
    year: number
  ): Promise<TeamLeaveSummaryResponse> {
    const response = await axiosInstance.get<TeamLeaveSummaryResponse>(
      `${this.baseUrl}/team-leave-summary`,
      { params: { managerId, month, year } }
    );
    return response.data;
  }

  async getLeaveBalance(userId: string): Promise<LeaveBalanceResponse> {
    const response = await axiosInstance.get<LeaveBalanceResponse>(
      `${this.baseUrl}/leave-balance`,
      { params: { employeeId: userId } }
    );
    return response.data;
  }

  async exportLeaveSummaryCSV(userId: string, year: number): Promise<Blob> {
    const response = await axiosInstance.get<Blob>(
      `${this.baseUrl}/leave-summary/export`,
      {
        params: { employeeId: userId, year },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async exportTeamLeaveSummaryCSV(managerId: string, month: number, year: number): Promise<Blob> {
    const response = await axiosInstance.get<Blob>(
      `${this.baseUrl}/team-leave-summary/export`,
      {
        params: { managerId, month, year },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  async exportLeaveBalanceCSV(userId: string): Promise<Blob> {
    const response = await axiosInstance.get<Blob>(
      `${this.baseUrl}/leave-balance/export`,
      {
        params: { employeeId: userId },
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /** GET /reports/export/all-leave-reports - backend export (year, employeeName) */
  async exportAllLeaveReports(params?: {
    year?: number;
    employeeName?: string;
  }): Promise<Blob> {
    const year = params?.year ?? new Date().getFullYear();
    const requestParams: { year: number; employeeName?: string } = { year };
    if (params?.employeeName) requestParams.employeeName = params.employeeName;
    const response = await axiosInstance.get<Blob>(
      `${this.baseUrl}/export/all-leave-reports`,
      { params: requestParams, responseType: 'blob' }
    );
    return response.data;
  }

  async getAllLeaveReports(
    page: number = 1,
    month?: number,
    year?: number,
    employeeName?: string
  ): Promise<AllLeaveReportsResponse> {
    const params: {
      page: number;
      month?: number;
      year?: number;
      employeeName?: string;
    } = { page };
    if (month) params.month = month;
    if (year) params.year = year;
    if (employeeName) params.employeeName = employeeName;

    const response = await axiosInstance.get<AllLeaveReportsResponse>(
      `${this.baseUrl}/all-leave-reports`,
      { params }
    );
    const data = response.data;

    if (!data) {
      throw new Error('No response data received');
    }

    // Helper function to calculate days between two dates
    const calculateDays = (startDate: string, endDate: string): number => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.floor(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diff >= 0 ? diff + 1 : 0; // +1 to include both start and end dates
      } catch {
        return 0;
      }
    };

    // Handle new API response structure with nested employeeReports.items
    let employeeReportsData: EmployeeReport[] = [];
    let paginationInfo: {
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    } = {};

    if (
      data.employeeReports &&
      typeof data.employeeReports === 'object' &&
      'items' in data.employeeReports
    ) {
      // New structure: employeeReports is an object with items array
      employeeReportsData = Array.isArray(data.employeeReports.items)
        ? data.employeeReports.items
        : [];
      paginationInfo = {
        total: data.employeeReports.total,
        page: data.employeeReports.page,
        limit: data.employeeReports.limit,
        totalPages: data.employeeReports.totalPages,
      };
    } else if (Array.isArray(data.employeeReports)) {
      // Old structure: employeeReports is directly an array
      employeeReportsData = data.employeeReports;
      paginationInfo = {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      };
    }

    if (employeeReportsData.length > 0) {
      const fixedReports = employeeReportsData.map((emp: EmployeeReport) => {
        const leaveRecords: LeaveRecord[] = emp.leaveRecords || [];
        const leaveSummary: LeaveSummaryItem[] = emp.leaveSummary || [];

        // Create a map of leave type IDs to their summaries for quick lookup
        const summaryMap = new Map<string, LeaveSummaryItem>();
        leaveSummary.forEach((summary: LeaveSummaryItem) => {
          summaryMap.set(summary.leaveTypeId, {
            ...summary,
            approvedDays: summary.approvedDays ?? 0,
            pendingDays: summary.pendingDays ?? 0,
            rejectedDays: summary.rejectedDays ?? 0,
            totalDays: summary.totalDays ?? 0,
          });
        });

        // Process leave records to calculate actual days used per leave type
        const leaveTypeStats = new Map<
          string,
          {
            approvedDays: number;
            pendingDays: number;
            rejectedDays: number;
            totalDays: number;
          }
        >();

        leaveRecords.forEach((record: LeaveRecord) => {
          if (!record.startDate || !record.endDate) return;

          // Calculate days for this record
          let recordDays = record.totalDays;
          if (recordDays === null || recordDays === undefined) {
            recordDays = calculateDays(record.startDate, record.endDate);
          }

          // Try to find the leave type ID from the summary
          // If leaveTypeName matches, use that leaveTypeId
          let leaveTypeId: string | null = null;
          for (const [id, summary] of summaryMap.entries()) {
            if (
              summary.leaveTypeName === record.leaveTypeName ||
              summary.leaveTypeName.toLowerCase() ===
                record.leaveTypeName?.toLowerCase()
            ) {
              leaveTypeId = id;
              break;
            }
          }

          // If we found a matching leave type, update stats
          if (leaveTypeId) {
            const stats = leaveTypeStats.get(leaveTypeId) || {
              approvedDays: 0,
              pendingDays: 0,
              rejectedDays: 0,
              totalDays: 0,
            };

            if (record.status === 'approved') {
              stats.approvedDays += recordDays;
            } else if (record.status === 'pending') {
              stats.pendingDays += recordDays;
            } else if (record.status === 'rejected') {
              stats.rejectedDays += recordDays;
            }
            stats.totalDays += recordDays;

            leaveTypeStats.set(leaveTypeId, stats);
          }
        });

        // Update leave summary with calculated values
        const updatedLeaveSummary = leaveSummary.map(
          (summary: LeaveSummaryItem) => {
            const stats = leaveTypeStats.get(summary.leaveTypeId);
            const approvedDays =
              stats?.approvedDays ?? summary.approvedDays ?? 0;
            const pendingDays = stats?.pendingDays ?? summary.pendingDays ?? 0;
            const rejectedDays =
              stats?.rejectedDays ?? summary.rejectedDays ?? 0;
            const totalDays = approvedDays + pendingDays + rejectedDays;

            // Prefer backend remainingDays if provided (may be negative when over-used)
            const remainingDays =
              summary.remainingDays ??
              (summary.maxDaysPerYear ?? 0) - approvedDays;

            return {
              ...summary,
              approvedDays,
              pendingDays,
              rejectedDays,
              totalDays,
              remainingDays,
            };
          }
        );

        // Calculate totals from leave records
        const validRecords = leaveRecords.filter(
          (r: LeaveRecord) => r.startDate && r.endDate
        );

        let totalLeaveDays = 0;
        let approvedLeaveDays = 0;
        let pendingLeaveDays = 0;
        let approvedRequests = 0;
        let pendingRequests = 0;
        let rejectedRequests = 0;

        validRecords.forEach((record: LeaveRecord) => {
          let recordDays = record.totalDays;
          if (recordDays === null || recordDays === undefined) {
            recordDays = calculateDays(record.startDate, record.endDate);
          }

          totalLeaveDays += recordDays;

          if (record.status === 'approved') {
            approvedLeaveDays += recordDays;
            approvedRequests += 1;
          } else if (record.status === 'pending') {
            pendingLeaveDays += recordDays;
            pendingRequests += 1;
          } else if (record.status === 'rejected') {
            rejectedRequests += 1;
          }
        });

        // Update totals, preferring calculated values if backend values are 0 or missing
        const totals = emp.totals || {};
        const updatedTotals = {
          totalLeaveDays:
            totalLeaveDays > 0 ? totalLeaveDays : (totals.totalLeaveDays ?? 0),
          approvedLeaveDays:
            approvedLeaveDays > 0
              ? approvedLeaveDays
              : (totals.approvedLeaveDays ?? 0),
          pendingLeaveDays:
            pendingLeaveDays > 0
              ? pendingLeaveDays
              : (totals.pendingLeaveDays ?? 0),
          totalLeaveRequests:
            validRecords.length > 0
              ? validRecords.length
              : (totals.totalLeaveRequests ?? 0),
          approvedRequests:
            approvedRequests > 0
              ? approvedRequests
              : (totals.approvedRequests ?? 0),
          pendingRequests:
            pendingRequests > 0
              ? pendingRequests
              : (totals.pendingRequests ?? 0),
          rejectedRequests:
            rejectedRequests > 0
              ? rejectedRequests
              : (totals.rejectedRequests ?? 0),
        };

        return {
          ...emp,
          leaveSummary: updatedLeaveSummary,
          leaveRecords: leaveRecords.map((record: LeaveRecord) => ({
            ...record,
            totalDays:
              record.totalDays ??
              (record.startDate && record.endDate
                ? calculateDays(record.startDate, record.endDate)
                : 0),
          })),
          totals: updatedTotals,
        };
      });

      return {
        period: data.period,
        organizationStats: data.organizationStats,
        employeeReports: fixedReports,
        total: paginationInfo.total || fixedReports.length,
        page: paginationInfo.page || page,
        limit: paginationInfo.limit || 25,
        totalPages: paginationInfo.totalPages || 1,
        leaveTypes: data.leaveTypes,
      };
    }

    // Fallback for other response structures
    // Check if employeeReports is an object with items property
    if (
      data.employeeReports &&
      typeof data.employeeReports === 'object' &&
      !Array.isArray(data.employeeReports) &&
      'items' in data.employeeReports &&
      Array.isArray(data.employeeReports.items)
    ) {
      const reportsWithItems = data.employeeReports as {
        items: EmployeeReport[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      };
      return {
        period: data.period,
        organizationStats: data.organizationStats,
        employeeReports: reportsWithItems.items,
        total: reportsWithItems.total || reportsWithItems.items.length,
        page: reportsWithItems.page || page,
        limit: reportsWithItems.limit || 25,
        totalPages: reportsWithItems.totalPages || 1,
        leaveTypes: data.leaveTypes,
      };
    }

    if (Array.isArray(data)) {
      return {
        employeeReports: data,
        total: data.length,
        page,
        limit: 25,
        totalPages: 1,
      };
    }

    throw new Error('Unexpected response structure for all leave reports');
  }
}

export const leaveReportApiService = new LeaveReportApiService();

// Maintain backward compatibility
export const leaveReportApi = leaveReportApiService;
