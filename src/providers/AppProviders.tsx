import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LanguageProvider } from '../context/LanguageContext';
import { UserProvider } from '../context/UserContext';
import { queryClientRef } from './queryClientRef';

export function AppProviders({ children }: { children: ReactNode }) {
  // Instantiated in useState so it is NOT shared across HMR boundaries or test runs.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 min — data considered fresh
            gcTime: 1000 * 60 * 10, // 10 min — keep unused cache
            retry: (failureCount, error) => {
              // Don't retry 4xx errors (client errors) — only retry network/5xx
              const status = (error as { response?: { status?: number } })
                ?.response?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: false, // Never auto-retry mutations
            // TODO: wire normalizeApiError from src/utils/errorHandler.ts into
            // onError here so all mutation failures are normalized consistently.
            // e.g. onError: (error) => { const e = normalizeApiError(error); showToast(e.message); }
          },
        },
      })
  );

  // Keep ref in sync so logout handlers and other imperative code can access
  // the active client without re-introducing a module-level singleton.
  queryClientRef.current = queryClient;

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {/* ProfilePictureContext merged into UserProvider — no separate provider needed */}
        <UserProvider>{children}</UserProvider>
      </LanguageProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
