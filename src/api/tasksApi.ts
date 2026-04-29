import axiosInstance from './axiosInstance';
import { notificationsApi } from './notificationsApi';
import { getCurrentUser } from '../utils/auth';
import type { Task, TaskStatus } from '../types/task';

// The backend uses snake_case keys; our frontend uses camelCase Task interface.
// This helper maps an API task object to the frontend Task shape.
function mapApiTaskToTask(apiTask: Record<string, unknown>): Task {
  const assignedToRaw = apiTask.assigned_to ?? apiTask.assignedTo ?? [];
  const assignedTo: string[] = Array.isArray(assignedToRaw)
    ? assignedToRaw
    : assignedToRaw
      ? [assignedToRaw]
      : [];

  // Resolve assignedToName from several possible places: assigned_to_name, assignedToName, or assignedEmployee.user
  const assignedToNameRaw =
    apiTask.assigned_to_name ??
    apiTask.assignedToName ??
    apiTask.assignedEmployee ??
    undefined;
  let assignedToName: string[] = [];
  if (Array.isArray(assignedToNameRaw)) {
    assignedToName = assignedToNameRaw;
  } else if (typeof assignedToNameRaw === 'string') {
    assignedToName = [assignedToNameRaw];
  } else if (assignedToNameRaw && typeof assignedToNameRaw === 'object') {
    // assignedEmployee may be an object with nested user
    const obj = assignedToNameRaw as Record<string, unknown> | undefined;
    const user = (obj?.user ?? obj) as Record<string, unknown> | undefined;
    const first = user?.['first_name'] ?? user?.['firstName'] ?? user?.['name'];
    const last = user?.['last_name'] ?? user?.['lastName'];
    const name = [first, last].filter(Boolean).map(String).join(' ').trim();
    if (name) assignedToName = [name];
    else if (typeof user?.['name'] === 'string')
      assignedToName = [String(user?.['name'])];
  }

  // Normalize status: API may return lowercase 'pending' etc. Convert to Title Case used by frontend
  const rawStatus = (apiTask.status ?? apiTask.task_status) as
    | string
    | undefined;
  const normalizeStatus = (s?: string): TaskStatus => {
    if (!s) return 'Pending';
    const lower = String(s).toLowerCase();
    if (lower.includes('progress')) return 'In Progress';
    if (lower.includes('completed') || lower.includes('complete'))
      return 'Completed';
    return 'Pending';
  };

  // Creator name resolution
  const creatorRaw = apiTask.creator ?? apiTask.created_by_user ?? undefined;
  let createdByName = (apiTask.created_by_name ?? apiTask.createdByName) as
    | string
    | undefined;
  if (!createdByName && creatorRaw && typeof creatorRaw === 'object') {
    const obj = creatorRaw as Record<string, unknown>;
    const user = (obj.user ?? obj) as Record<string, unknown> | undefined;
    const first = user?.['first_name'] ?? user?.['firstName'] ?? user?.['name'];
    const last = user?.['last_name'] ?? user?.['lastName'];
    const name = [first, last].filter(Boolean).map(String).join(' ').trim();
    if (name) createdByName = name;
    else if (typeof user?.['name'] === 'string')
      createdByName = String(user?.['name']);
  }

  return {
    id: apiTask.id ?? apiTask.task_id ?? apiTask.taskId,
    title: apiTask.title ?? apiTask.task_title ?? apiTask.name ?? '',
    description: apiTask.description ?? apiTask.task_description ?? '',
    assignedTo,
    assignedToName,
    status: normalizeStatus(rawStatus),
    createdBy: apiTask.created_by ?? apiTask.createdBy ?? '',
    createdByName,
    createdAt:
      apiTask.created_at ?? apiTask.createdAt ?? new Date().toISOString(),
    deadline:
      apiTask.deadline ?? apiTask.deadline_at ?? apiTask.due_date ?? undefined,
    updatedAt:
      apiTask.updated_at ?? apiTask.updatedAt ?? new Date().toISOString(),
    teamId: String(
      apiTask.team_id ??
        apiTask.teamId ??
        (apiTask.team as Record<string, unknown> | undefined)?.id ??
        ''
    ),
  } as Task;
}

