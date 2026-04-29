import { describe, it, expect } from 'vitest';
import {
  normalizeRole,
  getDefaultDashboardRoute,
  isDashboardPathAllowedForRole,
  isMenuVisibleForRole,
} from './permissions';

describe('normalizeRole', () => {
  it('returns unknown for undefined input', () => {
    expect(normalizeRole(undefined)).toBe('unknown');
  });

  it('handles all common spellings for system-admin', () => {
    expect(normalizeRole('system-admin')).toBe('system-admin');
    expect(normalizeRole('system_admin')).toBe('system-admin');
    expect(normalizeRole('system admin')).toBe('system-admin');
    expect(normalizeRole('SYSTEM-ADMIN')).toBe('system-admin');
  });

  it('handles network-admin variants', () => {
    expect(normalizeRole('network-admin')).toBe('network-admin');
    expect(normalizeRole('network_admin')).toBe('network-admin');
  });

  it('normalizes known roles correctly', () => {
    expect(normalizeRole('admin')).toBe('admin');
    expect(normalizeRole('manager')).toBe('manager');
    expect(normalizeRole('employee')).toBe('employee');
    expect(normalizeRole('user')).toBe('user');
    expect(normalizeRole('hr-admin')).toBe('hr-admin');
    expect(normalizeRole('hr_admin')).toBe('hr-admin');
  });
});

describe('getDefaultDashboardRoute', () => {
  it('routes admin roles to /dashboard', () => {
    expect(getDefaultDashboardRoute('system-admin')).toBe('/dashboard');
    expect(getDefaultDashboardRoute('network-admin')).toBe('/dashboard');
    expect(getDefaultDashboardRoute('admin')).toBe('/dashboard');
  });

  it('routes hr-admin to AttendanceTable', () => {
    expect(getDefaultDashboardRoute('hr-admin')).toBe(
      '/dashboard/AttendanceTable'
    );
  });

  it('routes manager to teams', () => {
    expect(getDefaultDashboardRoute('manager')).toBe('/dashboard/teams');
  });

  it('routes employee and user to AttendanceCheck', () => {
    expect(getDefaultDashboardRoute('employee')).toBe(
      '/dashboard/AttendanceCheck'
    );
    expect(getDefaultDashboardRoute('user')).toBe('/dashboard/AttendanceCheck');
  });

  it('routes unknown roles to /dashboard', () => {
    expect(getDefaultDashboardRoute(undefined)).toBe('/dashboard');
    expect(getDefaultDashboardRoute('some-other-role')).toBe('/dashboard');
  });
});

describe('isDashboardPathAllowedForRole', () => {
  it('allows AttendanceCheck for employee', () => {
    expect(isDashboardPathAllowedForRole('AttendanceCheck', 'employee')).toBe(
      true
    );
  });

  it('blocks employee from EmployeeManager', () => {
    expect(isDashboardPathAllowedForRole('EmployeeManager', 'employee')).toBe(
      false
    );
  });

  it('allows admin to access EmployeeManager', () => {
    expect(isDashboardPathAllowedForRole('EmployeeManager', 'admin')).toBe(
      true
    );
  });

  it('allows system-admin to access all major routes', () => {
    const adminRoutes = [
      'EmployeeManager',
      'AttendanceCheck',
      'AttendanceTable',
      'Designations',
      'TenantEmployees',
    ];
    for (const route of adminRoutes) {
      expect(isDashboardPathAllowedForRole(route, 'system-admin')).toBe(true);
    }
  });

  it('allows empty path (dashboard index) for admin', () => {
    expect(isDashboardPathAllowedForRole('', 'admin')).toBe(true);
  });
});

describe('isMenuVisibleForRole', () => {
  it('shows attendance menu for all roles except unknown', () => {
    const roles = ['admin', 'manager', 'employee', 'user', 'hr-admin'];
    for (const role of roles) {
      expect(isMenuVisibleForRole('Attendance', role)).toBe(true);
    }
  });

  it('hides tenant menu from employee and manager', () => {
    expect(isMenuVisibleForRole('Tenant', 'employee')).toBe(false);
    expect(isMenuVisibleForRole('Tenant', 'manager')).toBe(false);
  });

  it('shows tenant menu for system-admin', () => {
    expect(isMenuVisibleForRole('Tenant', 'system-admin')).toBe(true);
  });
});
