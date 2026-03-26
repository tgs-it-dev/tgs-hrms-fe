import axiosInstance from './axiosInstance';
import { notificationsApi } from './notificationsApi';
import systemEmployeeApiService from './systemEmployeeApi';
import teamApi from './teamApi';
import { getCurrentUser } from '../utils/auth';

export interface CreateLeaveRequest {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  documents?: File[];
}

export interface LeaveType {
  id: string;
  name: string;
  description?: string;
}

export interface CreateLeaveTypeRequest {
  name: string;
  description?: string;
  maxDaysPerYear: number;
  carryForward: boolean;
  isPaid: boolean;
}

export interface LeaveTypeListResponse {
  items: LeaveType[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface LeaveResponse {
  id: string;
  employeeId?: string;
  leaveTypeId?: string;
  startDate: string;
  endDate: string;
  totalDays?: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | 'cancelled';
  approvedBy?: string;
  tenantId?: string;
  createdAt?: string;
  approvedAt?: string | null;
  remarks?: string | null;
  managerRemarks?: string | null;
  documents?: string[];
}

export interface CreateLeaveForEmployeeRequest {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  documents?: File[];
}

export interface UpdateLeaveRequest {
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  documents?: File[];
}

export interface LeaveWithUser extends LeaveResponse {
  user: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface UpdateLeaveStatusRequest {
  status: 'approved' | 'rejected';
}

type LeaveResWithRelations = LeaveResponse & {
  user?: { id: string; first_name?: string };
  employee?: {
    id: string;
    first_name?: string;
    team?: string;
    team_id?: string;
    teamId?: string;
  };
};

class LeaveApiService {
  private baseUrl = '/leaves';

  async createLeave(data: CreateLeaveRequest): Promise<LeaveResponse> {
    const formData = new FormData();

    formData.append('leaveTypeId', data.leaveTypeId);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('reason', data.reason);

    if (data.documents && Array.isArray(data.documents)) {
      data.documents.forEach(file => {
        formData.append('documents', file);
      });
    }

    const response = await axiosInstance.post<LeaveResponse>(
      this.baseUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    const res = response.data;

    // Notify admin + reporting manager about new leave application (best-effort, non-blocking)
    (async () => {
      // Determine employee id + name
      const resTyped = res as LeaveResWithRelations;
      const employeeId =
        resTyped.employeeId || resTyped.user?.id || getCurrentUser()?.id;
      const employeeName =
        `${resTyped.employee?.first_name || resTyped.user?.first_name || getCurrentUser()?.first_name || ''}`.trim() ||
        'Employee';

      try {
       
        if (employeeId) {
          try {
            const profile = await systemEmployeeApiService.getSystemEmployeeById(String(employeeId));
            const prof = profile as Record<string, unknown> | undefined;
            const teamIdRaw = prof?.team ?? prof?.team_id ?? prof?.teamId ?? undefined;
            const teamId = teamIdRaw ?? undefined;
            if (teamId) {
              try {
                const team = await teamApi.getTeamById(String(teamId));
                const managerId = team?.manager_id ?? team?.manager?.id;
                if (managerId) {
                  const message = `${employeeName} has applied for leave`;
                  const notif = await notificationsApi.sendNotification({
                    user_ids: [String(managerId)],
                    message,
                    type: 'leave',
                  });
                  if (!notif.ok) {
                    console.warn(
                      'Notification send failed for createLeave (team manager)',
                      notif.message,
                      notif.correlationId
                    );
                  }
                  
                }
              } catch {
                // ignore and continue to admin notify
              }
            }
          } catch {
            // ignore and continue
          }
        }

        
        try {
          // Dynamic import to avoid circular dependency
          const { searchApiService } = await import('./searchApi');
          const adminsResp = await searchApiService.search({ limit: 10 });
          const adminItems = adminsResp?.results?.employees ?? [];
          const adminIds = (adminItems as Array<Record<string, unknown>>).map(it => String(it.id)).filter(Boolean).slice(0, 5);
          if (adminIds.length > 0) {
            const message = `${employeeName} has applied for leave`;
            const notif = await notificationsApi.sendNotification({
              user_ids: adminIds,
              message,
              type: 'leave',
            });
            if (!notif.ok) {
              console.warn('Notification send failed for createLeave (admins)', notif.message, notif.correlationId);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch/notify admins for leave creation', e);
        }
      } catch (err) {

        console.warn('Unexpected error while sending leave creation notification', err);
      }
      // Dispatch an in-app event to update local UI immediately
      /* 
      try {
        const detail = {
          title: 'Leave Applied',
          message: `${employeeName} has applied for leave`,
          employeeName,
          data: res,
          actorId: getCurrentUser()?.id ?? undefined,
        };
        const ev = new CustomEvent<Record<string, unknown>>('hrms:notification', { detail });
        window.dispatchEvent(ev);
      } catch {
        // ignore
      }
      */
    })();

    return res;
  }

  async getUserLeaves(
    userId?: string,
    page = 1
  ): Promise<{
    items: LeaveResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const params = userId ? { userId, page, limit: 25 } : { page, limit: 25 };
    const response = await axiosInstance.get(this.baseUrl, { params });
    const data = response.data;

    if (data && data.items) return data;
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
    return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
  }

  async getAllLeaves(
    page = 1,
    filters?: { month?: number; year?: number; status?: string }
  ): Promise<{
    items: LeaveWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    type AllLeaveParams = {
      page: number;
      limit: number;
      month?: number;
      year?: number;
      status?: string;
    };
    const params: AllLeaveParams = { page, limit: 25 };
    if (filters?.month) params.month = filters.month;
    if (filters?.year) params.year = filters.year;
    if (filters?.status) params.status = filters.status;

    const response = await axiosInstance.get(`${this.baseUrl}/all`, {
      params,
    });
    return response.data;
  }

  async getTeamLeaves(page = 1): Promise<{
    items: LeaveWithUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const response = await axiosInstance.get(`${this.baseUrl}/team`, {
      params: { page, limit: 25 },
    });
    const data = response.data;

    if (data && data.items) return data;
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
    return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
  }

  async updateLeaveStatus(
    id: string,
    status: 'approved' | 'rejected'
  ): Promise<LeaveResponse> {
    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}`,
      { status }
    );
    return response.data;
  }

  async cancelLeave(id: string): Promise<LeaveResponse> {
    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}/cancel`
    );
    return response.data;
  }

  async approveLeave(id: string, remarks?: string): Promise<LeaveResponse> {
    const payload = remarks?.trim() ? { remarks: remarks.trim() } : {};
    const response = await axiosInstance.put<LeaveResponse>(
      `${this.baseUrl}/${id}/approve`,
      payload
    );
    const res = response.data;
    const resTyped = res as LeaveResWithRelations;

    // Try to send notification to the employee about approval (non-blocking)
    (async () => {
      try {
        const recipient =
          resTyped.employeeId ?? resTyped.user?.id ?? resTyped.employee?.id;
        const employeeName =
          resTyped.employee?.first_name ||
          resTyped.user?.first_name ||
          getCurrentUser()?.first_name ||
          'Employee';
        if (recipient) {
          const message = `Your leave has been approved`;
          const notif = await notificationsApi.sendNotification({
            user_ids: [String(recipient)],
            message,
            type: 'leave',
          });
          if (!notif.ok) {
            // Log for debugging: backend message + correlationId if available
            console.warn('Notification send failed for approveLeave', notif.message, notif.correlationId);
          }
          // Dispatch in-app event for immediate UI update
          try {
            const detail = {
              title: 'Leave Applied',
              message: `${employeeName} has applied for leave`,
              employeeName,
              data: res,
              actorId: getCurrentUser()?.id ?? undefined,
            };
            const ev = new CustomEvent<Record<string, unknown>>('hrms:notification', { detail });
            window.dispatchEvent(ev);
          } catch {
            // ignore
          }
        }
      } catch (e) {
        // Do not block main flow on notification errors
        console.warn('Failed to send approval notification', e);
      }
    })();

    return res;
  }

  async rejectLeave(id: string, remarks?: string): Promise<LeaveResponse> {
    const payload = remarks?.trim() ? { remarks: remarks.trim() } : {};
    const response = await axiosInstance.put<LeaveResponse>(
      `${this.baseUrl}/${id}/reject`,
      payload
    );
    const res = response.data;

    // Notify employee about rejection (non-blocking)
    // Notify employee about rejection (non-blocking)
    (async () => {
      try {
        const resTyped = res as LeaveResWithRelations;
        const recipient =
          resTyped.employeeId ?? resTyped.user?.id ?? resTyped.employee?.id;
        if (recipient) {
          const message = `Your leave has been rejected`;
          const notif = await notificationsApi.sendNotification({
            user_ids: [String(recipient)],
            message,
            type: 'leave',
          });
          if (!notif.ok) {
            console.warn('Notification send failed for rejectLeave', notif.message, notif.correlationId);
          }
          // Dispatch in-app event for immediate UI update
          try {
            const detail = {
              title: 'Leave Rejected',
              message: `Your leave has been rejected`,
              data: res,
            };
            const ev = new CustomEvent<Record<string, unknown>>('hrms:notification', { detail });
            window.dispatchEvent(ev);
          } catch {
            // ignore
          }
        }
      } catch (e) {
        console.warn('Failed to send rejection notification', e);
      }
    })();

    return res;
  }

  async approveManagerLeave(
    id: string,
    data: { managerRemarks: string }
  ): Promise<LeaveResponse> {
    // Ensure managerRemarks is trimmed and not empty
    const trimmedRemarks = data.managerRemarks?.trim() || '';
    if (!trimmedRemarks) {
      throw new Error('Manager remarks cannot be empty');
    }

    // Use the correct endpoint: PATCH /leaves/{id}/manager-remarks
    // Backend expects 'remarks' field in request body, but returns 'managerRemarks' in response
    const payload = {
      remarks: trimmedRemarks,
    };

    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}/manager-remarks`,
      payload
    );
    const res = response.data;

    // Notify employee about manager's remarks update (non-blocking)
    (async () => {
      try {
        const resTyped = res as LeaveResWithRelations;
        const recipient =
          resTyped.employeeId ?? resTyped.user?.id ?? resTyped.employee?.id;
        if (recipient) {
          const message = `Your leave request (id: ${res.id}) has an update from manager.`;
          const notif = await notificationsApi.sendNotification({
            user_ids: [String(recipient)],
            message,
            type: 'leave',
          });
          if (!notif.ok) {
            console.warn('Notification send failed for approveManagerLeave', notif.message, notif.correlationId);
          }
          try {
            const detail = {
              title: 'Leave Update',
              message,
              data: res,
            };
            const ev = new CustomEvent<Record<string, unknown>>('hrms:notification', { detail });
            window.dispatchEvent(ev);
          } catch {
            // ignore
          }
        }
      } catch (e) {
        console.warn('Failed to send manager notification', e);
      }
    })();

    return res;
  }

  async approveLeaveByManager(
    id: string,
    data?: { remarks?: string }
  ): Promise<LeaveResponse> {
    // PATCH:/leaves/{id}/approve-manager
    // Remarks are optional for approval
    const payload = data?.remarks?.trim()
      ? { remarks: data.remarks.trim() }
      : {};

    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}/approve-manager`,
      payload
    );
    const res = response.data;
    const resTyped = res as LeaveResWithRelations;

    // Notify employee about manager approval (non-blocking)
    (async () => {
      try {
        const recipient =
          resTyped.employeeId ?? resTyped.user?.id ?? resTyped.employee?.id;
        if (recipient) {
          const message = `Your leave request (id: ${res.id}) has been approved by your manager.`;
          const notif = await notificationsApi.sendNotification({
            user_ids: [String(recipient)],
            message,
            type: 'leave',
          });
          if (!notif.ok) {
            console.warn('Notification send failed for approveLeaveByManager', notif.message, notif.correlationId);
          }
          // Only show in-app notification to the employee (recipient), not to the manager who approved
          const currentUserId = getCurrentUser()?.id;
          if (currentUserId && String(currentUserId) === String(recipient)) {
            try {
              const detail = {
                title: 'Leave Approved',
                message,
                data: res,
              };
              const ev = new CustomEvent<Record<string, unknown>>('hrms:notification', { detail });
              window.dispatchEvent(ev);
            } catch {
              // ignore
            }
          }
        }
      } catch (e) {
        console.warn('Failed to send manager approval notification', e);
      }
    })();

    return res;
  }

  async rejectLeaveByManager(
    id: string,
    data: { remarks: string }
  ): Promise<LeaveResponse> {
    // PATCH:/leaves/{id}/reject-manager
    // Remarks are required for rejection
    const trimmedRemarks = data.remarks?.trim() || '';
    if (!trimmedRemarks) {
      throw new Error('Rejection remarks cannot be empty');
    }

    const payload = {
      remarks: trimmedRemarks,
    };

    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}/reject-manager`,
      payload
    );
    const res = response.data;
    const resTyped = res as LeaveResWithRelations;

    // Notify employee about manager rejection (non-blocking)
    (async () => {
      try {
        const recipient =
          resTyped.employeeId ?? resTyped.user?.id ?? resTyped.employee?.id;
        if (recipient) {
          const message = `Your leave request (id: ${res.id}) has been rejected by your manager.`;
          const notif = await notificationsApi.sendNotification({
            user_ids: [String(recipient)],
            message,
            type: 'alert',
          });
          if (!notif.ok) {
            console.warn('Notification send failed for rejectLeaveByManager', notif.message, notif.correlationId);
          }
          // Only show in-app notification to the employee (recipient), not to the manager who rejected
          const currentUserId = getCurrentUser()?.id;
          if (currentUserId && String(currentUserId) === String(recipient)) {
            try {
              const detail = {
                title: 'Leave Rejected',
                message,
                data: res,
              };
              const ev = new CustomEvent<Record<string, unknown>>('hrms:notification', { detail });
              window.dispatchEvent(ev);
            } catch {
              // ignore
            }
          }
        }
      } catch (e) {
        console.warn('Failed to send manager rejection notification', e);
      }
    })();

    return res;
  }

  async createLeaveType(
    data: CreateLeaveTypeRequest
  ): Promise<LeaveType> {
    const response = await axiosInstance.post<LeaveType>(
      '/leave-types',
      data
    );
    return response.data;
  }

  async getLeaveTypes(
    params: { page?: number; limit?: number } = { page: 1, limit: 50 }
  ): Promise<LeaveTypeListResponse> {
    const response = await axiosInstance.get<LeaveTypeListResponse>(
      '/leave-types',
      { params }
    );
    const data = response.data;
    if (data && Array.isArray(data.items)) {
      return data;
    }
    if (Array.isArray(data)) {
      return {
        items: data,
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1,
      };
    }
    return { items: [] };
  }

  async exportSelfLeavesCSV(): Promise<Blob> {
    const response = await axiosInstance.get(`${this.baseUrl}/export/self`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportTeamLeavesCSV(): Promise<Blob> {
    const response = await axiosInstance.get(`${this.baseUrl}/export/team`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportAllLeavesCSV(params?: {
    month?: number;
    year?: number;
    status?: string;
    name?: string;
  }): Promise<Blob> {
    const query: Record<string, number | string> = {};
    if (params?.month != null && params.month >= 1 && params.month <= 12)
      query.month = params.month;
    if (params?.year != null) query.year = params.year;
    if (params?.status?.trim()) query.status = params.status.trim();
    if (params?.name?.trim()) query.name = params.name.trim();
    const response = await axiosInstance.get(`${this.baseUrl}/export/all`, {
      params: query,
      responseType: 'blob',
    });
    return response.data;
  }

  async createLeaveForEmployee(
    data: CreateLeaveForEmployeeRequest
  ): Promise<LeaveResponse> {
    const formData = new FormData();

    formData.append('employeeId', data.employeeId);
    formData.append('leaveTypeId', data.leaveTypeId);
    formData.append('startDate', data.startDate);
    formData.append('endDate', data.endDate);
    formData.append('reason', data.reason);

    if (data.documents && Array.isArray(data.documents)) {
      data.documents.forEach(file => {
        formData.append('documents', file);
      });
    }

    const response = await axiosInstance.post<LeaveResponse>(
      `${this.baseUrl}/for-employee`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    const res = response.data;

    // Notify the employee's manager about this created leave (non-blocking)
    (async () => {
      try {
        const resTyped = res as LeaveResWithRelations;
        const employeeId =
          data.employeeId || resTyped.employeeId || resTyped.user?.id;
        if (employeeId) {
          try {
            const profile = await systemEmployeeApiService.getSystemEmployeeById(
              String(employeeId)
            );
            const prof = profile as Record<string, unknown> | undefined;
            const teamIdRaw = prof?.team ?? prof?.team_id ?? prof?.teamId ?? undefined;
            const teamId = teamIdRaw ?? undefined;
            if (teamId) {
              try {
                const team = await teamApi.getTeamById(String(teamId));
                const managerId = team?.manager_id ?? team?.manager?.id;
                if (managerId) {
                  const message = `A leave request was created for your team member (leave id: ${res.id}).`;
                  const notif = await notificationsApi.sendNotification({
                    user_ids: [String(managerId)],
                    message,
                    type: 'alert',
                  });
                  if (!notif.ok) {
                    console.warn('Notification send failed for createLeaveForEmployee (team manager)', notif.message, notif.correlationId);
                  }
                  return;
                }
              } catch {
                // ignore and fallback
              }
            }
          } catch {
            // ignore and fallback
          }
        }

        // Fallback: notify available managers
        try {
          const managers = await teamApi.getAvailableManagers();
          const managerIds = managers.map(m => m.id).filter(Boolean).slice(0, 5);
          if (managerIds.length > 0) {
            const message = `A new leave request (id: ${res.id}) was submitted. Please review.`;
            const notif = await notificationsApi.sendNotification({
              user_ids: managerIds,
              message,
              type: 'alert',
            });
            if (!notif.ok) {
              console.warn('Notification send failed for createLeaveForEmployee (available managers)', notif.message, notif.correlationId);
            }
          }
        } catch (e) {
          console.warn('Failed to notify managers for leave creation (for-employee)', e);
        }
      } catch (err) {
        console.warn('Unexpected error while sending leave creation notification (for-employee)', err);
      }

      // Dispatch an in-app event to update local UI immediately
      /*
      try {
        const resTyped = res as LeaveResWithRelations;
        const employeeName =
          resTyped.employee?.first_name ||
          resTyped.user?.first_name ||
          getCurrentUser()?.first_name ||
          'Employee';
        const detail = {
          title: 'Leave Applied',
          message: `${employeeName} has applied for leave`,
          employeeName,
          data: res,
        } as Record<string, unknown>;
        const ev = new CustomEvent<Record<string, unknown>>('hrms:notification', { detail });
        window.dispatchEvent(ev);
      } catch {
        // ignore
      }
      */
    })();

    return res;
  }

  async updateLeave(
    id: string,
    data: UpdateLeaveRequest
  ): Promise<LeaveResponse> {
    const formData = new FormData();

    // Append ONLY provided fields
    if (data.leaveTypeId) {
      formData.append('leaveTypeId', data.leaveTypeId);
    }

    if (data.startDate) {
      formData.append('startDate', data.startDate);
    }

    if (data.endDate) {
      formData.append('endDate', data.endDate);
    }

    if (data.reason) {
      formData.append('reason', data.reason);
    }

    if (data.documents && Array.isArray(data.documents)) {
      data.documents.forEach(file => {
        formData.append('documents', file);
      });
    }

    const response = await axiosInstance.patch<LeaveResponse>(
      `${this.baseUrl}/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async deleteDocument(
    id: string,
    documentUrl: string
  ): Promise<LeaveResponse> {
    // Pass the document URL in the body as 'documentUrl'
    const response = await axiosInstance.delete<LeaveResponse>(
      `${this.baseUrl}/${id}/documents`,
      {
        data: { documentUrl },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }
}

export const leaveApiService = new LeaveApiService();
export const leaveApi = leaveApiService;
