import axiosInstance from './axiosInstance';
import { handleApiError } from '../utils/errorHandler';
import type {
  BackendDesignation,
  BackendDepartment,
  Designation,
  Department,
} from '../types/department';

export type {
  BackendDesignation,
  BackendDepartment,
  Designation,
  Department,
} from '../types/department';

/** @deprecated Use Designation from src/types/department.ts */
export type FrontendDesignation = Designation;
/** @deprecated Use Department from src/types/department.ts */
export type FrontendDepartment = Department;

export interface TenantDesignationEntry {
  id: string;
  title: string;
  created_at: string;
}

export interface TenantDesignationDepartment {
  department_id: string;
  department_name: string;
  designations: TenantDesignationEntry[];
}

export interface TenantDesignationTenant {
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  departments: TenantDesignationDepartment[];
}

export interface TenantDesignationTree {
  tenants: TenantDesignationTenant[];
}

export interface DesignationDto {
  title: string;
  departmentId: string;
}
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function normalizeDesignation(raw: unknown): BackendDesignation {
  const r = isRecord(raw) ? raw : {};
  return {
    id: typeof r.id === 'string' ? r.id : '',
    title: typeof r.title === 'string' ? r.title : '',
    departmentId:
      typeof r.departmentId === 'string'
        ? r.departmentId
        : typeof r.department_id === 'string'
          ? r.department_id
          : '',
    tenantId:
      typeof r.tenantId === 'string'
        ? r.tenantId
        : typeof r.tenant_id === 'string'
          ? r.tenant_id
          : undefined,
    createdAt:
      typeof r.createdAt === 'string'
        ? r.createdAt
        : typeof r.created_at === 'string'
          ? r.created_at
          : undefined,
    updatedAt:
      typeof r.updatedAt === 'string'
        ? r.updatedAt
        : typeof r.updated_at === 'string'
          ? r.updated_at
          : undefined,
  };
}

