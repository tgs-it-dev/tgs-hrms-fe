/**
 * Canonical role string constants for TGS HRMS.
 *
 * Use these constants instead of hardcoded strings throughout the codebase so
 * that role renames only require a single change here.
 *
 * Example:
 *   import { ROLES } from '@/constants/roles';
 *   if (role === ROLES.ADMIN) { ... }
 */
export const ROLES = {
  ADMIN: 'admin',
  HR_ADMIN: 'hr-admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  SYSTEM_ADMIN: 'system-admin',
  NETWORK_ADMIN: 'network-admin',
  USER: 'user',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];