// Get single task by id
export async function getTask(taskId: string): Promise<Task> {
  const res = await axiosInstance.get(`/tasks/${taskId}`);
  return mapApiTaskToTask(res.data);
}

// Get list of tasks, optional query params
export async function getTasks(
  params?: Record<string, unknown>
): Promise<Task[]> {
  const res = await axiosInstance.get('/tasks', { params });
  const data = res.data ?? [];
  if (Array.isArray(data)) return data.map(mapApiTaskToTask);
  // If API wraps list in an object like { items: [...] }
  if (Array.isArray(data.items)) return data.items.map(mapApiTaskToTask);
  return [];
}

// Create a new task. `payload` should follow backend contract (snake_case or camelCase).
export async function createTask(
  payload: Record<string, unknown>
): Promise<Task> {
  // Sanitize payload according to backend validation rules:
  // - Do not send server-managed fields like `status` or `created_by`.
  // - `assigned_to` must be a single UUID string (not an array).
  const sanitized: Record<string, unknown> = {};

  if (payload.title) sanitized.title = payload.title;
  if (payload.description) sanitized.description = payload.description;

  // Normalize assigned_to (accept either `assigned_to` or `assignedTo`)
  let assigned: unknown =
    payload.assigned_to ?? payload.assignedTo ?? undefined;
  if (Array.isArray(assigned)) assigned = assigned[0];
  if (assigned) sanitized.assigned_to = assigned;

  // Team id
  if (payload.team_id) sanitized.team_id = payload.team_id;
  if (payload.teamId) sanitized.team_id = payload.teamId;

  // Deadline / due date
  if (payload.deadline) sanitized.deadline = payload.deadline;
  if (payload.due_date) sanitized.due_date = payload.due_date;
  // Do NOT include tenant_id here — the backend determines tenant from the
  // authenticated request (token) and will reject tenant_id in the payload.

  const res = await axiosInstance.post('/tasks', sanitized);
  const task = mapApiTaskToTask(res.data);

  // Send notification to assigned user (non-blocking). If multiple assigned users, notify all.
  (async () => {
    try {
      const assigned = Array.isArray(task.assignedTo)
        ? task.assignedTo
        : [task.assignedTo];
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?.id;
      // Exclude the actor (creator/manager) from recipients so they don't get the notification
      const userIds = assigned
        .filter(Boolean)
        .map(String)
        .filter(id => id !== String(currentUserId));
      if (userIds.length > 0) {
        const message = `A new task has been assigned to you`;
        const notif = await notificationsApi.sendNotification({
          user_ids: userIds,
          message,
          type: 'task',
        });
        if (!notif.ok) {
          // Notification send failed
          console.warn(
            'Notification send failed for createTask',
            notif.message,
            notif.correlationId
          );
        }
        // Dispatch rich in-app event for immediate UI update in other tabs
        try {
          const actorId = currentUserId;
          const event = new CustomEvent<Record<string, unknown>>(
            'hrms:notification',
            {
              detail: {
                title: 'Task Assigned',
                message,
                taskTitle: task.title,
                employeeName: undefined,
                actorId,
                data: { task },
              },
            }
          );
          window.dispatchEvent(event);
        } catch {
          // ignore
        }
      }
    } catch (e) {
      console.warn('Failed to send task assignment notification', e);
    }
  })();

  return task;
}

// Update an existing task
export async function updateTask(
  taskId: string,
  payload: Record<string, unknown>
): Promise<Task> {
  // Only send allowed/simple updatable fields. The backend returns a 400
  // if server-managed relationship fields are present (e.g. assigned_to,
  // team_id, tenant_id). Send a minimal payload containing only editable
  // primitive fields.
  const sanitized: Record<string, unknown> = {};
  if (payload.title !== undefined) sanitized.title = payload.title;
  if (payload.description !== undefined)
    sanitized.description = payload.description;
  if (payload.deadline !== undefined) sanitized.deadline = payload.deadline;
  if (payload.due_date !== undefined) sanitized.due_date = payload.due_date;
  if (payload.status !== undefined) sanitized.status = payload.status;
  if (payload.priority !== undefined) sanitized.priority = payload.priority;

  const res = await axiosInstance.put(`/tasks/${taskId}`, sanitized);
  return mapApiTaskToTask(res.data);
}

