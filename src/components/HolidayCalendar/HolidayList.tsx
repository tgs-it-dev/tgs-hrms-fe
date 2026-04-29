import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import HolidayTable from './HolidayTable';
import AddHolidayDialog from './AddHolidayDialog';
import HolidayCalendarView from './HolidayCalendarView';
import UpcomingHolidayList from './UpcomingHolidayList';
import AppButton from '../common/AppButton';

export interface Holiday {
  id: string;
  date: string;
  title: string;
  description: string;
}

const HolidayList: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([
    {
      id: '1',
      date: '2025-08-14',
      title: 'Independence Day',
      description: 'National holiday in Pakistan',
    },
    {
      id: '2',
      date: '2025-09-06',
      title: 'Defence Day',
      description: "Commemoration of Pakistan's armed forces",
    },
  ]);

  const [open, setOpen] = useState(false);
  const { darkMode: _darkMode } = useOutletContext<{ darkMode: boolean }>();

  const handleAddHoliday = (newHoliday: Holiday) => {
    setHolidays(prev => [...prev, newHoliday]);
    setOpen(false);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant='h5' sx={{ color: 'text.primary' }}>
          Holiday List
        </Typography>
        <AppButton
          variant='contained'
          text='Add Holiday'
          onClick={() => setOpen(true)}
          sx={{ backgroundColor: 'primary.main' }}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: { xs: 'center', sm: 'start' },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: 2,
        }}
      >
        <Box width={{ xs: '100%', overflowX: 'auto' }}>
          <HolidayTable holidays={holidays} />
          <AddHolidayDialog
            open={open}
            onClose={() => setOpen(false)}
            onAdd={handleAddHoliday}
          />
        </Box>
        <Box>
          <HolidayCalendarView holidays={holidays} />
        </Box>
      </Box>
      <Box width={{ xs: '100%' }}>
        <UpcomingHolidayList holidays={holidays} />
      </Box>
    </Box>
  );
};

export default HolidayList;
