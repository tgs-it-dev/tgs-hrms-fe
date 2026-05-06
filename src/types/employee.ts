import type { Department, Designation } from './department';

// Re-export so existing imports of Department/Designation from this module keep working.
export type { Department, Designation };

// ── Form data ─────────────────────────────────────────────────────────────────

export interface DepartmentFormData {
  name: string;
  description?: string;
}

export interface DepartmentFormErrors {
  name?: string;
  description?: string;
}

export interface FormData {
  department: string;
  designation: string;
}

export interface FormErrors {
  department?: string;
  designation?: string;
}

// ── Employee entities ─────────────────────────────────────────────────────────

/** Full backend employee record as stored in the database. */
export interface BackendEmployee {
  id: string;
  user_id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role_id?: string;
  role_name?: string;
  departmentId: string;
  designationId: string;
  status?: string;
  cnic_number?: string;
  profile_picture?: string;
  cnic_picture?: string;
  cnic_back_picture?: string;
  department: {
    id: string;
    name: string;
    description: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  designation: {
    id: string;
    title: string;
    tenantId: string;
    departmentId: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeProfileAttendanceSummaryItem {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: number;
}

export interface EmployeeProfileLeaveHistoryItem {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  type: string;
  status: string;
}

export interface EmployeeFullProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string | null;
  department: string | null;
  joinedAt: string;
  profile_pic?: string | null;
  attendanceSummary: EmployeeProfileAttendanceSummaryItem[];
  leaveHistory: EmployeeProfileLeaveHistoryItem[];
}

export interface EmployeeJoiningReport {
  month: number;
  year: number;
  total: number;
}

export interface GenderPercentage {
  male: number;
  female: number;
  total: number;
}

export interface EmployeeDto {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password?: string;
  designationId: string;
  gender: string;
  role_name?: string;
  role_id?: string;
  team_id?: string;
  cnicNumber?: string;
  profilePicture?: File | null;
  cnicFrontPicture?: File | null;
  cnicBackPicture?: File | null;
}

export interface EmployeeUpdateDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  designationId?: string;
  role_id?: string;
  role_name?: string;
  gender?: string;
  cnicNumber?: string;
  profilePicture?: File | null;
  cnicFrontPicture?: File | null;
  cnicBackPicture?: File | null;
}

export interface EmployeePerformance {
  id: string;
  employee_id: string;
  kpi_id: string;
  targetValue?: number | null;
  achievedValue?: number | null;
  score?: number | null;
  reviewCycle?: string | null;
  reviewedBy: string;
  remarks: string;
  tenant_id: string;
  createdAt: string;
  kpi?: {
    id: string;
    title: string;
    description: string;
    weight: number;
    category: string;
    status: string;
  } | null;
}
