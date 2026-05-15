import axiosInstance from './axiosInstance';

// Normalized Tenant interface used by UI
export interface BackendCompany {
  id: string;
  name: string;
  createdAt?: string;
}

// Company Details interface
export interface CompanyDetails {
  id: string;
  company_name: string;
  domain: string;
  logo_url: string;
  plan_id: string;
  is_paid: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  ip_restriction_enabled: boolean;
  mobile_login_enabled: boolean;
  current_ip: string;
}

// Create/Update DTO interface
export interface CompanyDto {
  name: string;
}

// Update Company Details DTO
export interface UpdateCompanyDetailsDto {
  company_name: string;
  domain: string;
}

// Backend envelope
type Envelope<T> = {
  statusCode: number;
  message?: string;
  data: T;
};

// Some endpoints (e.g., delete) return id/message without data
type DeleteEnvelope = {
  statusCode: number;
  message?: string;
  id: string;
};

function normalizeTenant(raw: unknown): BackendCompany {
  return {
    id: raw?.id,
    name: raw?.name,
    createdAt: raw?.createdAt ?? raw?.created_at ?? undefined,
  };
}

class CompanyApiService {
  private baseUrl = '/tenants';

  async getAllCompanies(): Promise<BackendCompany[]> {
    const response = await axiosInstance.get<Envelope<BackendCompany[]>>(
      this.baseUrl
    );
    const items = Array.isArray(response.data?.data) ? response.data.data : [];
    return items.map(normalizeTenant);
  }

  // Get company by ID
  async getCompanyById(id: string): Promise<BackendCompany> {
    const response = await axiosInstance.get<Envelope<BackendCompany>>(
      `${this.baseUrl}/${id}`
    );
    return normalizeTenant(response.data.data);
  }

  // Create new company
  async createCompany(companyData: CompanyDto): Promise<BackendCompany> {
    const response = await axiosInstance.post<Envelope<BackendCompany>>(
      this.baseUrl,
      companyData
    );
    return normalizeTenant(response.data.data);
  }

  // Update company
  async updateCompany(
    id: string,
    companyData: CompanyDto
  ): Promise<BackendCompany> {
    const response = await axiosInstance.put<Envelope<BackendCompany>>(
      `${this.baseUrl}/${id}`,
      companyData
    );
    return normalizeTenant(response.data.data);
  }

  // Delete company
  async deleteCompany(id: string): Promise<{ id: string; message?: string }> {
    const response = await axiosInstance.delete<DeleteEnvelope>(
      `${this.baseUrl}/${id}`
    );
    return { id: response.data.id, message: response.data.message };
  }

  // Get company details
  async getCompanyDetails(): Promise<CompanyDetails> {
    const response = await axiosInstance.get<CompanyDetails>('/company');
    return response.data;
  }

  // Update company details
  async updateCompanyDetails(
    data: UpdateCompanyDetailsDto
  ): Promise<CompanyDetails> {
    const response = await axiosInstance.put<CompanyDetails>('/company', data);
    return response.data;
  }

  // Get company logo
  async getCompanyLogo(tenantId: string): Promise<string> {
    const response = await axiosInstance.get(`/company/logo/${tenantId}`, {
      responseType: 'blob',
    });

    // Create blob URL from binary response
    const blob = new Blob([response.data], {
      type: response.data.type || 'image/jpeg',
    });
    const blobUrl = URL.createObjectURL(blob);
    return blobUrl;
  }

  // Upload/Update company logo
  async uploadCompanyLogo(logoFile: File): Promise<string> {
    const formData = new FormData();
    formData.append('logo', logoFile);

    const response = await axiosInstance.post('/company/logo', formData);
    return response.data.logo_url || response.data;
  }

  async deleteCompanyLogo(tenantId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete<{ message: string }>(
      `/company/logo/${tenantId}`
    );
    return response.data;
  }
}

const companyApi = new CompanyApiService();
export default companyApi;
