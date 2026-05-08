import { extractErrorMessage } from '../utils/errorHandler';
import axiosInstance from './axiosInstance';
import type {
  BackendEmployee,
  GenderPercentage,
  EmployeeJoiningReport,
  EmployeeFullProfile,
  EmployeeDto,
  EmployeeUpdateDto,
} from '../types/employee';

export type {
  BackendEmployee,
  GenderPercentage,
  EmployeeJoiningReport,
  EmployeeProfileAttendanceSummaryItem,
  EmployeeProfileLeaveHistoryItem,
  EmployeeFullProfile,
  EmployeeDto,
  EmployeeUpdateDto,
} from '../types/employee';

type EmployeeFilters = {
  departmentId?: string;
  designationId?: string;
};

type RawUser = {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
  profile_pic?: string;
  gender?: string;
};

type RawDepartment = {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  created_at: string;
  updated_at?: string;
};

type RawDesignation = {
  id: string;
  title: string;
  department_id: string;
  created_at: string;
  updated_at?: string;
  department?: RawDepartment;
};

type RawEmployee = {
  id: string;
  user_id: string;
  designation_id: string;
  invite_status?: string;
  created_at: string;
  updated_at?: string;
  user?: RawUser;
  designation?: RawDesignation;
  role_id?: string;
  role_name?: string;
  gender?: string;
};

function normalizeEmployee(raw: unknown): BackendEmployee {
  const data = raw as Record<string, unknown>;
  const user = data?.user as RawUser | undefined;
  const designation = data?.designation as RawDesignation | undefined;
  const department = designation?.department;

  const roleId =
    (data.role_id as string) ||
    (user && ((user as Record<string, unknown>).role_id as string)) ||
    '';
  const roleName =
    (data.role_name as string) ||
    (user && ((user as Record<string, unknown>).role_name as string)) ||
    '';

  if (user && designation) {
    return {
      id: data.id as string,
      user_id: (data.user_id as string) || user?.id, // Preserve user_id for profile picture fetching
      name: user
        ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
        : '',
      firstName: user?.first_name,
      lastName: user?.last_name,
      email: user?.email ?? '',
      phone: user?.phone ?? '',
      role_id: roleId,
      role_name: roleName,
      departmentId: designation.department_id ?? '',
      designationId: data.designation_id as string,
      status: data.invite_status as string,
      cnic_number: data.cnic_number as string,
      profile_picture:
        (user?.profile_pic as string) || (data.profile_picture as string),
      cnic_picture: data.cnic_picture as string,
      cnic_back_picture: data.cnic_back_picture as string,
      gender: (user?.gender as string) || (data.gender as string),
      department: department
        ? {
            id: department.id,
            name: department.name,
            description: department.description ?? '',
            tenantId: department.tenant_id,
            createdAt: department.created_at,
            updatedAt: department.updated_at ?? department.created_at,
          }
        : null,
      designation: {
        id: designation.id,
        title: designation.title,
        tenantId: user.tenant_id ?? '',
        departmentId: designation.department_id,
        createdAt: designation.created_at,
        updatedAt: designation.updated_at ?? designation.created_at,
      },
      tenantId: user.tenant_id ?? '',
      createdAt: data.created_at as string,
      updatedAt: (data.updated_at as string) ?? (data.created_at as string),
    };
  }

  return {
    id: (data.id as string) || `fallback-${Date.now()}`,
    user_id: (data.user_id as string) || (user?.id as string),
    name: (data.name as string) || (data.title as string) || 'Unknown Employee',
    firstName: (data.first_name as string) || 'Unknown',
    lastName: (data.last_name as string) || 'Employee',
    email: (data.email as string) || 'unknown@company.com',
    phone: (data.phone as string) || '+1234567890',
    departmentId: (data.department_id as string) || '',
    designationId: (data.designation_id as string) || (data.id as string) || '',
    status: data.invite_status as string,
    cnic_number: data.cnic_number as string,
    profile_picture: data.profile_picture as string,
    cnic_picture: data.cnic_picture as string,
    cnic_back_picture: data.cnic_back_picture as string,
    gender: (user?.gender as string) || (data.gender as string),
    department: null,
    designation: null,
    tenantId: (data.tenant_id as string) || '',
    createdAt: (data.created_at as string) || new Date().toISOString(),
    updatedAt:
      (data.updated_at as string) ||
      (data.created_at as string) ||
      new Date().toISOString(),
  };
}

