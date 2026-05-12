/**
 * Barrel export for the API layer.
 *
 * Import individual API modules as:
 *   import { authApi, employeeApi } from '@/api';
 *
 * The shared axios instance and auth service are also re-exported for
 * use in API integration tests and custom hooks.
 */

// Core infrastructure
export { default as axiosInstance } from './axiosInstance';
export { authService } from './authService';
export { axiosErrorHandler } from './axiosErrorHandler';

// Domain API modules
export * from './announcementsApi';
export * from './attendanceApi';
export * from './authApi';
export * from './billingApi';
export * from './companyApi';
export * from './dashboardApi';
export * from './departmentApi';
export * from './designationApi';
export * from './employeeApi';
export * from './exportApi';
export * from './geofencingApi';
export * from './leaveApi';
export * from './leaveReportApi';
export * from './notificationsApi';
export * from './profileApi';
export * from './reportApi';
export * from './rolesApi';
export * from './searchApi';
export * from './signupApi';
export * from './systemDashboardApi';
export * from './systemEmployeeApi';
export * from './systemPerformanceApi';
export * from './systemTenantApi';
export * from './teamApi';
export * from './timesheetApi';
export * from './tenantLeaveApi';
export * from './workflowApi';
export * from './wfhApi';
export * from './overtimeApi';
