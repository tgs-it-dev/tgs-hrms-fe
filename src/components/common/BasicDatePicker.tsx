import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Box, Typography, useTheme, type Theme } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';

export interface BasicDatePickerProps {
  label: string;
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  labelClassName?: string;
  disabledPastDates?: boolean;
}

// Extract field as a named component to avoid re-mounting on every render
const CustomDatePickerField = React.memo(
  ({
    value,
    placeholder,
    onClick,
    theme,
  }: {
    value: Dayjs | null;
    placeholder: string;
    onClick: () => void;
    theme: Theme;
  }) => (
    <Box
      onClick={onClick}
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
        {value ? value.format('DD/MM/YYYY') : placeholder}
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
  )
);

CustomDatePickerField.displayName = 'CustomDatePickerField';

const BasicDatePicker: React.FC<BasicDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  helperText,
  labelClassName = '',
  disabledPastDates = false,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const handleChange = useCallback(
    (newValue: Dayjs | null) => {
      onChange(newValue);
      setOpen(false);
    },
    [onChange]
  );

  const fieldSlotProps = useMemo(
    () => ({
      value,
      placeholder,
      onClick: handleOpen,
      theme,
    }),
    [value, placeholder, handleOpen, theme]
  );

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
        ref={anchorRef}
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
              : theme.palette.primary.main,
          },
        }}
      >
        <DatePicker
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          value={value}
          disablePast={disabledPastDates}
          onChange={handleChange}
          slots={{
            field: CustomDatePickerField,
          }}
          slotProps={{
            field: fieldSlotProps,
            popper: {
              anchorEl: () => anchorRef.current ?? document.body,
              placement: 'bottom-start',
              sx: {
                '& .MuiPaper-root': {
                  borderRadius: 'var(--border-radius-xl)',
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: 'var(--box-shadow-md)',
                },
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default BasicDatePicker;