// Delete a task
export async function deleteTask(
  taskId: string
): Promise<{ ok: boolean; message?: string }> {
  const res = await axiosInstance.delete(`/tasks/${taskId}`);
  const ok = res.status >= 200 && res.status < 300;
  const data = res.data as Record<string, unknown>;
  const message = (data && (data['message'] ?? data['msg'])) as
    | string
    | undefined;
  return { ok, message };
}

// Patch task status (backend provides a dedicated endpoint)
export async function patchTaskStatus(
  taskId: string,
  status: string
): Promise<Task> {
  const res = await axiosInstance.patch(`/tasks/${taskId}/status`, { status });
  const updatedTask = mapApiTaskToTask(res.data);

  // Notify task creator and (best-effort) the manager about status update
  (async () => {
    try {
      const { getCurrentUser } = await import('../utils/auth');
      const storedUser = getCurrentUser();
      const employeeName = storedUser
        ? `${storedUser.first_name ?? ''} ${storedUser.last_name ?? ''}`.trim() ||
          'Employee'
        : 'Employee';

      const recipients: string[] = [];
      // Creator
      if (updatedTask.createdBy) recipients.push(String(updatedTask.createdBy));

      // Try to resolve assigned user's manager (best-effort)
      const assigned = Array.isArray(updatedTask.assignedTo)
        ? updatedTask.assignedTo[0]
        : updatedTask.assignedTo;
      if (assigned) {
        try {
          // Dynamic import to avoid circular dependency
          const systemEmployeeApi = (await import('./systemEmployeeApi'))
            .default;
          const teamApiLocal = (await import('./teamApi')).default;
          const profile = await systemEmployeeApi.getSystemEmployeeById(
            String(assigned)
          );
          const prof = profile as Record<string, unknown> | undefined;
          const teamIdRaw =
            prof?.team ?? prof?.team_id ?? prof?.teamId ?? undefined;
          const teamId = teamIdRaw ?? undefined;
          if (teamId) {
            try {
              const team = await teamApiLocal.getTeamById(String(teamId));
              const managerId = team?.manager_id ?? team?.manager?.id;
              if (managerId) recipients.push(String(managerId));
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore
        }
      }

      // Unique recipients excluding current actor
      const uniqueRecipients = Array.from(new Set(recipients)).filter(
        r => r && (!storedUser || r !== storedUser.id)
      );
      if (uniqueRecipients.length === 0) return;

      // Determine message based on status
      let message = '';
      const normalized = String(status).toLowerCase();
      if (normalized.includes('complete')) {
        message = `${employeeName} has completed the task`;
      } else if (
        normalized.includes('progress') ||
        normalized.includes('in progress')
      ) {
        message = `${employeeName} has started the task`;
      } else {
        message = `${employeeName} updated task status to ${status}`;
      }

      const notif = await notificationsApi.sendNotification({
        user_ids: uniqueRecipients,
        message,
        type: 'task',
      });
      if (!notif.ok) {
        console.warn(
          'Notification send failed for patchTaskStatus',
          notif.message,
          notif.correlationId
        );
      }
      // Dispatch in-app event with status details
      try {
        const actorId = storedUser?.id;
        const event = new CustomEvent<Record<string, unknown>>(
          'hrms:notification',
          {
            detail: {
              title: 'Task Status Updated',
              message,
              taskTitle: updatedTask.title,
              employeeName,
              oldStatus: undefined,
              newStatus: updatedTask.status,
              actorId,
              data: { task: updatedTask },
            },
          }
        );
        window.dispatchEvent(event);
      } catch {
        // ignore
      }
    } catch (e) {
      console.warn('Failed to send task status notification', e);
    }
  })();

  return updatedTask;
}

// Example helper to convert a frontend Task to backend payload (snake_case)
export function mapTaskToApiPayload(
  task: Partial<Task>
): Record<string, unknown> {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    assigned_to: task.assignedTo,
    assigned_to_name: task.assignedToName,
    status: task.status,
    created_by: task.createdBy,
    created_at: task.createdAt,
    deadline: task.deadline,
    updated_at: task.updatedAt,
    team_id: task.teamId,
  };
}

export default {
  getTask,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  patchTaskStatus,
  mapApiTaskToTask,
  mapTaskToApiPayload,
};
