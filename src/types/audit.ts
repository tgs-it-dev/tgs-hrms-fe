export interface ActiveEmployeesPerTenant {
  tenantId: string;
  tenantName: string;
  activeCount: string;
}

export interface RecentLogMeta {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export interface RecentLog {
  id: string;
  action: string;
  entityType: string;
  userId: string | null;
  userRole: string | null;
  tenantId: string | null;
  route: string;
  method: string;
  ip: string;
  meta: RecentLogMeta;
  createdAt: string;
}

export interface SystemDashboardResponse {
  totalTenants: number;
  activeTenants: number;
  totalEmployees: number;
  activeEmployeesPerTenant: ActiveEmployeesPerTenant[];
  systemUptimeSeconds: number;
  recentLogs: RecentLog[];
}

export interface TenantGrowth {
  tenantId: string;
  tenantName: string;
  month: string;
  monthName: string;
  employees: number;
  departments: number;
  designations: number;
}
