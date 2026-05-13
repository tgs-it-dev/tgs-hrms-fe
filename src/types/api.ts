/**
 * API response types follow the backend snake_case convention.
 * Frontend view models use camelCase.
 * See also: src/types/dto.ts for mutation payload helpers.
 */

/** Generic paginated list returned by most list endpoints. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Generic data envelope used by some REST endpoints. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}
