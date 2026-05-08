import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import employeeApi from '../../api/employeeApi';
import type { BackendEmployee } from '../../api/employeeApi';
import {
  departmentApiService,
  type BackendDepartment,
} from '../../api/departmentApi';
import {
  designationApiService,
  type BackendDesignation,
} from '../../api/designationApi';
import teamApiService from '../../api/teamApi';
import type { TeamMember } from '../../types/team';
import { useUser } from '../../hooks/useUser';
import { isManager } from '../../utils/roleUtils';

export const EMPLOYEE_KEYS = {
  all: ['employees'] as const,
  lists: () => [...EMPLOYEE_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...EMPLOYEE_KEYS.lists(), filters] as const,
  detail: (id: string) => [...EMPLOYEE_KEYS.all, 'detail', id] as const,
};

export const DEPARTMENT_KEYS = {
  all: ['departments'] as const,
  list: () => [...DEPARTMENT_KEYS.all, 'list'] as const,
};

export const DESIGNATION_KEYS = {
  all: ['designations'] as const,
  list: () => [...DESIGNATION_KEYS.all, 'list'] as const,
  byDepartment: (deptId: string) =>
    [...DESIGNATION_KEYS.all, 'by-dept', deptId] as const,
};

export function useDepartmentList() {
  return useQuery<BackendDepartment[]>({
    queryKey: DEPARTMENT_KEYS.list(),
    queryFn: () => departmentApiService.getAllDepartments(),
    staleTime: 1000 * 60 * 10, // departments rarely change
  });
}

export function useDesignationList() {
  return useQuery<BackendDesignation[]>({
    queryKey: DESIGNATION_KEYS.list(),
    queryFn: () => designationApiService.getAllDesignations(),
    staleTime: 1000 * 60 * 10, // designations rarely change
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeApi.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.lists() });
    },
  });
}

// Converts a TeamMember (manager path) to the BackendEmployee shape so callers
// can use one uniform type regardless of which API path was used.
function teamMemberToBackendEmployee(member: TeamMember): BackendEmployee {
  return {
    id: member.id,
    user_id: member.user.id,
    name: `${member.user.first_name || ''} ${member.user.last_name || ''}`.trim(),
    firstName: member.user.first_name,
    lastName: member.user.last_name,
    email: member.user.email,
    phone: '',
    departmentId:
      member.department?.id || member.designation.department?.id || '',
    designationId: member.designation.id,
    role_name: 'Employee',
    status: 'Active',
    profile_picture: member.user.profile_pic || undefined,
    cnic_number: undefined,
    cnic_picture: undefined,
    cnic_back_picture: undefined,
    department: member.department
      ? {
          id: member.department.id,
          name: member.department.name,
          description: '',
          tenantId: '',
          createdAt: '',
          updatedAt: '',
        }
      : member.designation.department
        ? {
            id: member.designation.department.id,
            name: member.designation.department.name,
            description: '',
            tenantId: '',
            createdAt: '',
            updatedAt: '',
          }
        : null,
    designation: {
      id: member.designation.id,
      title: member.designation.title,
      tenantId: '',
      departmentId:
        member.department?.id || member.designation.department?.id || '',
      createdAt: '',
      updatedAt: '',
    },
    tenantId: '',
    createdAt: member.created_at || new Date().toISOString(),
    updatedAt: member.updated_at || new Date().toISOString(),
  };
}

/**
 * Role-aware employee list query.
 *
 * - Manager role  → fetches team members (all pages) from teamApi
 * - Admin / HR    → fetches all employees (all pages) from employeeApi
 *
 * Returns a standard useQuery result whose `data` is always BackendEmployee[].
 * The caller can pass optional filter params (admin path only).
 */
export function useEmployeeListForRole(filters?: {
  departmentId?: string;
  designationId?: string;
}) {
  const { user } = useUser();
  const currentUserRole =
    user?.role || (user as { role_name?: string } | undefined)?.role_name;
  const isManagerRole = isManager(currentUserRole as string);

  // Manager path — fetch team members across all pages
  const managerQuery = useQuery<BackendEmployee[]>({
    queryKey: EMPLOYEE_KEYS.list({ role: 'manager' }),
    queryFn: async () => {
      const allMembers: TeamMember[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await teamApiService.getMyTeamMembers(page);
        if (res.items && res.items.length > 0) {
          allMembers.push(...res.items);
          hasMore = page < res.totalPages;
          page++;
        } else {
          hasMore = false;
        }
      }
      return allMembers.map(teamMemberToBackendEmployee);
    },
    enabled: isManagerRole,
    staleTime: 1000 * 60 * 3,
  });

  // Admin / HR path — fetch all employees across all pages with optional filters
  const adminQuery = useQuery<BackendEmployee[]>({
    queryKey: EMPLOYEE_KEYS.list({
      role: 'admin',
      departmentId: filters?.departmentId,
      designationId: filters?.designationId,
    }),
    queryFn: async () => {
      const apiFilters = {
        departmentId: filters?.departmentId || undefined,
        designationId: filters?.designationId || undefined,
      };
      const allEmployees: BackendEmployee[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore) {
        const res = await employeeApi.getAllEmployees(apiFilters, page);
        allEmployees.push(...res.items);
        hasMore = page < res.totalPages;
        page++;
      }
      return allEmployees;
    },
    enabled: !isManagerRole,
    staleTime: 1000 * 60 * 3,
  });

  return isManagerRole ? managerQuery : adminQuery;
}
