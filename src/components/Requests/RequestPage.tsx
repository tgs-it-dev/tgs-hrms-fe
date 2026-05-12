import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Pagination,
} from '@mui/material';
import AppPageTitle from '../common/AppPageTitle';
import AppButton from '../common/AppButton';
import { AddOutlined } from '@mui/icons-material';
import { useState, useCallback, useEffect, useRef } from 'react';

import dayjs from 'dayjs';
import workflowApi, {
  type WorkflowRequest,
  type WorkflowRequestStatus,
  type WorkflowRequestType,
} from '../../api/workflowApi';

import { useErrorHandler } from '../../hooks/useErrorHandler';
import RequestFilters from './RequestFilters';
import RequestLeaveCard from '../common/RequestLeaveCard';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import wfhApi from '../../api/wfhApi';
import overtimeApi from '../../api/overtimeApi';
import { normalizeRole } from '../../utils/permissions';
import { getUserRole } from '../../utils/auth';
import { PAGINATION } from '../../constants/appConstants';
import RequestModal from './RequestModal';
import { leaveApi, type LeaveType } from '../../api';
import { mapWorkflowStatus } from '../../utils/requestUtils';
function RequestPage() {
  const theme = useTheme();
  const getLabel = useDirectionLabel();
  const { showError } = useErrorHandler();
  const userRole = normalizeRole(getUserRole() || '');

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [requests, setRequests] = useState<WorkflowRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<WorkflowRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = PAGINATION.DEFAULT_PAGE_SIZE;

  const hasLoadedOnceRef = useRef(false);
  const currentPageRef = useRef(currentPage);
  const previousPageRef = useRef(1);
  const previousStatusFilterRef = useRef('all');
  const previousTypeFilterRef = useRef('all');
  const [leaveTypesMap, setLeaveTypesMap] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await leaveApi.getLeaveTypes({ page: 1, limit: 100 });
        const map: Record<string, string> = {};
        response.items?.forEach((lt: LeaveType) => {
          map[lt.id] = lt.name;
        });
        setLeaveTypesMap(map);
      } catch (error) {
        console.error('Failed to fetch leave types:', error);
      }
    };
    fetchLeaveTypes();
  }, []);

  const loadRequests = useCallback(
    async (options?: { page?: number; skipFullPageLoader?: boolean }) => {
      const pageToFetch = options?.page ?? currentPage;
      const showFullPageLoader = !options?.skipFullPageLoader;

      if (showFullPageLoader) setInitialLoading(true);
      else setTableLoading(true);

      try {
        const params = {
          status:
            statusFilter !== 'all'
              ? (statusFilter as WorkflowRequestStatus)
              : undefined,
          type:
            typeFilter !== 'all'
              ? (typeFilter as WorkflowRequestType)
              : undefined,
          page: pageToFetch,
          limit: ITEMS_PER_PAGE,
        };
        const response = await workflowApi.getMyWorkflowRequests(params);
        setRequests(response.items || []);
        setTotalItems(response.total || 0);
        setTotalPages(
          response.total
            ? Math.ceil(response.total / ITEMS_PER_PAGE)
            : response.items?.length === ITEMS_PER_PAGE
              ? pageToFetch + 1
              : pageToFetch
        );
        if (response.page && response.page !== currentPageRef.current) {
          setCurrentPage(response.page);
        }
        hasLoadedOnceRef.current = true;
      } catch (error) {
        showError(error);
      } finally {
        if (showFullPageLoader) setInitialLoading(false);
        else setTableLoading(false);
      }
    },
    [showError, statusFilter, typeFilter, ITEMS_PER_PAGE]
  );

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    const pageChanged = previousPageRef.current !== currentPage;
    const statusFilterChanged =
      previousStatusFilterRef.current !== statusFilter;
    const typeFilterChanged = previousTypeFilterRef.current !== typeFilter;

    if (
      hasLoadedOnceRef.current &&
      !pageChanged &&
      !statusFilterChanged &&
      !typeFilterChanged
    ) {
      return;
    }

    const skipFullPageLoader =
      hasLoadedOnceRef.current && !statusFilterChanged && !typeFilterChanged;

    loadRequests({
      page: currentPage,
      skipFullPageLoader,
    });

    previousPageRef.current = currentPage;
    previousStatusFilterRef.current = statusFilter;
    previousTypeFilterRef.current = typeFilter;
  }, [currentPage, statusFilter, typeFilter, loadRequests]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedRequest(null);
  }, []);

  const handleAddNew = useCallback(() => {
    setOpen(true);
  }, []);

  const filteredRequests = requests;

  const buildCardProps = (request: WorkflowRequest) => {
    return {
      title:
        request.request_type === 'wfh'
          ? getLabel('Work From Home', 'العمل من المنزل')
          : request.request_type === 'leave'
            ? getLabel('Leave Request', 'طلب إجازة')
            : getLabel('Overtime', 'عمل إضافي'),
      type:
        request.request_type === 'wfh'
          ? 'Work From Home'
          : request.request_type === 'leave'
            ? 'Leave'
            : 'Overtime',
      status: mapWorkflowStatus(request.status),
      startDate: request.request_data?.start_date
        ? dayjs(request.request_data.start_date).format('D/M/YYYY')
        : '—',
      endDate: request.request_data?.end_date
        ? dayjs(request.request_data.end_date).format('D/M/YYYY')
        : '—',
      reason: request.request_data?.reason || '—',
      submittedDate: dayjs(request.created_at).format('D/M/YYYY'),
      attachments: request?.request_data?.attachments || [],
      role: userRole,
      steps: request.steps || [],
      leaveType:
        request.request_type === 'leave' && request.request_data?.leave_type_id
          ? leaveTypesMap[request.request_data.leave_type_id] || '—'
          : undefined,
    };
  };

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
            role={userRole}
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
              opacity: tableLoading ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {initialLoading ? (
              <Box
                sx={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  justifyContent: 'center',
                  py: 8,
                }}
              >
                <CircularProgress />
              </Box>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <RequestLeaveCard
                  key={request.id}
                  {...buildCardProps(request)}
                  onEdit={() => {
                    setSelectedRequest(request);
                    setOpen(true);
                  }}
                  onCancel={async () => {
                    try {
                      if (request.request_type === 'wfh') {
                        await wfhApi.cancelWFHRequest(request.request_data.id);
                      } else if (request.request_type === 'leave') {
                        await leaveApi.cancelLeave(request.request_data.id);
                      } else if (request.request_type === 'overtime') {
                        await overtimeApi.cancelOvertimeRequest(
                          request.request_data.id
                        );
                      }
                      loadRequests({
                        page: currentPage,
                        skipFullPageLoader: true,
                      });
                    } catch (error) {
                      showError(error);
                    }
                  }}
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

          {/* Pagination */}
          {!initialLoading && (
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                mt: 3,
              }}
            >
              {(() => {
                const shouldShowPagination = totalPages > 1;

                return shouldShowPagination ? (
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, value) => setCurrentPage(value)}
                    sx={{
                      mb: 1,
                      '& .MuiPaginationItem-root': {
                        color: 'var(--primary-dark-color)',
                      },
                      '& .MuiPaginationItem-root.Mui-selected': {
                        backgroundColor: 'var(--primary-dark-color)',
                        color: 'var(--white-color)',
                        '&:hover': {
                          backgroundColor: 'var(--primary-dark-color)',
                        },
                      },
                    }}
                    showFirstButton
                    showLastButton
                  />
                ) : null;
              })()}

              {filteredRequests.length > 0 && (
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{
                    textAlign: 'center',
                    width: 'fit-content',
                    mx: 'auto',
                  }}
                >
                  {getLabel(
                    `Showing page ${currentPage} of ${totalPages} (${totalItems} total records)`,
                    `عرض الصفحة ${currentPage} من ${totalPages} (${totalItems} إجمالي السجلات)`
                  )}
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <RequestModal
          open={open}
          onClose={handleClose}
          onSuccess={() =>
            loadRequests({ page: currentPage, skipFullPageLoader: true })
          }
          initialData={selectedRequest}
          title={
            selectedRequest
              ? getLabel('Edit Request', 'تعديل الطلب')
              : getLabel('New Request', 'طلب جديد')
          }
        />
      </Box>
    </LocalizationProvider>
  );
}

export default RequestPage;
