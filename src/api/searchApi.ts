import axiosInstance from './axiosInstance';

export interface SearchResultItem {
  id: string;
  title: string;
  description: string;
  module: string;
  metadata: Record<string, unknown>;
}

export interface SearchResponse {
  query: string;
  totalResults: number;
  results: {
    employees?: SearchResultItem[];
    leaves?: SearchResultItem[];
    assets?: SearchResultItem[];
    assetRequests?: SearchResultItem[];
    teams?: SearchResultItem[];
    attendance?: SearchResultItem[];
    payroll?: SearchResultItem[];
  };
  counts: {
    employees?: number;
    leaves?: number;
    assets?: number;
    assetRequests?: number;
    teams?: number;
    attendance?: number;
    payroll?: number;
  };
}

export interface SearchParams {
  /** Search query (optional). If provided, minimum 2 characters. */
  query?: string;
  /** Limit search to a specific module. Default: all allowed modules. */
  module?: string;
  /** Max results per module. Default: 10. */
  limit?: number;
  /** Tenant filter (System Admin / Network Admin only). Omit for current user tenant; use for admin to search all tenants. */
  tenantId?: string;
}

class SearchApiService {
  private baseUrl = '/search';

  /**
   * Global search (tenant-scoped, RBAC-filtered).
   * GET /search with query, module, limit, tenantId.
   */
  async search(params: SearchParams = {}): Promise<SearchResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.query != null && params.query.trim().length >= 2) {
      queryParams.query = params.query.trim();
    }

    if (params.module) {
      queryParams.module = params.module;
    }

    if (params.limit != null) {
      queryParams.limit = params.limit;
    }

    if (params.tenantId) {
      queryParams.tenantId = params.tenantId;
    }

    const response = await axiosInstance.get<SearchResponse>(this.baseUrl, {
      params: queryParams,
    });

    return response.data;
  }
}

export const searchApiService = new SearchApiService();
