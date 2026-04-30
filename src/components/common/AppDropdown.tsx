import React, { useState } from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  Typography,
  Box,
  useTheme,
  Checkbox,
  type SelectProps,
  type SxProps,
  type Theme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Icons } from '../../assets/icons';

interface AppDropdownOption {
  value: string | number;
  label: string;
}

interface AppDropdownProps extends Omit<
  SelectProps<unknown>,
  'label' | 'onChange' | 'variant' | 'open' | 'onOpen' | 'onClose'
> {
  label: string;
  options: AppDropdownOption[];
  value: string | number | Array<string | number>;
  onChange: (event: SelectChangeEvent<string | number | string[]>) => void;
  labelClassName?: string;
  containerSx?: SxProps<Theme>;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  inputBackgroundColor?: string;
  showLabel?: boolean;
}

const ArrowIcon = ({ open }: { open: boolean }) => {
  const theme = useTheme();
  return (
    <Box
      component='img'
      src={Icons.arrowUp}
      alt=''
      sx={{
        width: { xs: 14, sm: 16 },
        height: { xs: 14, sm: 16 },
        pointerEvents: 'none',
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease-in-out',
        marginRight: { xs: '12px', sm: '16px' },
        filter:
          theme.palette.mode === 'dark'
            ? 'brightness(0) saturate(100%) invert(56%)'
            : 'none',
      }}
    />
  );
};

