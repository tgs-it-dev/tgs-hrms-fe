import type { Leave } from './leave';

/**
 * Canonical Team entity returned by the teams API.
 */
export interface Team {
  id: string;
  name: string;
  description: string;
  manager_id: string;
  created_at: string;
  updated_at: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_pic?: string | null;
  };
  teamMembers?: TeamMember[];
  members?: TeamMember[];
  memberCount?: number;
}

/**
 * Canonical TeamMember entity returned by the teams API.
 * Use AttendanceTeamMember for attendance-specific data,
 * and LeaveReportMember for leave-report-specific data.
 */
export interface TeamMember {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_pic?: string | null;
  };
  designation: {
    id: string;
    title: string;
    department?: {
      id: string;
      name: string;
    };
  };
  department?: {
    id: string;
    name: string;
  };
  team_id?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Team member shape used in attendance reporting.
 * Distinct from TeamMember because it carries attendance data.
 */
export interface AttendanceTeamMember {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  profile_pic?: string;
  designation?: string;
  department?: string;
  attendance: AttendanceEntry[];
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  totalDaysWorked?: number;
  totalHoursWorked?: number;
}

/** Single attendance entry row inside AttendanceTeamMember. */
export interface AttendanceEntry {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: number;
}

/**
 * Team member shape used in leave reports.
 * Distinct from TeamMember because it carries leave data.
 */
export interface LeaveReportMember {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  leaves: Leave[];
  totalLeaveDays: number;
}

/** Manager option used in team create/edit dropdowns. */
export interface Manager {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

// ── System-admin multi-tenant views ──────────────────────────────────────────

export interface TenantTeamMember {
  id: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile_pic?: string | null;
  };
  designation: {
    id: string;
    title: string;
  };
  department: {
    id: string;
    name: string;
  };
}

export interface TenantTeam {
  id: string;
  name: string;
  description: string;
  created_at: string;
  manager: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_pic?: string | null;
    role: string;
  };
  members: TenantTeamMember[];
}

export interface TenantTeams {
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  teams: TenantTeam[];
}

export interface AllTenantsTeamsResponse {
  tenants: TenantTeams[];
}

// ── DTOs (request payloads) ───────────────────────────────────────────────────

export interface CreateTeamDto {
  name: string;
  description?: string;
  manager_id: string;
}

export interface UpdateTeamDto {
  name?: string;
  description?: string;
  manager_id?: string;
}

export interface AddMemberDto {
  employee_id: string;
}

export interface RemoveMemberDto {
  employee_id: string;
}
