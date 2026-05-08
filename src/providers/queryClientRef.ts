import type { QueryClient } from '@tanstack/react-query';

/**
 * Ref for imperative cache access (e.g. logout handlers) without a module singleton.
 * Set by AppProviders on every render — always holds the current QueryClient instance.
 */
export const queryClientRef: { current: QueryClient | null } = {
  current: null,
};
