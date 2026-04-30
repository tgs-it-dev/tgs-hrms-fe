import React, { useState } from 'react';
import { Box, Tooltip } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { isSameDay } from 'date-fns';
import type { Holiday } from '../../types/holiday';

interface HolidayCalendarViewProps {
  holidays: Holiday[];
}

const HolidayCalendarView: React.FC<HolidayCalendarViewProps> = ({
  holidays,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  return (
    <Box>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <StaticDatePicker
          value={selectedDate}
          onChange={newDate => setSelectedDate(newDate)}
          displayStaticWrapperAs='desktop'
          slotProps={{
            day: ({ day }) => {
              const holiday = holidays.find(h =>
                isSameDay(new Date(h.date), day)
              );
              return {
                sx: holiday
                  ? {
                      backgroundColor: 'primary.main',
                      color: 'common.white',
                      borderRadius: '50%',
                      '&:hover': { backgroundColor: 'primary.dark' },
                    }
                  : undefined,
                children: holiday ? (
                  <Tooltip title={holiday.title}>
                    <span>{day.getDate()}</span>
                  </Tooltip>
                ) : (
                  <span>{day.getDate()}</span>
                ),
              };
            },
          }}
        />
      </LocalizationProvider>

      {/* Separate Upcoming Holidays Component */}
      {/* <UpcomingHolidayList holidays={holidays} /> */}
    </Box>
  );
};

export default HolidayCalendarView;
