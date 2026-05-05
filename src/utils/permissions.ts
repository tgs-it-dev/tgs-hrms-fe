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
      return '/dashboard/attendance-table';
    case 'admin':
      return '/dashboard';
    case 'manager':
      return '/dashboard/teams';
    case 'employee':
    case 'user':
      return '/dashboard/attendance-check';
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
    'recruitment',
    'feature-management',
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
    'review-requests',
  ],
  employee: [
    'attendance',
    'leave-analytics',
    'teams',
    'recruitment',
    'requests',
  ],
  user: ['attendance', 'teams', 'recruitment'],
  unknown: ['recruitment'],
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
  {
    key: 'feature-management',
    patterns: ['feature management', 'feature-management'],
  },
  { key: 'requests', patterns: ['request', 'requests'] },
  { key: 'review-requests', patterns: ['review-requests', 'approval'] },
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
  | 'request'
  | 'review-requests'
  | 'misc';

const PARENT_KEY_MATCHERS: Array<{ key: ParentKey; patterns: string[] }> = [
  { key: 'attendance', patterns: ['attendance'] },
  { key: 'department', patterns: ['department'] },
  { key: 'leave-analytics', patterns: ['leave analytics', 'leave-analytics'] },
  { key: 'employees', patterns: ['employee'] },
  { key: 'teams', patterns: ['team'] },
  { key: 'audit logs', patterns: ['audit logs'] },
  { key: 'recruitment', patterns: ['recruitment'] },
  { key: 'request', patterns: ['request'] },
  { key: 'review-requests', patterns: ['review-requests', 'approval'] },
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
    'designations',
    'employee-manager',
    'user-profile',
    'attendance-check',
    'attendance-table',
    'attendance-summary',
    'attendance-check/timesheet-layout',
    'CrossTenantLeaveManagement',
    'teams',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'my-tasks',
    'employee-profile-view',
    'settings',
    'cross-tenant-leaves',
    'audit-logs',
    'tenant-employees',
    'performance-dashboard',
    'feature-management',
  ],
  'network-admin': [
    '',
    'departments',
    'designations',
    'employee-manager',
    'user-list',
    'user-profile',
    'attendance-check',
    'attendance-table',
    'attendance-check/timesheet-layout',
    'teams',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'my-tasks',
    'employee-profile-view',
    'attendance-summary',
    'settings',
  ],
  'hr-admin': [
    'departments',
    'employee-manager',
    'departments',
    'designations',
    // 'attendance-check',
    'attendance-summary',
    'attendance-table',
    'attendance-check/timesheet-layout',
    'user-profile',
    'announcements',
    'settings',
    'teams',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'my-tasks',
    'leaves',
    'reports',
    'employee-salary',
  ],
  admin: [
    '',
    'departments',
    'designations',
    'employee-manager',
    'user-list',
    'user-profile',
    'leaves',
    'CrossTenantLeaveManagement',
    'cross-tenant-leaves',
    'announcements',
    'attendance-check',
    'attendance-table',
    'attendance-check/timesheet-layout',
    'reports',
    'teams',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'employee-profile-view',
    'attendance-summary',
    'settings',
    'employee-salary',
  ],
  manager: [
    'employee-manager',
    'attendance-check',
    'attendance-table',
    'reports',
    'attendance-check/timesheet-layout',
    'announcements',
    'teams',
    'geofencing',
    'teams/list',
    'teams/tasks',
    'manager-tasks',
    'my-tasks',
    'leaves',
    'user-profile',
    'settings',
    'employee-salary',
    'my-salary',
    'employee-profile-view',
    'review-requests',
  ],
  employee: [
    'attendance-check',
    'attendance-table',
    'reports',
    'attendance-check/timesheet-layout',
    'leaves',
    'my-tasks',
    'user-profile',
    'settings',
    'my-salary',
    'requests',
  ],
  user: [
    'attendance-check',
    'attendance-table',
    'attendance-check/timesheet-layout',
    'leaves',
    'announcements',
    'my-tasks',
    'user-profile',
    'settings',
    'my-salary',
    'requests',
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
