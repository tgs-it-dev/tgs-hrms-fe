import React from 'react';
import {
  TextField,
  Typography,
  Box,
  useTheme,
  type TextFieldProps,
  type SxProps,
  type Theme,
} from '@mui/material';

export interface AppTextareaProps extends Omit<
  TextFieldProps,
  'label' | 'multiline'
> {
  label: string;
  labelClassName?: string;
  containerSx?: SxProps<Theme>;
  inputBackgroundColor?: string;
  /** When true, helperText is rendered below the textarea instead of next to the label */
  helperTextBelowInput?: boolean;
  /** Number of visible rows (default 4) */
  rows?: number;
  minRows?: number;
  maxRows?: number;
}

const AppTextarea = React.forwardRef<HTMLDivElement, AppTextareaProps>(
  (
    {
      label,
      labelClassName = 'label',
      containerSx,
      sx,
      inputBackgroundColor,
      helperTextBelowInput = false,
      rows = 4,
      minRows,
      maxRows,
      ...rest
    },
    ref
  ) => {
    const theme = useTheme();
    const valueLength = (rest.value as string)?.length || 0;
    const maxLength = rest.inputProps?.maxLength || 200;

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
          }}
        >
          <Typography
            component='label'
            htmlFor={
              rest.id || (rest.name ? `textarea-${rest.name}` : undefined)
            }
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
          {rest.helperText && !helperTextBelowInput && (
            <Typography
              title={String(rest.helperText)}
              sx={{
                fontSize: { xs: '12px', sm: '14px' },
                lineHeight: 1.2,
                color: rest.error
                  ? theme.palette.error.main
                  : theme.palette.text.secondary,
                fontWeight: 400,
                textAlign: 'right',
                ml: 2,
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
            backgroundColor:
              inputBackgroundColor ||
              (theme.palette.mode === 'dark'
                ? theme.palette.background.default
                : theme.palette.background.default),
            overflow: 'visible',
          }}
        >
          <TextField
            ref={ref}
            {...rest}
            fullWidth
            multiline
            id={rest.id || (rest.name ? `textarea-${rest.name}` : undefined)}
            variant='outlined'
            rows={rows}
            minRows={minRows}
            maxRows={maxRows}
            helperText={undefined}
            inputProps={{ maxLength: 200, ...(rest.inputProps || {}) }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                minHeight: 'auto',
                padding: { xs: '8px 12px', sm: '10px 16px' },
                backgroundColor: 'transparent',
                alignItems: 'flex-start',
                '& fieldset': {
                  border: 'none',
                  display: 'none',
                },
              },
              '& .MuiOutlinedInput-input': {
                color: theme.palette.text.primary,
                fontSize: { xs: '16px', sm: '14px' },
                padding: 0,
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 1,
                },
              },
              '& .MuiInputLabel-root': {
                display: 'none',
              },
              '& .MuiFormHelperText-root': {
                display: 'none',
              },
              ...sx,
            }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 0.5,
          }}
        >
          {/* Left side (helper text if needed) */}
          {helperTextBelowInput && rest.helperText ? (
            <Typography
              sx={{
                fontSize: { xs: '12px', sm: '14px' },
                color: rest.error
                  ? theme.palette.error.main
                  : theme.palette.text.secondary,
              }}
            >
              {rest.helperText}
            </Typography>
          ) : (
            <span />
          )}

          {/* Right side (character count) */}
          <Typography
            sx={{
              fontSize: '12px',
              color:
                valueLength >= maxLength
                  ? theme.palette.error.main
                  : theme.palette.text.secondary,
            }}
          >
            {valueLength}/{maxLength}
          </Typography>
        </Box>
        {helperTextBelowInput && rest.helperText && (
          <Typography
            sx={{
              fontSize: { xs: '12px', sm: '14px' },
              lineHeight: 1.2,
              color: rest.error
                ? theme.palette.error.main
                : theme.palette.text.secondary,
              fontWeight: 400,
              mt: 0.5,
            }}
          >
            {rest.helperText}
          </Typography>
        )}
      </Box>
    );
  }
);

AppTextarea.displayName = 'AppTextarea';

export default AppTextarea;
