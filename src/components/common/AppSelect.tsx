import React from 'react';
import {
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  type SelectProps,
  type SxProps,
  type Theme,
} from '@mui/material';

interface AppSelectProps extends Omit<SelectProps, 'label'> {
  label?: string;
  options?: Array<{ value: string | number; label: string }>;
  children?: React.ReactNode;
}

export function AppSelect({
  label,
  options,
  children,
  sx,
  ...rest
}: AppSelectProps) {
  const baseSx: SxProps<Theme> = {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'divider',
    },
    // '&:hover .MuiOutlinedInput-notchedOutline': {
    //   borderColor: 'primary.main',
    // },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'primary.main',
    },
  };

  const content = options
    ? options.map(option => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))
    : children;

  if (label) {
    return (
      <FormControl fullWidth={rest.fullWidth} sx={sx}>
        <InputLabel>{label}</InputLabel>
        <Select {...rest} label={label} sx={[baseSx, sx]}>
          {content}
        </Select>
      </FormControl>
    );
  }

  return (
    <Select {...rest} sx={[baseSx, sx]}>
      {content}
    </Select>
  );
}

export default AppSelect;
