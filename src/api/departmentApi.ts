import axiosInstance from './axiosInstance';
import { handleApiError } from '../utils/errorHandler';
import type { BackendDepartment, Department } from '../types/department';

export type { BackendDepartment, Department } from '../types/department';
export type { ApiResponse } from '../types/api';

/** @deprecated Use Department from src/types/department.ts */
export type FrontendDepartment = Department;

export interface DepartmentDto {
  name: string;
  description?: string;
}

class DepartmentApiService {
  private baseUrl = '/departments';

  // Get all departments
  async getAllDepartments(): Promise<BackendDepartment[]> {
    const response = await axiosInstance.get<
      BackendDepartment[] | { items: BackendDepartment[] }
    >(this.baseUrl);
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (
      response.data &&
      'items' in response.data &&
      Array.isArray(response.data.items)
    ) {
      return response.data.items;
    }
    return [];
  }

  // Get department by ID
  async getDepartmentById(id: string): Promise<BackendDepartment> {
    try {
      const response = await axiosInstance.get<BackendDepartment>(
        `${this.baseUrl}/${id}`
      );
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'fetch',
        resource: 'department',
        isGlobal: false, // We don't know if it's global until we fetch it
      });
      throw new Error(errorResult.message);
    }
  }

  // Create new department
  async createDepartment(
    departmentData: DepartmentDto
  ): Promise<BackendDepartment> {
    try {
      const response = await axiosInstance.post<BackendDepartment>(
        this.baseUrl,
        departmentData
      );
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'create',
        resource: 'department',
        isGlobal: false,
      });
      throw new Error(errorResult.message);
    }
  }

  // Update department
  async updateDepartment(
    id: string,
    departmentData: DepartmentDto
  ): Promise<BackendDepartment> {
    try {
      const response = await axiosInstance.put<BackendDepartment>(
        `${this.baseUrl}/${id}`,
        departmentData
      );
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'update',
        resource: 'department',
        isGlobal: false, // Will be determined by the error message
      });
      throw new Error(errorResult.message);
    }
  }

  // Delete department
  async deleteDepartment(id: string): Promise<{ deleted: true; id: string }> {
    try {
      const response = await axiosInstance.delete<{
        deleted: true;
        id: string;
      }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error, {
        operation: 'delete',
        resource: 'department',
        isGlobal: false, // Will be determined by the error message
      });
      throw new Error(errorResult.message);
    }
  }

  // Helper function to convert backend department to frontend format
  convertBackendToFrontend(backendDept: BackendDepartment): FrontendDepartment {
    // Backend only stores English fields, Arabic fields are optional
    return {
      id: backendDept.id,
      name: backendDept.name,
      nameAr: '', // Arabic name is optional, empty by default
      description: backendDept.description || '',
      descriptionAr: '', // Arabic description is optional, empty by default
    };
  }

  // Helper function to convert frontend department to backend format
  convertFrontendToBackend(frontendDept: FrontendDepartment): DepartmentDto {
    // Only send English fields to backend, Arabic fields are ignored
    return {
      name: frontendDept.name,
      description: frontendDept.description || undefined, // Only send if not empty
    };
  }

  // Get all tenants with departments (for system admin)
  async getAllTenantsWithDepartments(tenantId?: string): Promise<{
    tenants: Array<{
      tenant_id: string;
      tenant_name: string;
      tenant_status: string;
      departments: Array<{
        id: string;
        name: string;
        description?: string;
        created_at: string;
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
          id: string;
          name: string;
          description?: string;
          created_at: string;
        }>;
      }>;
    }>(`${this.baseUrl}/all-tenants`, { params });
    return response.data;
  }
}

export const departmentApiService = new DepartmentApiService();
