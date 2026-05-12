import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { NotificationProvider } from '../context/NotificationContext';
import { FeatureToggleProvider } from '../context/FeatureToggleContext';
import { ThemeProvider } from '../theme';
import { useCompanyStore } from '../store/companyStore';

function CompanyBootstrapper({ children }: { children: ReactNode }) {
  const refreshCompanyDetails = useCompanyStore(s => s.refreshCompanyDetails);

  useEffect(() => {
    refreshCompanyDetails();
  }, [refreshCompanyDetails]);

  return <>{children}</>;
}

export function ProtectedProviders({ children }: { children: ReactNode }) {
  return (
    <CompanyBootstrapper>
      <NotificationProvider>
        <FeatureToggleProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </FeatureToggleProvider>
      </NotificationProvider>
    </CompanyBootstrapper>
  );
}
