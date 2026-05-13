import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import attendanceApi from '../../api/attendanceApi';
import AppPageTitle from '../common/AppPageTitle';
import AppTable from '../common/AppTable';
import { formatDate } from '../../utils/dateUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppButton from '../common/AppButton';

interface TeamMemberAttendance {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_pic?: string;
  designation?: string;
  department?: string;
  attendance: {
    date: string;
    checkIn: string;
    checkInId: string;
    checkOut: string | null;
    checkOutId: string | null;
    workedHours: number;
    approvalStatus: string;
    approvalRemarks: string | null;
    approvedBy: string | null;
    approvedAt: string | null;
  }[];
  totalDaysWorked: number;
  totalHoursWorked: number;
}

export interface TeamCheckInViewProps {
  onBack: () => void;
}

const TeamCheckInView: React.FC<TeamCheckInViewProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [teamData, setTeamData] = useState<TeamMemberAttendance[]>([]);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCheckInId, setSelectedCheckInId] = useState<string | null>(
    null
  );

  const fetchTodayAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const response = await attendanceApi.getTodayTeamAttendance();
      setTeamData(response.items || []);
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchTodayAttendance();
  }, [fetchTodayAttendance]);

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    checkInId: string
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedCheckInId(checkInId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCheckInId(null);
  };

  const handleApprove = async () => {
    if (!selectedCheckInId) return;

    handleMenuClose();
    try {
      await attendanceApi.approveCheckIn(selectedCheckInId);
      showSuccess('Check-in approved successfully');
      fetchTodayAttendance(); // Refresh data
    } catch (error) {
      showError(error);
    }
  };

  const handleDisapprove = async () => {
    if (!selectedCheckInId) return;

    handleMenuClose();
    try {
      await attendanceApi.disapproveCheckIn(selectedCheckInId);
      showSuccess('Check-in disapproved successfully');
      fetchTodayAttendance(); // Refresh data
    } catch (error) {
      showError(error);
    }
  };

  const handleApproveAll = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.approveAllCheckIns();
      showSuccess(`Approved ${res?.updated ?? 0} check-ins`);
      await fetchTodayAttendance();
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisapproveAll = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.disapproveAllCheckIns();
      showSuccess(`Disapproved ${res?.updated ?? 0} check-ins`);
      await fetchTodayAttendance();
    } catch (error) {
      showError(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter to only show members who have checked in
  const checkedInMembers = teamData.filter(
    member => member.attendance && member.attendance.length > 0
  );
  const hasPending = checkedInMembers.some(m =>
    m.attendance.some(
      a => !['approved', 'rejected', 'disapproved'].includes(a.approvalStatus)
    )
  );

  return (
    <Paper sx={{ background: 'unset !important', boxShadow: 'none' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={onBack}>
          <ArrowBackIcon />
        </IconButton>
        <AppPageTitle title='Team Check In' />
      </Box>

      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: { xs: 'center', sm: 'flex-end' },
          gap: 1,
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
        }}
      >
        <Tooltip title="Approve all today's pending check-ins">
          <span>
            <AppButton
              variantType='primary'
              onClick={handleApproveAll}
              disabled={loading || !hasPending}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: '100%', sm: 160 },
              }}
            >
              Approve All
            </AppButton>
          </span>
        </Tooltip>
        <Tooltip title="Disapprove all today's pending check-ins">
          <span>
            <AppButton
              variantType='danger'
              onClick={handleDisapproveAll}
              disabled={loading || !hasPending}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { xs: '100%', sm: 160 },
              }}
            >
              Disapprove All
            </AppButton>
          </span>
        </Tooltip>
      </Box>

      <AppTable>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Worked Hours</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align='center'>
                <CircularProgress />
              </TableCell>
            </TableRow>
          ) : teamData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align='center'>
                No team members found.
              </TableCell>
            </TableRow>
          ) : (
            teamData.map(member => {
              const attendanceList =
                member.attendance && member.attendance.length > 0
                  ? member.attendance
                  : [];

              if (attendanceList.length > 0) {
                return attendanceList.map((att, index) => (
                  <TableRow key={`${member.user_id}-${index}`}>
                    <TableCell>
                      {member.first_name} {member.last_name}
                    </TableCell>
                    <TableCell>
                      {att.date ? formatDate(att.date) : '--'}
                    </TableCell>
                    <TableCell>
                      {att.checkIn
                        ? new Date(att.checkIn).toLocaleTimeString()
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {att.checkOut
                        ? new Date(att.checkOut).toLocaleTimeString()
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {att.workedHours
                        ? `${att.workedHours.toFixed(2)} hrs`
                        : '--'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={
                            att.approvalStatus === 'approved'
                              ? 'Approved'
                              : att.approvalStatus === 'rejected'
                                ? 'Rejected'
                                : att.approvalStatus === 'disapproved'
                                  ? 'Disapproved'
                                  : 'Pending'
                          }
                          color={
                            att.approvalStatus === 'approved'
                              ? 'success'
                              : att.approvalStatus === 'rejected'
                                ? 'error'
                                : att.approvalStatus === 'disapproved'
                                  ? 'error'
                                  : 'warning'
                          }
                          size='small'
                          variant='filled'
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size='small'
                        onClick={e => handleMenuClick(e, att.checkInId)}
                        disabled={[
                          'approved',
                          'rejected',
                          'disapproved',
                        ].includes(att.approvalStatus)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ));
              } else {
                // Render one row for member with no attendance
                return (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      {member.first_name} {member.last_name}
                    </TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>
                      <Chip
                        label='Absent'
                        color='default'
                        size='small'
                        variant='filled'
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size='small' disabled>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              }
            })
          )}
        </TableBody>
      </AppTable>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleApprove}>
          <ListItemIcon>
            <CheckCircleOutlineIcon fontSize='small' color='success' />
          </ListItemIcon>
          <ListItemText>Approve</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDisapprove}>
          <ListItemIcon>
            <HighlightOffIcon fontSize='small' color='error' />
          </ListItemIcon>
          <ListItemText>Disapprove</ListItemText>
        </MenuItem>
      </Menu>

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Paper>
  );
};

export default TeamCheckInView;
