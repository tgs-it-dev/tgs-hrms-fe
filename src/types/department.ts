/** Canonical frontend Department shape used across the UI. */
export interface Department {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

/** Raw Department as returned by the NestJS backend. */
export interface BackendDepartment {
  id: string;
  name: string;
  description?: string;
  tenantId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/** Canonical frontend Designation shape. */
export interface Designation {
  id: string;
  title: string;
  titleAr?: string;
  departmentId: string;
  tenantId?: string;
}

/** Raw Designation as returned by the NestJS backend. */
export interface BackendDesignation {
  id: string;
  title: string;
  departmentId: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}
