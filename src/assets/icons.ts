export const Icons = {
  logoSidebar: '/logo-sidebar.svg',
  logoWhite: '/logo-white.svg',
  authSidebar: '/auth-sidebar.svg',
  vite: '/vite.svg',

  dashboard: '/dashboard.svg',
  dashboardFill: '/dashboard-fill.svg',

  department: '/department.svg',
  departmentFill: '/department-fill.svg',

  employee: '/employee.svg',
  employeeFill: '/employee-fill.svg',

  teams: '/teams.svg',
  teamsFill: '/teams-fill.svg',


  attendance: '/attendance.svg',
  attendanceFill: '/attendance-fill.svg',

  leaveAnalytics: '/leaveAnalytics.svg',
  leaveAnalyticsFill: '/leaveAnalytics-fill.svg',

  payroll: '/payroll.svg',
  payrollFill: '/payroll-fill.svg',

  logout: '/logout.svg',
  arrowUp: '/arrow-up.svg',
  search: '/search.svg',
  notification: '/notification.svg',
  edit: '/edit.svg',
  delete: '/delete.svg',
  add: '/add.svg',
  upload: '/upload.svg',
  plans: '/plans.svg',

  avatar: '/avatar.png',
  avatar2: '/avatar2.png',
  avatar3: '/avatar3.png',
  avatarJpg: '/avatar.jpg',
  avatarWebp: '/avatar.webp',

  google: '/google.svg',
  lock: '/lockkey.svg',
  back: '/back.svg',
  sent: '/sent.svg',
  password: '/password.svg',
} as const;

export type IconName = keyof typeof Icons;
export const getIcon = (name: IconName): string => {
  return Icons[name];
};
