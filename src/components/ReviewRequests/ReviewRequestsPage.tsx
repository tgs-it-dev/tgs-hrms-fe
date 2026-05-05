import { Box, useTheme, Typography } from '@mui/material';
import AppPageTitle from '../common/AppPageTitle';
import AppDropdown from '../common/AppDropdown';
import { useState, useCallback, useMemo } from 'react';
import RequestLeaveCard from '../common/RequestLeaveCard';
import { requests as AllRequests } from '../../data/mock-requests';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';
import AppButton from '../common/AppButton';
import AppTextField from '../common/AppTextField';
import { Check, Close } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function ReviewRequestsPage() {
  const theme = useTheme();
  const getLabel = useDirectionLabel();

  const controlBg = theme.palette.background.paper;

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dummy data for requests
  const [requests, setRequests] = useState(AllRequests);

  const handleApprove = useCallback((id: number | string) => {
    setRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, status: 'approved' } : req))
    );
  }, []);

  const handleReject = useCallback((id: number | string) => {
    setRequests(prev =>
      prev.map(req => (req.id === id ? { ...req, status: 'rejected' } : req))
    );
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchStatus = statusFilter === 'all' || req.status === statusFilter;
      const matchType = typeFilter === 'all' || req.type === typeFilter;
      return matchStatus && matchType;
    });
  }, [requests, statusFilter, typeFilter]);

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
              value={statusFilter}
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
              value={typeFilter}
              onChange={e => setTypeFilter(String(e.target.value))}
              options={[
                { value: 'all', label: getLabel('All Types', 'كل الأنواع') },
                {
                  value: 'wfh',
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
                  submittedDate={request.submittedDate || ''}
                  message={request.message || ''}
                  managerName={request.managerName || ''}
                  managerMessageDate={request.managerMessageDate || ''}
                  isManagerView
                  actions={
                    request.status === 'pending' ? (
                      <Box>
                        <AppTextField
                          placeholder={getLabel(
                            'Add your remarks...',
                            'أضف ملاحظاتك...'
                          )}
                          multiline
                          rows={2}
                          fullWidth
                          sx={{ mb: 2 }}
                        />
                        <Box display='flex' gap={3}>
                          <AppButton
                            variant='contained'
                            text={getLabel('Reject', 'رفض')}
                            startIcon={<Close />}
                            onClick={() => handleReject(request.id)}
                            sx={{
                              flex: 1,
                              backgroundColor: 'var(--status-rejected-bg)',
                              color: 'var(--status-rejected-text)',
                              ':hover': {
                                backgroundColor: 'var(--status-rejected-bg)',
                                color: 'var(--status-rejected-text)',
                              },
                            }}
                          />
                          <AppButton
                            variant='contained'
                            text={getLabel('Approve', 'موافقة')}
                            startIcon={<Check />}
                            onClick={() => handleApprove(request.id)}
                            sx={{
                              flex: 1,
                              backgroundColor: 'var(--status-approved-bg)',
                              color: 'var(--status-approved-text)',
                              ':hover': {
                                backgroundColor: 'var(--status-approved-bg)',
                                color: 'var(--status-approved-text)',
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    ) : null
                  }
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
      </Box>
    </LocalizationProvider>
  );
}

export default ReviewRequestsPage;
