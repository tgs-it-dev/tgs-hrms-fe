import React, { useState, useMemo, useEffect } from 'react';
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Pagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import type { Leave } from '../../types/leave';
import { formatDate } from '../../utils/dateUtils';
import { leaveApi } from '../../api/leaveApi';
import { PAGINATION } from '../../constants/appConstants';
import AppTable from '../common/AppTable';
import AppDropdown from '../common/AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';
import { getIcon } from '../../assets/icons';
import { IoCloseCircleOutline } from 'react-icons/io5';
import LeaveForm from './LeaveForm';
import { env } from '../../config/env';
import { authService } from '../../api/authService';
import ErrorSnackbar from '../common/ErrorSnackbar';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import MonthPicker from '../common/MonthPicker';

const ITEMS_PER_PAGE = PAGINATION.DEFAULT_PAGE_SIZE;

// Helper function to construct full URL for documents with authentication
const getDocumentUrl = (docUrl: string): string => {
  if (!docUrl) return '';
  // If it's already an absolute URL (starts with http:// or https://), return as is
  if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) {
    return docUrl;
  }

  // Get token for authentication
  const token = authService.getAccessToken();
  const timestamp = Date.now();

  const baseUrl = docUrl.startsWith('/')
    ? `${env.apiBaseUrl}${docUrl}`
    : `${env.apiBaseUrl}/${docUrl}`;

  const separator = baseUrl.includes('?') ? '&' : '?';
  const params = [`t=${timestamp}`];
  if (token) {
    params.push(`token=${encodeURIComponent(token)}`);
  }

  return `${baseUrl}${separator}${params.join('&')}`;
};

const statusConfig: Record<
  string,
  {
    color: 'success' | 'error' | 'warning' | 'default';
    icon: React.ReactElement | undefined;
  }
