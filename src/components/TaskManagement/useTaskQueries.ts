import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTask,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../../api/tasksApi';

export const TASK_KEYS = {
  all: ['tasks'] as const,
  lists: () => [...TASK_KEYS.all, 'list'] as const,
  list: (params?: unknown) => [...TASK_KEYS.lists(), params] as const,
  detail: (id: string | number) => [...TASK_KEYS.all, 'detail', id] as const,
};

export function useTaskList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: TASK_KEYS.list(params),
    queryFn: () => getTasks(params),
    staleTime: 1000 * 60,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: TASK_KEYS.detail(id),
    queryFn: () => getTask(id),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateTask(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
      queryClient.invalidateQueries({
        queryKey: TASK_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.lists() });
    },
  });
}
