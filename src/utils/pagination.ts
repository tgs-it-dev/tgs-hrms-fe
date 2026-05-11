/**
 * Typed pagination helpers.
 *
 * Use these instead of inline `{ page, limit }` / `{ page, per_page }`
 * constructions in query hooks so the shape is consistent across all features.
 *
 * NOTE: PaginatedResult<T> was removed — use PaginatedResponse<T> from
 * src/types/api.ts instead (it uses `items: T[]` which matches the backend).
 */

/** Default number of items per page — change here to change globally. */
export const DEFAULT_PAGE_SIZE = 25;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Builds the query-string params object expected by paginated list endpoints.
 *
 * Converts frontend `PaginationParams` (camelCase) to the `page` / `limit`
 * pair used by the TGS HRMS backend.
 */
export function buildPaginationParams(
  params: PaginationParams
): Record<string, string> {
  return {
    page: String(params.page),
    limit: String(params.pageSize),
  };
}

/**
 * Derives `totalPages` from a raw API response when the backend does not
 * return it directly (i.e. the response only has `total` + `limit`).
 */
export function deriveTotalPages(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}
