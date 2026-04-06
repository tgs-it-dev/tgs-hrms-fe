export type NormalizedRole =
  | 'system-admin'
  | 'network-admin'
  | 'hr-admin'
  | 'admin'
  | 'manager'
  | 'employee'
  | 'user'
  | 'unknown';

export const normalizeRole = (role?: string): NormalizedRole => {
  if (!role) return 'unknown';
  const r = role.trim().toLowerCase();
  if (r === 'system-admin' || r === 'system_admin' || r === 'system admin')
    return 'system-admin';
  if (r === 'network-admin' || r === 'network_admin' || r === 'network admin')
    return 'network-admin';
  if (r === 'hr-admin' || r === 'hr_admin' || r === 'hr admin')
    return 'hr-admin';
  if (r === 'admin') return 'admin';
  if (r === 'manager') return 'manager';
  if (r === 'employee') return 'employee';
  if (r === 'user') return 'user';
  return r as NormalizedRole;
};

export const getDefaultDashboardRoute = (role?: string): string => {
  const r = normalizeRole(role);
  switch (r) {
    case 'system-admin':
      return '/dashboard';
    case 'network-admin':
      return '/dashboard';
    case 'hr-admin':
      return '/dashboard/AttendanceTable';
    case 'admin':
      return '/dashboard';
    case 'manager':
      return '/dashboard/teams';
    case 'employee':
    case 'user':
      return '/dashboard/AttendanceCheck';
    default:
      return '/dashboard';
  }
};

const ROLE_MENU_ALLOWLIST: Record<NormalizedRole, readonly string[]> = {
  'system-admin': [
    'dashboard',
    'announcements',
    'tenant',
    'department',
    'employees',
    'teams',
    'attendance',
    'leave-analytics',
    'report',
    'audit logs',
    'performance',
  ],
  'network-admin': [
    'dashboard',
    'department',
    'employees',
    'teams',
    'attendance',
    'recruitment',
  ],
  'hr-admin': [
    'attendance',
    'announcements',
    'department',
    'teams',
    'leave-analytics',
    'employees',
    'recruitment',
  ],
  admin: [
    'dashboard',
    'announcements',
    'department',
    'employees',
    'teams',
    'attendance',
    'report',
    'leave-analytics',
    'recruitment',
  ],
  manager: [
    'teams',
    'attendance',
    'report',
    'leave-analytics',
    'recruitment',
  ],
  employee: ['attendance', '', 'leave-analytics', 'teams',],
  user: ['attendance', '', 'teams',],
};

const normalizeLabel = (value: string) => (value || '').toLowerCase().trim();

const MENU_KEY_MATCHERS: Array<{ key: string; patterns: string[] }> = [
  { key: 'dashboard', patterns: ['dashboard'] },
  { key: 'announcements', patterns: ['announcement', 'announcements'] },
  { key: 'tenant', patterns: ['tenant'] },
  { key: 'department', patterns: ['department'] },
  { key: 'employees', patterns: ['employee'] },
  { key: 'teams', patterns: ['team'] },
  { key: 'attendance', patterns: ['attendance'] },
  { key: 'leave-analytics', patterns: ['leave analytics', 'leave-analytics'] },
  { key: 'report', patterns: ['report'] },
  { key: 'audit logs', patterns: ['audit logs'] },
  { key: 'performance', patterns: ['performance'] },
  { key: 'recruitment', patterns: ['recruitment'] },
];

const getMenuKey = (label: string) => {
  const normalized = normalizeLabel(label).replace(/\s+/g, '');
  for (const matcher of MENU_KEY_MATCHERS) {
    if (
      matcher.patterns.some(pattern =>
        normalized.includes(pattern.replace(/\s+/g, ''))
      )
    ) {
      return matcher.key;
    }
  }
  return 'misc';
};

type ParentKey =
  | 'attendance'
  | 'department'
  | 'leave-analytics'
  | 'employees'
  | 'teams'
  | 'audit logs'
  | 'recruitment'
  | 'misc';

const PARENT_KEY_MATCHERS: Array<{ key: ParentKey; patterns: string[] }> = [
  { key: 'attendance', patterns: ['attendance'] },
  { key: 'department', patterns: ['department'] },
  { key: 'leave-analytics', patterns: ['leave analytics', 'leave-analytics'] },
  { key: 'employees', patterns: ['employee'] },
  { key: 'teams', patterns: ['team'] },
  { key: 'audit logs', patterns: ['audit logs'] },
  { key: 'recruitment', patterns: ['recruitment'] },
];