> = {
  pending: {
    color: 'warning',
    icon: <AccessTimeIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  processing: {
    color: 'warning',
    icon: <AccessTimeIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  approved: {
    color: 'success',
    icon: <CheckCircleIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  rejected: {
    color: 'error',
    icon: <CancelIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  withdrawn: {
    color: 'default',
    icon: <UndoIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
};

interface LeaveHistoryProps {
  leaves: Leave[];
  isAdmin: boolean;
  isManager?: boolean;
  currentUserId?: string;
  onAction?: (id: string, action: 'approved' | 'rejected') => void;
  onManagerAction?: (id: string, action: 'approved' | 'rejected') => void;
  onManagerResponse?: (id: string) => void;
  onWithdraw?: (id: string) => void;
  title?: string;
  showNames?: boolean;
  viewMode?: 'you' | 'team';
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  onExportAll?: () => Promise<Leave[]>;
  userRole?: string;
  onRefresh?: () => Promise<void> | void;
  dateFilter?: string;
  onDateFilterChange?: (filter: string) => void;
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({
  leaves,
  isAdmin,
  isManager = false,
  currentUserId,
  onAction,
  onManagerAction,
  onManagerResponse,
  onWithdraw,
  title = 'Leave History',
  showNames = false,
  viewMode = 'you',
  currentPage: serverCurrentPage = 1,
  totalPages: serverTotalPages = 1,
  onPageChange,
  isLoading = false,
  onExportAll,
  userRole,
  onRefresh,
  dateFilter,
  onDateFilterChange,
}) => {
  const hideActionColumn = userRole === 'hr-admin';

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [page, setPage] = useState(1);
  const [allLeavesForFilter, setAllLeavesForFilter] = useState<Leave[]>([]);
  const [loadingAllLeaves, setLoadingAllLeaves] = useState(false);
  const [openDocs, setOpenDocs] = useState(false);
  const [currentDocs, setCurrentDocs] = useState<string[]>([]);
  const [, setCurrentLeaveId] = useState<string>('');
  const [openLeaveForm, setOpenLeaveForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLeaveForMenu, setSelectedLeaveForMenu] =
    useState<Leave | null>(null);

  const { snackbar, showSuccess, showError, closeSnackbar } = useErrorHandler();
  const theme = useTheme();
  // Reset page to 1 when employee filter changes
  useEffect(() => {
    // If server-side pagination is active, tell the parent to reset to page 1.
    // Otherwise reset local page state.
    const useServerPagination = !!onPageChange && serverTotalPages > 0;
    if (selectedEmployee === '') {
      if (useServerPagination && onPageChange) {
        onPageChange(1);
      } else {
        setPage(1);
      }
    } else {
      // When filtering to a specific employee, always show first page of filtered results
      setPage(1);
    }
  }, [selectedEmployee, onPageChange, serverTotalPages]);

  // Fetch all leaves when employee filter is applied (for admin)
  useEffect(() => {
    const fetchAllLeavesForFilter = async () => {
      if (isAdmin && selectedEmployee !== '' && onExportAll) {
        try {
          setLoadingAllLeaves(true);
          const allLeaves = await onExportAll();
          setAllLeavesForFilter(allLeaves);
        } catch {
          setAllLeavesForFilter([]);
        } finally {
          setLoadingAllLeaves(false);
        }
      } else {
        setAllLeavesForFilter([]);
      }
    };

    fetchAllLeavesForFilter();
  }, [selectedEmployee, isAdmin, onExportAll]);

  // Also fetch all leaves once (for admin) to populate the "All Employees" dropdown
  // so it shows employees from all pages rather than only current page.
  useEffect(() => {
    let mounted = true;
    const fetchAllOnce = async () => {
      if (isAdmin && onExportAll && allLeavesForFilter.length === 0) {
        try {
          setLoadingAllLeaves(true);
          const allLeaves = await onExportAll();
          if (mounted) setAllLeavesForFilter(allLeaves);
        } catch {
          if (mounted) setAllLeavesForFilter([]);
        } finally {
          if (mounted) setLoadingAllLeaves(false);
        }
      }
    };

    fetchAllOnce();
    return () => {
      mounted = false;
    };
  }, [isAdmin, onExportAll, allLeavesForFilter.length]);

  const hideNameColumn = isManager && viewMode === 'you';
  const hideDropdown = isManager && viewMode === 'you';

  // Use all leaves when employee is filtered, otherwise use current page leaves
  const leavesToUse = useMemo(() => {
    if (isAdmin && selectedEmployee !== '' && allLeavesForFilter.length > 0) {
      return allLeavesForFilter;
    }
    return leaves;
  }, [isAdmin, selectedEmployee, allLeavesForFilter, leaves]);

  const employeeNames = useMemo(() => {
    const names = new Set<string>();
    const source =
      isAdmin && allLeavesForFilter && allLeavesForFilter.length > 0
        ? allLeavesForFilter
        : leavesToUse;
    source.forEach(l => {
      const empId = l.employee?.id || l.employeeId;
      const name = l.employee?.first_name;
      if (empId && name && empId !== currentUserId) names.add(name);
    });
    return Array.from(names);
  }, [leavesToUse, allLeavesForFilter, isAdmin, currentUserId]);

  const leavesInSelectedMonth = useMemo(() => {
    if (!dateFilter || !/^\d{4}-\d{2}$/.test(dateFilter)) return leavesToUse;
    const [y, m] = dateFilter.split('-').map(Number);
    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0);
    return leavesToUse.filter(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return leaveStart <= endOfMonth && leaveEnd >= startOfMonth;
    });
  }, [leavesToUse, dateFilter]);

  const filteredLeaves = useMemo(() => {
    if (isManager && viewMode === 'you') {
      return leavesInSelectedMonth.filter(
        l => l.employee?.id === currentUserId || l.employeeId === currentUserId
      );
    }

    if (selectedEmployee === '') return leavesInSelectedMonth;

    return leavesInSelectedMonth.filter(
      leave => leave.employee?.first_name === selectedEmployee
    );
  }, [
    selectedEmployee,
    leavesInSelectedMonth,
    isManager,
    viewMode,
    currentUserId,
  ]);

  // Check if an employee is selected (for admin filtering)
  const isEmployeeFiltered = isAdmin && selectedEmployee !== '';

  // When employee is filtered, disable server pagination and use client-side filtering
  // This ensures we can filter all available leaves, not just the current page
  const useServerPagination =
    !isEmployeeFiltered && !!onPageChange && serverTotalPages > 0;
  const currentPage = useServerPagination ? serverCurrentPage : page;

  // When employee is filtered, calculate pagination based on filtered results
  const filteredTotalItems = filteredLeaves.length;
  const totalPages = useServerPagination
    ? serverTotalPages
    : Math.max(1, Math.ceil(filteredTotalItems / ITEMS_PER_PAGE));

  // Use normal pagination for all cases
  const paginatedLeaves = useServerPagination
    ? filteredLeaves
    : filteredLeaves.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (useServerPagination && onPageChange) {
      onPageChange(newPage);
    } else {
      setPage(newPage);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleEditLeave = (leave: Leave) => {
    setEditingLeave(leave);
    setOpenLeaveForm(true);
  };

  const handleCloseLeaveForm = () => {
    setOpenLeaveForm(false);
    setEditingLeave(null);
  };

  const handleDownloadCSV = async () => {
    if (exporting) return;

    try {
      setExporting(true);
      let blob: Blob;
      let filename = 'leave-history.csv';

      // Determine which API to call based on user role and view mode
      const role = userRole || '';
      const isAdminRole = [
        'hr-admin',
        'system-admin',
        'admin',
        'network-admin',
      ].includes(role);

      if (isAdminRole) {
        // Admin/HR Admin/Network Admin - export all leaves for tenant
        let month: number | undefined;
        let year: number | undefined;
        if (dateFilter && /^\d{4}-\d{2}$/.test(dateFilter)) {
          const [y, m] = dateFilter.split('-').map(Number);
          year = y;
          month = m;
        }
        blob = await leaveApi.exportAllLeavesCSV({
          month,
          year,
          name: selectedEmployee?.trim() || undefined,
        });
        filename = 'all-leaves-export.csv';
      } else if (isManager && viewMode === 'team') {
        // Manager viewing team leaves - export team leave requests
        blob = await leaveApi.exportTeamLeavesCSV();
        filename = 'team-leaves-export.csv';
      } else {
        // Employee or Manager viewing own leaves - export self leave requests
        blob = await leaveApi.exportSelfLeavesCSV();
        filename = 'my-leaves-export.csv';
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export leave history. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleViewDocs = (leaveId: string, docs: string[]) => {
    setCurrentLeaveId(leaveId);
    setCurrentDocs(docs);
    setFailedImages(new Set()); // Reset failed images when opening dialog
    setOpenDocs(true);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    leave: Leave
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedLeaveForMenu(leave);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedLeaveForMenu(null);
  };

  const refreshLeaves = async () => {
    // If parent provides a refresh callback, use it (silent reload)
    if (onRefresh) {
      try {
        await onRefresh();
        return;
      } catch (err) {
        console.error('Failed to refresh leaves:', err);
      }
    }

    // Fallback to existing logic
    if (isEmployeeFiltered && onExportAll) {
      try {
        const allLeaves = await onExportAll();
        setAllLeavesForFilter(allLeaves);
      } catch (err) {
        console.error('Failed to refresh leaves:', err);
      }
    } else if (!isEmployeeFiltered && onPageChange) {
      onPageChange(currentPage);
    }
  };

  if (!Array.isArray(leaves)) {
    return (
      <Box>
        <Typography color='error'>Error: Invalid leaves data</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mt: 1,
          mb: 2,
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon
            sx={{
              fontSize: 32,
              mr: 1,
              color: 'var(--primary-dark-color)',
            }}
          />
          <Typography variant='h5' fontWeight={600}>
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' },
            flexWrap: 'wrap',
          }}
        >
          {isAdmin && onDateFilterChange && (
            <MonthPicker
              value={dateFilter ?? ''}
              onChange={onDateFilterChange}
              label='Month'
            />
          )}

          {!hideDropdown && (isAdmin || isManager) && (
            <AppDropdown
              label='All Employees'
              showLabel={false}
              value={selectedEmployee || ''}
              onChange={(e: SelectChangeEvent<string | number>) => {
                const val = String(e.target.value || '');
                setSelectedEmployee(val);
                // When selecting "All Employees", clear the month filter
                // so calendar shows no month selected.
                if (val === '' && onDateFilterChange) {
                  onDateFilterChange('');
                }
              }}
              options={[
                { value: '', label: 'All Employees' },
                ...employeeNames.map(name => ({ value: name, label: name })),
              ]}
              placeholder='All Employees'
              containerSx={{
                width: { xs: '100%', sm: 220 },
                minWidth: { xs: '100%', sm: 220 },
                maxWidth: { xs: '100%', sm: 220 },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                },
                '& .MuiInputBase-input': { padding: '10px 14px' },
                '& .MuiSelect-select': { padding: '10px 14px' },
              }}
            />
          )}

          <Tooltip
            title={exporting ? 'Exporting...' : 'Export All Leave History'}
          >
            <IconButton
              color='primary'
              onClick={handleDownloadCSV}
              disabled={exporting}
              sx={{
                backgroundColor: 'var(--primary-dark-color)',
                borderRadius: '6px',
                padding: '6px',
                color: 'var(--white-color)',
                '&:hover': {
                  backgroundColor: 'var(--primary-dark-color)',
                },
                '&:disabled': {
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--primary-dark-color)',
                },
              }}
            >
              {exporting ? (
                <CircularProgress size={20} sx={{ color: 'currentColor' }} />
              ) : (
                <FileDownloadIcon />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading || loadingAllLeaves ? (
        <Paper elevation={1} sx={{ boxShadow: 'none', py: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Paper>
      ) : filteredLeaves.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant='h6' color='textSecondary' gutterBottom>
            No Leave History Found
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            {isManager && viewMode === 'you'
              ? "You haven't applied for any leaves yet."
              : 'No leave requests available.'}
          </Typography>
        </Box>
      ) : (
        <AppTable>
          <TableHead>
            <TableRow>
              {!hideNameColumn && (isAdmin || isManager || showNames) && (
                <TableCell>Name</TableCell>
              )}
              <TableCell>Type</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>Applied</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Documents</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Remarks</TableCell>
              {!hideActionColumn && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedLeaves.map((leave, index) => (
              <TableRow key={leave.id || index}>
                {!hideNameColumn && (isAdmin || isManager || showNames) && (
                  <TableCell>{leave.employee?.first_name || 'N/A'}</TableCell>
                )}
                <TableCell>
                  {(leave.leaveType?.name || 'Unknown').replace(/^./, c =>
                    c.toUpperCase()
                  )}
                </TableCell>
                <TableCell>{formatDate(leave.startDate)}</TableCell>
                <TableCell>{formatDate(leave.endDate)}</TableCell>
                <TableCell>{formatDate(leave.createdAt)}</TableCell>
                <TableCell>
                  <Tooltip title={leave.reason || 'N/A'} placement='top' arrow>
                    <Typography
                      sx={{
                        fontSize: 14,
                        maxWidth: { xs: 120, sm: 200, md: 260 },
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {leave.reason || 'N/A'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {leave.documents && leave.documents.length > 0 ? (
                    <IconButton
                      onClick={() =>
                        handleViewDocs(leave.id, leave.documents || [])
                      }
                    >
                      <img
                        src={getIcon('password')}
                        alt='View Documents'
                        width={20}
                        height={20}
                      />
                    </IconButton>
                  ) : (
                    <span
                      style={{
                        fontStyle: 'italic',
                        color: theme.palette.text.secondary,
                      }}
                    >
                      No Documents
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      leave.status
                        ? leave.status.charAt(0).toUpperCase() +
                          leave.status.slice(1)
                        : 'Unknown'
                    }
                    color={statusConfig[leave.status]?.color}
                    sx={{ fontSize: 15, width: '100%' }}
                  />
                </TableCell>
                <TableCell>
                  {(() => {
                    const remarksList = [];
                    if (leave.managerRemarks)
                      remarksList.push(`Manager: ${leave.managerRemarks}`);
                    if (leave.remarks)
                      remarksList.push(`Admin/HR: ${leave.remarks}`);

                    const displayText =
                      leave.managerRemarks || leave.remarks || '';

                    if (!displayText) {
                      return (
                        <Typography
                          variant='body2'
                          sx={{
                            color: theme.palette.text.secondary,
                            fontStyle: 'italic',
                            fontSize: 13,
                          }}
                        >
                          -
                        </Typography>
                      );
                    }

                    return (
                      <Tooltip
                        title={
                          <div style={{ whiteSpace: 'pre-wrap' }}>
                            {remarksList.join('\n')}
                          </div>
                        }
                        arrow
                      >
                        <Typography
                          variant='body2'
                          sx={{
                            fontSize: 13,
                            maxWidth: { xs: 100, sm: 150, md: 200 },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            cursor: 'help',
                          }}
                        >
                          {displayText}
                        </Typography>
                      </Tooltip>
                    );
                  })()}
                </TableCell>
                {!hideActionColumn && (
                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Remarks moved to dedicated column */}

                      {/* Show action menu icon if there are any actions available */}
                      {(() => {
                        const isManagerOwnLeave =
                          isManager &&
                          viewMode === 'you' &&
                          (leave.employee?.id === currentUserId ||
                            leave.employeeId === currentUserId);

                        const isPendingOrProcessing = [
                          'pending',
                          'processing',
                        ].includes(leave.status);

                        const hasActions =
                          // Admin actions
                          (isAdmin &&
                            isPendingOrProcessing &&
                            (onAction || onWithdraw)) ||
                          // Manager team actions
                          (isManager &&
                            viewMode === 'team' &&
                            isPendingOrProcessing &&
                            (onManagerAction ||
                              onManagerResponse ||
                              onWithdraw)) ||
                          // Manager own leave actions (edit and withdraw)
                          (isManagerOwnLeave &&
                            isPendingOrProcessing &&
                            (onWithdraw || true)) || // Always allow edit for manager's own leaves
                          // Employee actions
                          (!isAdmin &&
                            !isManager &&
                            isPendingOrProcessing &&
                            onWithdraw);

                        if (!hasActions) return null;

                        return (
                          <>
                            <IconButton
                              size='small'
                              onClick={e => handleMenuClick(e, leave)}
                              aria-label={`Actions for leave ${leave.id}`}
                              aria-haspopup='true'
                              aria-expanded={
                                Boolean(menuAnchorEl) &&
                                selectedLeaveForMenu?.id === leave.id
                              }
                              sx={{
                                color: theme.palette.text.primary,
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                },
                              }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                            <Menu
                              anchorEl={menuAnchorEl}
                              open={
                                Boolean(menuAnchorEl) &&
                                selectedLeaveForMenu?.id === leave.id
                              }
                              onClose={handleMenuClose}
                            >
                              {/* Admin actions for pending leaves */}
                              {isAdmin && isPendingOrProcessing && onAction && (
                                <>
                                  <MenuItem
                                    onClick={() => {
                                      onAction(leave.id, 'approved');
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <CheckCircleIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>Approve</ListItemText>
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      onAction(leave.id, 'rejected');
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <CancelIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>Reject</ListItemText>
                                  </MenuItem>
                                </>
                              )}

                              {/* Edit option for admin on pending leaves */}
                              {isAdmin &&
                                isPendingOrProcessing &&
                                onWithdraw && (
                                  <MenuItem
                                    onClick={() => {
                                      handleEditLeave(leave);
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <EditIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>Edit</ListItemText>
                                  </MenuItem>
                                )}

                              {/* Manager team actions */}
                              {isManager &&
                                viewMode === 'team' &&
                                isPendingOrProcessing &&
                                onManagerAction && (
                                  <>
                                    <MenuItem
                                      onClick={() => {
                                        onManagerAction(leave.id, 'approved');
                                        handleMenuClose();
                                      }}
                                    >
                                      <ListItemIcon>
                                        <CheckCircleIcon fontSize='small' />
                                      </ListItemIcon>
                                      <ListItemText>Processing</ListItemText>
                                    </MenuItem>
                                    <MenuItem
                                      onClick={() => {
                                        onManagerAction(leave.id, 'rejected');
                                        handleMenuClose();
                                      }}
                                    >
                                      <ListItemIcon>
                                        <CancelIcon fontSize='small' />
                                      </ListItemIcon>
                                      <ListItemText>Reject</ListItemText>
                                    </MenuItem>
                                  </>
                                )}

                              {/* Manager response option */}
                              {isManager &&
                                viewMode === 'team' &&
                                isPendingOrProcessing &&
                                !onManagerAction &&
                                !leave.managerRemarks &&
                                onManagerResponse && (
                                  <MenuItem
                                    onClick={() => {
                                      onManagerResponse(leave.id);
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <EditIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>
                                      Manager Response
                                    </ListItemText>
                                  </MenuItem>
                                )}

                              {/* Edit option for manager's own pending leaves */}
                              {isManager &&
                                viewMode === 'you' &&
                                isPendingOrProcessing &&
                                (leave.employee?.id === currentUserId ||
                                  leave.employeeId === currentUserId) && (
                                  <MenuItem
                                    onClick={() => {
                                      handleEditLeave(leave);
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <EditIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>Edit</ListItemText>
                                  </MenuItem>
                                )}

                              {/* Withdraw option for pending leaves */}
                              {((isAdmin &&
                                isPendingOrProcessing &&
                                onWithdraw) ||
                                (isManager &&
                                  viewMode === 'you' &&
                                  isPendingOrProcessing &&
                                  onWithdraw) ||
                                (!isAdmin &&
                                  !isManager &&
                                  isPendingOrProcessing &&
                                  onWithdraw)) && (
                                <MenuItem
                                  onClick={() => {
                                    if (onWithdraw) {
                                      onWithdraw(leave.id);
                                    }
                                    handleMenuClose();
                                  }}
                                >
                                  <ListItemIcon>
                                    <UndoIcon fontSize='small' />
                                  </ListItemIcon>
                                  <ListItemText>Withdraw</ListItemText>
                                </MenuItem>
                              )}

                              {/* Edit option for employees on pending leaves */}
                              {!isAdmin &&
                                !isManager &&
                                isPendingOrProcessing &&
                                onWithdraw && (
                                  <MenuItem
                                    onClick={() => {
                                      handleEditLeave(leave);
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <EditIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>Edit</ListItemText>
                                  </MenuItem>
                                )}
                            </Menu>
                          </>
                        );
                      })()}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </AppTable>
      )}

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
          const shouldShowPagination = isEmployeeFiltered
            ? filteredTotalItems > ITEMS_PER_PAGE
            : totalPages > 1;

          return shouldShowPagination ? (
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, newPage) => handlePageChange(newPage)}
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

        {paginatedLeaves.length > 0 && (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{
              textAlign: 'center',
              width: 'fit-content',
              mx: 'auto',
            }}
          >
            {useServerPagination
              ? `Showing page ${currentPage} of ${totalPages} (${paginatedLeaves.length} total records)`
              : `Showing page ${page} of ${totalPages} (${paginatedLeaves.length} total records)`}
          </Typography>
        )}
      </Box>
      <Dialog
        open={openDocs}
        onClose={() => setOpenDocs(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant='h6'>Uploaded Documents</Typography>
          <IconButton onClick={() => setOpenDocs(false)}>
            <IoCloseCircleOutline />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 2,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {currentDocs.map((doc, index) => {
              const imageUrl = getDocumentUrl(doc);

              return (
                <Box key={index}>
                  {!failedImages.has(index) ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={`document-${index}`}
                        style={{
                          width: '100%',
                          height: 120,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: `1px solid ${theme.palette.divider}`,
                          cursor: 'pointer',
                        }}
                        onError={() => {
                          setFailedImages(prev => new Set(prev).add(index));
                        }}
                      />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 0.5,
                        }}
                      >
                        <Typography
                          variant='caption'
                          sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            mx: 0.5,
                          }}
                          onClick={() => window.open(imageUrl, '_blank')}
                        >
                          View /
                        </Typography>

                        <Typography
                          variant='caption'
                          sx={{ cursor: 'pointer', color: 'primary.main' }}
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.download = `document-${index}`;
                            link.click();
                          }}
                        >
                          Download
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Typography variant='caption' color='error'>
                      Failed to load
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>
      {openLeaveForm && editingLeave && (
        <Dialog
          open={openLeaveForm}
          onClose={handleCloseLeaveForm}
          maxWidth='sm'
          fullWidth
        >
          <LeaveForm
            mode='edit'
            leaveId={editingLeave.id}
            initialData={editingLeave}
            onSuccess={() => {
              showSuccess('Leave updated successfully');
              refreshLeaves();
              handleCloseLeaveForm();
            }}
            onError={msg => showError(msg)}
          />
        </Dialog>
      )}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default LeaveHistory;
