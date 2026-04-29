import axiosInstance from './axiosInstance';
import { extractErrorMessage } from '../utils/errorHandler';

export type AnnouncementPriority = 'low' | 'medium' | 'high' | (string & {});
export type AnnouncementStatus = 'draft' | 'scheduled' | 'sent' | (string & {});

export interface AnnouncementCreator {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
}

export interface Announcement {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tenant_id: string;
  title: string;
  content: string;
  category: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  created_by: string;
  creator?: AnnouncementCreator;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  category: string;
  priority: AnnouncementPriority;
  /**
   * ISO string. Only needed when `send_now` is false and you want scheduling.
   * Example: "2025-02-01T09:00:00.000Z"
   */
  scheduled_at?: string;
  send_now?: boolean;
}

export type UpdateAnnouncementDto = Partial<
  Omit<CreateAnnouncementDto, 'send_now' | 'scheduled_at'> & {
    /**
     * For update, backend may support:
     * - ISO string to schedule
     * - null to clear existing schedule
     */
    scheduled_at?: string | null;
  }
>;

interface ApiResponse<T> {
  message?: string;
  data: T;
}

class AnnouncementsApiService {
  private baseUrl = '/announcements';

  async listAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await axiosInstance.get<
        | ApiResponse<Announcement[] | { items: Announcement[] }>
        | Announcement[]
        | { items: Announcement[] }
      >(this.baseUrl);

      const raw = response.data as unknown;

      // Common shapes:
      // 1) { message, data: Announcement[] }
      // 2) { message, data: { items: Announcement[] } }
      // 3) Announcement[]
      // 4) { items: Announcement[] }
      if (Array.isArray(raw)) return raw as Announcement[];

      if (raw && typeof raw === 'object') {
        const maybeApi = raw as { data?: unknown; items?: unknown };

        if (Array.isArray(maybeApi.items)) {
          return maybeApi.items as Announcement[];
        }

        const maybeData = maybeApi.data as unknown;
        if (Array.isArray(maybeData)) return maybeData as Announcement[];

        if (maybeData && typeof maybeData === 'object') {
          const maybeItems = (maybeData as { items?: unknown }).items;
          if (Array.isArray(maybeItems)) return maybeItems as Announcement[];
        }
      }

      return [];
    } catch (error) {
      const errorResult = extractErrorMessage(error);
      throw new Error(errorResult.message);
    }
  }

  async createAnnouncement(
    payload: CreateAnnouncementDto
  ): Promise<Announcement> {
    try {
      const response = await axiosInstance.post<ApiResponse<Announcement>>(
        this.baseUrl,
        payload
      );
      return response.data.data;
    } catch (error) {
      const errorResult = extractErrorMessage(error);
      throw new Error(errorResult.message);
    }
  }

  async updateAnnouncement(
    id: string,
    payload: UpdateAnnouncementDto
  ): Promise<Announcement> {
    try {
      const response = await axiosInstance.put<ApiResponse<Announcement>>(
        `${this.baseUrl}/${id}`,
        payload
      );
      return response.data.data;
    } catch (error) {
      const errorResult = extractErrorMessage(error);
      throw new Error(errorResult.message);
    }
  }

  async deleteAnnouncement(id: string): Promise<{ deleted: true; id: string }> {
    try {
      const response = await axiosInstance.delete<{
        deleted: true;
        id: string;
      }>(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      const errorResult = extractErrorMessage(error);
      throw new Error(errorResult.message);
    }
  }
}

export const announcementsApiService = new AnnouncementsApiService();
