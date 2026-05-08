import { useState } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
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
    </QueryClientProvider>
  );
}
