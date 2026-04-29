// Types live in src/types/task.ts — re-export for backwards compatibility
export type { Task, TaskStatus, Team, TeamMember } from '../types/task';

import { formatDate as _formatDate } from '../utils/dateUtils';

export const getStatusColor = (status: string | undefined) => {
  const s = String(status ?? '').toLowerCase();
  if (s.includes('progress')) return 'warning' as const;
  if (s.includes('complete')) return 'success' as const;
  return 'default' as const;
};

export const formatDate = (d: unknown) => _formatDate(d);

export default {
  getStatusColor,
  formatDate,
};
