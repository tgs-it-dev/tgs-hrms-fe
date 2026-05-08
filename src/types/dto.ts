/**
 * Shared Data Transfer Objects (DTOs)
 *
 * Generic API response envelopes live in api.ts (the established source of truth).
 * This file defines mutation payload helpers and frontend view models.
 *
 * Naming convention:
 *   - *Response  — backend → frontend (read)
 *   - *Dto       — frontend → backend (write / mutation payload)
 */

// Re-export the canonical response envelopes from the established source of truth.
export type { ApiResponse, PaginatedResponse } from './api';

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
  error?: Error;
}
