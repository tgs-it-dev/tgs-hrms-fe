import React from 'react';
import { useTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export interface MonthPickerProps {
  /** Value in YYYY-MM format or empty string */
  value: string;
  /** Called with YYYY-MM or '' when cleared */
  onChange: (value: string) => void;
  label?: string;
}

const MonthPicker: React.FC<MonthPickerProps> = ({
  value,
  onChange,
  label = 'Month',
}) => {
  const theme = useTheme();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker
        label={label}
        views={['year', 'month']}
        openTo='month'
        value={
          value && /^\d{4}-\d{2}$/.test(value) ? new Date(value + '-01') : null
        }
        onChange={val => {
          if (val instanceof Date) {
            const y = val.getFullYear();
            const m = String(val.getMonth() + 1).padStart(2, '0');
            onChange(`${y}-${m}`);
          } else {
            onChange('');
          }
        }}
        slotProps={{
          textField: {
            size: 'small',
            sx: {
              width: { xs: '100%', sm: 220 },
              bgcolor: 'background.paper',
              borderRadius: 1,
              '& .MuiInputBase-input': { padding: '10px 14px' },
              '& .MuiSvgIcon-root': { color: theme.palette.text.primary },
              '& .MuiInputAdornment-root svg': {
                color: theme.palette.text.primary,
              },
            },
          },
          actionBar: {
            actions: ['clear'],
          },
          desktopPaper: {
            sx: {
              backgroundColor: 'background.paper',
              maxHeight: 320,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              '& .MuiPickersLayout-root': {
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
                overflow: 'hidden',
              },
              '& .MuiPickersLayout-contentWrapper': {
                flex: '1 1 auto',
                minHeight: 0,
                overflow: 'auto',
              },
              '& .MuiPickersActionBar-root': {
                flexShrink: 0,
                borderTop: '1px solid',
                borderColor: 'divider',
              },
              '& .MuiMonthCalendar-root': { maxHeight: 260 },
              '& .MuiPickersMonth-monthButton': {
                padding: '8px 16px',
                fontSize: '0.875rem',
              },
            },
          },
          popper: {
            sx: {
              '& .MuiPaper-root': {
                borderRadius: '12px',
                maxHeight: 320,
                overflow: 'hidden',
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default MonthPicker;
