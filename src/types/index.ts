// Consolidated Type Exports — Single Source of Truth
export * from './api';
export * from './dto';
export * from './availability';
export * from './chart';
export * from './context';
export * from './department';
export * from './interview';
export * from './notification';
export * from './stat';
export * from './team';
export * from './tenant';
export * from './user';

// Employee — re-export explicitly; Department/Designation come from department.ts
// (employee.ts re-exports them, so no duplicate name collisions at barrel level).
export type {
  BackendEmployee,
  DepartmentFormData,
  DepartmentFormErrors,
  EmployeeFullProfile,
  EmployeeJoiningReport,
  EmployeeProfileAttendanceSummaryItem,
  EmployeeProfileLeaveHistoryItem,
  GenderPercentage,
  FormData,
  FormErrors,
  EmployeeDto,
  EmployeeUpdateDto,
  EmployeePerformance,
} from './employee';

// Attendance domain types
export * from './attendance';

// Timesheet domain types
export * from './timesheet';

// Audit / system-dashboard types
export * from './audit';

export * from './leave';
export * from './holiday';
export * from './policy';
