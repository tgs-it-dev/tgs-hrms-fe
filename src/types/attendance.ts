import type { UserShort } from './user';
import type { AttendanceTeamMember } from './team';

export interface AttendanceEvent {
  id: string;
  user_id: string;
  timestamp: string;
  type: 'check-in' | 'check-out' | string;
  near_boundary?: boolean;
  user?: UserShort;
  approvalStatus?: string | null;
}

export interface TeamAttendanceEntry {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: number;
}

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
  items: AttendanceTeamMember[];
  total: number;
  page: number;
  totalPages: number;
}