class EmployeeApiService {
  private baseUrl = '/employees';

  private buildFormData(employeeData: EmployeeDto): FormData {
    const formData = new FormData();
    formData.append('first_name', employeeData.first_name);
    formData.append('last_name', employeeData.last_name);
    formData.append('email', employeeData.email);
    formData.append('phone', employeeData.phone);
    if (employeeData.password)
      formData.append('password', employeeData.password);
    formData.append('designation_id', employeeData.designationId);
    formData.append('gender', employeeData.gender);
    if (employeeData.role_name)
      formData.append('role_name', employeeData.role_name);
    if (employeeData.role_id) formData.append('role_id', employeeData.role_id);
    if (employeeData.team_id) formData.append('team_id', employeeData.team_id);
    if (employeeData.cnicNumber)
      formData.append('cnic_number', employeeData.cnicNumber);
    if (employeeData.profilePicture)
      formData.append(
        'profile_picture',
        employeeData.profilePicture,
        employeeData.profilePicture.name
      );
    if (employeeData.cnicFrontPicture)
      formData.append(
        'cnic_picture',
        employeeData.cnicFrontPicture,
        employeeData.cnicFrontPicture.name
      );
    if (employeeData.cnicBackPicture)
      formData.append(
        'cnic_back_picture',
        employeeData.cnicBackPicture,
        employeeData.cnicBackPicture.name
      );
    return formData;
  }

  private async createByEndpoint(
    endpoint: string,
    employeeData: EmployeeDto
  ): Promise<BackendEmployee> {
    const response = await axiosInstance.post<RawEmployee>(
      endpoint,
      this.buildFormData(employeeData)
    );
    return normalizeEmployee(response.data);
  }

  async getAllEmployees(
    filters: EmployeeFilters = {},
    page: number | null = 1
  ): Promise<{
    items: BackendEmployee[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const params: Record<string, string | number> = {};
      if (page !== null) {
        params.page = page;
        params.limit = 25;
      }
      if (filters.departmentId) params.department_id = filters.departmentId;
      if (filters.designationId) params.designation_id = filters.designationId;

      const response = await axiosInstance.get(this.baseUrl, { params });

      const itemsArray = Array.isArray(response.data.items)
        ? response.data.items
        : Array.isArray(response.data)
          ? response.data
          : [];

      const normalizedItems = itemsArray
        .map((item: unknown) => {
          try {
            return normalizeEmployee(item);
          } catch {
            return null;
          }
        })
        .filter(
          (e: BackendEmployee | null): e is BackendEmployee => e !== null
        );

      return {
        items: normalizedItems,
        total: response.data.total || normalizedItems.length,
        page: response.data.page || page,
        limit: response.data.limit || 25,
        totalPages: response.data.totalPages || 1,
      };
    } catch {
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
  }

  async getAllEmployeesWithoutPagination(): Promise<BackendEmployee[]> {
    let allEmployees: BackendEmployee[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await this.getAllEmployees({}, currentPage);
      allEmployees = [...allEmployees, ...res.items];
      hasMore = currentPage < res.totalPages;
      currentPage++;
    }

    return allEmployees;
  }

  async getEmployeeById(id: string): Promise<BackendEmployee> {
    const response = await axiosInstance.get<RawEmployee>(
      `${this.baseUrl}/${id}`
    );
    return normalizeEmployee(response.data);
  }

  async getEmployeeProfile(userId: string): Promise<EmployeeFullProfile> {
    const response = await axiosInstance.get<EmployeeFullProfile>(
      `${this.baseUrl}/users/${userId}/profile`
    );
    return response.data;
  }

  async createEmployee(employeeData: EmployeeDto): Promise<BackendEmployee> {
    // NOTE: We intentionally do NOT wrap/transform errors here.
    // The caller (UI) needs access to `error.response.data` for special flows
    // like `requiresPayment` + `checkoutUrl` returned by the backend.
    return this.createByEndpoint(this.baseUrl, employeeData);
  }

  async createManager(employeeData: EmployeeDto): Promise<BackendEmployee> {
    return this.createByEndpoint(`${this.baseUrl}/manager`, employeeData);
  }

  async createHrAdmin(employeeData: EmployeeDto): Promise<BackendEmployee> {
    return this.createByEndpoint(`${this.baseUrl}/hr-admin`, employeeData);
  }

  async updateEmployee(
    id: string,
    updates: EmployeeUpdateDto & { role_name?: string }
  ): Promise<BackendEmployee> {
    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();

      if (updates.first_name !== undefined)
        formData.append('first_name', updates.first_name);
      if (updates.last_name !== undefined)
        formData.append('last_name', updates.last_name);
      if (updates.email !== undefined) formData.append('email', updates.email);
      if (updates.phone !== undefined) formData.append('phone', updates.phone);
      if (updates.password && updates.password.trim() !== '')
        formData.append('password', updates.password);
      if (updates.gender !== undefined)
        formData.append('gender', updates.gender);

      if (updates.role_name && updates.role_name.trim() !== '') {
        formData.append('role_name', updates.role_name);
      }

      if (updates.designationId && updates.designationId.trim() !== '') {
        formData.append('designation_id', updates.designationId);
      }

      if (updates.cnicNumber !== undefined)
        formData.append('cnic_number', updates.cnicNumber);

      // Add image files if they exist
      if (
        updates.profilePicture !== undefined &&
        updates.profilePicture !== null
      ) {
        formData.append(
          'profile_picture',
          updates.profilePicture,
          updates.profilePicture.name
        );
      }
      if (
        updates.cnicFrontPicture !== undefined &&
        updates.cnicFrontPicture !== null
      ) {
        formData.append(
          'cnic_picture',
          updates.cnicFrontPicture,
          updates.cnicFrontPicture.name
        );
      }
      if (
        updates.cnicBackPicture !== undefined &&
        updates.cnicBackPicture !== null
      ) {
        formData.append(
          'cnic_back_picture',
          updates.cnicBackPicture,
          updates.cnicBackPicture.name
        );
      }

      const response = await axiosInstance.put<RawEmployee>(
        `${this.baseUrl}/${id}`,
        formData
      );
      return normalizeEmployee(response.data);
    } catch (error) {
      const result = extractErrorMessage(error);
      throw new Error(result.message);
    }
  }

