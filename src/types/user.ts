/**
 * Minimal user reference embedded in many API responses
 * (attendance events, team members, etc.).
 */
export interface UserShort {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * Canonical authenticated-user profile.
 *
 * This is the single source of truth for the logged-in user's shape.
 * It merges the profile API response (snake_case, from backend) with the
 * session fields previously scattered across utils/auth.ts.
 *
 * Backend response shape — snake_case matches API contract.
 */
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_pic?: string | null;
  role: string;
  /** Role display name when backend returns an object with a name field */
  role_name?: string;
  tenant: string;
  /** Tenant ID from the auth token payload */
  tenant_id?: string;
  /** Set to true when the tenant's subscription payment is required */
  requires_payment?: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Legacy UI user shape used by management tables and mock data.
 * Not the authenticated session user — see UserProfile above.
 */
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
  department: string;
  designation: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  role: string;
  department: string;
  designation: string;
}

export interface UserFilters {
  department: string;
  designation: string;
  search: string;
}