const getParentKey = (label: string): ParentKey => {
  const normalized = normalizeLabel(label);
  for (const matcher of PARENT_KEY_MATCHERS) {
    if (matcher.patterns.some(pattern => normalized.includes(pattern))) {
      return matcher.key;
    }
  }
  return 'misc';
};

type SubmenuPolicy = {
  allowOnly?: readonly string[];
  deny?: readonly string[];
  denyAll?: boolean;
};

const ROLE_SUBMENU_POLICIES: Record<
  NormalizedRole,
  Partial<Record<ParentKey, SubmenuPolicy>>
> = {
  'system-admin': {
    department: { deny: ['user list', 'policies', 'holidays'] },
    'leave-analytics': { deny: ['report'] },
    employees: { deny: ['employee list'] },
    teams: { deny: ['my tasks'] }, // Admins see Team Management and Manager Tasks only
    attendance: { deny: ['leave request', 'geofencing'] },
  },
  'network-admin': {
    employees: { deny: ['tenant employees'] },
    department: { deny: ['user list', 'policies', 'holidays'] },
    attendance: { deny: ['reports', 'leave request', 'geofencing'] },
    'audit logs': { denyAll: true },
    teams: { deny: ['my tasks'] }, // Admins see Team Management and Manager Tasks only
  },
  'hr-admin': {
    employees: { deny: ['tenant employees'] },
    'audit logs': { denyAll: true },
    department: { allowOnly: ['designation', 'department'] },
    'leave-analytics': { deny: ['cross tenant leaves'] },
    attendance: { deny: ['geofencing'] },
    teams: { deny: ['my tasks'] }, // Admins see Team Management and Manager Tasks only
  },
  admin: {
    employees: { deny: ['tenant employees'] },
    department: { deny: ['user list', 'policies', 'holidays'] },
    'leave-analytics': { deny: ['cross tenant leaves'] },
    attendance: { deny: ['reports', 'geofencing'] },
    'audit logs': { denyAll: true },
    teams: { deny: ['my tasks'] }, // Admins see Team Management and Manager Tasks only
  },
  manager: {
    employees: { deny: ['tenant employees'] },
    attendance: { deny: ['reports', 'report'] },
    'audit logs': { denyAll: true },
    'leave-analytics': { deny: ['cross tenant leaves'] },
    teams: { deny: ['my tasks'] }, // Managers see Team Management and Manager Tasks only
  },
  employee: {
    employees: { deny: ['tenant employees'] },
    attendance: { deny: ['report', 'geofencing'] },
    'leave-analytics': { allowOnly: ['report'] },
    'audit logs': { denyAll: true },
    teams: { allowOnly: ['my tasks'] }, // Employees see only My Tasks
  },
  user: {
    employees: { deny: ['tenant employees'] },
    attendance: { deny: ['report'] },
    'leave-analytics': { allowOnly: ['report'] },
    'audit logs': { denyAll: true },
    teams: { allowOnly: ['my tasks'] }, // Users see only My Tasks
  },
  unknown: {},
};

const matchesPattern = (value: string, patterns?: readonly string[]) =>
  patterns?.some(pattern => value.includes(pattern)) ?? false;

export const isMenuVisibleForRole = (
  menuLabel: string,
  role?: string
): boolean => {
  const r = normalizeRole(role);
  const allowed = ROLE_MENU_ALLOWLIST[r] ?? [];
  return allowed.includes(getMenuKey(menuLabel));
};

export const isSubMenuVisibleForRole = (
  parentMenuLabel: string,
  subLabel: string,
  role?: string
) => {
  const r = normalizeRole(role);
  const parentKey = getParentKey(parentMenuLabel);
  const subKey = normalizeLabel(subLabel);
  // Specifically hide "Attendance" sub-menu (Check-In page) for admins, but allow "Daily Attendance"
  // "Attendance" normalizes to 'attendance'
  // "Daily Attendance" normalizes to 'daily attendance'
  if (
    parentKey === 'attendance' &&
    subKey === 'attendance' &&
    (r === 'system-admin' || r === 'admin' || r === 'hr-admin')
  ) {
    return false;
  }

  if (subKey === 'report' && parentKey === 'attendance') {
    return r === 'admin' || r === 'hr-admin';
  }

  if (subKey === 'report') {
    return r === 'admin';
  }

  const policy = ROLE_SUBMENU_POLICIES[r]?.[parentKey];
  if (!policy) return true;
  if (policy.denyAll) return false;
  if (policy.allowOnly) {
    return matchesPattern(subKey, policy.allowOnly);
  }
  if (matchesPattern(subKey, policy.deny)) {
    return false;
  }
  return true;
};

