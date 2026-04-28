import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { formatDate } from '../../utils/dateUtils';
import AppTable from '../common/AppTable';
import type { TeamAttendanceEntry } from '../../api/attendanceApi';

export interface CheckInTeamMember {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  profile_pic?: string;
  designation?: string;
  department?: string;
  attendance: TeamAttendanceEntry[];
  totalDaysWorked?: number;
  totalHoursWorked?: number;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface TeamCheckInDialogProps {
  open: boolean;
  onClose: () => void;
  data: CheckInTeamMember[];
}

const TeamCheckInDialog: React.FC<TeamCheckInDialogProps> = ({
  open,
  onClose,
  data,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          padding: '16px',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '24px',
            lineHeight: '32px',
            color: '#2C2C2C',
            padding: 0,
          }}
        >
          Team Check In
        </DialogTitle>
        <IconButton onClick={onClose} aria-label='close'>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ padding: '0 24px 24px 24px' }}>
        <AppTable>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align='center'>
                  No check-in records found.
                </TableCell>
              </TableRow>
            ) : (
              data.flatMap(member => {
                const attendanceList = member.attendance || [];
                if (attendanceList.length > 0) {
                  return attendanceList.map((attendance, index) => (
                    <TableRow key={`${member.user_id}-${index}`}>
                      <TableCell>
                        {member.first_name} {member.last_name}
                      </TableCell>
                      <TableCell>
                        {attendance.date ? formatDate(attendance.date) : '--'}
                      </TableCell>
                      <TableCell>
                        {attendance.checkIn
                          ? new Date(attendance.checkIn).toLocaleTimeString()
                          : '--'}
                      </TableCell>
                      <TableCell>
                        <IconButton size='small'>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ));
                }
                return (
                  <TableRow key={member.user_id}>
                    <TableCell>
                      {member.first_name} {member.last_name}
                    </TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>
                      <IconButton size='small'>
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </AppTable>
      </DialogContent>
    </Dialog>
  );
};

export default TeamCheckInDialog;