const AppDropdown = React.forwardRef<HTMLDivElement, AppDropdownProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      labelClassName = 'subheading2',
      containerSx,
      placeholder = 'Select...',
      error = false,
      helperText,
      inputBackgroundColor,
      showLabel = true,
      sx,
      ...rest
    },
    ref
  ) => {
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    // Provide a sensible default container sizing for large screens
    // Pages can still override by passing `containerSx` prop.
    const defaultContainerSx = {
      minWidth: { md: 220 },
      width: { xs: '100%', md: 'auto' },
    };
    const mergedContainerSx = { ...defaultContainerSx, ...(containerSx || {}) };

    return (
      <Box
        sx={{
          ...mergedContainerSx,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {showLabel && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <Typography
              component='label'
              htmlFor={
                rest.id || (rest.name ? `dropdown-${rest.name}` : undefined)
              }
              className={labelClassName}
              sx={{
                // fontWeight: 500,
                // fontSize: 'var(--subheading3-font-size)',
                lineHeight: 'var(--subheading2-line-height)',
                letterSpacing: 'var(--subheading2-letter-spacing)',
                color:
                  theme.palette.mode === 'dark'
                    ? theme.palette.text.primary
                    : 'var(--black-color)',
              }}
            >
              {label}
            </Typography>
            {error && helperText && (
              <Typography
                sx={{
                  fontSize: 'var(--label-font-size)',
                  lineHeight: 'var(--label-line-height)',
                  color: 'error.main',
                  fontWeight: 400,
                  textAlign: 'right',
                  ml: 2,
                }}
              >
                {helperText}
              </Typography>
            )}
          </Box>
        )}
        <FormControl
          ref={ref}
          fullWidth
          error={error}
          sx={[
            {
              width: '100%',
              '& .MuiOutlinedInput-root': {
                backgroundColor:
                  inputBackgroundColor || theme.palette.background.paper,
                borderRadius: '12px',
                minHeight: { xs: '40px', sm: '44px' },
                width: '100%',
                padding: '0 !important',
                '& fieldset': {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.divider,
                  borderWidth: '1px',
                },
                '&:hover fieldset': {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.divider,
                },
                '&.Mui-focused fieldset': {
                  borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.primary.main,
                  borderWidth: '1px',
                },
              },
              '& .MuiInputBase-input': {
                padding: { xs: '8px 12px', sm: '10px 16px' },
                backgroundColor: 'transparent !important',
              },
              '& .MuiOutlinedInput-input': {
                backgroundColor: 'transparent !important',
                color: theme.palette.text.primary,
              },
              '& .MuiOutlinedInput-input.MuiSelect-select': {
                color: theme.palette.text.primary + ' !important',
              },
              '& .MuiSelect-select': {
                color: theme.palette.text.primary,
                fontSize: 'var(--label-font-size)',
                lineHeight: 'var(--label-line-height)',
                letterSpacing: 'var(--label-letter-spacing)',
                fontWeight: 400,
                padding: { xs: '8px 12px', sm: '10px 16px' },
                paddingRight: { xs: '36px', sm: '40px' },
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'transparent !important',
              },
              '& .MuiSelect-icon': {
                color: theme.palette.text.secondary,
                right: { xs: '12px', sm: '16px' },
              },
            },
            ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
          ]}
        >
          <Select
            {...rest}
            variant='outlined'
            id={rest.id || (rest.name ? `dropdown-${rest.name}` : undefined)}
            value={Array.isArray(value) ? value : value === 'all' ? '' : value}
            onChange={onChange}
            displayEmpty
            open={open}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
            IconComponent={() => <ArrowIcon open={open} />}
            renderValue={selected => {
              if (
                !selected ||
                (Array.isArray(selected) && selected.length === 0)
              ) {
                const emptyOption = options.find(
                  opt => opt.value === selected || opt.value === ''
                );
                if (emptyOption) return emptyOption.label;
                const allOption = options.find(opt => opt.value === 'all');
                return allOption ? allOption.label : placeholder || '';
              }
              if (Array.isArray(selected)) {
                const labels = (selected as Array<string | number>)
                  .map(s => options.find(opt => opt.value === s)?.label)
                  .filter(Boolean);
                return labels.join(', ');
              }
              const selectedOption = options.find(
                opt => opt.value === selected
              );
              return selectedOption ? selectedOption.label : '';
            }}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                border: error
                  ? `1px solid ${theme.palette.error.main}`
                  : `1px solid ${theme.palette.divider}`,
              },
              '& .MuiSelect-select': {
                backgroundColor: 'transparent !important',
                color: theme.palette.text.primary,
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  borderRadius: '12px',
                  mt: 1,
                  backgroundColor: theme.palette.background.paper,
                  '& .MuiMenuItem-root': {
                    fontSize: 'var(--label-font-size)',
                    lineHeight: 'var(--label-line-height)',
                    letterSpacing: 'var(--label-letter-spacing)',
                    color: theme.palette.text.primary,
                    minHeight: { xs: 40, sm: 44 },
                    backgroundColor: 'transparent !important',
                    '&:hover': {
                      backgroundColor: `${theme.palette.action.hover} !important`,
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'transparent !important',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: `${theme.palette.action.hover} !important`,
                      },
                    },
                    '&.Mui-selected.Mui-focusVisible': {
                      backgroundColor: 'transparent !important',
                    },
                    '&.Mui-focusVisible': {
                      backgroundColor: 'transparent !important',
                    },
                  },
                },
              },
            }}
          >
            {options.map((option, index) => (
              <MenuItem
                key={`${String(option.value)}-${index}`}
                value={option.value === 'all' ? '' : option.value}
                sx={{
                  color: theme.palette.text.primary,
                  backgroundColor: 'transparent !important',
                  '&.Mui-selected': {
                    backgroundColor: 'transparent !important',
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: `${theme.palette.action.hover} !important`,
                    },
                  },
                  '&.Mui-focusVisible': {
                    backgroundColor: 'transparent !important',
                  },
                  '&:hover': {
                    backgroundColor: `${theme.palette.action.hover} !important`,
                  },
                }}
              >
                {rest.multiple ? (
                  <Box display='flex' alignItems='center' gap={1}>
                    <Checkbox
                      size='small'
                      checked={
                        Array.isArray(value) &&
                        (value as Array<string | number>).includes(option.value)
                      }
                    />
                    <Box>{option.label}</Box>
                  </Box>
                ) : (
                  option.label
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  }
);

AppDropdown.displayName = 'AppDropdown';

export default AppDropdown;
