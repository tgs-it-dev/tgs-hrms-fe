import React from 'react';
import { Box, Paper, Typography, IconButton, useTheme } from '@mui/material';
import SheetList from './SheetList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const TimesheetLayout: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  return (
    <Box>
      {/* Back Arrow */}
      <IconButton
        sx={{ p: 0, mb: 2, color: theme.palette.text.primary }}
        onClick={() => navigate('/dashboard/attendance-check')}
      >
        <ArrowBackIcon />
      </IconButton>
      <Box display='flex' flexDirection='column' gap={2}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography
            variant='h5'
            component='h1'
            sx={{ color: theme.palette.text.primary }}
          >
            My Timesheet
          </Typography>
        </Box>
        <Paper
          sx={{
            flex: 1,
            width: '100%',
            overflow: 'auto',
            boxShadow: 'none',
            borderRadius: 0,
            bgcolor: 'unset',
          }}
        >
          <SheetList />
        </Paper>
      </Box>
    </Box>
  );
};

export default TimesheetLayout;
