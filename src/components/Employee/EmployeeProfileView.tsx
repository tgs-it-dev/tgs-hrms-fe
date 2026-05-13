import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import {
  Box,
  Typography,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import { Work, Business, Email, CalendarToday } from '@mui/icons-material';
import employeeApi from '../../api/employeeApi';
import type {
  EmployeeFullProfile,
  EmployeeProfileAttendanceSummaryItem,
  EmployeeProfileLeaveHistoryItem,
} from '../../api/employeeApi';
import { leaveApi, type LeaveType } from '../../api/leaveApi';
import UserAvatar from '../common/UserAvatar';
import { formatDate } from '../../utils/dateUtils';
import AppTable from '../common/AppTable';

const EmployeeProfileView: React.FC = () => {
  const theme = useTheme();
  const { employeeId } = useParams<{ employeeId: string }>();
  const location = useLocation();
  const stateUserId = location.state?.userId as string | undefined;
  const { user: contextUser } = useUser();
  const [profile, setProfile] = useState<EmployeeFullProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<Record<string, string>>({});
  const [loadingLeaveTypes, setLoadingLeaveTypes] = useState(false);

  const base64UrlDecode = (str: string): string => {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    const pad = output.length % 4;
    if (pad === 2) output += '==';
    else if (pad === 3) output += '=';
    else if (pad !== 0) output += '===';
    try {
      return atob(output);
    } catch {
      return '';
    }
  };

  const resolveUserIdFromToken = (): string | null => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payloadJson = base64UrlDecode(parts[1]);
      if (!payloadJson) return null;
      const payload = JSON.parse(payloadJson);
      const candidate =
        payload.employeeId ||
        payload.employee_id ||
        payload.empId ||
        payload.emp_id ||
        payload.userId ||
        payload.user_id ||
        payload.id;
      if (!candidate) return null;
      return String(candidate);
    } catch {
      return null;
    }
  };

  const resolveUserId = (): string | null => {
    const fromToken = resolveUserIdFromToken();
    if (fromToken) return fromToken;
    // Fall back to UserContext (avoids direct localStorage access)
    return contextUser?.id ?? null;
  };

  // Fetch leave types on component mount
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        setLoadingLeaveTypes(true);
        const response = await leaveApi.getLeaveTypes({ page: 1, limit: 100 });
        // Create a map of leaveTypeId to leaveType name
        const leaveTypesMap: Record<string, string> = {};
        if (response.items && Array.isArray(response.items)) {
          response.items.forEach((leaveType: LeaveType) => {
            if (leaveType.id && leaveType.name) {
              leaveTypesMap[leaveType.id] = leaveType.name;
            }
          });
        }
        setLeaveTypes(leaveTypesMap);
      } catch {
        // Don't set error state, just log it - leave types are not critical
      } finally {
        setLoadingLeaveTypes(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let targetUserId = null;

        if (employeeId) {
          // Check if userId was passed in state first (e.g. from search)
          if (stateUserId) {
            targetUserId = stateUserId;
          } else {
            try {
              const employee = await employeeApi.getEmployeeById(employeeId);
              if (employee && employee.user_id) {
                targetUserId = employee.user_id;
              } else {
                throw new Error('Employee record found but missing User ID');
              }
            } catch (err) {
              console.error('Failed to resolve employee to user', err);
              setError('Failed to find employee details.');
              setIsLoading(false);
              return;
            }
          }
        } else {
          // Only fallback to self if no ID provided in URL
          targetUserId = resolveUserId();
        }

        if (!targetUserId) {
          setError(
            'Unable to resolve user id from token or parameter. Please re-login.'
          );
          setIsLoading(false);
          return;
        }
        const res = await employeeApi.getEmployeeProfile(targetUserId);
        setProfile(res);
      } catch (e: unknown) {
        if (
          e &&
          typeof e === 'object' &&
          'response' in e &&
          (e as { response: { status: number } }).response.status === 404
        ) {
          setError('Profile not found.');
        } else {
          setError((e as Error)?.message || 'Failed to load profile');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const formatTime = (iso: string | null) => {
    if (!iso) return '--:--';
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? String(iso)
      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <Box py={3} display='flex' justifyContent='center'>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box py={3}>
        <Alert severity='error'>{error}</Alert>
      </Box>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <Box py={2}>
      <Paper
        elevation={1}
        sx={{
          borderRadius: 1,
          p: 3,
          bgcolor: 'background.paper',
          mb: 4,
          boxShadow: 'none',
        }}
      >
        <Typography
          variant='h5'
          fontWeight={600}
          gutterBottom
          sx={{ color: 'var(--primary-dark-color)' }}
        >
          Employee Details
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 3,
          }}
        >
          <UserAvatar
            user={{
              id: profile.id,
              first_name: profile.name.split(' ')[0] || '',
              last_name: profile.name.split(' ').slice(1).join(' ') || '',
              profile_pic: profile.profile_pic,
            }}
            size={80}
            sx={{ mr: { xs: 0, sm: 2 }, mb: { xs: 2, sm: 0 } }}
          />
          <Box>
            <Typography variant='h6' fontWeight={600}>
              {profile.name}
            </Typography>
            <Chip
              label={profile.designation || '—'}
              icon={<Work />}
              sx={{
                mr: 1,
                mb: 1,
                backgroundColor: 'var(--primary-dark-color)',
                color: 'common.white',
                '& .MuiChip-icon': { color: 'common.white' },
              }}
            />
            <Chip
              label={profile.department || '—'}
              icon={<Business />}
              sx={{
                mb: 1,
                backgroundColor: 'var(--primary-dark-color)',
                color: 'common.white',
                '& .MuiChip-icon': { color: 'common.white' },
              }}
            />
            <Typography variant='body2' color='text.secondary' mt={1}>
              <Email
                sx={{
                  fontSize: 16,
                  mr: 0.5,
                  color: 'var(--primary-dark-color)',
                }}
              />{' '}
              {profile.email}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              <CalendarToday
                sx={{
                  fontSize: 16,
                  mr: 0.5,
                  color: 'var(--primary-dark-color)',
                }}
              />{' '}
              Joined: {new Date(profile.joinedAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Recent Attendance Table */}
      <Paper
        elevation={1}
        sx={{
          borderRadius: 1,
          p: 3,
          bgcolor: 'background.paper',
          mb: 4,
          boxShadow: 'none',
        }}
      >
        <Typography
          variant='h6'
          fontWeight={600}
          gutterBottom
          sx={{ color: 'var(--primary-dark-color)' }}
        >
          Recent Attendance
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <AppTable sx={{ minWidth: 350 }}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Check In</TableCell>
              <TableCell>Check Out</TableCell>
              <TableCell>Worked Hours</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(profile.attendanceSummary || [])
              .slice(0, 5)
              .map(
                (log: EmployeeProfileAttendanceSummaryItem, index: number) => (
                  <TableRow
                    key={index}
                    sx={{
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    <TableCell>{formatDate(log.date)}</TableCell>
                    <TableCell>{formatTime(log.checkIn)}</TableCell>
                    <TableCell>{formatTime(log.checkOut)}</TableCell>
                    <TableCell>{log.workedHours ?? 0}h</TableCell>
                  </TableRow>
                )
              )}
          </TableBody>
        </AppTable>
      </Paper>

      {/* Leave History Table */}
      <Paper
        elevation={1}
        sx={{
          borderRadius: 1,
          p: 3,
          bgcolor: 'background.paper',
          boxShadow: 'none',
        }}
      >
        <Typography
          variant='h6'
          fontWeight={600}
          gutterBottom
          sx={{ color: 'var(--primary-dark-color)' }}
        >
          Leave History
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <AppTable sx={{ minWidth: 350 }}>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(profile.leaveHistory || [])
              .slice(0, 5)
              .map((lv: EmployeeProfileLeaveHistoryItem, idx: number) => {
                // Check if lv.type is an ID (UUID format) or already a name
                // UUID format: contains hyphens and is 36 characters long
                const isUUID =
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                    lv.type
                  );
                const leaveTypeName =
                  isUUID && leaveTypes[lv.type] ? leaveTypes[lv.type] : lv.type; // If not UUID or name not found, show original value

                return (
                  <TableRow
                    key={idx}
                    sx={{
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    <TableCell>
                      {loadingLeaveTypes && isUUID ? (
                        <CircularProgress size={16} />
                      ) : leaveTypeName ? (
                        leaveTypeName.charAt(0).toUpperCase() +
                        leaveTypeName.slice(1)
                      ) : (
                        ''
                      )}
                    </TableCell>
                    <TableCell>{formatDate(lv.fromDate)}</TableCell>
                    <TableCell>{formatDate(lv.toDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={lv.status}
                        sx={{
                          bgcolor:
                            lv.status === 'approved'
                              ? 'success.main'
                              : lv.status === 'Pending'
                                ? 'primary.dark'
                                : 'error.main',
                          color: 'common.white',
                          fontWeight: 600,
                        }}
                        size='small'
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </AppTable>
      </Paper>
    </Box>
  );
};

export default EmployeeProfileView;
