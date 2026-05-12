import { create } from 'zustand';
import companyApi, { type CompanyDetails } from '../api/companyApi';

interface CompanyState {
  companyDetails: CompanyDetails | null;
  companyName: string;
  companyLogo: string | null;
  refreshCompanyDetails: () => Promise<void>;
}

export const useCompanyStore = create<CompanyState>(set => ({
  companyDetails: null,
  companyName: 'HRMS',
  companyLogo: null,

  refreshCompanyDetails: async () => {
    try {
      const details = await companyApi.getCompanyDetails();
      set({
        companyDetails: details,
        companyName: details.company_name || 'HRMS',
        companyLogo: details.logo_url,
      });
      const logoUrl = await companyApi.getCompanyLogo(details.tenant_id);
      set({ companyLogo: logoUrl });
    } catch {
      // Leave company state empty on failure; UI handles missing branding
    }
  },
}));
