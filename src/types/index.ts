// Consolidated Type Exports - Single Source of Truth
export * from './availability';
export * from './chart';
export * from './context';
export * from './interview';
export * from './stat';
export * from './user';

// Employee types (exported explicitly to avoid conflicts with mock data)
export type {
  Department,
  Designation,
  FormData,
  FormErrors,
  DepartmentFormData,
  DepartmentFormErrors,
} from './employee';
export * from './tenant';

// Additional consolidated types
export * from './leave';
export * from './holiday';
export * from './policy';
