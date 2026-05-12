/**
 * CompanyContext is kept for backward-compat exports only.
 * All state is now managed by useCompanyStore (src/store/companyStore.ts).
 */
import type { ReactNode } from 'react';
import { useCompanyStore } from '../store/companyStore';
import type { CompanyDetails } from '../api/companyApi';

export type { CompanyDetails };

export interface CompanyContextType {
  companyDetails: CompanyDetails | null;
  companyName: string;
  companyLogo: string | null;
  refreshCompanyDetails: () => Promise<void>;
}

/** @deprecated Use useCompanyStore() from src/store directly. */
// eslint-disable-next-line react-refresh/only-export-components
export const useCompany = (): CompanyContextType => useCompanyStore();

/**
 * No-op provider — kept so existing JSX (<CompanyProvider>) compiles.
 * Bootstrap happens in ProtectedBootstrapper inside ProtectedProviders.tsx.
 */
export const CompanyProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
