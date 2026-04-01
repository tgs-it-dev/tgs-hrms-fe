import axiosInstance from './axiosInstance';

export type SystemEmployee = {
  id: string;
  name: string;
  email?: string;
  tenantId: string;
  departmentId: string;
  departmentName: string;
  designationId: string;
  designationTitle: string;
  team?: string;
  status: string;
  inviteStatus: string;
  createdAt?: string;
};

export type SystemEmployeeDetails = SystemEmployee & {
  kpis: EmployeePerformance[];
  promotions: EmployeePromotion[];
  performanceReviews: EmployeePerformanceReview[];
};

export type EmployeeLeave = {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType?: {
    id: string;
    name: string;
    description?: string;
    maxDaysPerYear?: number;
    carryForward?: boolean;
    isPaid?: boolean;
    tenantId?: string;
    createdBy?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  approvedBy: string | null;
  tenantId: string;
  approvedAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmployeeAsset = {
  id: string;
  name: string;
  category: string;
  subcategory_id: string;
  status: string;
  assigned_to: string;
  purchase_date: string;
  tenant_id: string;
  created_at: string;
};

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

export interface EmployeePromotion {
  id?: string;
  previousDesignation: string;
  newDesignation: string;
  effectiveDate: string;
  status: string;
  remarks?: string | null;
}

export interface EmployeePerformanceReview {
  id?: string;
  cycle: string;
  overallScore?: number | null;
  status: string;
  recommendation?: string | null;
}

export type GetEmployeesParams = {
  tenantId?: string;
  departmentId?: string;
  designationId?: string;
  status?: string;
  page?: number | null; // null to get all records for dropdowns
};

const BASE = '/system/employees';

type PaginatedSystemEmployeeResponse = {
  items: SystemEmployee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

class SystemEmployeeApiService {
  async getSystemEmployees(
    params?: GetEmployeesParams
  ): Promise<SystemEmployee[] | PaginatedSystemEmployeeResponse> {
    // Build params object, excluding page if it's null (for dropdowns)
    const requestParams: Record<string, unknown> = {};
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof GetEmployeesParams];
        // Only include page parameter if it's not null (for dropdowns, pass null to get all records)
        if (key === 'page' && value === null) {
          return; // Skip page parameter when null
        }
        if (value !== undefined && value !== null) {
          requestParams[key] = value;
        }
      });
    }
    const res = await axiosInstance.get<
      SystemEmployee[] | PaginatedSystemEmployeeResponse
    >(BASE, { params: requestParams });

    // Handle paginated response with items array
    if (
      res.data &&
      typeof res.data === 'object' &&
      'items' in res.data &&
      Array.isArray(res.data.items)
    ) {
      return res.data;
    }

    // Handle direct array response
    if (Array.isArray(res.data)) {
      return res.data;
    }

    return [];
  }

  async getSystemEmployeeById(id: string): Promise<SystemEmployeeDetails> {
    const res = await axiosInstance.get<SystemEmployeeDetails>(`${BASE}/${id}`);
    return res.data;
  }

  async getSystemEmployeeLeaves(id: string): Promise<EmployeeLeave[]> {
    const res = await axiosInstance.get<EmployeeLeave[]>(
      `${BASE}/${id}/leaves`
    );
    return res.data || [];
  }

  async getSystemEmployeePerformance(
    id: string
  ): Promise<EmployeePerformance[]> {
    const res = await axiosInstance.get<EmployeePerformance[]>(
      `${BASE}/${id}/performance`
    );
    return res.data || [];
  }

  async getSystemEmployeeAssets(id: string): Promise<EmployeeAsset[]> {
    const res = await axiosInstance.get<EmployeeAsset[]>(
      `${BASE}/${id}/assets`
    );
    return res.data || [];
  }

  async getTenants(
    page: number,
    includeDeleted: boolean = true
  ): Promise<SystemEmployee[]> {
    const res = await axiosInstance.get<SystemEmployee[]>('/system/tenants', {
      params: { page, includeDeleted },
    });
    return res.data || [];
  }

  async getAllTenants(includeDeleted = true): Promise<SystemEmployee[]> {
    const res = await axiosInstance.get('/system/tenants', {
      params: { includeDeleted, limit: 'all' },
    });

    return res.data?.items || [];
  }
}

export const systemEmployeeApiService = new SystemEmployeeApiService();
export default systemEmployeeApiService;
