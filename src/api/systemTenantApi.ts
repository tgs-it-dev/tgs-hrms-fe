import axiosInstance from './axiosInstance';
import type { AxiosResponse } from 'axios';
import { env } from '../config/env';

export interface SystemTenant {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'delelted';
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SystemTenantDetail {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'delelted';
  created_at: string;
  departmentCount: number;
  employeeCount: number;
  logo?: string;
  domain?: string;
  company?: {
    id: string;
    company_name: string;
    domain: string;
    logo_url: string;
    is_paid: boolean;
    plan_id: string;
    tenant_id: string;
  };
  departments: Array<{
    id?: string;
    name?: string;
  }>;
}

export interface SystemTenantFilters {
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

interface PaginatedSystemTenantsResponse {
  data?: SystemTenant[];
  items?: SystemTenant[];
  total?: number;
  page?: number;
  totalPages?: number;
}

export const SystemTenantApi = {
  /**
   * @param filters
   * @returns { data, total, page, totalPages }
   */
  getAll: async (
    filters: SystemTenantFilters = { page: 1, limit: 25 }
  ): Promise<{
    data: SystemTenant[];
    total: number;
    page: number;
    totalPages: number;
  }> => {
    const response: AxiosResponse<
      PaginatedSystemTenantsResponse | SystemTenant[]
    > = await axiosInstance.get('/system/tenants', {
      params: {
        page: filters.page ?? 1,
        limit: filters.limit ?? 25,
        includeDeleted: filters.includeDeleted ?? false,
      },
    });

    const payload = response.data;

    const totalFromResponse =
      !Array.isArray(payload) && typeof payload?.total === 'number'
        ? payload.total
        : null;
    const totalHeader = Number(response.headers['x-total-count']);
    const total =
      totalFromResponse ?? (!Number.isNaN(totalHeader) ? totalHeader : 0);

    const page =
      !Array.isArray(payload) && typeof payload?.page === 'number'
        ? payload.page
        : (filters.page ?? 1);

    const totalPagesFromResponse =
      !Array.isArray(payload) && typeof payload?.totalPages === 'number'
        ? payload.totalPages
        : null;
    const totalPages =
      totalPagesFromResponse ??
      (total > 0 ? Math.ceil(total / (filters.limit ?? 25)) : 1);

    let tenants: SystemTenant[] = [];
    if (Array.isArray(payload)) {
      tenants = payload;
    } else if (payload && typeof payload === 'object') {
      tenants = (payload.items ?? payload.data ?? []) as SystemTenant[];
    }

    return {
      data: tenants,
      total,
      page,
      totalPages,
    };
  },

  getById: async (id: string): Promise<SystemTenantDetail> => {
    try {
      const response: AxiosResponse<SystemTenantDetail> =
        await axiosInstance.get(`/system/tenants/${id}`);

      const detail = response.data;
      const baseURL = env.apiBaseUrl;

      const getFullLogoUrl = (
        logoPath: string | undefined | null
      ): string | undefined => {
        if (
          !logoPath ||
          typeof logoPath !== 'string' ||
          logoPath === '[object Object]'
        ) {
          return undefined;
        }
        if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
          return logoPath;
        }
        if (logoPath.startsWith('/')) {
          return `${baseURL}${logoPath}`;
        }
        return `${baseURL}/${logoPath}`;
      };
      let logoUrl = detail.logo || detail.company?.logo_url;
      logoUrl = getFullLogoUrl(logoUrl);
      if (logoUrl) {
        detail.logo = logoUrl;
      }

      console.warn('Tenant Detail API Response:', {
        id: detail.id,
        name: detail.name,
        originalLogo: response.data.logo,
        originalCompanyLogoUrl: response.data.company?.logo_url,
        processedLogo: detail.logo,
        baseURL,
      });

      return detail;
    } catch (error) {
      console.error(` Failed to fetch tenant details (id=${id}):`, error);
      throw error;
    }
  },

