export interface Department {
  id: string;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  subtitle?: string;
  subtitleAr?: string;
}

export interface DepartmentFormData {
  name: string;
  description?: string;
}

export interface DepartmentFormErrors {
  name?: string;
  description?: string;
}

export interface Designation {
  id: string;
  name: string;
  nameAr: string;
  departmentId: string;
}

export interface FormData {
  department: string;
  designation: string;
}

export interface FormErrors {
  department?: string;
  designation?: string;
}
