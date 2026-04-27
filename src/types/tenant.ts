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
