import axiosInstance from './axiosInstance';
import { handleApiError } from '../utils/errorHandler';
// Normalized types exposed to the rest of the app (camelCase)
export interface BackendDesignation {
  id: string;
  title: string;
  departmentId: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface BackendDepartment {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface FrontendDesignation {
  id: string;
  title: string;
  titleAr: string;
  departmentId: string;
}
export interface FrontendDepartment {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
}
export interface DesignationDto {
  title: string;
  departmentId: string;
}
function normalizeDesignation(
  raw: Record<string, unknown>
): BackendDesignation {
  return {
    id: raw?.id as string,
    title: raw?.title as string,
    departmentId: (raw?.departmentId ?? raw?.department_id) as string,
    tenantId: (raw?.tenantId ?? raw?.tenant_id) as string | undefined,
    createdAt: (raw?.createdAt ?? raw?.created_at) as string | undefined,
    updatedAt: (raw?.updatedAt ?? raw?.updated_at) as string | undefined,
  };
}
function normalizeDepartment(raw: Record<string, unknown>): BackendDepartment {
  return {
    id: raw?.id as string,
    name: raw?.name as string,
    description: raw?.description as string | undefined,
    tenantId: (raw?.tenantId ?? raw?.tenant_id) as string | undefined,
    createdAt: (raw?.createdAt ?? raw?.created_at) as string | undefined,
    updatedAt: (raw?.updatedAt ?? raw?.updated_at) as string | undefined,
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

    return items.map((item: unknown) =>
      normalizeDepartment(item as Record<string, unknown>)
    );
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
        items: items.map((item: unknown) =>
          normalizeDesignation(item as Record<string, unknown>)
        ),
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
    return normalizeDesignation(
      response.data as unknown as Record<string, unknown>
    );
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
      return normalizeDesignation(
        response.data as unknown as Record<string, unknown>
      );
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
      return normalizeDesignation(
        response.data as unknown as Record<string, unknown>
      );
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
  async getAllTenantsWithDesignations(tenantId?: string): Promise<{
    tenants: Array<{
      tenant_id: string;
      tenant_name: string;
      tenant_status: string;
      departments: Array<{
        department_id: string;
        department_name: string;
        designations: Array<{
          id: string;
          title: string;
          created_at: string;
        }>;
      }>;
    }>;
  }> {
    const params = tenantId ? { tenant_id: tenantId } : {};
    const response = await axiosInstance.get<{
      tenants: Array<{
        tenant_id: string;
        tenant_name: string;
        tenant_status: string;
        departments: Array<{
          department_id: string;
          department_name: string;
          designations: Array<{
            id: string;
            title: string;
            created_at: string;
          }>;
        }>;
      }>;
    }>(`${this.baseUrl}/all-tenants`, { params });
    return response.data;
  }
}
export const designationApiService = new DesignationApiService();
