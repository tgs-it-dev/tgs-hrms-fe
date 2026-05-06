import { Box, Typography, useTheme } from '@mui/material';
import AppPageTitle from '../common/AppPageTitle';
import AppButton from '../common/AppButton';
import { AddOutlined } from '@mui/icons-material';
import { useState, useCallback } from 'react';
import RequestModal from './RequestModal';

import {
  requests as AllRequests,
  type Request,
} from '../../data/mock-requests';
import RequestFilters from './RequestFilters';
import RequestLeaveCard from '../common/RequestLeaveCard';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function RequestPage() {
  const theme = useTheme();
  const getLabel = useDirectionLabel();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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

  const filteredRequests = requests.filter(req => {
    const matchStatus =
      !statusFilter || statusFilter === 'all' || req.status === statusFilter;
    const matchType =
      !typeFilter || typeFilter === 'all' || req.type === typeFilter;
    return matchStatus && matchType;
  });

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
          <RequestFilters
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
          />

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
              minHeight: '200px',
            }}
          >
            {filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <RequestLeaveCard
                  key={request.id}
                  title={request.title}
                  type={request.type === 'wfh' ? 'Work From Home' : 'Leave'}
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
              ))
            ) : (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  backgroundColor: 'background.paper',
                  borderRadius: 'var(--border-radius-2xl)',
                  border: `1px dashed ${theme.palette.divider}`,
                }}
              >
                <Typography variant='h6' color='text.secondary'>
                  {getLabel('No requests found', 'لم يتم العثور على طلبات')}
                </Typography>
                <Typography variant='body2' color='text.secondary' mt={1}>
                  {getLabel(
                    'Try adjusting your filters',
                    'جرب تعديل الفلاتر الخاصة بك'
                  )}
                </Typography>
              </Box>
            )}
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
