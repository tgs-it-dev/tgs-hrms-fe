import axiosInstance from './axiosInstance';
import type { UserShort } from '../types/user';
import type { AttendanceTeamMember } from '../types/team';

export type { UserShort } from '../types/user';
export type { AttendanceTeamMember } from '../types/team';

export interface AttendanceEvent {
  id: string;
  user_id: string;
  timestamp: string;
  type: 'check-in' | 'check-out' | string;
  near_boundary?: boolean;
  user?: UserShort;
  approvalStatus?: string | null;
}

/** Single attendance row in AttendanceTeamMember.attendance. */
export interface TeamAttendanceEntry {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: number;
}

/** @deprecated Use AttendanceTeamMember from src/types/team.ts */
export type TeamMember = AttendanceTeamMember;

export interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: number;
}

export interface AttendanceResponse {
  items: AttendanceEvent[] | AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SystemTenantEmployeeAttendance {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_pic: string;
  attendance: {
    date: string;
    checkIn: string | null;
    checkOut: string | null;
    workedHours: number;
  }[];
  totalDaysWorked: number;
  totalHoursWorked: number;
}

export interface SystemTenantAttendance {
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  employees: SystemTenantEmployeeAttendance[];
  totalEmployees: number;
  totalAttendanceRecords: number;
}

export interface SystemAllAttendanceResponse {
  tenants: SystemTenantAttendance[];
  totalTenants: number;
}

export interface TodayTeamAttendanceMember {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_pic?: string;
  designation?: string;
  department?: string;
  attendance: {
    date: string;
    checkIn: string;
    checkInId: string;
    checkOut: string | null;
    checkOutId: string | null;
    workedHours: number;
    approvalStatus: string;
    approvalRemarks: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
  }[];
  totalDaysWorked: number;
  totalHoursWorked: number;
}

export interface TodayTeamAttendanceResponse {
  items: TodayTeamAttendanceMember[];
  total: number;
}

export interface TeamAttendanceResponse {
  items: AttendanceEvent[];
  total: number;
  page: number;
  totalPages: number;
}

class AttendanceApiService {
  private baseUrl = '/attendance';

  // Get all attendance records (Admin only)
  async getAllAttendance(
    page: number = 1,
    startDate?: string,
    endDate?: string,
    selectedEmployee?: string,
    tenantId?: string
  ): Promise<AttendanceResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (selectedEmployee) {
        params.append('userId', selectedEmployee);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
      }

      const response = await axiosInstance.get<AttendanceResponse>(
        `${this.baseUrl}/all?${params.toString()}`
      );

      if (response.data && response.data.items) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Get attendance events for a user
  async getAttendanceEvents(
    userId?: string,
    page: number = 1,
    startDate?: string,
    endDate?: string,
    tenantId?: string
  ): Promise<AttendanceResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (userId) {
        params.append('userId', userId);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
      }

      const url = `${this.baseUrl}/events?${params.toString()}`;

      const response = await axiosInstance.get<AttendanceResponse>(url);

      if (response.data && response.data.items) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // UPDATED: Get daily summaries for a user with date filtering support
  async getDailySummaries(
    userId?: string,
    page: number = 1,
    startDate?: string,
    endDate?: string,
    tenantId?: string
  ): Promise<AttendanceResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (userId) {
        params.append('userId', userId);
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
      }

      const url = `${this.baseUrl}?${params.toString()}`; // This hits the /attendance endpoint for daily summaries

      const response = await axiosInstance.get<AttendanceResponse>(url);

      if (response.data && response.data.items) {
        return response.data;
      } else if (Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Get today's summary
  async getTodaySummary(
    userId?: string
  ): Promise<{ checkIn: string | null; checkOut: string | null }> {
    try {
      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      }

      const url = `${this.baseUrl}/today?${params.toString()}`;

      const response = await axiosInstance.get<{
        checkIn: string | null;
        checkOut: string | null;
      }>(url);

      return response.data;
    } catch {
      return {
        checkIn: null,
        checkOut: null,
      };
    }
  }

