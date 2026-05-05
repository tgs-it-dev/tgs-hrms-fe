import React from 'react';
import { Box, useTheme } from '@mui/material';
import AppDropdown from '../common/AppDropdown';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';

interface RequestFiltersProps {
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
}

const RequestFilters: React.FC<RequestFiltersProps> = ({
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
}) => {
  const theme = useTheme();
  const getLabel = useDirectionLabel();
  const controlBg = theme.palette.background.paper;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        justifyContent: 'end',
        width: '100%',
      }}
    >
      <AppDropdown
        label={getLabel('Status', 'الحالة')}
        showLabel={false}
        placeholder={getLabel('Status', 'الحالة')}
        inputBackgroundColor={controlBg}
        value={statusFilter}
        onChange={e => onStatusChange(String(e.target.value))}
        options={[
          { value: 'all', label: getLabel('All Statuses', 'كل الحالات') },
          {
            value: 'pending',
            label: getLabel('Pending', 'قيد الانتظار'),
          },
          { value: 'approved', label: getLabel('Approved', 'مقبول') },
          { value: 'rejected', label: getLabel('Rejected', 'مرفوض') },
        ]}
        containerSx={{ minWidth: { xs: '120px', md: '160px' } }}
      />
      <AppDropdown
        label={getLabel('Type', 'النوع')}
        showLabel={false}
        placeholder={getLabel('Type', 'النوع')}
        inputBackgroundColor={controlBg}
        value={typeFilter}
        onChange={e => onTypeChange(String(e.target.value))}
        options={[
          { value: 'all', label: getLabel('All Types', 'كل الأنواع') },
          {
            value: 'wfh',
            label: getLabel('Work From Home', 'العمل من المنزل'),
          },
          { value: 'leave', label: getLabel('Leave', 'إجازة') },
        ]}
        containerSx={{ minWidth: { xs: '120px', md: '160px' } }}
      />
    </Box>
  );
};

export default RequestFilters;
