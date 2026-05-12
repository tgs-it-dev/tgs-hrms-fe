import { lazy } from 'react';
import type React from 'react';
import { ROLES } from '@/constants/roles';
import type { AppRole } from '@/constants/roles';

export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType>;
  requiredRole?: AppRole | AppRole[];
}

export interface ProtectedRouteConfig {
  path?: string; // undefined = index route
  index?: boolean; // explicit flag for the index route
  component: React.LazyExoticComponent<React.ComponentType>;
  /** When false, the route skips RouteErrorBoundary; defaults to true */
  withErrorBoundary?: boolean;
  requiredRole?: AppRole | AppRole[];
}

// ── Public lazy imports ──────────────────────────────────────────────────────
const Login = lazy(() => import('../components/Auth/Login'));
const Forget = lazy(() => import('../components/Auth/Forget'));
const ResetPassword = lazy(() => import('../components/Auth/ResetPassword'));
const Signup = lazy(() => import('../components/Auth/Signup'));
const ConfirmPassword = lazy(
  () => import('../components/Auth/ConfirmPassword')
);
const SignupSuccess = lazy(() => import('../components/Auth/SignupSuccess'));
const CompanyDetails = lazy(
  () => import('../components/Company/CompanyDetails')
);
const SelectPlan = lazy(() => import('../components/Company/SelectPlan'));
const ConfirmPayment = lazy(
  () => import('../components/Company/ConfirmPayment')
);
const Error404 = lazy(() => import('../components/common/Error404'));
const EmployeePaymentReturn = lazy(
  () => import('../components/Employee/EmployeePaymentReturn')
);
const TermsOfServicePage = lazy(
  () => import('../components/TermsPolicy/TermsOfServicePage')
);
const PrivacyPolicyPage = lazy(
  () => import('../components/TermsPolicy/PrivacyPolicyPage')
);

