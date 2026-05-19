export interface Tenant {
  id: string;
  name: string;
  nameAr?: string;
}

export interface TenantFormData {
  name: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemTenant {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'deleted';
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SystemTenantDetail {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'deleted';
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

export interface UpdateTenantMobileLoginRequest {
  enabled: boolean;
}

export interface UpdateTenantMobileLoginResponse {
  tenantId: string;
  mobileLoginEnabled: boolean;
}
