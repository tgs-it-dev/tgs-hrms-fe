import React, { useState, useEffect } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
// back button removed per UX request
import { Icons } from '../../assets/icons';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import {} from /* useNavigate */ 'react-router-dom';
import AppCard from '../common/AppCard';
import AppDropdown from '../common/AppDropdown';
import AppButton from '../common/AppButton';
import AppFormModal, { type FormField } from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppPageTitle from '../common/AppPageTitle';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  getStatusColor,
  formatDate,
  type Task,
  type Team,
  type TeamMember,
} from '../../Data/taskMockData';
import { getStoredUser } from '../../utils/authSession';
import { isSystemAdmin as roleIsSystemAdmin } from '../../utils/auth';
import { teamApiService } from '../../api/teamApi';
import * as tasksApi from '../../api/tasksApi';
import { TASK_CARD_CONFIG } from '../../theme/themeConfig';

function truncateText(text: string, limit: number) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}

const CURRENT_MANAGER_ID =
  localStorage.getItem('employeeId') ??
  (getStoredUser<Record<string, unknown>>()?.id as string | undefined) ??
  undefined;

const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
];

interface TaskFormData {
  title: string;
  description: string;
  assignedTo: string[];
  teamId: string;
  deadline?: string;
}

export default function ManagerTaskBoard() {
  // navigate not used in this component
  const { snackbar, showSuccess, showError, closeSnackbar } = useErrorHandler();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembersMap, setTeamMembersMap] = useState<
    Record<string, TeamMember[]>
  >({});
  const [teamMembersLoading, setTeamMembersLoading] = useState<
    Record<string, boolean>
  >({});
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateTaskSubmitting, setIsCreateTaskSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    assignedTo: [],
    teamId: '',
    deadline: undefined,
  });

  // Task detail modal state
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [taskDetailMember, setTaskDetailMember] = useState<TeamMember | null>(
    null
  );
  const [taskDetailTasks, setTaskDetailTasks] = useState<Task[]>([]);
  const [taskDetailStatusFilter, setTaskDetailStatusFilter] =
    useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Team-wise view state
  // viewByTeam state removed (unused)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeeTasks, setEmployeeTasks] = useState<Task[] | null>(null);
  // Derive current user info from stored auth session
  const storedUser = getStoredUser<Record<string, unknown>>();
  // currentUserName not used in this component

  // Determine role and current user identifiers (handle object/string/array shapes)
  let roleStrRaw: string = '';
  const roleVal = (storedUser as Record<string, unknown>)?.role;
  if (typeof roleVal === 'string') roleStrRaw = roleVal;
  else if (roleVal && typeof roleVal === 'object')
    roleStrRaw =
      (roleVal.name as string) ??
      (roleVal.role as string) ??
      (roleVal.type as string) ??
      '';
  else if (Array.isArray((storedUser as Record<string, unknown>)?.roles)) {
    const first = (storedUser as Record<string, unknown>)?.roles?.[0] as
      | Record<string, unknown>
      | string
      | undefined;
    roleStrRaw =
      (first &&
        (((first as Record<string, unknown>)?.name as string) ?? first)) ??
      '';
  }
  const roleStr = String(roleStrRaw).toLowerCase();
  const isAdmin = roleStr.includes('admin');
  const isManager = roleStr.includes('manager');

  // If the signed-in user is a system admin, hide this task management UI
  // We must NOT return early here because React Hooks must execute in the same
  // order on every render. Instead, evaluate the flag and return later after
  // all hooks are declared.
  const isSystemAdmin = roleIsSystemAdmin();

  const CURRENT_USER_ID =
    localStorage.getItem('employeeId') ??
    (storedUser?.id as string | undefined);

  // Build identifiers to match against team.managerId or team.memberIds
  const currentUserIdentifiers = Array.from(
    new Set<string>(
      [
        String(CURRENT_USER_ID ?? ''),
        String(storedUser?.id ?? ''),
        String((storedUser as Record<string, unknown>)?.userId ?? ''),
        String((storedUser as Record<string, unknown>)?.user_id ?? ''),
      ].filter(Boolean)
    )
  );

  // Helper to extract a readable message from unknown error objects
  const extractErrorMessage = (err: unknown): string => {
    if (!err) return String(err);
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null) {
      const e = err as Record<string, unknown>;
      const resp = e.response as Record<string, unknown> | undefined;
      const data = resp?.data as Record<string, unknown> | undefined;
      const message = (data?.message ?? data?.error) as string | undefined;
      const errorsArr = data?.errors as unknown[] | undefined;
      if (Array.isArray(errorsArr) && errorsArr.length > 0) {
        const formatted = errorsArr
          .map(it => {
            const r = it as Record<string, unknown>;
            if (r && (r.field || r.message))
              return `${String(r.field ?? '')}: ${String(r.message ?? '')}`;
            return String(it);
          })
          .join('; ');
        return `${String(message ?? '')} — ${formatted}`.trim();
      }
      return String(message ?? e.message ?? JSON.stringify(e));
    }
    return String(err);
  };

  // Local today string in YYYY-MM-DD for `min` attribute on date inputs
  const todayLocalDateString = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })();

  // Load all tasks on mount (from API)
  useEffect(() => {
    let mounted = true;
    const fetchTasks = async () => {
      try {
        const data = await tasksApi.getTasks();
        // Debug: log tasks received

        console.debug(
          'Fetched tasks from API:',
          Array.isArray(data) ? data.length : 0,
          data?.[0]
        );
        if (mounted) setTasks(data);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        // show error snackbar
        (showError ?? (() => {}))(err as unknown, {
          operation: 'fetch',
          resource: 'employee',
        });
      }
    };
    void fetchTasks();
    return () => {
      mounted = false;
    };
  }, [showError]);

  // Load teams from API for dropdown and cards
  useEffect(() => {
    let mounted = true;
    const fetchTeams = async () => {
      try {
        // Request all teams (pass null so service omits page param)
        const resp = await teamApiService.getAllTeams(
          null as unknown as number | null
        );
        const items: unknown[] = resp?.items ?? [];

        const mapped = items.map(t => {
          const tt = t as Record<string, unknown>;
          const teamMembers = (tt.teamMembers as unknown[]) ?? [];
          const managerId =
            (tt.manager_id as string | undefined) ??
            ((tt.manager as Record<string, unknown>)?.id as
              | string
              | undefined) ??
            '';
          return {
            id: String(tt.id ?? ''),
            name: String(tt.name ?? ''),
            department: String(tt.description ?? ''),
            project: String(tt.project ?? ''),
            managerId: String(managerId ?? ''),
            memberIds: teamMembers.map(m => {
              const mm = m as Record<string, unknown>;
              return String(
                mm.id ?? (mm.user as Record<string, unknown>)?.id ?? ''
              );
            }),
          } as Team;
        });

        if (mounted && mapped.length) setTeams(mapped);
      } catch (err) {
        console.error('Failed to fetch teams from API, using mocks:', err);
      }
    };
    void fetchTeams();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute visible teams depending on role: admins see all, managers see only their teams
  const visibleTeams = isAdmin
    ? teams
    : isManager
      ? teams.filter(t => {
          const mgrId = String(t.managerId ?? '');
          if (currentUserIdentifiers.includes(mgrId)) return true;
          const memberIds = (t.memberIds || []).map(String);
          return memberIds.some(id => currentUserIdentifiers.includes(id));
        })
      : [];

  const visibleTeamIds = visibleTeams.map(t => t.id);

  // For managers, show a focused single-column layout on larger screens
  const teamGridTemplate = {
    xs: '1fr',
    sm: isManager ? '1fr' : 'repeat(2, 1fr)',
    md: isManager ? '1fr' : 'repeat(3, 1fr)',
    lg: isManager ? '1fr' : 'repeat(4, 1fr)',
  } as const;

  // Get filtered tasks (also enforce role-based visibility)
  const filteredTasks = tasks.filter(task => {
    // Managers only see tasks for their visible teams
    if (!isAdmin && isManager) {
      if (!visibleTeamIds.includes(task.teamId)) return false;
    }

    const teamMatch = selectedTeam === 'all' || task.teamId === selectedTeam;
    const statusMatch =
      selectedStatus === 'all' || task.status === selectedStatus;
    return teamMatch && statusMatch;
  });

  // Tasks shown inside the Task Details modal after applying modal-level status filter
  const shownTaskDetailTasks = taskDetailTasks.filter(
    t => taskDetailStatusFilter === 'all' || t.status === taskDetailStatusFilter
  );

  // Get team members for selected team
  const getAvailableMembers = (teamId: string) => {
    if (!teamId) return [];
    // Return from cache if available
    if (teamMembersMap[teamId]) return teamMembersMap[teamId];

    // Kick off background load if not already loading
    if (!teamMembersLoading[teamId]) {
      (async () => {
        try {
          setTeamMembersLoading(prev => ({ ...prev, [teamId]: true }));
          const resp = await teamApiService.getTeamMembers(teamId, 1);
          const items: unknown[] = resp.items || [];

          // Map API member shape to the local TeamMember shape used by this component
          const mapped = (items as unknown[])
            .map(m => {
              const mm = m as Record<string, unknown>;
              const user = (mm.user as Record<string, unknown>) ?? {};
              const name =
                (user.name as string | undefined) ||
                `${(user.first_name as string | undefined) ?? ''} ${(user.last_name as string | undefined) ?? ''}`.trim() ||
                (user.email as string | undefined) ||
                (user.first_name as string | undefined) ||
                (user.last_name as string | undefined) ||
                'Unknown';
              return {
                id: String(mm.id ?? user.id ?? String(Math.random())),
                name,
                email: String(user.email ?? ''),
                role: String(mm.role ?? 'employee'),
                department:
                  String(
                    (mm.department as Record<string, unknown>)?.name ?? ''
                  ) ||
                  String(
                    (mm.designation as Record<string, unknown>)?.department
                      ?.name ?? ''
                  ),
              } as TeamMember;
            })
            // dedupe by id
            .reduce((acc: TeamMember[], cur) => {
              if (!acc.some(a => a.id === cur.id)) acc.push(cur);
              return acc;
            }, [] as TeamMember[]);

          setTeamMembersMap(prev => ({ ...prev, [teamId]: mapped }));
        } catch (err) {
          // On error, fall back to mock members for this team

          console.error(
            'Failed to load team members from API for',
            teamId,
            err
          );
          setTeamMembersMap(prev => ({
            ...prev,
            [teamId]: [],
          }));
        } finally {
          setTeamMembersLoading(prev => ({ ...prev, [teamId]: false }));
        }
      })();
    }

    // Return fallback (mock) merged with any assignees referenced by tasks for this team
    const mock: TeamMember[] = [];
    const assigneesFromTasks = tasks
      .filter(t => t.teamId === teamId)
      .flatMap(t => t.assignedTo || [])
      .filter(Boolean) as string[];

    const additional = assigneesFromTasks
      .filter(aid => !mock.some(m => m.id === aid))
      .map(aid => {
        // Try to resolve a display name from tasks
        const t = tasks.find(tsk => (tsk.assignedTo || []).includes(aid));
        const name = t?.assignedToName?.[0] ?? aid;
        return {
          id: aid,
          name,
          email: '',
          role: 'employee',
          department: '',
        } as TeamMember;
      });

    // Merge mock + additional and dedupe by id
    const merged = [...mock, ...additional];
    const unique = merged.reduce((acc: TeamMember[], cur) => {
      if (!acc.some(a => a.id === cur.id)) acc.push(cur);
      return acc;
    }, [] as TeamMember[]);
    return unique;
  };

  // Handle create task (calls API)
  const handleCreateTask = async () => {
    if (!CURRENT_MANAGER_ID) {
      console.warn('Cannot create task: manager id is not defined');
      showError?.(new Error('Manager id is not defined. Please login.'), {
        operation: 'create',
        resource: 'task',
      });
      return;
    }
    if (
      !formData.title.trim() ||
      !formData.teamId ||
      !formData.assignedTo?.length
    ) {
      return;
    }

    // Validate deadline is not in the past (if provided)
    if (formData.deadline) {
      // compare as local date strings (YYYY-MM-DD)
      if (String(formData.deadline) < todayLocalDateString) {
        showError?.(
          new Error(
            'Deadline cannot be in the past. Please select today or a future date.'
          ),
          { operation: 'create', resource: 'task' }
        );
        return;
      }
    }

    try {
      setIsCreateTaskSubmitting(true);
      const payload = tasksApi.mapTaskToApiPayload({
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedTo: formData.assignedTo,
        teamId: formData.teamId,
        deadline: formData.deadline,
        createdBy: CURRENT_MANAGER_ID,
        status: 'Pending',
      });

      const created = await tasksApi.createTask(payload);
      setTasks(prev =>
        prev.some(t => t.id === created.id) ? prev : [created, ...prev]
      );
      setIsCreateDialogOpen(false);
      resetForm();
      showSuccess('Task created successfully!');
    } catch (err) {
      const msg = extractErrorMessage(err);
      showError?.(new Error(msg), {
        operation: 'create',
        resource: 'employee',
      });
    } finally {
      setIsCreateTaskSubmitting(false);
    }
  };

  // Open create dialog helper: auto-select manager's primary team if available
  const openCreateDialog = () => {
    if (isManager && visibleTeams && visibleTeams.length > 0) {
      setFormData(prev => ({
        ...prev,
        teamId: String(visibleTeams[0].id),
        assignedTo: [],
      }));
    }
    setIsCreateDialogOpen(true);
  };

  // Handle edit task (calls API)
  const handleEditTask = async () => {
    if (
      !editingTask ||
      !formData.title.trim() ||
      !formData.assignedTo?.length
    ) {
      return;
    }

    // Validate deadline is not in the past (if provided)
    if (formData.deadline) {
      if (String(formData.deadline) < todayLocalDateString) {
        showError?.(
          new Error(
            'Deadline cannot be in the past. Please select today or a future date.'
          ),
          { operation: 'update', resource: 'task' }
        );
        return;
      }
    }

    try {
      // Build a minimal update payload — do NOT send server-managed
      // relationship or timestamp fields (backend rejects `assigned_to`,
      // `team_id`, `tenant_id`, and `updated_at`).
      const updatePayload: Record<string, unknown> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
      };
      if (formData.deadline) updatePayload.deadline = formData.deadline;

      const updated = await tasksApi.updateTask(editingTask.id, updatePayload);
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      // Also update any derived lists shown in the UI (task detail modal, employee drill-down)
      setTaskDetailTasks(prev =>
        prev ? prev.map(t => (t.id === updated.id ? updated : t)) : prev
      );
      setEmployeeTasks(prev =>
        prev ? prev.map(t => (t.id === updated.id ? updated : t)) : prev
      );
      setIsEditDialogOpen(false);
      setEditingTask(null);
      resetForm();
      showSuccess('Task updated successfully!');
    } catch (err) {
      const msg = extractErrorMessage(err);
      showError?.(new Error(msg), {
        operation: 'update',
        resource: 'employee',
      });
    }
  };

  // Handle delete task (open confirmation)
  const handleDeleteTask = (taskId: string) => {
    setDeleteTargetId(taskId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTask = () => {
    const doDelete = async () => {
      if (!deleteTargetId) return setDeleteDialogOpen(false);
      try {
        const res = await tasksApi.deleteTask(deleteTargetId);
        if (res.ok) {
          setTasks(prev => prev.filter(task => task.id !== deleteTargetId));
          setTaskDetailTasks(prev => prev.filter(t => t.id !== deleteTargetId));
          const msg = res.message ?? 'Task deleted successfully!';
          showError(new Error(msg));
        }
      } catch (err) {
        showError(err, { operation: 'delete', resource: 'employee' });
      } finally {
        setDeleteDialogOpen(false);
        setDeleteTargetId(null);
      }
    };
    void doDelete();
  };

  // Open edit dialog
  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      teamId: task.teamId,
      // Normalize deadline into YYYY-MM-DD for the date input field
      deadline:
        task.deadline && typeof task.deadline === 'string'
          ? String(task.deadline).slice(0, 10)
          : undefined,
    });
    setIsEditDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: [],
      teamId: '',
      deadline: undefined,
    });
  };

  // Handle dialog close
  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingTask(null);
    resetForm();
  };

  if (isSystemAdmin) return null;

  return (
    <Box>
      {/* Header with Back Button and Notifications */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Box /> {/* Placeholder Box for alignment */}
      </Box>

      {/* Page Title */}
      <AppPageTitle>Manager Task Board</AppPageTitle>

      {/* Filters and Create Button */}
      <AppCard sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(12, 1fr)',
            },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <Box
            sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', md: 'span 3' } }}
          >
            {!isManager && (
              <AppDropdown
                options={[
                  { value: 'all', label: 'All Teams' },
                  ...visibleTeams.map(team => ({
                    value: team.id,
                    label: team.name,
                  })),
                ]}
                value={selectedTeam}
                onChange={e => {
                  const v = String(e.target.value);
                  setSelectedTeam(v === '' ? 'all' : v);
                }}
                placeholder='Filter by Team'
                containerSx={{ width: '100%' }}
                label='Team'
                showLabel={false}
              />
            )}
          </Box>

          <Box
            sx={{ gridColumn: { xs: 'span 1', sm: 'span 1', md: 'span 3' } }}
          >
            {isAdmin && (
              <AppDropdown
                options={[
                  { value: 'all', label: 'All Statuses' },
                  ...statusOptions,
                ]}
                value={selectedStatus}
                onChange={e => {
                  const v = String(e.target.value);
                  setSelectedStatus(v === '' ? 'all' : v);
                }}
                placeholder='Filter by Status'
                containerSx={{ width: '100%' }}
                label='Status'
                showLabel={false}
              />
            )}
          </Box>

          <Box
            sx={{
              gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 6' },
              textAlign: { xs: 'left', md: 'right' },
            }}
          >
            {isManager && (
              <AppButton
                variantType='primary'
                text='Create New Task'
                onClick={openCreateDialog}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              />
            )}
          </Box>
        </Box>
      </AppCard>

      {/* Task Statistics */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(4, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <AppCard compact>
            <Typography variant='body2' color='text.secondary'>
              Total Tasks
            </Typography>
            <Typography variant='h4' fontWeight={600}>
              {filteredTasks.length}
            </Typography>
          </AppCard>
        </Box>
        <Box>
          <AppCard compact>
            <Typography variant='body2' color='text.secondary'>
              Pending
            </Typography>
            <Typography variant='h4' fontWeight={600} color='info.main'>
              {filteredTasks.filter(t => t.status === 'Pending').length}
            </Typography>
          </AppCard>
        </Box>
        <Box>
          <AppCard compact>
            <Typography variant='body2' color='text.secondary'>
              In Progress
            </Typography>
            <Typography variant='h4' fontWeight={600} color='warning.main'>
              {filteredTasks.filter(t => t.status === 'In Progress').length}
            </Typography>
          </AppCard>
        </Box>
        <Box>
          <AppCard compact>
            <Typography variant='body2' color='text.secondary'>
              Completed
            </Typography>
            <Typography variant='h4' fontWeight={600} color='success.main'>
              {filteredTasks.filter(t => t.status === 'Completed').length}
            </Typography>
          </AppCard>
        </Box>
      </Box>

      {/* Team-wise View: One card per team with member list and drill-down */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: teamGridTemplate,
          gap: 2,
          mb: 3,
        }}
      >
        {visibleTeams
          .filter(team =>
            selectedTeam === 'all' ? true : team.id === selectedTeam
          )
          .map(team => {
            const members = getAvailableMembers(team.id);
            return (
              <AppCard
                key={team.id}
                sx={{
                  height: '100%',
                  width: isManager ? '100%' : undefined,
                  p: isManager ? { xs: 2, md: 4 } : undefined,
                }}
              >
                <Box display='flex' flexDirection='column' gap={2}>
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='center'
                  >
                    <Box>
                      <Typography
                        variant={isManager ? 'h5' : 'h6'}
                        sx={isManager ? { fontWeight: 700 } : {}}
                      >
                        {team.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {team.project}
                      </Typography>
                    </Box>
                    <Box textAlign='right'>
                      <Typography variant='body2' color='text.secondary'>
                        Members
                      </Typography>
                      <Typography variant='h6' fontWeight={600}>
                        {members.length}
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{ mb: 1 }}
                    >
                      Team Members
                    </Typography>
                    <Box display='flex' flexDirection='column' gap={1}>
                      {members.map(mem => (
                        <Box
                          key={mem.id}
                          display='flex'
                          justifyContent='space-between'
                          alignItems='center'
                        >
                          <Typography
                            sx={theme => ({
                              color:
                                String(mem.name).toLowerCase().trim() ===
                                  'hassan ali' && theme.palette.mode === 'dark'
                                  ? theme.palette.text.secondary
                                  : selectedEmployee === mem.id
                                    ? theme.palette.mode === 'dark'
                                      ? theme.palette.primary.main
                                      : theme.palette.primary.dark
                                    : 'text.primary',
                              fontWeight:
                                selectedEmployee === mem.id ? 600 : undefined,
                            })}
                          >
                            {mem.name}
                          </Typography>
                          <Tooltip title='View tasks' arrow>
                            <IconButton
                              size='small'
                              onClick={e => {
                                e.stopPropagation();
                                // open task detail modal for this member
                                const tasksForMember = tasks.filter(t =>
                                  (t.assignedTo || []).includes(mem.id)
                                );
                                setTaskDetailMember(mem);
                                setSelectedEmployee(mem.id);
                                setTaskDetailTasks(tasksForMember);
                                setTaskDetailOpen(true);
                              }}
                              aria-label={`view-${mem.name}`}
                              sx={{ color: 'text.primary' }}
                            >
                              <VisibilityIcon
                                fontSize='small'
                                sx={{ color: 'inherit' }}
                              />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Employee tasks drill-down (if selected employee is part of this team) */}
                  {selectedEmployee &&
                    employeeTasks &&
                    employeeTasks.length > 0 && (
                      <Box>
                        <AppCard compact>
                          <Typography variant='subtitle2'>
                            Employee Tasks
                          </Typography>
                          <Box
                            mt={1}
                            display='flex'
                            flexDirection='column'
                            gap={1}
                          >
                            {employeeTasks.map(et => (
                              <Box
                                key={et.id}
                                display='flex'
                                justifyContent='space-between'
                                alignItems='center'
                              >
                                <Box>
                                  <Typography
                                    variant='body2'
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {et.title}
                                  </Typography>
                                  <Tooltip title={et.description} arrow>
                                    <Typography
                                      variant='caption'
                                      color='text.secondary'
                                    >
                                      {et.description}
                                    </Typography>
                                  </Tooltip>
                                </Box>
                                <Box display='flex' alignItems='center' gap={1}>
                                  <Chip
                                    label={et.status}
                                    size='small'
                                    color={getStatusColor(et.status)}
                                  />
                                  {isManager &&
                                    visibleTeamIds.includes(et.teamId) && (
                                      <Box display='flex' gap={0.5}>
                                        <Tooltip title='Edit' arrow>
                                          <IconButton
                                            size='small'
                                            onClick={() => openEditDialog(et)}
                                            aria-label={`edit-${et.id}`}
                                            sx={{ p: { xs: 0.4, sm: 0.6 } }}
                                          >
                                            <Box
                                              component='img'
                                              src={Icons.edit}
                                              alt='Edit'
                                              sx={{ width: 18, height: 18 }}
                                            />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title='Delete' arrow>
                                          <IconButton
                                            size='small'
                                            onClick={() =>
                                              handleDeleteTask(et.id)
                                            }
                                            aria-label={`delete-${et.id}`}
                                            sx={{ p: { xs: 0.4, sm: 0.6 } }}
                                          >
                                            <Box
                                              component='img'
                                              src={Icons.delete}
                                              alt='Delete'
                                              sx={{ width: 18, height: 18 }}
                                            />
                                          </IconButton>
                                        </Tooltip>
                                      </Box>
                                    )}
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </AppCard>
                      </Box>
                    )}
                </Box>
              </AppCard>
            );
          })}
      </Box>

      {/* Create Task Modal (uses shared AppFormModal) */}
      {(() => {
        const createFields: FormField[] = [
          {
            name: 'title',
            label: 'Task Title',
            type: 'text',
            required: true,
            placeholder: 'Enter task title',
            value: formData.title,
            onChange: v => setFormData({ ...formData, title: String(v) }),
          },
          {
            name: 'deadline',
            label: 'Deadline',
            type: 'text',
            component: (
              <AppInputField
                label='Deadline'
                type='date'
                value={formData.deadline || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
                inputProps={{ min: todayLocalDateString }}
                inputBackgroundColor={undefined}
              />
            ),
            value: formData.deadline || '',
            onChange: v => setFormData({ ...formData, deadline: String(v) }),
          },
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter task description',
            multiline: true,
            rows: 3,
            value: formData.description,
            onChange: v => setFormData({ ...formData, description: String(v) }),
          },
          // Assign To will be conditionally rendered by AppFormModal only if teamId selected
          ...(formData.teamId
            ? [
                {
                  name: 'assignedTo',
                  label: 'Assign To',
                  component: (
                    <AppDropdown
                      multiple
                      options={getAvailableMembers(formData.teamId).map(m => ({
                        value: m.id,
                        label: m.name,
                      }))}
                      value={formData.assignedTo}
                      onChange={(
                        e: SelectChangeEvent<string | number | string[]>
                      ) =>
                        setFormData({
                          ...formData,
                          assignedTo: (e.target.value as string[]) || [],
                        })
                      }
                      placeholder='Assign To'
                      containerSx={{ width: '100%' }}
                      showLabel={false}
                      label={''}
                    />
                  ),
                  value: formData.assignedTo.join(','),
                  onChange: (v: string | number) =>
                    setFormData({
                      ...formData,
                      assignedTo: String(v).split(',').filter(Boolean),
                    }),
                } as unknown as FormField,
              ]
            : []),
        ];

        return (
          <AppFormModal
            maxWidth='md'
            paperSx={{
              width: { xs: '100%', sm: '92%', lg: '800px' },
              maxHeight: '82vh',
            }}
            open={isCreateDialogOpen}
            onClose={handleCloseCreateDialog}
            onSubmit={handleCreateTask}
            title='Create New Task'
            fields={createFields}
            submitLabel='Create Task'
            cancelLabel='Cancel'
            wrapInForm={true}
            showCancelButton={true}
            showSubmitButton={true}
            isSubmitting={isCreateTaskSubmitting}
            submitDisabled={
              isCreateTaskSubmitting ||
              !formData.title.trim() ||
              !formData.teamId ||
              !formData.assignedTo?.length
            }
          />
        );
      })()}

      {/* Edit Task Modal (shared AppFormModal) */}
      <AppFormModal
        maxWidth='md'
        paperSx={{
          width: { xs: '100%', sm: '92%', lg: '800px' },
          maxHeight: '82vh',
        }}
        open={isEditDialogOpen}
        onClose={handleCloseEditDialog}
        onSubmit={handleEditTask}
        title='Edit Task'
        fields={(() => {
          const fields: FormField[] = [
            {
              name: 'title',
              label: 'Task Title',
              type: 'text',
              required: true,
              value: formData.title,
              onChange: v => setFormData({ ...formData, title: String(v) }),
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              value: formData.description,
              onChange: v =>
                setFormData({ ...formData, description: String(v) }),
              rows: 3,
            },

            ...(formData.teamId
              ? [
                  //  as unknown as FormField,
                ]
              : []),
            {
              name: 'deadline',
              label: 'Deadline',
              value: formData.deadline || '',
              component: (
                <AppInputField
                  label='Deadline'
                  type='date'
                  value={formData.deadline || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: todayLocalDateString }}
                />
              ),
              onChange: v => setFormData({ ...formData, deadline: String(v) }),
            },
          ];
          return fields;
        })()}
        submitLabel='Save Changes'
        cancelLabel='Cancel'
        submitDisabled={
          !formData.title.trim() ||
          !formData.teamId ||
          !formData.assignedTo?.length
        }
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDeleteTask}
        message={'This action will permanently delete the task.'}
      />

      {/* Success/Error Snackbar */}
      {/* Task Detail Modal */}
      <Dialog
        open={taskDetailOpen}
        onClose={() => {
          setTaskDetailOpen(false);
          setSelectedEmployee(null);
        }}
        maxWidth='lg'
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '82vh',
            width: { xs: '96%', sm: '92%', md: '850px' },
            overflowY: 'auto',
          },
        }}
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
            }}
          >
            <Box>
              <Typography
                variant='h6'
                sx={{ color: 'text.primary', fontWeight: 600 }}
              >
                Task Details
                {taskDetailMember ? ` - ${taskDetailMember.name}` : ''}
              </Typography>
            </Box>
            <Box
              sx={{ width: { xs: '100%', sm: '200px' }, mt: { xs: 1, sm: 0 } }}
            >
              <AppDropdown
                options={[
                  { value: 'all', label: 'All Statuses' },
                  ...statusOptions,
                ]}
                value={taskDetailStatusFilter}
                onChange={e => {
                  const v = String(e.target.value);
                  setTaskDetailStatusFilter(v === '' ? 'all' : v);
                }}
                placeholder='Filter by Status'
                containerSx={{ width: '100%' }}
                label='Status'
                showLabel={false}
              />
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {taskDetailTasks.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>
              No tasks assigned to this member.
            </Typography>
          ) : shownTaskDetailTasks.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>
              No tasks match the selected status.
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 2,
              }}
            >
              {shownTaskDetailTasks.map(t => (
                <AppCard key={t.id} sx={{ height: '100%' }}>
                  <Box
                    display='flex'
                    flexDirection='column'
                    gap={1}
                    sx={{ height: '100%' }}
                  >
                    <Box
                      display='flex'
                      justifyContent='space-between'
                      alignItems='center'
                    >
                      <Tooltip
                        title={t.title.length > TASK_CARD_CONFIG.TITLE_LIMIT ? t.title : ''}
                        arrow
                      >
                        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                          {truncateText(t.title, TASK_CARD_CONFIG.TITLE_LIMIT)}
                        </Typography>
                      </Tooltip>
                      <Box display='flex' alignItems='center' gap={1}>
                        <Chip
                          label={t.status}
                          size='small'
                          color={getStatusColor(t.status)}
                        />
                      </Box>
                    </Box>
                    <Tooltip
                      title={t.description && t.description.length > TASK_CARD_CONFIG.DESCRIPTION_LIMIT ? t.description : ''}
                      arrow
                    >
                      <Typography variant='body2' color='text.secondary' sx={{ wordBreak: 'break-word' }}>
                        {truncateText(t.description || '', TASK_CARD_CONFIG.DESCRIPTION_LIMIT)}
                      </Typography>
                    </Tooltip>
                    {t.deadline && (
                      <Typography variant='caption' color='text.secondary'>
                        Deadline: {formatDate(t.deadline)}
                      </Typography>
                    )}
                    {t.assignedToName && t.assignedToName.length > 0 && (
                      <Typography variant='caption' color='text.secondary'>
                        Assigned To: {(t.assignedToName || []).join(', ')}
                      </Typography>
                    )}
                    <Typography variant='caption' color='text.secondary'>
                      {formatDate(t.createdAt)}
                    </Typography>

                    {/* Footer actions: edit/delete shown at the bottom of the card (managers only for their teams) */}
                    {isManager && visibleTeamIds.includes(t.teamId) && (
                      <Box
                        display='flex'
                        justifyContent='flex-end'
                        gap={1}
                        sx={{ mt: 'auto' }}
                      >
                        <Tooltip title='Edit' arrow>
                          <IconButton
                            size='small'
                            onClick={() => openEditDialog(t)}
                            aria-label={`edit-${t.id}`}
                            sx={{ p: { xs: 0.5, sm: 1 } }}
                          >
                            <Box
                              component='img'
                              src={Icons.edit}
                              alt='Edit'
                              sx={{
                                width: { xs: 16, sm: 20 },
                                height: { xs: 16, sm: 20 },
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Delete' arrow>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteTask(t.id)}
                            aria-label={`delete-${t.id}`}
                            sx={{ p: { xs: 0.5, sm: 1 } }}
                          >
                            <Box
                              component='img'
                              src={Icons.delete}
                              alt='Delete'
                              sx={{
                                width: { xs: 16, sm: 20 },
                                height: { xs: 16, sm: 20 },
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </AppCard>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTaskDetailOpen(false);
              setSelectedEmployee(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
