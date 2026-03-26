import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import companyApi, { type CompanyDetails } from '../api/companyApi';
interface CompanyContextType {
  companyDetails: CompanyDetails | null;
  companyName: string;
  companyLogo: string | null;
  refreshCompanyDetails: () => Promise<void>;
}
// eslint-disable-next-line react-refresh/only-export-components
export const CompanyContext = createContext<CompanyContextType | undefined>(
  undefined
);
export const CompanyProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(
    null
  );
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const refreshCompanyDetails = useCallback(async () => {
    try {
      const details = await companyApi.getCompanyDetails();
      setCompanyDetails(details);
      const tenantId = details.tenant_id;
      setCompanyLogo(details.logo_url);
        const logoUrl = await companyApi.getCompanyLogo(tenantId);
        setCompanyLogo(logoUrl);
    } catch {
      // Leave company context empty on failure; UI can handle missing branding
    }
  }, []);
  useEffect(() => {
    refreshCompanyDetails();
  }, [refreshCompanyDetails]);
  const companyName = useMemo(
    () => companyDetails?.company_name || 'HRMS',
    [companyDetails]
  );
  const contextValue = useMemo(
    () => ({
      companyDetails,
      companyName,
      companyLogo,
      refreshCompanyDetails,
    }),
    [companyDetails, companyName, companyLogo, refreshCompanyDetails]
  );
  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
};
// eslint-disable-next-line react-refresh/only-export-components
export const useCompany = (): CompanyContextType => {
  const context = React.useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
};
