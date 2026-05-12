import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Pagination,
} from '@mui/material';
import AppPageTitle from '../common/AppPageTitle';
import AppButton from '../common/AppButton';
import { Check, Close } from '@mui/icons-material';
import { useState, useCallback, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import workflowApi, {
  type WorkflowRequest,
  type WorkflowRequestType,
  type WorkflowApprovalView,
} from '../../api/workflowApi';

import { useErrorHandler } from '../../hooks/useErrorHandler';
import RequestLeaveCard from '../common/RequestLeaveCard';
import { useDirectionLabel } from '../../hooks/useDirectionLabel';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { PAGINATION } from '../../constants/appConstants';

import { normalizeRole } from '../../utils/permissions';
import { getUserRole } from '../../utils/auth';
import RequestFilters from '../Requests/RequestFilters';
import { AppTextarea } from '../common';
import {
  isEmployee,
  isManager,
  isAdmin,
  isHRAdmin,
} from '../../utils/roleUtils';
import { leaveApi } from '../../api';
import type { LeaveType } from '../../api/leaveApi';

function ReviewRequestPage() {
  const theme = useTheme();
  const getLabel = useDirectionLabel();
  const { showError } = useErrorHandler();
  const userRole = normalizeRole(getUserRole() || '');
  const employee = isEmployee(userRole);
  const manager = isManager(userRole);
  const admin = isAdmin(userRole);
  const hrAdmin = isHRAdmin(userRole);

  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [requests, setRequests] = useState<WorkflowRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = PAGINATION.DEFAULT_PAGE_SIZE;
  const [remarksMap, setRemarksMap] = useState<Record<string, string>>({});

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
              ? (statusFilter as WorkflowApprovalView)
              : undefined,
          type:
            typeFilter !== 'all'
              ? (typeFilter as WorkflowRequestType)
              : undefined,
          page: pageToFetch,
          limit: ITEMS_PER_PAGE,
        };
        console.log(params);
        const response = await workflowApi.getWorkflowApprovals(params);
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

  const handleDecision = useCallback(
    async (requestId: string, action: 'approved' | 'rejected') => {
      try {
        const remarks = remarksMap[requestId] || '';
        await workflowApi.submitWorkflowDecision(requestId, {
          action,
          remarks,
        });
        // Clear remark after successful decision
        setRemarksMap(prev => {
          const next = { ...prev };
          delete next[requestId];
          return next;
        });
        loadRequests({ page: currentPage, skipFullPageLoader: true });
      } catch (error) {
        showError(error);
      }
    },
    [loadRequests, currentPage, remarksMap, showError]
  );

  const handleRemarkChange = (requestId: string, remark: string) => {
    setRemarksMap(prev => ({
      ...prev,
      [requestId]: remark,
    }));
  };

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

  const filteredRequests = requests;

  const mapStatus = (
    status: string
  ): 'pending' | 'approved' | 'rejected' | 'cancelled' => {
    if (status === 'approved') return 'approved';
    if (status === 'rejected') return 'rejected';
    if (status === 'cancelled') return 'cancelled';
    return 'pending';
  };

  const buildCardProps = (request: WorkflowRequest) => {
    return {
      title:
        request?.request_type === 'wfh'
          ? 'Work From Home'
          : request?.request_type === 'leave'
            ? 'Leave'
            : 'Overtime',
      from: `${request?.requestor?.first_name?.charAt(0)?.toUpperCase() || ''}${request?.requestor?.first_name?.slice(1) || ''} ${request?.requestor?.last_name?.charAt(0)?.toUpperCase() || ''}${request?.requestor?.last_name?.slice(1) || ''}`,
      type:
        request?.request_type === 'wfh'
          ? 'Work From Home'
          : request?.request_type === 'leave'
            ? 'Leave'
            : 'Overtime',
      status: mapStatus(request?.status),
      startDate: request?.request_data?.start_date
        ? dayjs(request?.request_data?.start_date).format('D/M/YYYY')
        : '—',
      endDate: request?.request_data?.end_date
        ? dayjs(request?.request_data?.end_date).format('D/M/YYYY')
        : '—',
      reason: request?.request_data?.reason || '—',
      submittedDate: dayjs(request?.created_at).format('D/M/YYYY'),
      attachments: request?.request_data?.attachments || [],
      role: userRole,
      steps: request?.steps || [],
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
                  actions={
                    !employee &&
                    !(
                      (manager &&
                        [
                          'rejected',
                          'cancelled',
                          'approved',
                          'in_review',
                        ].includes(request.status)) ||
                      ((admin || hrAdmin) &&
                        ['rejected', 'cancelled', 'approved'].includes(
                          request.status
                        ))
                    ) ? (
                      <Box>
                        <AppTextarea
                          label={getLabel('Remarks', 'ملاحظات')}
                          placeholder={getLabel(
                            `Add your remarks...`,
                            'أضف ملاحظاتك...'
                          )}
                          rows={2}
                          maxLength={200}
                          fullWidth
                          sx={{ mb: 2 }}
                          value={remarksMap[request.id] || ''}
                          onChange={e =>
                            handleRemarkChange(request.id, e.target.value)
                          }
                        />
                        <Box display='flex' gap={3}>
                          <AppButton
                            variant='contained'
                            text={getLabel('Reject', 'رفض')}
                            startIcon={<Close />}
                            onClick={() =>
                              handleDecision(request.id, 'rejected')
                            }
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
                            onClick={() =>
                              handleDecision(request.id, 'approved')
                            }
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
      </Box>
    </LocalizationProvider>
  );
}

export default ReviewRequestPage;
