import { lazy } from 'react';
import type React from 'react';
import type { FeatureKey } from '../context/FeatureToggleContext';

export interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType>;
  requiredRole?: string[];
}

export interface ProtectedRouteConfig {
  path?: string; // undefined = index route
  index?: boolean; // explicit flag for the index route
  component: React.LazyExoticComponent<React.ComponentType>;
  /** When false, the route skips RouteErrorBoundary; defaults to true */
  withErrorBoundary?: boolean;
  requiredRole?: string[];
  requiredFeature?: FeatureKey | FeatureKey[];
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
const TeamTasks = lazy(() => import('../components/TaskManagement/TeamTasks'));
const MyTasks = lazy(() => import('../components/TaskManagement/MyTasks'));
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
const ManagerTaskBoard = lazy(
  () => import('../components/TaskManagement/ManagerTaskBoard')
);
const EmployeeTasks = lazy(
  () => import('../components/TaskManagement/EmployeeTasks')
);
const FeatureManagementPage = lazy(
  () => import('../components/Settings/FeatureManagementPage')
);
const RequestPage = lazy(() => import('../components/Requests/RequestPage'));
const ReviewRequestsPage = lazy(
  () => import('../components/ReviewRequests/ReviewRequestsPage')
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
export const protectedRoutes: ProtectedRouteConfig[] = [
  { index: true, component: DashboardPage },
  { path: 'tenant', component: TenantPage },
  { path: 'departments', component: DepartmentList },
  { path: 'designations', component: DesignationManager },
  { path: 'employee-manager', component: EmployeesPage },
  { path: 'user-list', component: UserList },
  { path: 'user-profile', component: ProfilePage },
  { path: 'leaves', component: LeavePage },
  { path: 'cross-tenant-leaves', component: CrossTenantLeaveManagement },
  { path: 'attendance-summary', component: AttendanceSummaryReport },
  { path: 'employee-profile-view', component: EmployeeProfileView },
  { path: 'employee-profile-view/:employeeId', component: EmployeeProfileView },
  { path: 'tenant-employees', component: TenantBasedEmployeeManager },
  { path: 'attendance-check', component: AttendancePage },
  { path: 'attendance-table', component: AttendanceTable },
  { path: 'reports', component: Reports },
  { path: 'policies', component: PolicyList },
  { path: 'holidays', component: HolidayList },
  { path: 'attendance-check/timesheet-layout', component: TimesheetLayout },
  { path: 'teams', component: TeamManager },
  { path: 'teams/list', component: TeamsTaskList },
  { path: 'teams/tasks', component: TeamTasks },
  { path: 'teams/tasks/:teamId', component: TeamTasks },
  { path: 'my-tasks', component: MyTasks },
  { path: 'manager-tasks', component: ManagerTaskBoard },
  { path: 'teams/employee/:employeeId', component: EmployeeTasks },
  { path: 'settings', component: SettingsPage },
  { path: 'feature-management', component: FeatureManagementPage },
  { path: 'performance-dashboard', component: PerformanceDashboard },
  { path: 'audit-logs', component: AuditLogs },
  { path: 'announcements', component: AnnouncementsPage },
  { path: 'geofencing', component: GeofencingManagement },
  {
    path: 'requests',
    component: RequestPage,
    requiredFeature: [
      'leave_workflow_enabled',
      'wfh_workflow_enabled',
      'overtime_workflow_enabled',
    ],
  },
  {
    path: 'review-requests',
    component: ReviewRequestsPage,
    requiredFeature: [
      'leave_workflow_enabled',
      'wfh_workflow_enabled',
      'overtime_workflow_enabled',
    ],
  },
];
