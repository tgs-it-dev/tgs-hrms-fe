import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LanguageProvider } from '../context/LanguageContext';
import { useUserStore } from '../store/userStore';
import { queryClientRef } from './queryClientRef';

function UserBootstrapper({ children }: { children: ReactNode }) {
  const bootstrap = useUserStore(s => s.bootstrap);

  useEffect(() => {
    return bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
            retry: (failureCount, error) => {
              const status = (error as { response?: { status?: number } })
                ?.response?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  queryClientRef.current = queryClient;

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <UserBootstrapper>{children}</UserBootstrapper>
      </LanguageProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
