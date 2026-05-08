import React, { useState } from 'react';
import { Box, IconButton, Typography, Paper, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(advancedFormat);

interface DateNavigationProps {
  currentDate: string; // YYYY-MM-DD format or 'all' for showing all records
  onDateChange: (newDate: string) => void;
  disabled?: boolean;
}

const WINDOW_SIZE = 5;
const HALF = Math.floor(WINDOW_SIZE / 2);

const DateNavigation: React.FC<DateNavigationProps> = ({
  currentDate,
  onDateChange,
  disabled = false,
}) => {
  // State to track the center date of the sequence
  const [sequenceCenter, setSequenceCenter] = useState<Date>(new Date());
  const theme = useTheme();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizeDate = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const getDateSequence = () => {
    return Array.from({ length: WINDOW_SIZE }, (_, i) => {
      const d = new Date(sequenceCenter);
      d.setDate(sequenceCenter.getDate() + (i - HALF));
      return d;
    });
  };

  const formatDate = (date: Date) => {
    return dayjs(date).format('Do MMM');
  };

  const formatDateToString = (date: Date) => {
    return dayjs(date).format('YYYY-MM-DD');
  };

  const handlePrevious = () => {
    const newCenter = new Date(sequenceCenter);
    newCenter.setDate(newCenter.getDate() - 1);
    setSequenceCenter(newCenter);
    // Do not change the selected date — only scroll the visible window
  };

  const handleNext = () => {
    const candidate = new Date(sequenceCenter);
    candidate.setDate(candidate.getDate() + 1);

    const rightEdge = new Date(candidate);
    rightEdge.setDate(candidate.getDate() + HALF);

    if (normalizeDate(rightEdge) > today) return;

    setSequenceCenter(candidate);
    // Do not change the selected date — only scroll the visible window
  };

  // click selects + recenters
  const handleDateClick = (date: Date) => {
    setSequenceCenter(new Date(date));
    onDateChange(formatDateToString(date));
  };

  const dateSequence = getDateSequence();
  const todayStr = formatDateToString(new Date());

  const rightEdge = new Date(dateSequence[dateSequence.length - 1]);
  rightEdge.setHours(0, 0, 0, 0);

  const isNextDisabled = rightEdge >= today;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 3,
        justifyContent: 'center',
        mt: 3,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Previous Button */}
      <IconButton
        onClick={handlePrevious}
        disabled={disabled}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          width: 40,
          height: 40,
          color: theme.palette.text.primary,
        }}
      >
        <ChevronLeft />
      </IconButton>

      {/* Date Sequence */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {dateSequence.map(date => {
          const dateStr = formatDateToString(date);
          const isToday = dateStr === todayStr;
          const isSelected = currentDate !== 'all' && dateStr === currentDate;

          return (
            <Paper
              key={dateStr}
              onClick={() => handleDateClick(date)}
              sx={{
                p: 1,
                minWidth: { lg: 56, xs: 83 },
                textAlign: 'center',
                cursor: 'pointer',
                border: isSelected ? '2px solid' : '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                backgroundColor: isSelected
                  ? 'primary.50'
                  : isToday
                    ? 'action.hover'
                    : 'background.paper',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: isSelected ? 'primary.100' : 'action.hover',
                  transform: 'translateY(-1px)',
                  boxShadow: 2,
                },
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Typography
                variant='body2'
                sx={{
                  fontWeight: isSelected ? 600 : isToday ? 500 : 400,
                  color: isSelected
                    ? 'primary.main'
                    : isToday
                      ? 'primary.dark'
                      : 'text.primary',
                  fontSize: '0.875rem',
                }}
              >
                {formatDate(date)}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {/* Next Button */}
      <IconButton
        onClick={handleNext}
        disabled={disabled || isNextDisabled}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          width: 40,
          height: 40,
          color: theme.palette.text.primary,
        }}
      >
        <ChevronRight />
      </IconButton>
    </Box>
  );
};

export default DateNavigation;