  create: async (data: {
    name: string;
    domain?: string;
    logo?: string | File;
    adminName?: string;
    adminEmail?: string;
  }): Promise<SystemTenant> => {
    if (data.logo instanceof File) {
      const formData = new FormData();
      formData.append('logo', data.logo);
      formData.append('name', data.name);
      formData.append('domain', data.domain || '');
      formData.append('adminName', data.adminName || '');
      formData.append('adminEmail', data.adminEmail || '');
      const response: AxiosResponse<SystemTenant> = await axiosInstance.post(
        '/system/tenants',
        formData,
        {
          // Axios will automatically set Content-Type with boundary for FormData
          // We don't need to set headers here
        }
      );
      return response.data;
    } else {
      const response: AxiosResponse<SystemTenant> = await axiosInstance.post(
        '/system/tenants',
        data
      );
      return response.data;
    }
  },

  updateStatus: async (
    id: string,
    status: 'active' | 'suspended'
  ): Promise<SystemTenant> => {
    const response = await axiosInstance.put(
      `/system/tenants/${id}/status`,
      {},
      {
        params: { status },
        headers: { 'Content-Type': 'application/json' },
      }
    );
    return response.data;
  },

  remove: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    const response: AxiosResponse<{ deleted: boolean; id: string }> =
      await axiosInstance.delete(`/system/tenants/${id}`);
    return response.data;
  },

  restore: async (id: string): Promise<{ restored: boolean; id: string }> => {
    const response: AxiosResponse<{ restored: boolean; id: string }> =
      await axiosInstance.put(`/system/tenants/${id}/restore`);
    return response.data;
  },

  update: async (data: {
    tenantId: string;
    companyName?: string;
    domain?: string;
    logo?: string | File;
  }): Promise<SystemTenant> => {
    try {
      if (data.logo instanceof File) {
        const formData = new FormData();
        formData.append('tenantId', data.tenantId);
        if (data.companyName) {
          formData.append('companyName', data.companyName);
        }
        if (data.domain) {
          formData.append('domain', data.domain);
        }
        formData.append('logo', data.logo);

        const response: AxiosResponse<SystemTenant> = await axiosInstance.put(
          '/system/tenants',
          formData
        );
        return response.data;
      } else {
        const response: AxiosResponse<SystemTenant> = await axiosInstance.put(
          '/system/tenants',
          data
        );

        return response.data;
      }
    } catch {
      throw new Error('Failed to update tenant');
    }
  },

  getAllTenants: async (includeDeleted = true): Promise<SystemTenant[]> => {
    try {
      const res = await axiosInstance.get<
        | SystemTenant[]
        | { items: SystemTenant[]; total?: number; data?: SystemTenant[] }
      >('/system/tenants', {
        params: { includeDeleted },
      });

      let tenants: SystemTenant[] = [];

      if (Array.isArray(res.data)) {
        tenants = res.data;
      } else if (res.data && typeof res.data === 'object') {
        if ('items' in res.data && Array.isArray(res.data.items)) {
          tenants = res.data.items;
          const total = res.data.total || res.data.items.length;
          if (total > res.data.items.length) {
            let page = 2;
            const perPage = res.data.items.length || 25;
            while (tenants.length < total) {
              const pageRes = await axiosInstance.get<
                | SystemTenant[]
                | { items: SystemTenant[]; data?: SystemTenant[] }
              >('/system/tenants', {
                params: { page, includeDeleted, limit: perPage },
              });

              let pageTenants: SystemTenant[] = [];
              if (Array.isArray(pageRes.data)) {
                pageTenants = pageRes.data;
              } else if (pageRes.data && typeof pageRes.data === 'object') {
                if (
                  'items' in pageRes.data &&
                  Array.isArray(pageRes.data.items)
                ) {
                  pageTenants = pageRes.data.items;
                } else if (
                  'data' in pageRes.data &&
                  Array.isArray(pageRes.data.data)
                ) {
                  pageTenants = pageRes.data.data;
                }
              }

              if (pageTenants.length === 0) break;
              tenants = [...tenants, ...pageTenants];
              page++;
            }
          }
        } else if ('data' in res.data && Array.isArray(res.data.data)) {
          tenants = res.data.data;
        }
      }
      return tenants;
    } catch {
      return [];
    }
  },
};
