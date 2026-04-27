import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, Tooltip } from '@mui/material';
import AppPageTitle from '../common/AppPageTitle';
import AppCard from '../common/AppCard';
import AppDropdown from '../common/AppDropdown';
import * as tasksApi from '../../api/tasksApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
// teamApiService not required in this component
import type { Task, TaskStatus } from '../../types/task';
import { TASK_CARD_CONFIG } from '../../theme/themeConfig';

function truncateText(text: string, limit: number) {
  if (!text) return '';
  if (text.length <= limit) return text;
  return text.substring(0, limit) + '...';
}

function formatDateLocal(isoDate?: string) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function getStatusColorLocal(status: string) {
  switch (status) {
    case 'In Progress':
      return 'warning';
    case 'Completed':
      return 'success';
    default:
      return 'default';
  }
}
const CURRENT_USER_ID = localStorage.getItem('employeeId') ?? undefined;
const statusOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
];

export default function MyTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await tasksApi.getTasks();
        const filtered = all.filter(t =>
          (t.assignedTo || []).includes(CURRENT_USER_ID || '')
        );
        if (mounted) setTasks(filtered as Task[]);
      } catch (err) {
        console.error('Failed to load my tasks', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();
  const updateStatus = async (taskId: string, newStatus: string) => {
    let previousTasks: Task[] = [];
    setTasks(prev => {
      previousTasks = prev;
      return prev.map(task =>
        task.id === taskId
          ? {
            ...task,
            status: newStatus as TaskStatus,
            updatedAt: new Date().toISOString(),
          }
          : task
      );
    });

    try {
      const updated = await tasksApi.patchTaskStatus(taskId, newStatus);
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      showSuccess('Status updated');
      // Do not show in-app notification to employee when they complete their own task
    } catch (err) {
      // rollback optimistic update
      setTasks(previousTasks);
      showError(err, { operation: 'update', resource: 'employee' });
    }
  };

  return (
    <Box>
      {/* Page Title */}
      <AppPageTitle>My Tasks</AppPageTitle>

      {/* Task Cards Grid */}
      {tasks.length === 0 ? (
        <AppCard>
          <Typography color='text.secondary'>
            No tasks assigned to you.
          </Typography>
        </AppCard>
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
          {tasks.map(task => (
            <AppCard
              key={task.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <Box display='flex' flexDirection='column' gap={2}>
                {/* Title and Status Badge */}
                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='flex-start'
                  gap={1}
                >
                  <Tooltip
                    title={task.title.length > TASK_CARD_CONFIG.TITLE_LIMIT ? task.title : ''}
                    arrow
                  >
                    <Typography
                      variant='h6'
                      sx={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        textDecoration:
                          task.status === 'Completed' ? 'line-through' : 'none',
                        color:
                          task.status === 'Completed'
                            ? 'text.disabled'
                            : 'text.primary',
                        flex: 1,
                      }}
                    >
                      {truncateText(task.title, TASK_CARD_CONFIG.TITLE_LIMIT)}
                    </Typography>
                  </Tooltip>
                  <Chip
                    label={task.status}
                    color={getStatusColorLocal(task.status)}
                    size='small'
                    sx={{ flexShrink: 0 }}
                  />
                </Box>

                {/* Description */}
                <Tooltip
                  title={
                    task.description &&
                      task.description.length > TASK_CARD_CONFIG.DESCRIPTION_LIMIT
                      ? task.description
                      : ''
                  }
                  arrow
                >
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {truncateText(
                      task.description || '',
                      TASK_CARD_CONFIG.DESCRIPTION_LIMIT
                    )}
                  </Typography>
                </Tooltip>

                {/* Assigned To */}
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    Assigned To
                  </Typography>
                  <Typography variant='body2' fontWeight={500}>
                    {Array.isArray(task.assignedToName)
                      ? task.assignedToName.join(', ')
                      : task.assignedToName || 'You'}
                  </Typography>
                </Box>

                {/* Created By */}
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    Created By
                  </Typography>
                  <Typography variant='body2' fontWeight={500}>
                    {task.createdByName}
                  </Typography>
                </Box>

                {/* Created Date */}
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    Created
                  </Typography>
                  <Typography variant='body2'>
                    {formatDateLocal(task.createdAt)}
                  </Typography>
                </Box>

                {/* Deadline */}
                <Box>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mb: 0.5 }}
                  >
                    Deadline
                  </Typography>
                  <Typography variant='body2'>
                    {task.deadline ? formatDateLocal(task.deadline) : '—'}
                  </Typography>
                </Box>

                {/* Status Update Dropdown */}
                <Box mt='auto'>
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ display: 'block', mb: 1 }}
                  >
                    Update Status
                  </Typography>
                  <AppDropdown
                    options={statusOptions}
                    value={task.status}
                    onChange={e =>
                      void updateStatus(task.id, String(e.target.value))
                    }
                    placeholder='Status'
                    containerSx={{ width: '100%' }}
                    label={''}
                  />
                </Box>
              </Box>
            </AppCard>
          ))}
        </Box>
      )}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
}