// ── Page-layer lazy imports (5 primary routes use thin page wrappers) ────────
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const EmployeesPage = lazy(() => import('../pages/EmployeesPage'));
const AttendancePage = lazy(() => import('../pages/AttendancePage'));
const LeavePage = lazy(() => import('../pages/LeavePage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));

// ── Protected (dashboard child) lazy imports ─────────────────────────────────
const DepartmentList = lazy(() =>
  import('../components/department/Department-list').then(module => ({
    default: module.DepartmentList,
  }))
);
const DesignationManager = lazy(
  () => import('../components/Designations/DesignationManager')
);
const TenantPage = lazy(() =>
  import('../components/Tenant/Tenant').then(module => ({
    default: module.TenantPage,
  }))
);
const EmployeeProfileView = lazy(
  () => import('../components/Employee/EmployeeProfileView')
);
const AttendanceTable = lazy(
  () => import('../components/Attendance/AttendanceTable')
);
const AttendanceSummaryReport = lazy(
  () => import('../components/Attendance/AttendanceSummaryReport')
);
const Reports = lazy(() => import('../components/Attendance/Reports'));
const SettingsPage = lazy(() => import('../components/Settings/SettingsPage'));
const UserList = lazy(() => import('../components/ManagementUI/UserList'));
const CrossTenantLeaveManagement = lazy(
  () => import('../components/LeaveRequest/CrossTenantLeaveManagement')
);
const PolicyList = lazy(
  () => import('../components/HRPoliciesModule/PolicyList')
);
const HolidayList = lazy(
  () => import('../components/HolidayCalendar/HolidayList')
);
const TimesheetLayout = lazy(
  () => import('../components/TimerTracker/TimesheetLayout')
);
const TeamManager = lazy(() => import('../components/Teams/TeamManager'));
const TeamsTaskList = lazy(() => import('../components/Teams/TeamList'));
const TenantBasedEmployeeManager = lazy(
  () => import('../components/Employee/TenantBasedEmployeeManager')
);
const AuditLogs = lazy(() => import('../components/Audits/AuditLogs'));
const AnnouncementsPage = lazy(
  () => import('../components/Announcements/AnnouncementsPage')
);
const PerformanceDashboard = lazy(
  () => import('../components/Performance/PerformanceManager')
);
const GeofencingManagement = lazy(
  () => import('../components/Geofencing/GeofencingManagement')
);
const FeatureManagementPage = lazy(
  () => import('../components/Settings/FeatureManagementPage')
);

// ── Public routes ────────────────────────────────────────────────────────────
export const publicRoutes: RouteConfig[] = [
  { path: '/', component: Login },
  { path: '/forget', component: Forget },
  { path: '/reset-password', component: ResetPassword },
  { path: '/confirm-password', component: ConfirmPassword },
  { path: '/signup', component: Signup },
  { path: '/signup/company-details', component: CompanyDetails },
  { path: '/signup/select-plan', component: SelectPlan },
  { path: '/signup/confirm-payment', component: ConfirmPayment },
  { path: '/signup/success', component: SignupSuccess },
  { path: '/employees', component: EmployeePaymentReturn },
  { path: '/company-details', component: CompanyDetails },
  { path: '*', component: Error404 },
];

// Public routes that need ThemeProvider wrapping (accessible without auth)
export const themedPublicRoutes: RouteConfig[] = [
  { path: '/terms', component: TermsOfServicePage },
  { path: '/privacy-policy', component: PrivacyPolicyPage },
];

// ── Protected (dashboard child) routes ───────────────────────────────────────
// withErrorBoundary defaults to true in AppRouter — only set false to opt out.
// requiredRole is enforced by RoleGuard in AppRouter; omit for all-authenticated routes.
export const protectedRoutes: ProtectedRouteConfig[] = [
  // Dashboard index — accessible to all authenticated users
  { index: true, component: DashboardPage },

  // System-admin-only routes
  {
    path: 'tenant',
    component: TenantPage,
    requiredRole: [ROLES.SYSTEM_ADMIN, ROLES.NETWORK_ADMIN],
  },
  {
    path: 'tenant-employees',
    component: TenantBasedEmployeeManager,
    requiredRole: ROLES.SYSTEM_ADMIN,
  },
  {
    path: 'feature-management',
    component: FeatureManagementPage,
    requiredRole: ROLES.SYSTEM_ADMIN,
  },
  {
    path: 'performance-dashboard',
    component: PerformanceDashboard,
    requiredRole: ROLES.SYSTEM_ADMIN,
  },
  {
    path: 'audit-logs',
    component: AuditLogs,
    requiredRole: ROLES.SYSTEM_ADMIN,
  },

  // Admin-tier routes (system-admin, network-admin, hr-admin, admin)
  {
    path: 'departments',
    component: DepartmentList,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
    ],
  },
  {
    path: 'designations',
    component: DesignationManager,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
    ],
  },
  {
    path: 'attendance-summary',
    component: AttendanceSummaryReport,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
    ],
  },

  // User-list: network-admin and admin
  {
    path: 'user-list',
    component: UserList,
    requiredRole: [ROLES.NETWORK_ADMIN, ROLES.ADMIN],
  },

  // Employee management — admin-tier + manager
  {
    path: 'employee-manager',
    component: EmployeesPage,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
    ],
  },
  {
    path: 'employee-profile-view',
    component: EmployeeProfileView,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
    ],
  },
  {
    path: 'employee-profile-view/:employeeId',
    component: EmployeeProfileView,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
    ],
  },

  // Cross-tenant leaves — system-admin and admin only
  {
    path: 'cross-tenant-leaves',
    component: CrossTenantLeaveManagement,
    requiredRole: [ROLES.SYSTEM_ADMIN, ROLES.ADMIN],
  },

  // Policies and holidays — admin-tier (not in any employee allowlist)
  {
    path: 'policies',
    component: PolicyList,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
    ],
  },
  {
    path: 'holidays',
    component: HolidayList,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
    ],
  },

  // Teams — admin-tier + manager
  {
    path: 'teams',
    component: TeamManager,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
    ],
  },
  {
    path: 'teams/list',
    component: TeamsTaskList,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.NETWORK_ADMIN,
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
    ],
  },

  // Reports — hr-admin, admin, manager, employee
  {
    path: 'reports',
    component: Reports,
    requiredRole: [ROLES.HR_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.EMPLOYEE],
  },

  // Geofencing — manager only
  {
    path: 'geofencing',
    component: GeofencingManagement,
    requiredRole: ROLES.MANAGER,
  },

  // Leaves — hr-admin, admin, manager, employee, user
  {
    path: 'leaves',
    component: LeavePage,
    requiredRole: [
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
      ROLES.EMPLOYEE,
      ROLES.USER,
    ],
  },

  // Announcements — system-admin, hr-admin, admin, manager, user
  {
    path: 'announcements',
    component: AnnouncementsPage,
    requiredRole: [
      ROLES.SYSTEM_ADMIN,
      ROLES.HR_ADMIN,
      ROLES.ADMIN,
      ROLES.MANAGER,
      ROLES.USER,
    ],
  },

  // Open to all authenticated users (no requiredRole)
  { path: 'user-profile', component: ProfilePage },
  { path: 'attendance-check', component: AttendancePage },
  { path: 'attendance-table', component: AttendanceTable },
  { path: 'attendance-check/timesheet-layout', component: TimesheetLayout },
  { path: 'settings', component: SettingsPage },
];
