/**
 * Centralised API error normalizer.
 *
 * Every failed TanStack Query request produces an `unknown` error.
 * `normalizeApiError` converts it to a consistent `ApiError` shape so
 * components never need to re-implement their own error parsing.
 *
 * Wired into the QueryClient `onError` default via AppProviders.tsx.
 */

import axios from 'axios';

export interface ApiError {
  /** HTTP status code, or 0 for network errors / non-HTTP failures */
  status: number;
  /** Human-readable message safe to display in the UI */
  message: string;
  /** Optional machine-readable error code from the backend */
  code?: string;
  /** Field name when the error relates to a specific form field */
  field?: string;
}

// Patterns that indicate internal server crashes — never expose these raw to users.
const INTERNAL_ERROR_PATTERNS = [
  /is not defined/i,
  /cannot read propert/i,
  /undefined is not/i,
  /null is not/i,
  /TypeError:/i,
  /ReferenceError:/i,
  /SyntaxError:/i,
];

function sanitize(message: string): string {
  if (INTERNAL_ERROR_PATTERNS.some(p => p.test(message))) {
    return 'An unexpected server error occurred. Please try again or contact support.';
  }
  return message;
}

/**
 * Normalises any thrown value (Axios error, plain Error, string, etc.) into
 * the canonical `ApiError` interface.
 */
export function normalizeApiError(error: unknown): ApiError {
  // Axios errors — most common in this codebase
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as
      | {
          message?: string | string[];
          error?: string;
          code?: string;
          field?: string;
        }
      | undefined;

    // Backend may send `message` as an array (class-validator) or a string.
    const rawMessage = Array.isArray(data?.message)
      ? data.message.join(' ')
      : (data?.message ?? error.message ?? 'Request failed');

    return {
      status,
      message: sanitize(rawMessage),
      code: data?.error ?? data?.code,
      field: data?.field,
    };
  }

  // Plain JS Error
  if (error instanceof Error) {
    return {
      status: 0,
      message: sanitize(error.message),
    };
  }

  // String error
  if (typeof error === 'string') {
    return {
      status: 0,
      message: sanitize(error),
    };
  }

  // Fallback
  return {
    status: 0,
    message: 'An unexpected error occurred. Please try again.',
  };
}
