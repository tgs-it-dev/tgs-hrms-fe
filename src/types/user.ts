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
 * Full user profile as returned by the profile API.
 * This is the shape used by the current user's profile page.
 */
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_pic?: string | null;
  role: string;
  tenant: string;
  created_at: string;
  updated_at: string;
}

/**
 * Legacy UI user shape used by management tables and mock data.
 * For the authenticated session user see utils/auth.ts:User.
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
