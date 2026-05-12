import axiosInstance from './axiosInstance';

export interface WorkflowFeatureFlagRequest {
  enabled: boolean;
}

export interface WorkflowFeatureFlagResponse {
  leave_workflow_enabled: boolean;
  wfh_workflow_enabled: boolean;
  overtime_workflow_enabled: boolean;
}

export type WorkflowRequestType = 'leave' | 'wfh' | 'overtime';

export type WorkflowRequestStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'withdrawn'
  | 'all'
  | 'history';

export interface WorkflowRequest {
  request_data: RequestData;
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tenant_id: string;
  request_type: WorkflowRequestType;
  related_entity_id: string;
  requestor_id: string;
  status: WorkflowRequestStatus;
  current_step_order: number;
  total_steps: number;
  steps: WorkflowStep[];
  attachments?: string[];
  requestor: {
    first_name?: string;
    last_name?: string;
  };
}
export interface WorkflowStep {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  workflow_request_id: string;
  tenant_id: string;
  step_order: number;
  approver_role: 'manager' | 'hr-admin' | string;
  step_label: string;
  status: WorkflowRequestStatus;
  approver_id: string | null;
  remarks: string | null;
  acted_at: string | null;
  approval_role: string;
}

export interface RequestData {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: WorkflowRequestStatus;
  attachments?: string[];
  leave_type_id?: string;
}

export interface GetMyWorkflowRequestsParams {
  type?: WorkflowRequestType;
  status?: WorkflowRequestStatus;
  page?: number;
  limit?: number;
}

export interface WorkflowRequestListResponse {
  items: WorkflowRequest[];
  total: number;
  page: number;
  limit: number;
}

export type WorkflowApprovalView = 'pending' | 'history' | 'all';

export interface GetWorkflowApprovalsParams {
  status?: WorkflowApprovalView;
  type?: WorkflowRequestType;
  page?: number;
  limit?: number;
}

export interface WorkflowDecisionRequest {
  action: 'approved' | 'rejected';
  remarks?: string;
}

export interface UpdateWorkflowSettingsRequest {
  request_type: WorkflowRequestType;
  enabled: boolean;
}

class WorkflowApiService {
  private baseUrl = 'https://tgs-hrms.onrender.com/workflow';

  /**
   * Get workflow feature flag status
   */
  async getFeatureFlag(): Promise<WorkflowFeatureFlagResponse> {
    const response = await axiosInstance.get<WorkflowFeatureFlagResponse>(
      `${this.baseUrl}/settings`
    );

    return response.data;
  }

  /**
   * Enable / disable workflow feature flag
   */
  async updateFeatureFlag(
    data: WorkflowFeatureFlagRequest
  ): Promise<WorkflowFeatureFlagResponse> {
    const response = await axiosInstance.patch<WorkflowFeatureFlagResponse>(
      `${this.baseUrl}/settings/enabled`,
      data
    );

    return response.data;
  }

  /**
   * Get current user's workflow requests
   */
  async getMyWorkflowRequests(
    params?: GetMyWorkflowRequestsParams
  ): Promise<WorkflowRequestListResponse> {
    const response = await axiosInstance.get<WorkflowRequestListResponse>(
      `${this.baseUrl}/my-requests`,
      {
        params: {
          type: params?.type,
          status: params?.status,
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
        },
      }
    );

    return response.data;
  }

  /**
   * Get workflow approvals
   */
  async getWorkflowApprovals(
    params?: GetWorkflowApprovalsParams
  ): Promise<WorkflowRequestListResponse> {
    const response = await axiosInstance.get<WorkflowRequestListResponse>(
      `${this.baseUrl}/approvals`,
      {
        params: {
          view: params?.status || 'all',
          type: params?.type,
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
        },
      }
    );

    return response.data;
  }

  /**
   * Approve / reject workflow request
   */
  async submitWorkflowDecision(
    id: string,
    data: WorkflowDecisionRequest
  ): Promise<WorkflowRequest> {
    const response = await axiosInstance.post<WorkflowRequest>(
      `${this.baseUrl}/requests/${id}/decision`,
      data
    );

    return response.data;
  }

  /**
   * Update workflow settings
   */
  async updateWorkflowSettings(
    data: UpdateWorkflowSettingsRequest
  ): Promise<WorkflowFeatureFlagResponse> {
    const response = await axiosInstance.patch<WorkflowFeatureFlagResponse>(
      `${this.baseUrl}/settings`,
      data
    );

    return response.data;
  }
}

const workflowApi = new WorkflowApiService();

export default workflowApi;
