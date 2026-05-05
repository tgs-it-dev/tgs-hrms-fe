import { Box, useTheme } from '@mui/material';
import AppPageTitle from '../common/AppPageTitle';
import AppButton from '../common/AppButton';
import { AddOutlined } from '@mui/icons-material';
import AppDropdown from '../common/AppDropdown';
import { useState, useCallback } from 'react';
import RequestModal from './RequestModal';
import { requests as AllRequests, type Request } from '../../data/mock-leaves';
import RequestLeaveCard from '../common/RequestLeaveCard';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function RequestPage() {
  const theme = useTheme();
  const getLabel = useDirectionLabel();

  const controlBg = theme.palette.background.paper;

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const [requests, setRequests] = useState<Request[]>(AllRequests);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleEdit = useCallback((request: Request) => {
    setSelectedRequest(request);
    setOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setSelectedRequest(null);
    setOpen(true);
  }, []);

  const handleDelete = useCallback((id: number | string) => {
    setRequests(prev => prev.filter(req => req.id !== id));
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
          <AppPageTitle>{getLabel('Requests', 'الطلبات')}</AppPageTitle>

          <AppButton
            variant='contained'
            variantType='primary'
            text={getLabel('New Request', 'طلب جديد')}
            startIcon={<AddOutlined />}
            onClick={handleAddNew}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { xs: 'auto', sm: 120, md: 140 },
            }}
          />
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
                {
                  value: 'pending',
                  label: getLabel('Pending', 'قيد الانتظار'),
                },
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
                submittedDate={request.submittedDate ?? ''}
                message={request.message ?? ''}
                managerName={request.managerName}
                managerMessageDate={request.managerMessageDate}
                onEdit={() => handleEdit(request)}
                onDelete={() => handleDelete(request.id)}
              />
            ))}
          </Box>
        </Box>

        <RequestModal
          open={open}
          onClose={handleClose}
          title={
            selectedRequest
              ? getLabel('Edit Request', 'تعديل الطلب')
              : getLabel('New Request', 'طلب جديد')
          }
          initialData={selectedRequest}
        />
      </Box>
    </LocalizationProvider>
  );
}

export default RequestPage;
