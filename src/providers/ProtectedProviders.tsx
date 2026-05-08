import type { ReactNode } from 'react';
import { CompanyProvider } from '../context/CompanyContext';
import { NotificationProvider } from '../context/NotificationContext';
import { FeatureToggleProvider } from '../context/FeatureToggleContext';
import { ThemeProvider } from '../theme';

export function ProtectedProviders({ children }: { children: ReactNode }) {
  return (
    <CompanyProvider>
      <NotificationProvider>
        <FeatureToggleProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </FeatureToggleProvider>
      </NotificationProvider>
    </CompanyProvider>
  );
}
