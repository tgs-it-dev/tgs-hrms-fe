import axiosInstance from './axiosInstance';
import { env } from '../config/env';

export type OvertimeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface CreateOvertimeRequest {
  start_date: string;
  end_date?: string;
  hours?: number;
  reason: string;
  attachments?: File[];
}

export interface UpdateOvertimeRequest {
  start_date?: string;
  end_date?: string;
  hours?: number;
  reason?: string;
  attachments_to_remove?: string[];
  attachments?: File[];
}

export interface OvertimeResponse {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tenant_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  hours: number | string;
  reason: string;
  status: OvertimeStatus;
  attachments: string[];
  workflow_request_id: string;
}

export interface DeleteOvertimeAttachmentResponse {
  url: string;
}

class OvertimeApiService {
  private baseUrl = `${env.apiBaseUrl}/overtime`;

  /**
   * Create overtime request
   */
  async createOvertimeRequest(
    data: CreateOvertimeRequest
  ): Promise<OvertimeResponse> {
    const formData = new FormData();

    formData.append('start_date', data.start_date);
    formData.append('reason', data.reason);

    if (data.end_date) {
      formData.append('end_date', data.end_date);
    }

    if (typeof data.hours === 'number') {
      formData.append('hours', String(data.hours));
    }

    if (data.attachments && Array.isArray(data.attachments)) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await axiosInstance.post<OvertimeResponse>(
      this.baseUrl,
      formData
    );

    return response.data;
  }

  /**
   * Update overtime request
   */
  async updateOvertimeRequest(
    id: string,
    data: UpdateOvertimeRequest
  ): Promise<OvertimeResponse> {
    const formData = new FormData();

    if (data.start_date) {
      formData.append('start_date', data.start_date);
    }

    if (data.end_date) {
      formData.append('end_date', data.end_date);
    }

    if (typeof data.hours === 'number') {
      formData.append('hours', String(data.hours));
    }

    if (data.reason) {
      formData.append('reason', data.reason);
    }

    if (
      data.attachments_to_remove &&
      Array.isArray(data.attachments_to_remove)
    ) {
      data.attachments_to_remove.forEach(url => {
        formData.append('attachments_to_remove', url);
      });
    }

    if (data.attachments && Array.isArray(data.attachments)) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await axiosInstance.patch<OvertimeResponse>(
      `${this.baseUrl}/${id}`,
      formData
    );

    return response.data;
  }

  /**
   * Cancel overtime request
   */
  async cancelOvertimeRequest(id: string): Promise<OvertimeResponse> {
    const response = await axiosInstance.patch<OvertimeResponse>(
      `${this.baseUrl}/${id}/cancel`
    );

    return response.data;
  }

  /**
   * Delete overtime attachment
   */
  async deleteDocument(
    id: string,
    url: string
  ): Promise<DeleteOvertimeAttachmentResponse> {
    const response =
      await axiosInstance.delete<DeleteOvertimeAttachmentResponse>(
        `${this.baseUrl}/${id}/attachments`,
        {
          data: { url },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

    return response.data;
  }
}

const overtimeApi = new OvertimeApiService();

export default overtimeApi;
