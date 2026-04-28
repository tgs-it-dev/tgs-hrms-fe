import React, { useRef } from 'react';
import {
  TextField,
  Typography,
  Box,
  useTheme,
  InputAdornment,
  IconButton,
  type TextFieldProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface AppInputFieldProps extends Omit<TextFieldProps, 'label'> {
  label: string;
  labelClassName?: string;
  containerSx?: SxProps<Theme>;
  inputBackgroundColor?: string;
  hideErrorsOnSmallScreen?: boolean;
}

const AppInputField = React.forwardRef<HTMLDivElement, AppInputFieldProps>(
  (
    {
      label,
      labelClassName = 'label',
      containerSx,
      sx,
      inputBackgroundColor,
      hideErrorsOnSmallScreen = false,
      ...rest
    },
    ref
  ) => {
    const theme = useTheme();
    const inputRef = useRef<HTMLInputElement | null>(null);
    // Check if this is a phone input (has PhoneInput in InputProps)
    const isPhoneInput = rest.InputProps?.startAdornment !== undefined;
    const isDateInput = String(rest.type) === 'date';
    const isFirefox = typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);

    const handleAdornmentClick = (e: React.MouseEvent) => {
      e.preventDefault();
      // Focus the underlying input and try to open native picker where supported
      const el = inputRef.current as HTMLInputElement | null;
      if (!el) return;
      try {
        // Some browsers support showPicker()
        const maybePicker = (el as unknown as { showPicker?: () => void })
          .showPicker;
        if (typeof maybePicker === 'function') {
          maybePicker.call(el);
          return;
        }
      } catch {
        // ignore
      }
      el.focus();
      // fallback: dispatch click
      try {
        el.click();
      } catch {
        /* ignore */
      }
    };

    return (
      <Box
        sx={{
          ...containerSx,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'nowrap',
            // gap: 1,
          }}
        >
          <Typography
            component='label'
            htmlFor={rest.id || (rest.name ? `input-${rest.name}` : undefined)}
            className={labelClassName}
            sx={{
              fontWeight: { xs: 400, lg: 500 },
              fontSize: { xs: '14px', lg: '20px' },
              lineHeight: 'var(--subheading2-line-height)',
              letterSpacing: 'var(--subheading2-letter-spacing)',
              color: theme.palette.text.primary,
            }}
          >
            {label}
          </Typography>
          {rest.helperText && (
            <Typography
              title={String(rest.helperText)}
              sx={{
                display: hideErrorsOnSmallScreen
                  ? { xs: 'none', sm: 'block' }
                  : 'block',
                fontSize: { xs: '12px', sm: '14px' },
                lineHeight: '1.2',
                color: rest.error
                  ? theme.palette.error.main
                  : theme.palette.text.secondary,
                fontWeight: 400,
                textAlign: 'right',
                ml: 2,
                whiteSpace: 'nowrap',
                overflow: 'visible',
                textOverflow: 'clip',
              }}
            >
              {rest.helperText}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            position: 'relative',
            borderRadius: '12px',
            border: {
              xs: `0.5px solid ${rest.error ? theme.palette.error.main : theme.palette.divider}`,
              sm: `1px solid ${rest.error ? theme.palette.error.main : theme.palette.divider}`,
            },
            backgroundColor: inputBackgroundColor,
            overflow: 'visible',
          }}
        >
          <TextField
            ref={ref}
            {...rest}
            fullWidth
            id={rest.id || (rest.name ? `input-${rest.name}` : undefined)}
            variant='outlined'
            inputProps={{ maxLength: 50, ...(rest.inputProps || {}) }}
            InputProps={
              // If caller provided InputProps, keep them and merge
              isDateInput
                ? {
                  ...rest.InputProps,
                  endAdornment:
                    rest.InputProps && rest.InputProps.endAdornment ? (
                      rest.InputProps.endAdornment
                    ) : (
                      !isFirefox ? (
                        <InputAdornment position='end'>
                          <IconButton
                            size='small'
                            onClick={handleAdornmentClick}
                            aria-label='open date picker'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            <CalendarTodayIcon fontSize='small' />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    ),
                }
                : rest.InputProps
            }
            inputRef={inputRef}
            helperText={undefined}
            onChange={e => {
              // Normalize the change event into a simple value passed to callers.
              const native = e as React.ChangeEvent<HTMLInputElement>;
              const raw = native.target.value;
              let out: string | number = raw;
              if (String(rest.type) === 'number') {
                if (raw === '') out = '';
                else {
                  const parsed = Number(raw);
                  out = Number.isNaN(parsed) ? raw : parsed;
                }
              }
              // Call the provided onChange handler with the normalized value
              // If caller expects the native event, they can wrap it accordingly.
              if (typeof rest.onChange === 'function') {
                try {
                  (
                    rest.onChange as unknown as (v: string | number) => void
                  )(out);
                } catch {
                  // fallback: call with native event
                  (
                    rest.onChange as unknown as (
                      e: React.ChangeEvent<HTMLInputElement>
                    ) => void
                  )(native);
                }
              }
            }}
            sx={{
              position: isPhoneInput ? 'relative' : 'static',
              '& input[type="date"]': {
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
                appearance: 'textfield',
              },
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                display: 'none',
                WebkitAppearance: 'none',
              },
              '& input[type="date"]::-webkit-inner-spin-button': {
                display: 'none',
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                height: rest.multiline ? 'auto' : { xs: 40, sm: 44 },
                minHeight: rest.multiline ? 'auto' : { xs: 40, sm: 44 },
                padding: isPhoneInput ? '0px' : undefined,
                backgroundColor: 'transparent',
                '& fieldset': {
                  border: 'none',
                  display: 'none',
                },
              },
              '& .MuiOutlinedInput-input': {
                color: theme.palette.text.primary,
                fontSize: { xs: '16px', sm: '14px' },
                display: isPhoneInput ? 'none' : undefined,
                padding: rest.multiline
                  ? undefined
                  : { xs: '8px 12px', sm: '10px 16px' },
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 1,
                },
              },
              '& .MuiOutlinedInput-input:-webkit-autofill': {
                padding: rest.multiline ? undefined : '10px 16px !important',
                WebkitBoxShadow: `0 0 0 1000px ${inputBackgroundColor || (theme.palette.mode === 'dark' ? theme.palette.background.default : '#EFEFEF')} inset`,
                WebkitTextFillColor: theme.palette.text.primary,
              },
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiFormHelperText-root': {
                display: 'none',
              },
              '& .MuiInputAdornment-root': isPhoneInput
                ? {
                  width: '100%',
                  margin: 0,
                }
                : {},
              '& .MuiInputAdornment-positionStart': isPhoneInput
                ? {
                  marginRight: 0,
                }
                : {},
              ...sx,
            }}
          />
        </Box>
      </Box>
    );
  }
);

AppInputField.displayName = 'AppInputField';

export default AppInputField;
