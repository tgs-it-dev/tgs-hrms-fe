// timesheetApi.ts
import axiosInstance from './axiosInstance';

export interface TimesheetEntry {
  id: string;
  user_id: string;
  employee_full_name: string;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  duration_hours: number | null;
  durationHours?: number | null; // Additional field from backend
}

interface TimesheetEmployee {
  userId: string;
  fullName: string;
}

interface TimesheetData {
  employee: TimesheetEmployee;
  totalHours: number;
  sessions: TimesheetEntry[];
}

interface TimesheetResponse {
  items: TimesheetData;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TimesheetSummaryEntry {
  user_id: string;
  employee_name: string;
  total_hours: number;
}

interface TimesheetSummaryResponse {
  items: TimesheetSummaryEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class TimesheetApiService {
  private baseUrl = '/timesheet';

  async startWork(): Promise<TimesheetEntry> {
    const response = await axiosInstance.post<TimesheetEntry>(
      `${this.baseUrl}/start`
    );
    return response.data;
  }

  async endWork(): Promise<TimesheetEntry> {
    const response = await axiosInstance.post<TimesheetEntry>(
      `${this.baseUrl}/end`
    );
    return response.data;
  }

  async getUserTimesheet(page: number = 1): Promise<TimesheetResponse> {
    try {
      const response = await axiosInstance.get(`${this.baseUrl}?page=${page}`);

      // Handle the new backend structure
      if (
        response.data &&
        response.data.items &&
        response.data.items.sessions
      ) {
        return {
          items: response.data.items,
          total: response.data.total || 0,
          page: response.data.page || page,
          limit: response.data.limit || 25,
          totalPages: response.data.totalPages || 1,
        };
      } else if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        return {
          items: {
            employee: { userId: '', fullName: '' },
            totalHours: 0,
            sessions: response.data.items,
          },
          total: response.data.total || response.data.items.length,
          page: response.data.page || 1,
          limit: response.data.limit || 25,
          totalPages: response.data.totalPages || 1,
        };
      } else if (Array.isArray(response.data)) {
        return {
          items: {
            employee: { userId: '', fullName: '' },
            totalHours: 0,
            sessions: response.data,
          },
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        return {
          items: {
            employee: { userId: '', fullName: '' },
            totalHours: 0,
            sessions: [],
          },
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch {
      return {
        items: {
          employee: { userId: '', fullName: '' },
          totalHours: 0,
          sessions: [],
        },
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }

  // Get summary for admin (tenant-wise) with pagination
  async getSummary(
    from?: string,
    to?: string,
    page: number = 1
  ): Promise<TimesheetSummaryResponse> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const url = `${this.baseUrl}/summary?${params.toString()}`;

      const response = await axiosInstance.get(url);

      // Handle the new paginated summary structure
      if (
        response.data &&
        response.data.items &&
        Array.isArray(response.data.items)
      ) {
        return {
          items: response.data.items,
          total: response.data.total || 0,
          page: response.data.page || page,
          limit: response.data.limit || 25,
          totalPages: response.data.totalPages || 1,
        };
      } else if (Array.isArray(response.data)) {
        return {
          items: response.data,
          total: response.data.length,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      } else {
        return {
          items: [],
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };
      }
    } catch {
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 25,
        totalPages: 1,
      };
    }
  }
}

const timesheetApi = new TimesheetApiService();
export default timesheetApi;
