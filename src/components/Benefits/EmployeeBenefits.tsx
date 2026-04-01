import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Tooltip,
  IconButton,
  Pagination,
  Table,
  useTheme,
  Stack,
} from '@mui/material';
import AppFormModal from '../common/AppFormModal';
import {
  Add as AddIcon,
  FileDownload as FileDownloadIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { TextField } from '@mui/material';
import AssignEmployeeBenefit from './AssignEmployeeBenefit';
import AppDropdown from '../common/AppDropdown';
import AppButton from '../common/AppButton';
import employeeBenefitApi from '../../api/employeeBenefitApi';
import benefitsApi from '../../api/benefitApi';
import type {
  EmployeeWithBenefits,
  ReimbursementRequest,
  EmployeeBenefitDetail,
} from '../../api/employeeBenefitApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppTable from '../common/AppTable';
import { getUserRole } from '../../utils/auth';
import { normalizeRole } from '../../utils/permissions';
import { formatDate } from '../../utils/dateUtils';
import { env } from '../../config/env';
import { PAGINATION } from '../../constants/appConstants';

const ITEMS_PER_PAGE = PAGINATION.DEFAULT_PAGE_SIZE;

const EmployeeBenefits: React.FC = () => {
  const role = normalizeRole(getUserRole());
  const theme = useTheme();
  const isManager = role === 'manager';
  const [openForm, setOpenForm] = useState(false);
  const [employees, setEmployees] = useState<EmployeeWithBenefits[]>([]);
  const [selectedBenefit, setSelectedBenefit] =
    useState<EmployeeBenefitDetail | null>(null);
  const [openBenefitDialog, setOpenBenefitDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [benefitLoading, setBenefitLoading] = useState(false);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'active' | 'inactive' | 'expired' | 'cancelled'
  >('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Reimbursement History State for Admin/HR
  const [reimbursementHistory, setReimbursementHistory] = useState<
    ReimbursementRequest[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Review Dialog State
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>(
    'approved'
  );
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const handleReviewClick = (
    requestId: string,
    status: 'approved' | 'rejected'
  ) => {
    setReviewRequestId(requestId);
    setReviewStatus(status);
    setReviewRemarks(''); // Reset remarks
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewRequestId) return;

    if (reviewStatus === 'rejected' && !reviewRemarks.trim()) {
      showError('Remarks are required for rejection.');
      return;
    }

    setReviewLoading(true);
    try {
      await employeeBenefitApi.reviewBenefitReimbursement(reviewRequestId, {
        status: reviewStatus,
        reviewRemarks: reviewRemarks.trim(),
      });
      showSuccess(`Request ${reviewStatus} successfully.`);
      setReviewDialogOpen(false);

      // Refresh history
      if (selectedBenefit) {
        // Mock refresh logic similar to initial fetch
        const benefitAssignmentId = selectedBenefit.benefitAssignmentId;
        const employeeId = selectedBenefit.employeeId;

        if (benefitAssignmentId && employeeId) {
          const response = await employeeBenefitApi.getAllReimbursementRequests(
            {
              employeeId,
              limit: 100,
            }
          );
          const allRequests = response.items || [];
          const filteredHistory = allRequests.filter(
            r =>
              r.employeeBenefitId === benefitAssignmentId &&
              r.status !== 'cancelled'
          );
          setReimbursementHistory(filteredHistory);
        }
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Review failed', error);
      const errorMessage =
        err.response?.data?.message || 'Failed to submit review.';
      showError(errorMessage);
    } finally {
      setReviewLoading(false);
    }
  };

  const getFileUrl = (path: string) => {
    if (!path) return '';
    if (
      path.startsWith('http') ||
      path.startsWith('https') ||
      path.startsWith('blob:')
    )
      return path;
    const baseUrl = env.apiBaseUrl?.endsWith('/')
      ? env.apiBaseUrl.slice(0, -1)
      : env.apiBaseUrl;
    const relativePath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${relativePath}`;
  };

  const fetchEmployees = useCallback(
    async (pageNum: number = 1, statusFilter: typeof selectedStatus = selectedStatus) => {
      try {
        setLoading(true);
        const resp = await employeeBenefitApi.getEmployeesWithBenefits({
          page: pageNum,
          limit: ITEMS_PER_PAGE,
        });

      // Handle both array and paginated response
      const items = Array.isArray(resp) ? resp : resp.items || [];
      const paginationInfo = Array.isArray(resp)
        ? null
        : 'total' in resp && 'totalPages' in resp
          ? resp
          : null;

        setEmployees(items);

      // Backend returns 25 records per page (fixed page size)
      // If we get 25 records, there might be more pages
      // If we get less than 25, it's the last page
        const hasMorePages = items.length === ITEMS_PER_PAGE;
        const employeesCount = items.length;

        // Use backend pagination info if available, otherwise estimate
        if (paginationInfo && paginationInfo.total && paginationInfo.totalPages) {
          setTotalPages(paginationInfo.totalPages);
          // Use total from backend
          setTotalRecords(paginationInfo.total);
        } else {
          // Fallback: estimate based on current page and records received
          setTotalPages(hasMorePages ? pageNum + 1 : pageNum);
          // Count employees across all pages
          setTotalRecords(
            hasMorePages
              ? pageNum * ITEMS_PER_PAGE
              : (pageNum - 1) * ITEMS_PER_PAGE + employeesCount
          );
        }
      } catch {
        // Keep previous grid state if fetch fails
      } finally {
        setLoading(false);
      }
    },
    [selectedStatus]
  );

  useEffect(() => {
    fetchEmployees(page, selectedStatus);
  }, [page, selectedStatus, fetchEmployees]);

  const handleBenefitClick = async (
    benefitId: string,
    employeeBenefitStatus: string,
    benefitAssignmentId: string,
    employeeId: string,
    assignmentStartDate?: string,
    assignmentEndDate?: string
  ) => {
    try {
      setBenefitLoading(true);
      const benefitDetails = await benefitsApi.getBenefitById(benefitId);
      const effectiveEmployeeStatus =
        benefitDetails.status === 'inactive'
          ? 'inactive'
          : employeeBenefitStatus;

      setSelectedBenefit({
        ...benefitDetails,
        employeeStatus: effectiveEmployeeStatus,
        benefitAssignmentId,
        employeeId,
        startDate: assignmentStartDate,
        endDate: assignmentEndDate,
      });

      setOpenBenefitDialog(true);

      // Fetch reimbursement history for this benefit assignment if user is authorized
      if (benefitAssignmentId && employeeId) {
        setLoadingHistory(true);
        try {
          // Admin/HR must filter by employeeId to see specific employee requests
          // Then we filter by employeeBenefitId match client-side to show only for this benefit card
          const response = await employeeBenefitApi.getAllReimbursementRequests(
            {
              employeeId,
              limit: 100, // Fetch enough to filter
            }
          );

          const allRequests = response.items || [];
          const filteredHistory = allRequests.filter(
            r =>
              r.employeeBenefitId === benefitAssignmentId &&
              r.status !== 'cancelled'
          );

          setReimbursementHistory(filteredHistory);
        } catch (error) {
          console.error('Failed to fetch reimbursement history', error);
          setReimbursementHistory([]);
        } finally {
          setLoadingHistory(false);
        }
      } else {
        setReimbursementHistory([]);
      }
    } catch {
      // Keep previous selection if details fetch fails
    } finally {
      setBenefitLoading(false);
    }
  };

  const handleDeleteBenefitClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBenefit?.benefitAssignmentId) return;
    setOpenDeleteDialog(false);

    try {
      await employeeBenefitApi.cancelEmployeeBenefit(
        selectedBenefit.benefitAssignmentId
      );
      showError(new Error('Benefit cancelled successfully!'));
      setOpenBenefitDialog(false);
      await fetchEmployees();
    } catch {
      showError('Failed to cancel benefit.');
    }
  };

  const filteredEmployees = employees
    .map(emp => {
      const benefitsArray = Array.isArray(emp.benefits) ? emp.benefits : [];

      const filteredBenefits =
        selectedStatus === 'all'
          ? benefitsArray
          : benefitsArray.filter(b => {
              const effectiveStatus =
                b.status === 'inactive'
                  ? 'inactive'
                  : b.statusOfAssignment || b.status || '';
              return effectiveStatus === selectedStatus;
            });

      return {
        ...emp,
        benefits: filteredBenefits,
      };
    })
    .filter(emp => selectedStatus === 'all' || emp.benefits.length > 0);

  // Reset to page 1 when status filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedStatus]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const csvEscape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleDownload = async () => {
    try {
      // Admin-side: use backend export endpoint /employee-benefits/export/employees
      if (!isManager) {
        const statusParam = selectedStatus === 'all' ? undefined : selectedStatus;
        const blob = await employeeBenefitApi.exportEmployeesBenefits({
          status: statusParam,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', 'Employee_Benefits.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // Manager side: keep existing frontend-generated CSV behavior
      if (!filteredEmployees.length) {
        alert('No data to download.');
        return;
      }

      const csvHeader = [
        'Employee Name',
        'Department',
        'Designation',
        'Benefit Name',
        'Benefit Status',
      ];

      const rows: string[] = [];

      filteredEmployees.forEach(emp => {
        if (emp.benefits?.length > 0) {
          emp.benefits.forEach(benefit => {
            rows.push(
              [
                csvEscape(emp.employeeName),
                csvEscape(emp.department),
                csvEscape(emp.designation),
                csvEscape(benefit.name),
                csvEscape(benefit.statusOfAssignment),
              ].join(',')
            );
          });
        } else {
          rows.push(
            [
              csvEscape(emp.employeeName),
              csvEscape(emp.department),
              csvEscape(emp.designation),
              'N/A',
              'No Benefits',
            ].join(',')
          );
        }
      });

      const csvContent = [csvHeader.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', 'Employee_Benefits.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      showError('An error occurred while downloading the CSV.');
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant='h4'
          fontWeight={600}
          fontSize={{ xs: '32px', lg: '48px' }}
          mb={1}
        >
          Employees Benefits
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box
            sx={{
              minWidth: { xs: '100%', sm: 200 },
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <AppDropdown
              showLabel={false}
              options={[
                { value: 'all', label: 'All Benefits' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'expired', label: 'Expired' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              label='Benefit Status'
              value={selectedStatus}
              onChange={e => {
                const v = e.target.value as string;
                setSelectedStatus(
                  (v === '' ? 'all' : v) as
                    | 'all'
                    | 'active'
                    | 'inactive'
                    | 'expired'
                    | 'cancelled'
                );
              }}
              containerSx={{
                minWidth: { xs: '100%', sm: 200 },
                width: { xs: '100%', sm: 'auto' },
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <AppButton
              variantType='primary'
              startIcon={<AddIcon />}
              onClick={() => setOpenForm(true)}
              sx={{
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 400,
                fontSize: 'var(--body-font-size)',
                lineHeight: 'var(--body-line-height)',
                letterSpacing: 'var(--body-letter-spacing)',
                bgcolor: 'var(--primary-dark-color)',
                color: '#FFFFFF',
                boxShadow: 'none',
                minWidth: { xs: 'auto', sm: 200 },
                width: { xs: '100%', sm: 'auto' },
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.75, sm: 1 },
                '& .MuiButton-startIcon': {
                  marginRight: { xs: 0.5, sm: 1 },
                  '& > *:nth-of-type(1)': {
                    fontSize: { xs: '18px', sm: '20px' },
                  },
                },
              }}
            >
              Assign Benefit
            </AppButton>

            {isManager ? (
              <AppButton
                variant='contained'
                variantType='primary'
                onClick={handleDownload}
                sx={{
                  borderRadius: '6px',
                  padding: '6px',
                  height: 'auto',
                  width: 'auto',
                  alignSelf: 'flex-start',
                }}
                aria-label='Download employee benefits CSV'
              >
                <FileDownloadIcon aria-hidden='true' />
              </AppButton>
            ) : (
              <Tooltip title='Download Employee Benefits'>
                <IconButton
                  onClick={handleDownload}
                  aria-label='Download employee benefits CSV'
                  disableRipple
                  sx={{
                    backgroundColor: 'var(--primary-dark-color)',
                    padding: '6px',
                    color: 'white',
                    width: 'auto',
                    alignSelf: 'flex-start',
                    borderRadius: { xs: '8px', sm: '6px' },
                    '&:hover': { backgroundColor: 'var(--primary-dark-color)' },
                  }}
                >
                  <FileDownloadIcon aria-hidden='true' />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: 0,
          borderColor: 'divider',
          backgroundColor: 'transparent',
        }}
      >
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress
              size={28}
              sx={{ color: 'var(--primary-dark-color)' }}
            />
          </Box>
        ) : (
          <AppTable>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 600 }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  Assigned Benefits
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(emp => (
                  <TableRow key={emp.employeeId}>
                    <TableCell>{emp.employeeName}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell>{emp.designation}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {emp.benefits.map(b => {
                          const effectiveStatus =
                            b.status === 'inactive'
                              ? 'inactive'
                              : b.statusOfAssignment || b.status || '';
                          return (
                            <Chip
                              key={b.benefitAssignmentId}
                              label={b.name}
                              color={
                                effectiveStatus === 'active'
                                  ? 'success'
                                  : effectiveStatus === 'expired' ||
                                      effectiveStatus === 'inactive'
                                    ? 'default'
                                    : 'warning'
                              }
                              variant='outlined'
                              size='small'
                              sx={{ cursor: 'pointer' }}
                              onClick={() =>
                                handleBenefitClick(
                                  b.id,
                                  effectiveStatus,
                                  b.benefitAssignmentId,
                                  emp.employeeId,
                                  b.startDate,
                                  b.endDate
                                )
                              }
                            />
                          );
                        })}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align='center'>
                    No employees with {selectedStatus} benefits
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </AppTable>
        )}
      </Paper>

      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' alignItems='center' py={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {(selectedStatus === 'all' ? totalRecords : filteredEmployees.length) > 0 && (
        <Box display='flex' justifyContent='center' my={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {page} of {totalPages} ({selectedStatus === 'all' ? totalRecords : filteredEmployees.length} total records)
          </Typography>
        </Box>
      )}

      <AssignEmployeeBenefit
        open={openForm}
        onClose={() => setOpenForm(false)}
        onAssigned={() => {
          fetchEmployees(page, selectedStatus);
          showSuccess('Benefit assigned successfully!');
        }}
      />

      <AppFormModal
        open={openBenefitDialog}
        onClose={() => setOpenBenefitDialog(false)}
        title={selectedBenefit?.name || 'Benefit Details'}
        cancelLabel='Close'
        showSubmitButton={false}
        maxWidth='md'
        onSubmit={() => {}}
        paperSx={{
          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
          width: '100%',
          maxWidth: '800px',
        }}
      >
        {benefitLoading ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : selectedBenefit ? (
          <Stack spacing={3}>
            {/* Status Header */}
            <Box>
              <Typography
                variant='body2'
                sx={{ color: theme.palette.text.secondary }}
              >
                Status:{' '}
                <Chip
                  label={
                    selectedBenefit.employeeStatus || selectedBenefit.status
                  }
                  size='small'
                  color={
                    (selectedBenefit.employeeStatus ||
                      selectedBenefit.status) === 'active'
                      ? 'success'
                      : 'default'
                  }
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>

            {/* Details Grid */}
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor:
                    theme.palette.mode === 'dark' ? '#121212' : '#f8f9fa',
                  borderRadius: 2,
                }}
              >
                <Typography variant='caption' color='textSecondary'>
                  Type
                </Typography>
                <Typography variant='subtitle1' fontWeight={600}>
                  {selectedBenefit.type || '-'}
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor:
                    theme.palette.mode === 'dark' ? '#121212' : '#f8f9fa',
                  borderRadius: 2,
                }}
              >
                <Typography variant='caption' color='textSecondary'>
                  Start Date
                </Typography>
                <Typography variant='subtitle1' fontWeight={600}>
                  {formatDate(selectedBenefit.startDate || '')}
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor:
                    theme.palette.mode === 'dark' ? '#121212' : '#f8f9fa',
                  borderRadius: 2,
                }}
              >
                <Typography variant='caption' color='textSecondary'>
                  End Date
                </Typography>
                <Typography variant='subtitle1' fontWeight={600}>
                  {formatDate((selectedBenefit.endDate as string) || '')}
                </Typography>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor:
                    theme.palette.mode === 'dark' ? '#121212' : '#f8f9fa',
                  borderRadius: 2,
                }}
              >
                <Typography variant='caption' color='textSecondary'>
                  Eligibility
                </Typography>
                <Typography
                  variant='subtitle1'
                  fontWeight={600}
                  sx={{ fontSize: '0.9rem' }}
                >
                  {selectedBenefit.eligibilityCriteria || '-'}
                </Typography>
              </Paper>
            </Box>

            {/* Description */}
            {selectedBenefit.description && (
              <Box>
                <Typography variant='subtitle2' fontWeight={600} gutterBottom>
                  Description
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor:
                      theme.palette.mode === 'dark' ? '#121212' : '#f8f9fa',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant='body2'>
                    {selectedBenefit.description}
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Reimbursement History */}
            <Box>
              <Typography variant='subtitle1' fontWeight={600} gutterBottom>
                Reimbursement History
              </Typography>
              <Paper
                sx={{
                  width: '100%',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size='small' sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
                        <TableCell>Date</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Proof</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loadingHistory ? (
                        <TableRow>
                          <TableCell colSpan={6} align='center'>
                            <CircularProgress size={20} />
                          </TableCell>
                        </TableRow>
                      ) : reimbursementHistory.length > 0 ? (
                        reimbursementHistory.map(item => (
                          <TableRow key={item.id} hover>
                            <TableCell>{formatDate(item.createdAt)}</TableCell>
                            <TableCell>{item.amount}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.status}
                                size='small'
                                color={
                                  item.status === 'approved'
                                    ? 'success'
                                    : item.status === 'rejected'
                                      ? 'error'
                                      : 'warning'
                                }
                              />
                            </TableCell>
                            <TableCell
                              sx={{
                                maxWidth: 200,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              <Tooltip
                                title={
                                  (item.details || item.description || '') +
                                  (item.status === 'rejected' &&
                                  item.reviewRemarks
                                    ? ` \nRejection Reason: ${item.reviewRemarks}`
                                    : '')
                                }
                              >
                                <span
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                  }}
                                >
                                  <span>
                                    {item.details || item.description || '-'}
                                  </span>
                                  {item.status === 'rejected' &&
                                    item.reviewRemarks && (
                                      <span
                                        style={{
                                          color: 'red',
                                          fontSize: '0.8em',
                                          marginTop: '4px',
                                        }}
                                      >
                                        Reason: {item.reviewRemarks}
                                      </span>
                                    )}
                                </span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              {item.proofDocuments &&
                              item.proofDocuments.length > 0
                                ? item.proofDocuments
                                    .slice(-1)
                                    .map((doc: string, idx: number) => (
                                      <a
                                        key={idx}
                                        href={getFileUrl(doc)}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                          display: 'block',
                                          fontSize: '12px',
                                          color: '#1976d2',
                                          textDecoration: 'underline',
                                        }}
                                      >
                                        View Proof
                                      </a>
                                    ))
                                : 'No Proof'}
                            </TableCell>
                            <TableCell>
                              {item.status === 'pending' && (
                                <Box display='flex' gap={1}>
                                  <Tooltip title='Approve'>
                                    <IconButton
                                      size='small'
                                      color='success'
                                      onClick={() =>
                                        handleReviewClick(item.id, 'approved')
                                      }
                                    >
                                      <CheckIcon fontSize='small' />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title='Reject'>
                                    <IconButton
                                      size='small'
                                      color='error'
                                      onClick={() =>
                                        handleReviewClick(item.id, 'rejected')
                                      }
                                    >
                                      <CloseIcon fontSize='small' />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align='center'>
                            No requests found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Paper>
            </Box>

            {/* Cancel Benefit Action */}
            {selectedBenefit?.employeeStatus === 'active' && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Button
                  variant='outlined'
                  color='error'
                  onClick={handleDeleteBenefitClick}
                >
                  Cancel Benefit Assignment
                </Button>
              </Box>
            )}
          </Stack>
        ) : (
          <Typography sx={{ p: 2 }}>No benefit details available</Typography>
        )}
      </AppFormModal>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Cancel Benefit</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this benefit? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color='primary'>
            No
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color='error'
            variant='contained'
          >
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => !reviewLoading && setReviewDialogOpen(false)}
      >
        <DialogTitle>
          {reviewStatus === 'approved' ? 'Approve Request' : 'Reject Request'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide remarks for this action.
            {reviewStatus === 'rejected' && ' (Required)'}
          </DialogContentText>
          <TextField
            autoFocus
            margin='dense'
            label='Review Remarks'
            fullWidth
            multiline
            rows={3}
            variant='outlined'
            value={reviewRemarks}
            onChange={e => setReviewRemarks(e.target.value)}
            required={reviewStatus === 'rejected'}
            error={reviewStatus === 'rejected' && !reviewRemarks.trim()}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setReviewDialogOpen(false)}
            color='inherit'
            disabled={reviewLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReviewSubmit}
            color={reviewStatus === 'approved' ? 'success' : 'error'}
            variant='contained'
            disabled={reviewLoading}
          >
            {reviewLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default EmployeeBenefits;
