import React from 'react';
import DatePicker from 'react-multi-date-picker';
import type { DateObject } from 'react-multi-date-picker';
import { Box, Typography, useTheme } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import 'react-multi-date-picker/styles/layouts/mobile.css';
import 'react-multi-date-picker/styles/colors/teal.css';

export interface BasicDatePickerProps {
  label: string;
  value: DateObject | null; // Change to DateObject
  onChange: (date: DateObject | null) => void; // Change to DateObject
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  labelClassName?: string;
}

const BasicDatePicker: React.FC<BasicDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  helperText,
  labelClassName = '',
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
            fontWeight: 500,
            fontSize: {
              xs: 'var(--body-font-size)',
              sm: 'var(--subheading2-font-size)',
            },
            lineHeight: {
              xs: 'var(--body-line-height)',
              sm: 'var(--subheading2-line-height)',
            },
            color: theme.palette.text.primary,
          }}
        >
          {label}
        </Typography>
        {helperText && (
          <Typography
            sx={{
              fontSize: {
                xs: 'var(--label-font-size)',
                sm: 'var(--body-font-size)',
              },
              lineHeight: 1.2,
              color: error
                ? theme.palette.error.main
                : theme.palette.text.secondary,
              fontWeight: 'var(--subheading1-font-weight)',
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
          borderRadius: 'var(--border-radius-xl)',
          border: {
            xs: `0.5px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
            sm: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
          },
          backgroundColor: theme.palette.background.default,
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
                  fontSize: {
                    xs: 'var(--label-font-size)',
                    sm: 'var(--body-font-size)',
                  },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {value || placeholder}
              </Typography>
              <CalendarTodayIcon
                sx={{
                  fontSize: {
                    xs: 'var(--label-font-size)',
                    sm: 'var(--body-font-size)',
                  },
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
