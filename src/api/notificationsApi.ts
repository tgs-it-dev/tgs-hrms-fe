import axiosInstance from './axiosInstance';
import type {
  SendNotificationRequest,
  SendNotificationResult,
  GetNotificationsParams,
  GetNotificationsResult,
} from '../types/notification';

export type {
  SendNotificationRequest,
  SendNotificationResult,
  GetNotificationsParams,
  NotificationItem,
  GetNotificationsResult,
} from '../types/notification';

class NotificationsApi {
  private baseUrl = '/notifications';
  async sendNotification(
    _payload: SendNotificationRequest
  ): Promise<SendNotificationResult> {
    return {
      ok: true,
      status: 200,
      correlationId: null,
    };
  }

  async getNotifications(
    params?: GetNotificationsParams
  ): Promise<GetNotificationsResult> {
    const res: GetNotificationsResult = { ok: false, status: 0 };
    try {
      const resp = await axiosInstance.get(`${this.baseUrl}`, { params });
      res.status = resp.status;
      res.ok = resp.status >= 200 && resp.status < 300;
      const data = resp.data ?? {};
      res.notifications = data.notifications ?? data.data ?? [];
      res.unread_count = data.unread_count ?? data.unreadCount ?? 0;
      res.message = data.message ?? undefined;
      return res;
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: Record<string, unknown> };
      };
      res.error = err;
      if (axiosErr?.response) {
        res.status = axiosErr.response.status ?? 0;
        const data = axiosErr.response.data as
          | Record<string, unknown>
          | undefined;
        res.message = data?.message as string | undefined;
      }
      return res;
    }
  }

  async markNotificationRead(
    notificationId: string
  ): Promise<SendNotificationResult> {
    const res: SendNotificationResult = {
      ok: false,
      status: 0,
      correlationId: null,
    };
    try {
      const resp = await axiosInstance.patch(
        `${this.baseUrl}/${encodeURIComponent(notificationId)}/read`
      );
      res.status = resp.status;
      res.ok = resp.status >= 200 && resp.status < 300;
      res.data = resp.data?.data ?? resp.data;
      res.message = resp.data?.message ?? undefined;
      return res;
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: Record<string, unknown> };
      };
      res.error = err;
      if (axiosErr?.response) {
        res.status = axiosErr.response.status ?? 0;
        const data = axiosErr.response.data as
          | Record<string, unknown>
          | undefined;
        res.message = data?.message as string | undefined;
      }
      return res;
    }
  }

  async markAllNotificationsRead(): Promise<SendNotificationResult> {
    const res: SendNotificationResult = {
      ok: false,
      status: 0,
      correlationId: null,
    };
    try {
      const resp = await axiosInstance.patch(`${this.baseUrl}/read-all`);
      res.status = resp.status;
      res.ok = resp.status >= 200 && resp.status < 300;
      res.data = resp.data?.data ?? resp.data;
      res.message = resp.data?.message ?? undefined;
      return res;
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: Record<string, unknown> };
      };
      res.error = err;
      if (axiosErr?.response) {
        res.status = axiosErr.response.status ?? 0;
        const data = axiosErr.response.data as
          | Record<string, unknown>
          | undefined;
        res.message = data?.message as string | undefined;
      }
      return res;
    }
  }
}

export const notificationsApi = new NotificationsApi();

export default notificationsApi;
