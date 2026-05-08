import React, { memo } from 'react';
import {
  TableContainer,
  Table,
  Paper,
  useTheme,
  type TableContainerProps,
  type SxProps,
  type Theme,
  type TableProps,
} from '@mui/material';

interface AppTableProps extends TableContainerProps {
  children: React.ReactNode;
  tableProps?: TableProps;
}

export const AppTable = memo(function AppTable({
  children,
  sx,
  tableProps,
  ...rest
}: AppTableProps) {
  const theme = useTheme();

  const baseSx: SxProps<Theme> = {
    border: 'none',
    borderRadius: '12px',
    overflowX: 'auto',
    overflowY: 'hidden',
    backgroundColor: theme.palette.background.paper,

    '& .MuiTableHead-root .MuiTableRow-root': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'var(--primary-light-color)'
          : 'var(--primary-color)',
      '& .MuiTableCell-root': {
        borderBottom: 'none',
        padding: { xs: '8px 12px', sm: '16px' },
        fontWeight: 700,
        fontSize: { xs: '12px', sm: '18px' },
        lineHeight: { xs: '16px', sm: 'var(--subheading2-line-height)' },
        letterSpacing: 'var(--subheading2-letter-spacing)',
        color: theme.palette.common.white,
        backgroundColor:
          theme.palette.mode === 'dark'
            ? 'var(--primary-dark-color)'
            : 'var(--primary-light-color)',
        whiteSpace: 'nowrap',
      },
    },

    '& .MuiTableBody-root .MuiTableRow-root': {
      backgroundColor: theme.palette.background.paper,
      '& .MuiTableCell-root': {
        borderBottom: `0.5px solid ${theme.palette.divider}`,
        padding: { xs: '8px 12px', sm: '16px' },
        fontSize: { xs: '12px', sm: 'var(--body-font-size)' },
        lineHeight: { xs: '16px', sm: 'var(--body-line-height)' },
        color: theme.palette.text.primary,
        whiteSpace: { xs: 'nowrap', sm: 'normal' },
        backgroundColor: theme.palette.background.paper,
      },
    },
    '& .MuiTableCell-root[data-truncate="true"]': {
      maxWidth: 200,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .MuiTableCell-root[data-truncate="true"] .MuiTypography-root': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  };

  return (
    <TableContainer
      component={Paper}
      {...rest}
      sx={{ ...baseSx, ...(sx as object) }}
    >
      <Table {...(tableProps ?? {})}>{children}</Table>
    </TableContainer>
  );
});

export default AppTable;