  async deleteEmployee(id: string): Promise<{ deleted: true; id: string }> {
    const response = await axiosInstance.delete<{ deleted: true; id: string }>(
      `${this.baseUrl}/${id}`
    );
    return response.data;
  }

  async deleteDocument(
    id: string,
    documentUrl: string
  ): Promise<{ success: boolean }> {
    const response = await axiosInstance.delete<{ success: boolean }>(
      `${this.baseUrl}/${id}/documents`,
      { data: { documentUrl } }
    );
    return response.data;
  }

  async getGenderPercentage(): Promise<GenderPercentage> {
    const response = await axiosInstance.get<GenderPercentage>(
      `${this.baseUrl}/gender-percentage`
    );
    return response.data;
  }

  async resendInvite(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await axiosInstance.post<{ message: string }>(
      `${this.baseUrl}/${id}/refresh-invite-status`
    );
    return { success: true, message: response.data.message };
  }

  // Image blob endpoints removed. Image paths should come directly from list/detail APIs.

  // Export employees for all tenants as CSV (System-admin only)
  async exportSystemEmployeesCSV(
    tenantId?: string,
    departmentId?: string,
    designationId?: string
  ): Promise<Blob> {
    const params: Record<string, string> = {};
    if (tenantId) {
      params.tenantId = tenantId;
    }
    if (departmentId) {
      params.departmentId = departmentId;
    }
    if (designationId) {
      params.designationId = designationId;
    }
    const response = await axiosInstance.get('/employees/system/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
}

export const getEmployeeJoiningReport = async (): Promise<
  EmployeeJoiningReport[]
> => {
  const response = await axiosInstance.get('/employees/joining-report');
  return response.data;
};

export const getAttendanceThisMonth = async (): Promise<{
  status?: string;
  data?: { total_attendance: number };
}> => {
  const response = await axiosInstance.get('/employees/attendance-this-month');
  return response.data;
};

export const getLeavesThisMonth = async (): Promise<{
  status?: string;
  data?: { total_leaves: number };
}> => {
  const response = await axiosInstance.get('/employees/leaves-this-month');
  return response.data;
};

const employeeApi = new EmployeeApiService();
export default employeeApi;
