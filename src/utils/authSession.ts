import type { LoginResponse } from '../api/authApi';

const setItem = (key: string, value?: string | number | null) => {
  if (value === undefined || value === null) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, String(value));
};

const setJsonItem = (key: string, value: unknown) => {
  if (value === undefined || value === null) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
};

export const getTenantIdFromUser = (
  user?: Record<string, unknown>
): string | null => {
  if (!user || typeof user !== 'object') return null;
  const tenantId =
    (user.tenant_id as string | number | undefined) ??
    (user.tenantId as string | number | undefined) ??
    (user.tenant && typeof user.tenant === 'object'
      ? ((user.tenant as Record<string, unknown>).id as
          | string
          | number
          | undefined)
      : undefined);
  return tenantId != null ? String(tenantId) : null;
};

export const persistAuthSession = (data: LoginResponse): void => {
  if (!data?.accessToken) {
    throw new Error('Missing access token in auth response');
  }

  setItem('accessToken', data.accessToken);
  if (data.refreshToken) setItem('refreshToken', data.refreshToken);
  else localStorage.removeItem('refreshToken');

  if (data.user) {
    setJsonItem('user', data.user);
    const tenantId = getTenantIdFromUser(
      data.user as Record<string, unknown> | undefined
    );
    setItem('tenant_id', tenantId);
  } else {
    localStorage.removeItem('user');
    localStorage.removeItem('tenant_id');
  }

  if (data.permissions !== undefined) {
    setJsonItem('permissions', data.permissions);
  } else {
    localStorage.removeItem('permissions');
  }

  if (data.employee?.id) {
    setItem('employeeId', data.employee.id);
  }

  if (data.company) setJsonItem('company', data.company);
  else localStorage.removeItem('company');

  const signupSession = data.session_id ?? data.signupSessionId;
  if (signupSession) setItem('signupSessionId', signupSession);
};

export const getStoredUser = <T = Record<string, unknown>>(): T | null => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};
