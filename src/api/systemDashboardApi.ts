import axiosInstance from './axiosInstance';
import type {
  RecentLog,
  SystemDashboardResponse,
  TenantGrowth,
} from '../types/audit';

export type {
  ActiveEmployeesPerTenant,
  RecentLogMeta,
  RecentLog,
  SystemDashboardResponse,
  TenantGrowth,
} from '../types/audit';

class SystemDashboardApiService {
  private baseUrl = '/system/dashboard';
  private logsUrl = '/system/logs';
  private tenantGrowthUrl = '/system/tenant-growth';

  async getSystemDashboard(): Promise<SystemDashboardResponse | null> {
    const response = await axiosInstance.get<SystemDashboardResponse>(
      this.baseUrl
    );
    return response.data;
  }

  async getSystemLogs(
    page: number = 1,
    filters?: {
      userRole?: string;
      tenantId?: string;
      method?: string;
    }
  ): Promise<RecentLog[]> {
    const params: Record<string, string | number> = { page };
    if (filters?.userRole) {
      params.userRole = filters.userRole;
    }
    if (filters?.tenantId) {
      params.tenantId = filters.tenantId;
    }
    if (filters?.method) {
      params.method = filters.method;
    }
    const response = await axiosInstance.get<RecentLog[]>(this.logsUrl, {
      params,
    });
    return response.data;
  }

  async exportSystemLogs(): Promise<Blob | null> {
    const response = await axiosInstance.get(`${this.logsUrl}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getTenantGrowth(
    year: number,
    tenantId: string
  ): Promise<TenantGrowth[]> {
    const response = await axiosInstance.get<TenantGrowth[]>(
      this.tenantGrowthUrl,
      {
        params: { year, tenantId },
      }
    );
    return response.data;
  }
}

export const systemDashboardApiService = new SystemDashboardApiService();
export default systemDashboardApiService;