  // Create attendance record. Accept optional coordinates for check-in.
  async createAttendance(
    payload:
      | { type: 'check-in' | 'check-out' | string }
      | { type: string; latitude?: number; longitude?: number }
  ): Promise<AttendanceEvent> {
    // Normalize type to backend expected format (prefer uppercase with underscore)
    // Normalize type to backend expected format (prefer uppercase with underscore)
    // Use an intersection type to safely access properties that might exist
    const input = payload as {
      type: string;
      latitude?: number;
      longitude?: number;
    };
    let typeVal = input.type || '';
    if (typeof typeVal === 'string') {
      const lowered = typeVal.toLowerCase();
      if (
        lowered === 'check-in' ||
        lowered === 'check_in' ||
        lowered === 'check in'
      )
        typeVal = 'check-in';
      else if (
        lowered === 'check-out' ||
        lowered === 'check_out' ||
        lowered === 'check out'
      )
        typeVal = 'check-out';
      else typeVal = lowered;
    }

    const body: { type: string; latitude?: number; longitude?: number } = {
      type: typeVal,
    };
    if (typeof input.latitude === 'number') body.latitude = input.latitude;
    if (typeof input.longitude === 'number') body.longitude = input.longitude;

    const response = await axiosInstance.post<AttendanceEvent>(
      this.baseUrl,
      body
    );
    return response.data;
  }

  // Get team attendance for manager
  async getTeamAttendance(
    page: number = 1,
    startDate?: string,
    endDate?: string,
    tenantId?: string
  ): Promise<{
    items: AttendanceEvent[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (tenantId) {
        params.append('tenantId', tenantId);
      }
      const response = await axiosInstance.get<TeamAttendanceResponse>(
        `${this.baseUrl}/team?${params.toString()}`
      );
      return response.data;
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        totalPages: 1,
      };
    }
  }

  // Get today's attendance for all team members (Manager only)
  async getTodayTeamAttendance(): Promise<TodayTeamAttendanceResponse> {
    try {
      const response = await axiosInstance.get<TodayTeamAttendanceResponse>(
        `${this.baseUrl}/team/today/attendance`
      );
      return response.data;
    } catch {
      return {
        items: [],
        total: 0,
      };
    }
  }

  // Approve a single check-in (Manager only)
  async approveCheckIn(id: string): Promise<AttendanceEvent> {
    const response = await axiosInstance.patch(
      `${this.baseUrl}/check-in/${id}/approve`
    );
    return response.data;
  }

  // Disapprove a single check-in (Manager only)
  async disapproveCheckIn(id: string): Promise<AttendanceEvent> {
    const response = await axiosInstance.patch(
      `${this.baseUrl}/check-in/${id}/disapprove`
    );
    return response.data;
  }

  // Approve all today's check-ins (Manager only)
  async approveAllCheckIns(): Promise<{ updated: number }> {
    const response = await axiosInstance.patch(
      `${this.baseUrl}/check-in/approve-all`
    );
    return response.data;
  }

  // Disapprove all today's check-ins (Manager only)
  async disapproveAllCheckIns(): Promise<{ updated: number }> {
    const response = await axiosInstance.patch(
      `${this.baseUrl}/check-in/disapprove-all`
    );
    return response.data;
  }

  // Get system-wide (cross-tenant) attendance for system admin
  async getSystemAllAttendance(
    startDate?: string,
    endDate?: string
  ): Promise<SystemAllAttendanceResponse> {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }

    const query = params.toString();
    const url =
      query.length > 0
        ? `${this.baseUrl}/system/all?${query}`
        : `${this.baseUrl}/system/all`;

    const response = await axiosInstance.get<SystemAllAttendanceResponse>(url);
    return response.data;
  }
}

const attendanceApi = new AttendanceApiService();
export default attendanceApi;
