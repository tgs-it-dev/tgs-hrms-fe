import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Tooltip,
  IconButton,
  Pagination,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import attendanceSummaryApi from '../../api/reportApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import { PAGINATION } from '../../constants/appConstants';
import AppTable from '../common/AppTable';
import AppDropdown from '../common/AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';
import AppPageTitle from '../common/AppPageTitle';
import { useUser } from '../../hooks/useUser';

interface AttendanceSummaryItem {
  employeeName?: string;
  department?: string;
  designation?: string;
  workingDays?: number;
  presents?: number;
  absents?: number;
  informedLeaves?: number;
}

const AttendanceSummaryReport: React.FC = () => {
  const { user } = useUser();
  const [summaryData, setSummaryData] = useState<AttendanceSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'thisMonth' | 'prevMonth' | '60days' | '90days'
  >('thisMonth');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;
  const { snackbar, showError, showSuccess, showWarning, closeSnackbar } =
    useErrorHandler();

  // Fetch attendance summary with pagination
  const fetchSummary = useCallback(
    async (page: number = 1) => {
      const tenantId = user?.tenant || localStorage.getItem('tenant_id');
      if (!tenantId) {
        setSummaryData([]);
        setLoading(false);
        showError('User tenant not found. Please log in again.');
        return;
      }

      setLoading(true);
      try {
        const getDaysRange = () => {
          switch (filter) {
            case 'thisMonth':
              return new Date().getDate();
            case 'prevMonth': {
              const lastMonth = new Date();
              lastMonth.setMonth(lastMonth.getMonth() - 1);
              return new Date(
                lastMonth.getFullYear(),
                lastMonth.getMonth() + 1,
                0
              ).getDate();
            }
            case '60days':
              return 60;
            case '90days':
              return 90;
            default:
              return 30;
          }
        };
        const days = getDaysRange();
        const resp = await attendanceSummaryApi.getAttendanceSummary(
          tenantId,
          days,
          page
        );

        let items: AttendanceSummaryItem[] = [];
        let paginationInfo = {
          total: 0,
          page: 1,
          limit: 25,
          totalPages: 1,
        };

        // Handle paginated response
        if (resp && typeof resp === 'object' && 'items' in resp) {
          items = (resp.items || []) as AttendanceSummaryItem[];
          paginationInfo = {
            total: resp.total || 0,
            page: resp.page || page,
            limit: resp.limit || 25,
            totalPages: resp.totalPages || 1,
          };
        } else if (Array.isArray(resp)) {
          items = resp as AttendanceSummaryItem[];
          paginationInfo = {
            total: items.length,
            page: 1,
            limit: 25,
            totalPages: 1,
          };
        } else if (resp && typeof resp === 'object' && 'data' in resp) {
          const data = (resp as Record<string, unknown>).data;
          if (Array.isArray(data)) {
            items = data as AttendanceSummaryItem[];
            paginationInfo = {
              total: items.length,
              page: 1,
              limit: 25,
              totalPages: 1,
            };
          }
        }

        // Backend returns 25 records per page (fixed page size)
        // If we get 25 records, there might be more pages
        // If we get less than 25, it's the last page
        const hasMorePages = items.length === itemsPerPage;

        // Use backend pagination info if available, otherwise estimate
        if (paginationInfo.total && paginationInfo.totalPages) {
          setTotalPages(paginationInfo.totalPages);
          setTotalRecords(paginationInfo.total);
        } else {
          // Fallback: estimate based on current page and records received
          setTotalPages(hasMorePages ? page + 1 : page);
          setTotalRecords(
            hasMorePages
              ? page * itemsPerPage
              : (page - 1) * itemsPerPage + items.length
          );
        }

        setSummaryData(items);
      } catch (err) {
        setSummaryData([]);
        showError(err);
      } finally {
        setLoading(false);
      }
    },
    [filter, itemsPerPage, showError, user]
  );

  // Fetch when filter changes, reset to page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Fetch when page or filter changes
  useEffect(() => {
    fetchSummary(currentPage);
  }, [currentPage, filter, fetchSummary]);

  // Handle page change
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
  };

  const safeData = Array.isArray(summaryData) ? summaryData : [];

  const csvEscape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleDownload = () => {
    if (safeData.length === 0) {
      showWarning('No data to download.');
      return;
    }

    const csvHeader = [
      'Employee Name',
      'Department',
      'Designation',
      'Working Days',
      'Presents',
      'Absents',
      'Informed Leaves',
    ];

    const rows = safeData.map(row =>
      [
        csvEscape(row.employeeName),
        csvEscape(row.department),
        csvEscape(row.designation),
        csvEscape(row.workingDays),
        csvEscape(row.presents),
        csvEscape(row.absents),
        csvEscape(row.informedLeaves),
      ].join(',')
    );

    const csvContent = [csvHeader.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const label =
      filter === 'thisMonth'
        ? 'ThisMonth'
        : filter === 'prevMonth'
          ? 'PreviousMonth'
          : filter === '60days'
            ? 'Last60Days'
            : 'Last90Days';

    a.setAttribute('download', `AttendanceSummary_${label}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('CSV file downloaded successfully.');
  };

  return (
    <Box>
      <AppPageTitle>Attendance Summary Report</AppPageTitle>

      <Box
        display='flex'
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'stretch', sm: 'center' }}
        gap={2}
      >
        <AppDropdown
          label='Filter'
          value={filter}
          onChange={(e: SelectChangeEvent<string | number>) => {
            setFilter(
              e.target.value as 'thisMonth' | 'prevMonth' | '60days' | '90days'
            );
          }}
          options={[
            { value: 'thisMonth', label: 'This Month' },
            { value: 'prevMonth', label: 'Previous Month' },
            { value: '60days', label: 'Last 60 Days' },
            { value: '90days', label: 'Last 90 Days' },
          ]}
          containerSx={{
            width: { xs: '100%', sm: '200px' },
            minWidth: { xs: '100%', sm: '200px' },
            maxWidth: { xs: '100%', sm: '200px' },
            flexShrink: 0,
          }}
        />

        <Tooltip title='Export All Attendance'>
          <IconButton
            color='primary'
            onClick={handleDownload}
            sx={{
              backgroundColor: '#3083DC',
              borderRadius: '6px',
              padding: '6px',
              color: 'white',
              width: 40,
              '&:hover': {
                backgroundColor: '#3083DC',
              },
            }}
          >
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='200px'
        >
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          sx={{ mt: 2, boxShadow: 'none', backgroundColor: 'transparent' }}
        >
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Employee Name</b>
                </TableCell>
                <TableCell>
                  <b>Department</b>
                </TableCell>
                <TableCell>
                  <b>Designation</b>
                </TableCell>
                <TableCell align='center'>
                  <b>Working Days</b>
                </TableCell>
                <TableCell align='center'>
                  <b>Presents</b>
                </TableCell>
                <TableCell align='center'>
                  <b>Absents</b>
                </TableCell>
                <TableCell align='center'>
                  <b>Informed Leaves</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {safeData.length > 0 ? (
                safeData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.employeeName ?? '--'}</TableCell>
                    <TableCell>{row.department ?? '--'}</TableCell>
                    <TableCell>{row.designation ?? '--'}</TableCell>
                    <TableCell align='center'>
                      {row.workingDays ?? '--'}
                    </TableCell>
                    <TableCell align='center'>{row.presents ?? '--'}</TableCell>
                    <TableCell align='center'>{row.absents ?? '--'}</TableCell>
                    <TableCell align='center'>
                      {row.informedLeaves ?? '--'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No data found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </AppTable>
        </Paper>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Pagination Info */}
      {safeData.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1} mb={2}>
          <Typography
            fontWeight={400}
            fontSize='16px'
            lineHeight='24px'
            letterSpacing='-1%'
            color='#2C2C2C'
          >
            Showing page {currentPage} of {totalPages} ({totalRecords} total
            records)
          </Typography>
        </Box>
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

export default AttendanceSummaryReport;
