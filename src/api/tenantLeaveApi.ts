import type { AxiosError } from 'axios';
import axiosInstance from './axiosInstance';

export interface SystemLeaveFilters {
  tenantId?: string;
  departmentId?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface SystemLeaveResponse {
  id: string;
  tenantId: string;
  tenantName?: string;
  departmentId?: string;
  departmentName?: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
  createdAt: string;
}

export interface SystemLeaveSummary {
  tenantId: string;
  tenantName: string;
  totalLeaves: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  cancelledCount: number;
}

export interface TenantListItem {
  id: string;
  name: string;
  status: string;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  created_at: string;
}

export interface TenantDepartment {
  id?: string;
  name?: string;
}

export interface TenantDetails {
  id: string;
  name: string;
  status: string;
  departmentCount?: number;
  employeeCount?: number;
  departments?: TenantDepartment[];
  [key: string]: unknown;
}

type RawTenant = {
  id: string;
  name: string;
  status: string;
  isDeleted?: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type TenantsResponse = { items?: RawTenant[] } | RawTenant[] | undefined;

type LeavesResponse =
  | {
      items?: SystemLeaveResponse[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }
  | SystemLeaveResponse[];

type SummaryResponseItem = {
  tenantId?: string;
  tenantName?: string;
  totalLeaves?: number;
  approvedCount?: number;
  rejectedCount?: number;
  pendingCount?: number;
  cancelledCount?: number;
};

type DepartmentsResponse = { items?: Department[] } | Department[] | undefined;

export const TenantLeaveApi = {
  getSystemTenants: async (
    page: number = 1,
    includeDeleted: boolean = false
  ): Promise<TenantListItem[]> => {
    try {
      const { data } = await axiosInstance.get('/system/tenants', {
        params: {
          page,
          includeDeleted: includeDeleted.toString(),
          limit: 1000,
        },
      });

      const rawTenantsResponse = data as TenantsResponse;
      const tenants = Array.isArray(rawTenantsResponse)
        ? rawTenantsResponse
        : (rawTenantsResponse?.items ?? []);

      return tenants.map((tenant: TenantListItem) => ({
        id: tenant.id,
        name: tenant.name,
        status: tenant.status,
        isDeleted: tenant.isDeleted ?? false,
        created_at: tenant.created_at ?? '',
        updated_at: tenant.updated_at ?? '',
        deleted_at: tenant.deleted_at ?? null,
      }));
    } catch {
      return [];
    }
  },
  getSystemLeaves: async (
    filters: SystemLeaveFilters = {}
  ): Promise<{
    items: SystemLeaveResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> => {
    try {
      const params: Record<string, string | number> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
      };

      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.departmentId) params.departmentId = filters.departmentId;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [{ data: leavesData }, { data: tenantsData }] = await Promise.all([
        axiosInstance.get<LeavesResponse>('/system/leaves', { params }),
        axiosInstance.get<TenantsResponse>('/system/tenants', {
          params: { page: 1, includeDeleted: 'false', limit: 1000 },
        }),
      ]);

      const tenantList = Array.isArray(tenantsData)
        ? tenantsData
        : (tenantsData?.items ?? []);

      const tenantMap: Record<string, string> = {};
      tenantList.forEach(t => {
        tenantMap[t.id] = t.name;
      });

      const items = Array.isArray(leavesData)
        ? leavesData
        : (leavesData?.items ?? []);

      const enriched = items.map(leave => ({
        ...leave,
        tenantName: leave.tenantName || tenantMap[leave.tenantId] || 'Unknown',
      }));

      const paginationSource = Array.isArray(leavesData)
        ? undefined
        : leavesData;

      const total =
        typeof paginationSource?.total === 'number'
          ? paginationSource.total
          : enriched.length;
      const page = paginationSource?.page ?? 1;
      const limit = paginationSource?.limit ?? enriched.length;
      const totalPages =
        paginationSource?.totalPages ?? Math.ceil(total / (limit || 1));

      return { items: enriched, total, page, limit, totalPages };
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Failed to fetch system leaves';
      throw new Error(message);
    }
  },

  getTenantDetailsById: async (
    tenantId: string
  ): Promise<TenantDetails | null> => {
    try {
      const { data } = await axiosInstance.get<TenantDetails | null>(
        `/system/tenants/${tenantId}`
      );
      return data ?? null;
    } catch (error) {
      console.error('Failed to fetch tenant details:', error);
      return null;
    }
  },

  getSystemLeaveSummary: async (
    filters: {
      tenantId?: string;
      status?: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<SystemLeaveSummary[]> => {
    try {
      const params: Record<string, string> = {};
      if (filters.tenantId) params.tenantId = filters.tenantId;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { data } = await axiosInstance.get('/system/leaves/summary', {
        params: filters,
      });

      const rawSummary = (
        Array.isArray(data)
          ? data
          : Array.isArray((data as { items?: SummaryResponseItem[] })?.items)
            ? (data as { items?: SummaryResponseItem[] }).items
            : []
      ) as SummaryResponseItem[];

      return rawSummary.map(item => ({
        tenantId: item.tenantId || 'system',
        tenantName: item.tenantName || 'System / Unassigned',
        totalLeaves: Number(item.totalLeaves ?? 0),
        approvedCount: Number(item.approvedCount ?? 0),
        rejectedCount: Number(item.rejectedCount ?? 0),
        pendingCount: Number(item.pendingCount ?? 0),
        cancelledCount: Number(item.cancelledCount ?? 0),
      }));
    } catch {
      return [];
    }
  },

  getDepartments: async (tenantId?: string): Promise<Department[]> => {
    try {
      const { data } = await axiosInstance.get<DepartmentsResponse>(
        '/departments',
        {
          params: tenantId ? { tenantId } : {},
        }
      );

      const list = Array.isArray(data) ? data : (data?.items ?? []);

      const filtered = tenantId
        ? list.filter(d => d.tenant_id === tenantId)
        : list;

      return filtered.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description,
        tenant_id: dept.tenant_id,
        created_at: dept.created_at,
      }));
    } catch {
      return [];
    }
  },
};
