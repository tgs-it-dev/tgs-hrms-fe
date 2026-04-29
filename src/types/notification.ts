/** Raw notification item as stored in the database and returned by the API. */
export interface NotificationItem {
  id: string;
  user_id: string;
  tenant_id?: string;
  message: string;
  type?: string;
  status?: 'unread' | 'read';
  created_at?: string;
  updated_at?: string;
}

/** Query parameters accepted by GET /notifications. */
export interface GetNotificationsParams {
  status?: 'unread' | 'read';
  type?: string;
  limit?: number;
}

/** Result shape returned by notificationsApi.getNotifications(). */
export interface GetNotificationsResult {
  ok: boolean;
  status: number;
  notifications?: NotificationItem[];
  unread_count?: number;
  message?: string;
  error?: unknown;
}

/** Payload for sending a notification. */
export interface SendNotificationRequest {
  user_ids: string[];
  message: string;
  type?: string;
}

/** Result shape returned by send/mark-read notification calls. */
export interface SendNotificationResult {
  ok: boolean;
  status: number;
  data?: unknown;
  message?: string;
  correlationId?: string | null;
  error?: unknown;
}

/** UI-level notification displayed in the Navbar bell. */
export interface UINotification {
  id: string;
  title: string;
  text: string;
  timestamp: string;
  read: boolean;
  employeeName?: string;
  taskTitle?: string;
  oldStatus?: string;
  newStatus?: string;
  raw?: unknown;
}
