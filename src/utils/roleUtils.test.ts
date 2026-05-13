import { describe, it, expect } from 'vitest';
import {
  getRoleName,
  hasRole,
  isAdmin,
  isManager,
  isEmployee,
  isSystemAdmin,
} from './roleUtils';

describe('getRoleName', () => {
  it('returns the string when role is a string', () => {
    expect(getRoleName('admin')).toBe('admin');
    expect(getRoleName('manager')).toBe('manager');
  });

  it('extracts name from a role object', () => {
    expect(getRoleName({ name: 'admin' })).toBe('admin');
    expect(getRoleName({ name: 'employee', id: '1' })).toBe('employee');
  });

  it('returns Unknown for undefined', () => {
    expect(getRoleName(undefined)).toBe('Unknown');
  });
});

describe('hasRole', () => {
  it('matches case-insensitively', () => {
    expect(hasRole('Admin', 'admin')).toBe(true);
    expect(hasRole('ADMIN', 'admin')).toBe(true);
  });

  it('returns false for non-matching roles', () => {
    expect(hasRole('employee', 'admin')).toBe(false);
  });

  it('works with role objects', () => {
    expect(hasRole({ name: 'admin' }, 'admin')).toBe(true);
  });
});

describe('isAdmin / isManager / isEmployee / isSystemAdmin', () => {
  it('correctly identifies admin', () => {
    expect(isAdmin('admin')).toBe(true);
    expect(isAdmin('manager')).toBe(false);
  });

  it('correctly identifies manager', () => {
    expect(isManager('manager')).toBe(true);
    expect(isManager('admin')).toBe(false);
  });

  it('correctly identifies employee', () => {
    expect(isEmployee('employee')).toBe(true);
    expect(isEmployee('user')).toBe(false);
  });

  it('correctly identifies system-admin', () => {
    expect(isSystemAdmin('system-admin')).toBe(true);
    expect(isSystemAdmin('admin')).toBe(false);
  });
});
