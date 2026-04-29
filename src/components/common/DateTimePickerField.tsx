import React from 'react';
import { useTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

/** Value format: "YYYY-MM-DDTHH:mm" or empty string */
function toDatetimeLocal(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface DateTimePickerFieldProps {
  /** Value in YYYY-MM-DDTHH:mm format or empty string */
  value: string;
  /** Called with YYYY-MM-DDTHH:mm or '' */
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  value,
  onChange,
  label = 'Schedule at',
  required = false,
  error = false,
  helperText,
}) => {
  const theme = useTheme();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DateTimePicker
        label={label}
        value={value && value.trim() ? new Date(value.trim()) : null}
        onChange={val => {
          if (val instanceof Date && !Number.isNaN(val.getTime())) {
            onChange(toDatetimeLocal(val.toISOString()));
          } else {
            onChange('');
          }
        }}
        slotProps={{
          textField: {
            required,
            error,
            helperText,
            fullWidth: true,
            sx: {
              '& .MuiOutlinedInput-root': {
                backgroundColor:
                  theme.palette.mode === 'dark'
                    ? theme.palette.background.default
                    : '#F8F8F8',
              },
              '& .MuiSvgIcon-root': {
                color: theme.palette.text.primary,
              },
              '& .MuiInputAdornment-root svg': {
                color: theme.palette.text.primary,
              },
            },
          },
          desktopPaper: {
            sx: { backgroundColor: '#FFFFFF' },
          },
          popper: {
            sx: { '& .MuiPaper-root': { borderRadius: '12px' } },
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default DateTimePickerField;