function normalizeDepartment(raw: unknown): BackendDepartment {
  const r = isRecord(raw) ? raw : {};
  return {
    id: typeof r.id === 'string' ? r.id : '',
    name: typeof r.name === 'string' ? r.name : '',
    description: typeof r.description === 'string' ? r.description : undefined,
    tenantId:
      typeof r.tenantId === 'string'
        ? r.tenantId
        : typeof r.tenant_id === 'string'
          ? r.tenant_id
          : undefined,
    createdAt:
      typeof r.createdAt === 'string'
        ? r.createdAt
        : typeof r.created_at === 'string'
          ? r.created_at
          : undefined,
    updatedAt:
      typeof r.updatedAt === 'string'
        ? r.updatedAt
        : typeof r.updated_at === 'string'
          ? r.updated_at
          : undefined,
  };
}
class DesignationApiService {
  private baseUrl = '/designations';
  private departmentUrl = '/departments';
  async getAllDepartments(): Promise<BackendDepartment[]> {
    const response = await axiosInstance.get<
      BackendDepartment[] | { items: BackendDepartment[] }
    >(this.departmentUrl);

    let items: BackendDepartment[] = [];
    if (Array.isArray(response.data)) {
      items = response.data;
    } else if (
      response.data &&
      'items' in response.data &&
      Array.isArray(response.data.items)
    ) {
      items = response.data.items;
    }

    return items.map((item: unknown) => normalizeDepartment(item));
  }
  async getDesignationsByDepartment(
    departmentId: string,
    page: number | null = 1
  ): Promise<{
    items: BackendDesignation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const url =
        page === null
          ? `${this.baseUrl}/department/${departmentId}`
          : `${this.baseUrl}/department/${departmentId}?page=${page}`;
      const response = await axiosInstance.get(url);
      let items: unknown[] = [];
      let total = 0;
      let currentPage = page ?? 1;
      let limit = 25;
      let totalPages = 1;
      if (response.data && response.data.items) {
        items = response.data.items;
        total = response.data.total || items.length;
        currentPage = response.data.page || (page ?? 1);
        limit = response.data.limit || 25;
        totalPages = response.data.totalPages || Math.ceil(total / limit);
      } else if (Array.isArray(response.data)) {
        items = response.data;
        total = items.length;
        totalPages = 1;
      } else {
        // Fallback
        items = [];
        total = 0;
        totalPages = 1;
      }
      return {
        items: items.map((item: unknown) => normalizeDesignation(item)),
        total,
        page: currentPage,
        limit,
        totalPages,
      };
    } catch {
      // Return empty paginated structure on error
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }
  // Get all designations from all departments
  async getAllDesignations(): Promise<BackendDesignation[]> {
    try {
      // Since your backend doesn't have a direct endpoint for all designations,
      // we'll need to fetch all departments first and then get designations for each
      const departments = await this.getAllDepartments();
      const allDesignations: BackendDesignation[] = [];

      for (const department of departments) {
        try {
          let currentPage = 1;
          let totalPages = 1;

          do {
            const response = await this.getDesignationsByDepartment(
              department.id,
              currentPage
            );

            if (response.items.length === 0) break;

            allDesignations.push(...response.items);
            totalPages = response.totalPages;
            currentPage++;
          } while (currentPage <= totalPages);
        } catch {
          // Continue with other departments even if one fails
        }
      }

      // Remove duplicates just in case
      const uniqueDesignationsMap = new Map<string, BackendDesignation>();
      allDesignations.forEach(d => uniqueDesignationsMap.set(d.id, d));
      const uniqueDesignations = Array.from(uniqueDesignationsMap.values());

      return uniqueDesignations;
    } catch {
      throw new Error('Failed to fetch all designations');
    }
  }
  // Get designation by ID
  async getDesignationById(id: string): Promise<BackendDesignation> {
    const response = await axiosInstance.get<BackendDesignation>(
      `${this.baseUrl}/${id}`
    );
    return normalizeDesignation(response.data);
  }
  // Create new designation
  async createDesignation(
    designationData: DesignationDto
  ): Promise<BackendDesignation> {
    try {
      // Backend expects snake_case: { title, department_id }
      const payload = {
        title: designationData.title,
        department_id: designationData.departmentId,
      };
      const response = await axiosInstance.post<BackendDesignation>(
        this.baseUrl,
        payload
      );
      return normalizeDesignation(response.data);
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'create',
        resource: 'designation',
        isGlobal: false, // Will be determined by the error message
      });
      throw new Error(errorResult.message);
    }
  }
  // Update designation
  async updateDesignation(
    id: string,
    designationData: DesignationDto
  ): Promise<BackendDesignation> {
    try {
      // Backend uses department_id from existing record; only title is relevant
      const payload = { title: designationData.title };
      const response = await axiosInstance.put<BackendDesignation>(
        `${this.baseUrl}/${id}`,
        payload
      );
      return normalizeDesignation(response.data);
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'update',
        resource: 'designation',
        isGlobal: false, // Will be determined by the error message
      });
      throw new Error(errorResult.message);
    }
  }
  // Delete designation
  async deleteDesignation(id: string): Promise<{ deleted: true; id: string }> {
    try {
      const response = await axiosInstance.delete<{
        deleted: true;
        id: string;
      }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'delete',
        resource: 'designation',
        isGlobal: false, // Will be determined by the error message
      });
      throw new Error(errorResult.message);
    }
  }
  // Helper function to convert backend designation to frontend format
  convertBackendToFrontend(
    backendDesignation: BackendDesignation
  ): FrontendDesignation {
    return {
      id: backendDesignation.id,
      title: backendDesignation.title,
      titleAr: '', // Arabic title is optional, empty by default
      departmentId: backendDesignation.departmentId,
    };
  }
  // Helper function to convert backend department to frontend format
  convertBackendDepartmentToFrontend(
    backendDepartment: BackendDepartment
  ): FrontendDepartment {
    return {
      id: backendDepartment.id,
      name: backendDepartment.name,
      nameAr: backendDepartment.name, // Use English name for Arabic display for now
      description: backendDepartment.description,
      descriptionAr: backendDepartment.description, // Use English description for Arabic display for now
    };
  }
  // Helper function to convert frontend designation to backend format
  convertFrontendToBackend(
    frontendDesignation: FrontendDesignation
  ): DesignationDto {
    return {
      title: frontendDesignation.title,
      departmentId: frontendDesignation.departmentId,
    };
  }
  // Get all tenants with designations (for system admin)
  async getAllTenantsWithDesignations(
    tenantId?: string
  ): Promise<TenantDesignationTree> {
    const params = tenantId ? { tenant_id: tenantId } : {};
    const response = await axiosInstance.get<TenantDesignationTree>(
      `${this.baseUrl}/all-tenants`,
      { params }
    );
    return response.data;
  }
}
export const designationApiService = new DesignationApiService();
