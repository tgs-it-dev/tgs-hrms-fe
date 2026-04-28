import axiosInstance from './axiosInstance';
import type { PaginatedResponse } from '../types/api';
import type {
  Team,
  TeamMember,
  Manager,
  AllTenantsTeamsResponse,
  CreateTeamDto,
  UpdateTeamDto,
} from '../types/team';

// Re-export so existing component imports keep working without path changes.
export type {
  Team,
  TeamMember,
  Manager,
  AllTenantsTeamsResponse,
  TenantTeam,
  TenantTeamMember,
  TenantTeams,
  CreateTeamDto,
  UpdateTeamDto,
  AddMemberDto,
  RemoveMemberDto,
  AttendanceTeamMember,
  LeaveReportMember,
} from '../types/team';
export type { PaginatedResponse } from '../types/api';

class TeamApiService {
  private baseUrl = '/teams';

  async getAvailableManagers(): Promise<Manager[]> {
    try {
      const response = await axiosInstance.get<Manager[]>(
        `${this.baseUrl}/available-managers`
      );
      return response.data;
    } catch {
      return [];
    }
  }

  async createTeam(teamData: CreateTeamDto): Promise<Team> {
    const response = await axiosInstance.post<Team>(this.baseUrl, teamData);
    const newTeam = response.data;

    if (newTeam.id && teamData.manager_id) {
      try {
        await this.addMemberToTeam(newTeam.id, teamData.manager_id);
      } catch {
        // Manager add as member failed; team creation succeeded - do not throw
      }
    }

    return newTeam;
  }

  async getAllTeams(page: number | null = 1): Promise<PaginatedResponse<Team>> {
    const url = page === null ? this.baseUrl : `${this.baseUrl}?page=${page}`;
    const response = await axiosInstance.get<PaginatedResponse<Team>>(url);
    const teams = response.data;

    if (teams.items) {
      const teamsWithMembers = await Promise.all(
        teams.items.map(async team => {
          if (!team.teamMembers) {
            if (team.id === 'employee-pool') {
              return { ...team, teamMembers: [] };
            }
            try {
              const membersResponse = await this.getTeamMembers(team.id, 1);
              return {
                ...team,
                teamMembers: membersResponse.items || [],
              };
            } catch {
              return { ...team, teamMembers: [] };
            }
          }
          return team;
        })
      );

      return { ...teams, items: teamsWithMembers };
    }

    return teams;
  }

  async getTeamById(id: string): Promise<Team> {
    const response = await axiosInstance.get<Team>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async updateTeam(id: string, teamData: UpdateTeamDto): Promise<Team> {
    const response = await axiosInstance.patch<Team>(
      `${this.baseUrl}/${id}`,
      teamData
    );
    return response.data;
  }

  async deleteTeam(id: string): Promise<void> {
    await axiosInstance.delete(`${this.baseUrl}/${id}`);
  }

  async getMyTeams(): Promise<Team[]> {
    try {
      const response = await axiosInstance.get<Team[]>(
        `${this.baseUrl}/my-teams`
      );
      return response.data;
    } catch {
      return [];
    }
  }

  async getMyTeamMembers(
    page: number = 1,
    limit: number = 25
  ): Promise<PaginatedResponse<TeamMember>> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(
        `${this.baseUrl}/my-members?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch {
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  async getTeamMembers(
    teamId: string,
    page: number = 1
  ): Promise<PaginatedResponse<TeamMember>> {
    if (teamId === 'employee-pool') {
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
    try {
      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(
        `${this.baseUrl}/${teamId}/members?page=${page}`
      );
      return response.data;
    } catch {
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
  }

  async getAvailableEmployees(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<PaginatedResponse<TeamMember>> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.append('search', search);

      const response = await axiosInstance.get<PaginatedResponse<TeamMember>>(
        `${this.baseUrl}/employee-pool?${params}`
      );
      return response.data;
    } catch {
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
  }

  async addMemberToTeam(
    teamId: string,
    employeeId: string,
    companyId?: string
  ): Promise<void> {
    const payload: Record<string, string> = { employee_id: employeeId };
    if (companyId) payload.company_id = companyId;
    await axiosInstance.post(`${this.baseUrl}/${teamId}/add-member`, payload);
  }

  async removeMemberFromTeam(
    teamId: string,
    employeeId: string
  ): Promise<void> {
    await axiosInstance.post(`${this.baseUrl}/${teamId}/remove-member`, {
      employee_id: employeeId,
    });
  }

  async getAllTeamMembers(
    page: number = 1
  ): Promise<
    PaginatedResponse<TeamMember & { team?: { id: string; name: string } }>
  > {
    try {
      const response = await axiosInstance.get<
        PaginatedResponse<TeamMember & { team?: { id: string; name: string } }>
      >(`${this.baseUrl}/all-members?page=${page}`);
      return response.data;
    } catch {
      return { items: [], total: 0, page: 1, limit: 25, totalPages: 1 };
    }
  }

  async getAllTenantsWithTeams(
    tenantId?: string
  ): Promise<AllTenantsTeamsResponse> {
    const params: Record<string, string> = { limit: 'all' };
    if (tenantId) {
      params.tenant_id = tenantId;
    }
    const response = await axiosInstance.get<AllTenantsTeamsResponse>(
      `${this.baseUrl}/all-tenants`,
      { params }
    );
    return response.data;
  }
}

export const teamApiService = new TeamApiService();

export default teamApiService;