const DASHBOARD_ALLOWLIST_ENTRIES: Record<NormalizedRole, readonly string[]> = {
  'system-admin': [
    '',
    'announcements',
    'tenant',
    'departments',
    'Designations',
    'EmployeeManager',
    'UserProfile',
    'AttendanceCheck',
    'AttendanceTable',
    'attendance-summary',
    'AttendanceCheck/TimesheetLayout',
    'CrossTenantLeaveManagement',
    'teams',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'my-tasks',
    'EmployeeProfileView',
    'settings',
    'cross-tenant-leaves',
    'audit-logs',
    'TenantEmployees',
    'performance-dashboard',
  ],
  'network-admin': [
    '',
    'departments',
    'Designations',
    'EmployeeManager',
    'UserList',
    'UserProfile',
    'AttendanceCheck',
    'AttendanceTable',
    'AttendanceCheck/TimesheetLayout',
    'teams',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'my-tasks',
    'EmployeeProfileView',
    'attendance-summary',
    'settings',
  ],
  'hr-admin': [
    'departments',
    'EmployeeManager',
    'departments',
    'Designations',
    // 'AttendanceCheck',
    'attendance-summary',
    'AttendanceTable',
    'AttendanceCheck/TimesheetLayout',
    'UserProfile',
    'announcements',
    'settings',
    'teams',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'my-tasks',
    'leaves',
    'Reports',
    'employee-salary',
  ],
  admin: [
    '',
    'departments',
    'Designations',
    'EmployeeManager',
    'UserList',
    'UserProfile',
    'leaves',
    'CrossTenantLeaveManagement',
    'cross-tenant-leaves',
    'announcements',
    'AttendanceCheck',
    'AttendanceTable',
    'AttendanceCheck/TimesheetLayout',
    'Reports',
    'teams',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'EmployeeProfileView',
    'attendance-summary',
    'settings',
    'employee-salary',
  ],
  manager: [
    'EmployeeManager',
    'AttendanceCheck',
    'AttendanceTable',
    'Reports',
    'AttendanceCheck/TimesheetLayout',
    'announcements',
    'teams',
    'geofencing',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'my-tasks',
    'leaves',
    'UserProfile',
    'settings',
    'employee-salary',
    'my-salary',
    'EmployeeProfileView',
  ],
  employee: [
    'AttendanceCheck',
    'AttendanceTable',
    'Reports',
    'AttendanceCheck/TimesheetLayout',
    'leaves',
    'my-tasks',
    'UserProfile',
    'settings',
    'my-salary',
  ],
  user: [
    'AttendanceCheck',
    'AttendanceTable',
    'AttendanceCheck/TimesheetLayout',
    'leaves',
    'announcements',
    'my-tasks',
    'UserProfile',
    'settings',
    'my-salary',
  ],
  unknown: [],
};

const DASHBOARD_ALLOWLIST: Record<NormalizedRole, Set<string>> = Object.entries(
  DASHBOARD_ALLOWLIST_ENTRIES
).reduce(
  (acc, [role, paths]) => {
    acc[role as NormalizedRole] = new Set(paths);
    return acc;
  },
  {} as Record<NormalizedRole, Set<string>>
);

export const isDashboardPathAllowedForRole = (
  pathAfterDashboard: string,
  role?: string
): boolean => {
  const r = normalizeRole(role);
  const normalizedPath = (pathAfterDashboard || '').replace(/^\/+|\/+$/g, '');
  const allowedSet = DASHBOARD_ALLOWLIST[r];

  if (allowedSet.has(normalizedPath)) {
    return true;
  }

  for (const allowedPath of allowedSet) {
    if (allowedPath && normalizedPath.startsWith(allowedPath + '/')) {
      return true;
    }
  }

  return false;
};
