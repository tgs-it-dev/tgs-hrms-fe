import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import AppCard from '../common/AppCard';
import * as tasksApi from '../../api/tasksApi';
import type { Task } from '../../types/task';
import { formatDate } from '../../utils/dateUtils';

export default function EmployeeTasks(): JSX.Element {
  const { employeeId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!employeeId) return;
      try {
        const all = await tasksApi.getTasks();
        const filtered = all.filter(t =>
          (t.assignedTo || []).includes(employeeId)
        );
        if (mounted) setTasks(filtered as Task[]);
      } catch (err) {
        console.error('Failed to load tasks for employee', employeeId, err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  return (
    <Box>
      <Typography variant='h5' mb={2}>
        Tasks for {employeeId}
      </Typography>

      {tasks.length === 0 ? (
        <AppCard>
          <Typography color='text.secondary'>
            No tasks for this employee.
          </Typography>
        </AppCard>
      ) : (
        <Box sx={{ display: 'grid', gap: 2 }}>
          {tasks.map(t => (
            <AppCard key={t.id}>
              <Box display='flex' flexDirection='column' gap={1}>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                  {t.title}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {t.description}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  Deadline: {t.deadline ? formatDate(t.deadline) : '—'}
                </Typography>
              </Box>
            </AppCard>
          ))}
        </Box>
      )}
    </Box>
  );
}
