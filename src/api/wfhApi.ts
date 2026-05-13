import axiosInstance from './axiosInstance';
import { env } from '../config/env';

export interface CreateWFHRequest {
  start_date: string;
  end_date: string;
  reason: string;
  attachments?: (File | string)[];
}

/**
 * Workflow Step
 */
export interface WorkflowStep {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  workflow_request_id: string;
  tenant_id: string;

  step_order: number;
  approver_role: string;
  step_label: string;

  status: 'pending' | 'approved' | 'rejected';

  approver_id: string | null;
  remarks: string | null;
  acted_at: string | null;
}

/**
 * Actual WFH Request Data
 */
export interface WFHRequestData {
  id: string;

  start_date: string;
  end_date: string;

  reason: string;

  status: 'pending' | 'approved' | 'rejected' | 'cancelled';

  attachments: string[];
}

/**
 * Workflow WFH Request
 */
export interface WFHWorkflowRequest {
  /**
   * Workflow request ID
   * Use this for workflow actions like cancel/update
   */
  id: string;

  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  tenant_id: string;

  request_type: string;

  /**
   * Related WFH entity ID
   */
  related_entity_id: string;

  requestor_id: string;

  status: 'pending' | 'approved' | 'rejected' | 'cancelled';

  current_step_order: number;
  total_steps: number;

  steps: WorkflowStep[];

  request_data: WFHRequestData;
}

export interface WFHListResponse {
  items: WFHWorkflowRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface DeleteWFHAttachmentResponse {
  url: string;
}

class WFHApiService {
  private baseUrl = `${env.apiBaseUrl}/wfh`;

  /**
   * Create Work From Home request
   */
  async createWFHRequest(data: CreateWFHRequest): Promise<WFHRequestData> {
    const formData = new FormData();

    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date);
    formData.append('reason', data.reason);

    if (data.attachments && Array.isArray(data.attachments)) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await axiosInstance.post<WFHRequestData>(
      `${this.baseUrl}`,
      formData
    );

    return response.data;
  }

  /**
   * Get logged-in user's workflow requests
   */
  async getMyWFHRequests(page = 1, limit = 10): Promise<WFHListResponse> {
    const response = await axiosInstance.get<WFHListResponse>(
      `${this.baseUrl}/workflow/my-requests`,
      {
        params: {
          page,
          limit,
        },
      }
    );

    return response.data;
  }

  /**
   * Update WFH request
   */
  async updateWFHRequest(
    id: string,
    data: Partial<CreateWFHRequest>
  ): Promise<WFHRequestData> {
    const formData = new FormData();

    if (data.start_date) formData.append('start_date', data.start_date);
    if (data.end_date) formData.append('end_date', data.end_date);
    if (data.reason) formData.append('reason', data.reason);

    if (data.attachments && Array.isArray(data.attachments)) {
      data.attachments.forEach(file => {
        formData.append('attachments', file);
      });
    }

    const response = await axiosInstance.patch<WFHRequestData>(
      `${this.baseUrl}/${id}`,
      formData
    );

    return response.data;
  }

  /**
   * Cancel WFH request
   * Pass workflow request ID
   */
  async cancelWFHRequest(id: string): Promise<WFHWorkflowRequest> {
    const response = await axiosInstance.patch<WFHWorkflowRequest>(
      `${this.baseUrl}/${id}/cancel`
    );

    return response.data;
  }

  /**
   * Delete WFH attachment
   */
  async deleteDocument(
    id: string,
    url: string
  ): Promise<DeleteWFHAttachmentResponse> {
    const response = await axiosInstance.delete<DeleteWFHAttachmentResponse>(
      `${this.baseUrl}/${id}/attachments`,
      { data: { url } }
    );

    return response.data;
  }

  /**
   * Get WFH request by workflow ID
   */
  async getWFHRequestById(id: string): Promise<WFHWorkflowRequest> {
    const response = await axiosInstance.get<WFHWorkflowRequest>(
      `${this.baseUrl}/workflow/${id}`
    );

    return response.data;
  }
}

const wfhApi = new WFHApiService();

export default wfhApi;
