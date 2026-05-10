import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  announcementsApiService,
  type CreateAnnouncementDto,
  type UpdateAnnouncementDto,
} from '../../api/announcementsApi';

export const ANNOUNCEMENT_KEYS = {
  all: ['announcements'] as const,
  lists: () => [...ANNOUNCEMENT_KEYS.all, 'list'] as const,
  list: (params?: unknown) => [...ANNOUNCEMENT_KEYS.lists(), params] as const,
  detail: (id: string) => [...ANNOUNCEMENT_KEYS.all, 'detail', id] as const,
};

export function useAnnouncementList() {
  return useQuery({
    queryKey: ANNOUNCEMENT_KEYS.lists(),
    queryFn: () => announcementsApiService.listAnnouncements(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAnnouncementDto) =>
      announcementsApiService.createAnnouncement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.lists() });
    },
  });
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAnnouncementDto;
    }) => announcementsApiService.updateAnnouncement(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.lists() });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsApiService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANNOUNCEMENT_KEYS.lists() });
    },
  });
}
