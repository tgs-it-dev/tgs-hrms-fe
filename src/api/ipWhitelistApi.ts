import axiosInstance from './axiosInstance';
import { env } from '../config/env';

export interface IPWhitelistResponse {
  message: string;
}

export interface IPWhitelistItem {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  tenant_id: string;

  ip_address: string;
  description: string;
}

export interface IPWhitelistListResponse {
  items: IPWhitelistItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateIPWhitelistRequest {
  ip_address: string;
  description: string;
}

export interface DeleteIPWhitelistResponse {
  deleted: boolean;
  ip_address: string;
}

export interface GetIPWhitelistParams {
  page?: number;
  limit?: number;
}

class IPWhitelistApiService {
  private baseUrl = `${env.apiBaseUrl}/ip-whitelist`;

  /**
   * Enable IP restriction
   */
  async enableIPRestriction(): Promise<IPWhitelistResponse> {
    const response = await axiosInstance.post<IPWhitelistResponse>(
      `${this.baseUrl}/enable`
    );

    return response.data;
  }

  /**
   * Disable IP restriction
   */
  async disableIPRestriction(): Promise<IPWhitelistResponse> {
    const response = await axiosInstance.post<IPWhitelistResponse>(
      `${this.baseUrl}/disable`
    );

    return response.data;
  }

  /**
   * Get whitelisted IPs
   */
  async getWhitelistedIPs(
    params?: GetIPWhitelistParams
  ): Promise<IPWhitelistListResponse> {
    const response = await axiosInstance.get<IPWhitelistListResponse>(
      `${this.baseUrl}`,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
        },
      }
    );

    return response.data;
  }

  /**
   * Add IP to whitelist
   */
  async addIPToWhitelist(
    data: CreateIPWhitelistRequest
  ): Promise<IPWhitelistItem> {
    const response = await axiosInstance.post<IPWhitelistItem>(
      `${this.baseUrl}`,
      data
    );

    return response.data;
  }

  /**
   * Remove IP from whitelist
   */
  async removeIPFromWhitelist(
    ipAddress: string
  ): Promise<DeleteIPWhitelistResponse> {
    const response =
      await axiosInstance.delete<DeleteIPWhitelistResponse>(
        `${this.baseUrl}/${encodeURIComponent(ipAddress)}`
      );

    return response.data;
  }
}

const ipWhitelistApi = new IPWhitelistApiService();

export default ipWhitelistApi;