import React, { useState, useEffect, useCallback, useRef } from 'react';
import LeaveForm from './LeaveForm';
import LeaveHistory from './LeaveHistory';
import LeaveApprovalDialog from './LeaveApprovalDialog';
import { leaveApi } from '../../api/leaveApi';
import LeaveTypeFormModal, {
  type LeaveTypeFormValues,
} from './LeaveTypeFormModal';
import type { Leave } from '../../types/leave';
import type { LeaveStatus } from '../../type/levetypes';
import { getUserName, getUserRole } from '../../utils/auth';
import { useUser } from '../../hooks/useUser';
import { normalizeRole } from '../../utils/permissions';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AppButton from '../common/AppButton';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';
import ErrorSnackbar from '../common/ErrorSnackbar';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  useLeaveTypes,
  useLeaveEmployeeList,
  useLeaveList,
} from './useLeaveQueries';

const LeaveRequestPage = () => {
  // Local leaves state — populated from query data, also used for optimistic updates
  // during approve/reject/withdraw so the table reflects changes immediately.
  const [leaves, setLeaves] = useState<Leave[]>([]);

  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('history');

  const [currentPage, setCurrentPage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(
    null
  );
  const [isManagerAction, setIsManagerAction] = useState(false);
  const [managerResponseDialogOpen, setManagerResponseDialogOpen] =
    useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [leaveTypeModalOpen, setLeaveTypeModalOpen] = useState(false);
  const [savingLeaveType, setSavingLeaveType] = useState(false);

  const [viewMode, setViewMode] = useState<'team' | 'you'>('you');
  // Default dateFilter is empty so admin users can see ALL leaves by default.
  // Non-admin users will be initialized to current month below.
  const [dateFilter, setDateFilter] = useState<string>('');

  const { user: currentUser } = useUser();
  const currentUserId = currentUser?.id ?? '';
  const role = normalizeRole(getUserRole());
  const userName = getUserName();

  // MIGRATED: employees list now owned by TanStack Query
  const { data: employeesData = [] } = useLeaveEmployeeList(role);
  const employees = employeesData;

  // MIGRATED: leave types now pre-fetched by TanStack Query
  useLeaveTypes();

  // If user is not admin/HR/system, default date filter to current month
  useEffect(() => {
    const adminRoles = ['system-admin', 'network-admin', 'admin', 'hr-admin'];
    if (!adminRoles.includes(role) && !dateFilter) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      setDateFilter(`${y}-${m}`);
    }
  }, [role, dateFilter]);

  // Reset to page 1 when the manager toggles between "Your Leaves" / "Team Leaves"
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  // ---------------------------------------------------------------------------
  // MIGRATED: leave list data now owned by useLeaveList TanStack Query hook.
  // The hook re-runs automatically whenever role/viewMode/page/dateFilter change.
  // ---------------------------------------------------------------------------
  const effectiveViewMode = role === 'manager' ? viewMode : 'you';
  const {
    data: leaveListData,
    isLoading: initialLoading,
    isFetching,
    refetch: refetchLeaves,
  } = useLeaveList({
    role,
    viewMode: effectiveViewMode,
    page: currentPage,
    dateFilter,
    currentUserId,
  });

  // tableLoading is true on background re-fetches (page/filter changes after first load)
  const tableLoading = isFetching && !initialLoading;

  const totalPages = leaveListData?.totalPages ?? 1;
  const totalItems = leaveListData?.totalItems ?? 0;

  // Sync local leaves from query result; local state is also mutated for optimistic updates.
  const prevLeaveListDataRef = useRef(leaveListData);
  useEffect(() => {
    if (leaveListData && leaveListData !== prevLeaveListDataRef.current) {
      prevLeaveListDataRef.current = leaveListData;
      setLeaves(leaveListData.leaves);
    }
  }, [leaveListData]);

  const handleDateFilterChange = (filter: string) => {
    setDateFilter(filter);
    setCurrentPage(1);
  };

  // Currently selected leave (used for dialogs like manager response)
  const selectedLeave = selectedId
    ? leaves.find(l => l.id === selectedId)
    : undefined;

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      if (axiosError.response?.data?.message)
        return axiosError.response.data.message;
    }
    return '';
  };

  const handleCreateLeaveType = async (values: LeaveTypeFormValues) => {
    try {
      setSavingLeaveType(true);
      await leaveApi.createLeaveType(values);
      showSuccess('Leave type created successfully!');
      setLeaveTypeModalOpen(false);
      // Leave types are kept fresh by TanStack Query (useLeaveTypes hook) — no manual refetch needed
    } catch (error: unknown) {
      showError(getErrorMessage(error) || 'Failed to create leave type');
    } finally {
      setSavingLeaveType(false);
    }
  };

  // Handle apply leave (called after successful API in form)
  const handleApply = async () => {
    try {
      showSuccess('Leave applied successfully!');
      await refetchLeaves();
      setActiveTab('history');
    } catch (error: unknown) {
      showError(getErrorMessage(error) || 'Failed to apply leave');
    }
  };

  const handleApplyError = (message: string) => {
    showError(message || 'Failed to apply leave');
  };

  // Handle approve/reject
  const handleConfirm = async (reason?: string) => {
    if (!selectedId || !actionType) return;
    // Snapshot current leaves in case we need to revert on error
    const prevLeavesSnapshot = leaves;

    // If manager approves, optimistically set status to 'processing' immediately
    if (isManagerAction && actionType === 'approved') {
      setLeaves(prev =>
        prev.map(l =>
          l.id === selectedId
            ? {
                ...l,
                status: 'processing',
                managerRemarks: reason ?? l.managerRemarks,
              }
            : l
        )
      );
    }

    try {
      if (isManagerAction) {
        // Manager approval/rejection
        if (actionType === 'approved') {
          await leaveApi.approveLeaveByManager(
            selectedId,
            reason?.trim() ? { remarks: reason.trim() } : undefined
          );
          // Keep status as 'processing' for manager approvals (final approval comes from admin)
        } else {
          if (!reason || !reason.trim()) {
            // revert optimistic update if any
            setLeaves(prevLeavesSnapshot);
            showError('Rejection remarks are required');
            return;
          }
          await leaveApi.rejectLeaveByManager(selectedId, {
            remarks: reason.trim(),
          });
          // Update local state for rejection
          setLeaves(prev =>
            prev.map(l =>
              l.id === selectedId
                ? { ...l, status: 'rejected', managerRemarks: reason }
                : l
            )
          );
        }
      } else {
        // Admin approval/rejection
        if (actionType === 'approved') {
          await leaveApi.approveLeave(selectedId, reason);
        } else {
          await leaveApi.rejectLeave(selectedId, reason);
        }

        // Update local state for admin actions
        setLeaves(prev =>
          prev.map(l => {
            if (l.id === selectedId) {
              const updated: Leave = {
                ...l,
                status: actionType === 'approved' ? 'approved' : 'rejected',
              };
              if (!isManagerAction && reason) {
                updated.remarks = reason;
              }
              return updated;
            }
            return l;
          })
        );
      }

      if (actionType === 'approved') {
        showSuccess('Leave action applied successfully!');
      } else {
        showError(new Error('Leave rejected successfully!'));
      }
    } catch (error: unknown) {
      // Revert optimistic update on error
      setLeaves(prevLeavesSnapshot);
      showError(getErrorMessage(error) || String(error));
    } finally {
      setDialogOpen(false);
      setActionType(null);
      setIsManagerAction(false);
      setSelectedId(null);
    }
  };

  // Withdraw leave
  const handleConfirmWithdraw = async () => {
    if (!selectedId) return;
    try {
      await leaveApi.cancelLeave(selectedId);
      showSuccess('Leave withdrawn successfully!');
      setLeaves(prev =>
        prev.map((l: Leave) =>
          l.id === selectedId ? { ...l, status: 'withdrawn' } : l
        )
      );
    } catch (error: unknown) {
      showError(getErrorMessage(error) || 'Failed to withdraw leave');
    } finally {
      setWithdrawDialogOpen(false);
      setSelectedId(null);
    }
  };

  // Open approval/reject dialog (for admin/HR admin)
  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setSelectedId(id);
    setActionType(action);
    setIsManagerAction(false);
    setDialogOpen(true);
  };

  // Open approval/reject dialog (for managers)
  const handleOpenManagerResponse = (
    id: string,
    action: 'approved' | 'rejected'
  ) => {
    setSelectedId(id);
    setActionType(action);
    setIsManagerAction(true);
    setDialogOpen(true);
  };

  // Manager approves/rejects a team leave (alias to the existing dialog flow)
  const handleManagerAction = (id: string, action: 'approved' | 'rejected') => {
    handleOpenManagerResponse(id, action);
  };

  // View manager remarks/response for a leave (opens the read-only dialog)
  const handleViewManagerResponse = (id: string) => {
    setSelectedId(id);
    setManagerResponseDialogOpen(true);
  };

  const handleWithdraw = (id: string) => {
    setSelectedId(id);
    setWithdrawDialogOpen(true);
  };

  // Fetch all leaves for export
  const _fetchAllLeavesForExport = useCallback(async (): Promise<Leave[]> => {
    // eslint-disable-next-line no-useless-catch
    try {
      const allLeaves: Leave[] = [];
      let pageNum = 1;
      let totalPagesLocal = 1;
      do {
        let res;
        if (
          ['system-admin', 'network-admin', 'admin', 'hr-admin'].includes(role)
        ) {
          res = await leaveApi.getAllLeaves(pageNum);
        } else if (role === 'manager') {
          res =
            viewMode === 'you'
              ? await leaveApi.getUserLeaves(currentUserId, pageNum)
              : await leaveApi.getTeamLeaves(pageNum);
        } else {
          res = await leaveApi.getUserLeaves(currentUserId, pageNum);
        }
        totalPagesLocal = res.totalPages || 1;
        allLeaves.push(
          ...res.items.map((leave): Leave => {
            const leaveRec = leave as unknown as Record<string, unknown>;
            const employeeId = String(
              (leaveRec.employee as Record<string, unknown> | undefined)?.id ||
                (leaveRec.user as Record<string, unknown> | undefined)?.id ||
                (leaveRec.employeeId as string | undefined) ||
                ''
            );

            const r = leaveRec.remarks;
            const remarks =
              r === null || typeof r === 'undefined' ? undefined : String(r);

            const rawStatus = String(leaveRec.status ?? '').toLowerCase();
            let normalizedStatus: LeaveStatus = 'pending';
            // Accept 'processing' as a valid intermediate status coming from backend
            if (
              rawStatus === 'pending' ||
              rawStatus === 'processing' ||
              rawStatus === 'approved' ||
              rawStatus === 'rejected' ||
              rawStatus === 'withdrawn'
            ) {
              normalizedStatus = rawStatus as LeaveStatus;
            } else if (rawStatus === 'cancelled') {
              // Backend uses 'cancelled' sometimes — map to 'rejected'
              normalizedStatus = 'rejected';
            }

            return {
              ...leave,
              employeeId,
              leaveTypeId: leaveRec.leaveTypeId
                ? String(leaveRec.leaveTypeId)
                : '',
              remarks,
              status: normalizedStatus,
            } as Leave;
          })
        );
        pageNum++;
      } while (pageNum <= totalPagesLocal);

      return Array.from(new Map(allLeaves.map(l => [l.id, l])).values());
    } catch (error) {
      // Propagate error to callers (export handlers) to show a UI message
      throw error;
    }
  }, [currentUserId, role, viewMode]);

  // Employee list fetch MIGRATED: replaced by useLeaveEmployeeList TanStack Query hook above

  if (initialLoading)
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='80vh'
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header */}
      <AppBar
        position='static'
        sx={{
          borderRadius: 1,
          backgroundColor: 'var(--primary-dark-color)',
          boxShadow: 'none',
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            textAlign: { xs: 'start', sm: 'left' },
            gap: { xs: 1, sm: 0 },
            color: 'common.white',
          }}
        >
          <Box>
            <Typography variant='h6' fontWeight={700}>
              Leave Management System
            </Typography>
            {currentUser && (
              <Typography variant='caption'>
                Logged in as: {userName} ({role})
              </Typography>
            )}
          </Box>

          {['employee', 'manager', 'admin', 'hr-admin'].includes(role) && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{
                my: { xs: 1, sm: 0 },
                gap: 1,
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                width: { xs: '100%', sm: 'auto' },
                flexWrap: 'wrap',
              }}
            >
              <AppButton
                startIcon={<AssignmentIcon sx={{ color: 'inherit' }} />}
                variant={activeTab === 'apply' ? 'contained' : 'outlined'}
                variantType={activeTab === 'apply' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('apply')}
                sx={{
                  borderRadius: '20px',
                  width: { xs: '100%', sm: 'auto' },
                  color:
                    activeTab === 'apply'
                      ? 'var(--primary-dark-color)'
                      : 'common.white',
                  backgroundColor:
                    activeTab === 'apply' ? 'background.paper' : 'transparent',
                  borderColor: 'common.white',
                }}
              >
                Apply Leave
              </AppButton>

              <AppButton
                startIcon={<HistoryIcon sx={{ color: 'inherit' }} />}
                variant={activeTab === 'history' ? 'contained' : 'outlined'}
                variantType={activeTab === 'history' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('history')}
                sx={{
                  borderRadius: '20px',
                  width: { xs: '100%', sm: 'auto' },
                  color:
                    activeTab === 'history'
                      ? 'var(--primary-dark-color)'
                      : 'common.white',
                  backgroundColor:
                    activeTab === 'history'
                      ? 'background.paper'
                      : 'transparent',
                  borderColor: 'common.white',
                  '&:hover': {
                    color:
                      activeTab === 'history'
                        ? 'var(--primary-dark-color)'
                        : 'common.white',
                    backgroundColor:
                      activeTab === 'history'
                        ? 'background.paper'
                        : 'transparent',
                    borderColor: 'common.white',
                  },
                }}
              >
                Leave History
              </AppButton>

              {[
                'admin',
                'hr-admin',
                'system-admin',
                'network-admin',
                'oe-admin',
              ].includes(role) && (
                <AppButton
                  variant='contained'
                  variantType='secondary'
                  onClick={() => setLeaveTypeModalOpen(true)}
                  sx={{
                    borderRadius: '20px',
                    width: { xs: '100%', sm: 'auto' },
                    backgroundColor: 'transparent',
                    color: 'common.white',
                    borderColor: 'common.white',
                  }}
                >
                  Create Leave Type
                </AppButton>
              )}
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ py: 3 }}>
        {activeTab === 'apply' &&
        ['employee', 'manager', 'admin', 'hr-admin'].includes(role) ? (
          <LeaveForm
            onSubmit={async formData => {
              try {
                if (role === 'admin' || role === 'hr-admin') {
                  // formData.employeeId = selected employee's EMPLOYEE id
                  const employee = employees.find(
                    e => e.id === formData.employeeId
                  );

                  if (!employee?.userId) {
                    showError('Invalid employee selected');
                    return;
                  }

                  await leaveApi.createLeaveForEmployee({
                    employeeId: employee.userId, // ✅ user_id
                    leaveTypeId: formData.leaveTypeId,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    reason: formData.reason,
                    documents: formData.documents,
                  });
                } else {
                  await leaveApi.createLeave({
                    leaveTypeId: formData.leaveTypeId,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    reason: formData.reason,
                    documents: formData.documents,
                  });
                }

                await handleApply();
              } catch (err) {
                handleApplyError(getErrorMessage(err));
              }
            }}
            onError={handleApplyError}
            employees={
              role === 'admin' || role === 'hr-admin' ? employees : undefined
            }
          />
        ) : activeTab === 'history' &&
          ['employee', 'manager'].includes(role) ? (
          <>
            {role === 'manager' && (
              <Box
                sx={{
                  mb: 2,
                  textAlign: { xs: 'left', sm: 'right' },
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                }}
              >
                <AppButton
                  variant={viewMode === 'you' ? 'contained' : 'outlined'}
                  variantType={viewMode === 'you' ? 'primary' : 'secondary'}
                  onClick={() => setViewMode('you')}
                  sx={{
                    borderRadius: '20px',
                    width: { xs: '100%', sm: 'auto' },
                    backgroundColor:
                      viewMode === 'you'
                        ? 'var(--primary-dark-color)'
                        : 'transparent',
                    color:
                      viewMode === 'you'
                        ? 'common.white'
                        : 'var(--primary-dark-color)',
                    borderColor: 'var(--primary-dark-color)',
                    '&:hover': {
                      backgroundColor:
                        viewMode === 'you'
                          ? 'var(--primary-dark-color)'
                          : '#eae7f5',
                    },
                  }}
                >
                  Your Leaves
                </AppButton>
                <AppButton
                  variant={viewMode === 'team' ? 'contained' : 'outlined'}
                  variantType={viewMode === 'team' ? 'primary' : 'secondary'}
                  onClick={() => setViewMode('team')}
                  sx={{
                    borderRadius: '20px',
                    width: { xs: '100%', sm: 'auto' },
                    backgroundColor:
                      viewMode === 'team'
                        ? 'var(--primary-dark-color)'
                        : 'transparent',
                    color:
                      viewMode === 'team'
                        ? 'common.white'
                        : 'var(--primary-dark-color)',
                    borderColor: 'var(--primary-dark-color)',
                    '&:hover': {
                      backgroundColor:
                        viewMode === 'team'
                          ? 'var(--primary-dark-color)'
                          : '#eae7f5',
                    },
                  }}
                >
                  Team Leaves
                </AppButton>
              </Box>
            )}

            <LeaveHistory
              leaves={leaves}
              isAdmin={false}
              isManager={role === 'manager'}
              currentUserId={currentUserId || undefined}
              viewMode={viewMode}
              onManagerAction={
                role === 'manager' && viewMode === 'team'
                  ? handleManagerAction
                  : undefined
              }
              onManagerResponse={
                role === 'manager' && viewMode === 'team'
                  ? handleViewManagerResponse
                  : undefined
              }
              onWithdraw={viewMode === 'you' ? handleWithdraw : undefined}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              isLoading={tableLoading}
              onExportAll={
                ['manager'].includes(role)
                  ? _fetchAllLeavesForExport
                  : undefined
              }
              userRole={role}
              onRefresh={() => void refetchLeaves()}
            />
          </>
        ) : (
          <LeaveHistory
            leaves={leaves}
            isAdmin={['hr-admin', 'system-admin', 'admin', 'oe-admin'].includes(
              role
            )}
            isManager={false}
            currentUserId={currentUserId || undefined}
            onAction={handleAction}
            onWithdraw={handleWithdraw}
            dateFilter={dateFilter}
            onDateFilterChange={handleDateFilterChange}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            isLoading={tableLoading}
            onExportAll={_fetchAllLeavesForExport}
            userRole={role}
            onRefresh={() => void refetchLeaves()}
          />
        )}
      </Box>

      <LeaveApprovalDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setActionType(null);
          setIsManagerAction(false);
          setSelectedId(null);
        }}
        onConfirm={reason => handleConfirm(reason)}
        action={actionType || 'approved'}
        allowComments={true}
        commentLabel='Remarks (Optional)'
        showRemarksField={true}
      />

      {/* Manager response dialog - shows manager remarks or response */}
      <Dialog
        open={managerResponseDialogOpen}
        onClose={() => {
          setManagerResponseDialogOpen(false);
          setSelectedId(null);
        }}
        aria-labelledby='manager-response-dialog-title'
        aria-describedby='manager-response-dialog-description'
      >
        <DialogTitle id='manager-response-dialog-title'>
          Manager Response
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='manager-response-dialog-description'>
            {selectedLeave?.managerRemarks || 'No remarks provided by manager.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <AppButton
            onClick={() => {
              setManagerResponseDialogOpen(false);
              setSelectedId(null);
            }}
            variantType='primary'
          >
            Close
          </AppButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        aria-labelledby='withdraw-dialog-title'
        aria-describedby='withdraw-dialog-description'
      >
        <DialogTitle id='withdraw-dialog-title'>
          Withdraw Leave Request
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='withdraw-dialog-description'>
            Are you sure you want to withdraw this leave request? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <AppButton
            onClick={() => setWithdrawDialogOpen(false)}
            variantType='secondary'
          >
            Cancel
          </AppButton>
          <AppButton
            onClick={handleConfirmWithdraw}
            variantType='danger'
            variant='contained'
          >
            Withdraw
          </AppButton>
        </DialogActions>
      </Dialog>

      <LeaveTypeFormModal
        open={leaveTypeModalOpen}
        onClose={() => setLeaveTypeModalOpen(false)}
        onSubmit={handleCreateLeaveType}
        isSubmitting={savingLeaveType}
      />

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default LeaveRequestPage;
