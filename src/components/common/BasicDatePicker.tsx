import React from 'react';
import DatePicker from 'react-multi-date-picker';
import { Box, Typography, useTheme } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import 'react-multi-date-picker/styles/layouts/mobile.css';
import 'react-multi-date-picker/styles/colors/teal.css';
import '../Attendance/AttendanceTable.css';

export interface BasicDatePickerProps {
  label: string;
  value: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  labelClassName?: string;
}

const BasicDatePicker: React.FC<BasicDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  helperText,
  labelClassName = 'subheading2',
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'nowrap',
        }}
      >
        <Typography
          component='label'
          className={labelClassName}
          sx={{
            // fontWeight: { xs: 400, lg: 500 },
            // fontSize: { xs: '14px', lg: '20px' },
            lineHeight: 'var(--subheading2-line-height)',
            letterSpacing: 'var(--subheading2-letter-spacing)',
            color: theme.palette.text.primary,
          }}
        >
          {label}
          {/* {required && <span style={{ color: theme.palette.error.main }}> *</span>} */}
        </Typography>
        {helperText && (
          <Typography
            sx={{
              fontSize: { xs: '12px', sm: '14px' },
              lineHeight: 1.2,
              color: error
                ? theme.palette.error.main
                : theme.palette.text.secondary,
              fontWeight: 400,
              textAlign: 'right',
              ml: 2,
            }}
          >
            {helperText}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          position: 'relative',
          borderRadius: '12px',
          border: {
            xs: `0.5px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
            sm: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
          },
          backgroundColor:
            theme.palette.mode === 'dark'
              ? theme.palette.background.default
              : '#ffffff',
          overflow: 'visible',
          '&:hover': {
            borderColor: error
              ? theme.palette.error.main
              : theme.palette.text.primary,
          },
        }}
      >
        <DatePicker
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          containerStyle={{ width: '100%' }}
          render={(value, openCalendar) => (
            <Box
              onClick={openCalendar}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                height: { xs: 40, sm: 44 },
                padding: { xs: '8px 12px', sm: '10px 16px' },
                cursor: 'pointer',
              }}
            >
              <Typography
                sx={{
                  color: value
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                  fontSize: { xs: '16px', sm: '14px' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {value || placeholder}
              </Typography>
              <CalendarTodayIcon
                sx={{
                  fontSize: { xs: '18px', sm: '20px' },
                  color: theme.palette.text.secondary,
                  ml: 1,
                }}
              />
            </Box>
          )}
        />
      </Box>
    </Box>
  );
};

export default BasicDatePicker;
