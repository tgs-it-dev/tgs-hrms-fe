import { Box } from '@mui/material';
import AppPageTitle from '../common/AppPageTitle';
import AppDropdown from '../common/AppDropdown';
import { useState } from 'react';
import { useTheme } from '@mui/material';
import RequestLeaveCard from '../common/RequestLeaveCard';
import { requests as AllRequests } from '../Requests/mockData';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';

function ReviewRequestsPage() {
  const theme = useTheme();

  const controlBg = theme.palette.background.paper;

  const getLabel = useDirectionLabel();

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Dummy data for requests
  const requests = AllRequests;

  return (
    <Box sx={{ pb: 4 }}>
      {/* title and actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'wrap',
          gap: 1,
          mb: 3,
          width: '100%',
        }}
      >
        <AppPageTitle>Requests</AppPageTitle>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Filters Row */}
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
            value={statusFilter === '' ? 'all' : statusFilter}
            onChange={e => setStatusFilter(String(e.target.value))}
            options={[
              { value: 'all', label: getLabel('All Statuses', 'كل الحالات') },
              { value: 'pending', label: getLabel('Pending', 'قيد الانتظار') },
              { value: 'approved', label: getLabel('Approved', 'مقبول') },
              { value: 'rejected', label: getLabel('Rejected', 'مرفوض') },
            ]}
            containerSx={{
              minWidth: { xs: '120px', md: '160px' },
            }}
          />
          <AppDropdown
            label={getLabel('Type', 'النوع')}
            showLabel={false}
            placeholder={getLabel('Type', 'النوع')}
            inputBackgroundColor={controlBg}
            value={typeFilter === '' ? 'all' : typeFilter}
            onChange={e => setTypeFilter(String(e.target.value))}
            options={[
              { value: 'all', label: getLabel('All Types', 'كل الأنواع') },
              {
                value: 'work-from-home',
                label: getLabel('Work From Home', 'العمل من المنزل'),
              },
              { value: 'leave', label: getLabel('Leave', 'إجازة') },
            ]}
            containerSx={{
              minWidth: { xs: '120px', md: '160px' },
            }}
          />
        </Box>

        {/* Request Cards Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(auto-fill, minmax(450px, 1fr))',
              lg: 'repeat(auto-fill, minmax(513px, 1fr))',
            },
            gap: 3,
            width: '100%',
          }}
        >
          {requests.map(request => (
            <RequestLeaveCard
              key={request.id}
              title={request.title}
              type={request.type}
              status={request.status}
              startDate={request.startDate}
              endDate={request.endDate}
              reason={request.reason}
              submittedDate={request.submittedDate || ''}
              message={request.message || ''}
              managerName={request.managerName || ''}
              managerMessageDate={request.managerMessageDate || ''}
              onEdit={() => {}}
              onDelete={() => console.warn('Delete', request.id)}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default ReviewRequestsPage;
