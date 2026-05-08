/**
 * Shared Data Transfer Objects (DTOs)
 *
 * This file defines the generic API response envelopes and pagination
 * contracts that the backend adheres to.  Feature-specific request/response
 * shapes live in their own type files (e.g. employee.ts, leave.ts) and
 * are parameterised with these generics where needed.
 *
 * Naming convention:
 *   - *Response  — backend → frontend (read)
 *   - *Dto       — frontend → backend (write / mutation payload)
 */

// ---------------------------------------------------------------------------
// Generic response wrappers
// ---------------------------------------------------------------------------

/**
 * Standard single-resource envelope.
 *
 * @example
 *   const { data } = await axiosInstance.get<ApiResponse<Employee>>('/employees/1');
 *   console.log(data.data.first_name);
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

/**
 * Standard paginated list envelope.
 *
 * @example
 *   const { data } = await axiosInstance.get<PaginatedResponse<Employee>>('/employees');
 *   console.log(data.items, data.total);
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Common mutation DTOs
// ---------------------------------------------------------------------------

/** Generic create/update payload where only a subset of fields is sent. */
export type CreateDto<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/** Generic partial update payload. */
export type UpdateDto<T> = Partial<CreateDto<T>>;

// ---------------------------------------------------------------------------
// Frontend view models
// ---------------------------------------------------------------------------

/**
 * Represents a UI-ready select option derived from a backend entity.
 * Used by AppSelect, AppDropdown, and similar form controls.
 */
export interface SelectOption {
  label: string;
  value: string | number;
}

/**
 * Generic "loading / error / data" view state for async data.
 * Mirrors TanStack Query's query result shape for component props.
 */
export interface AsyncViewState<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
}
