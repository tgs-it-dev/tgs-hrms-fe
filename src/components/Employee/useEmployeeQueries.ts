import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import employeeApi from '../../api/employeeApi';
import {
  departmentApiService,
  type BackendDepartment,
} from '../../api/departmentApi';
import {
  designationApiService,
  type BackendDesignation,
} from '../../api/designationApi';

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
