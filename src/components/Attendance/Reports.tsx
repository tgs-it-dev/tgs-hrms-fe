import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  IconButton,
  Pagination,
  useTheme,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import {
  leaveReportApi,
  type EmployeeReport,
  type LeaveSummaryItem,
  type LeaveReportMember,
} from '../../api/leaveReportApi';
import employeeApi from '../../api/employeeApi';
import AppCard from '../common/AppCard';
import AppTable from '../common/AppTable';
import AppPageTitle from '../common/AppPageTitle';
import AppDropdown from '../common/AppDropdown';
import { getYear } from 'date-fns';
import type { SelectChangeEvent } from '@mui/material/Select';

const getCardStyle = () => ({
  flex: '1 1 calc(33.33% - 16px)',
  minWidth: '250px',
  boxShadow: 'none',
  borderRadius: '0.5rem',
  backgroundColor: 'background.paper',
});

interface LeaveBalance {
  leaveTypeName: string;
  used: number;
  remaining: number;
  maxDaysPerYear: number;
  carryForward: boolean;
}

const yearOptions = Array.from({ length: 11 }, (_, i) => {
  const year = getYear(new Date()) - 5 + i;
  return { label: year.toString(), value: year };
}).reverse();

const Reports: React.FC = () => {
  const [tab] = useState(0);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [allLeaveReports, setAllLeaveReports] = useState<EmployeeReport[]>([]);
  const [page, setPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [, setTotalRecords] = useState(0);
  const [paginationLimit, setPaginationLimit] = useState(25); // Backend limit, default 25
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [allEmployees, setAllEmployees] = useState<
    Array<{ id: string; name: string; firstName: string }>
  >([]);
  const [, setTeamSummary] = useState<LeaveReportMember[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    userId: string | null;
    isManager: boolean;
    isHrAdmin: boolean;
    isAdmin: boolean;
    isSystemAdmin: boolean;
  } | null>(null);

  const theme = useTheme();

  useEffect(() => {
    try {
      const info = leaveReportApi.getUserInfo();
      setUserInfo(info);
    } catch (err) {
      console.error('[Reports] Failed to load user information', err);
      setError('Failed to load user information');
      setUserInfo({
        userId: null,
        isManager: false,
        isHrAdmin: false,
        isAdmin: false,
        isSystemAdmin: false,
      });
    }
  }, []);

  const { userId, isManager, isHrAdmin, isAdmin, isSystemAdmin } = userInfo || {
    userId: null,
    isManager: false,
    isHrAdmin: false,
    isAdmin: false,
    isSystemAdmin: false,
  };

  const isAdminView = isHrAdmin || isAdmin || isSystemAdmin;

  // Fetch all employees for admin/HR admin view
  useEffect(() => {
    const fetchAllEmployees = async () => {
      if (!isAdminView) {
        setAllEmployees([]);
        return;
      }

      try {
        setLoadingEmployees(true);
        const employees = await employeeApi.getAllEmployeesWithoutPagination();
        setAllEmployees(
          employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            firstName: emp.firstName || emp.name.split(' ')[0],
          }))
        );
      } catch (err) {
        console.error('Error fetching all employees:', err);
        setAllEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (userInfo) {
      fetchAllEmployees();
    }
  }, [isAdminView, userInfo]);

  // handleTabChange removed — `tab` is not dynamically changed in this component

  const handleYearChange = (
    event: SelectChangeEvent<string | number | string[]>
  ) => {
    const value = event.target.value;
    const single = Array.isArray(value) ? value[0] : value;
    setSelectedYear(Number(single));
  };

  const handleEmployeeChange = (
    event: SelectChangeEvent<string | number | string[]>
  ) => {
    const value = event.target.value;
    const single = Array.isArray(value) ? value[0] : value;
    setSelectedEmployee(single === 'all' ? null : String(single));
  };

  const filteredEmployeeReports = useMemo(() => {
    return allLeaveReports || [];
  }, [allLeaveReports]);

  const handleExport = async () => {
    try {
      let blob;

      if (isAdminView) {
        blob = await leaveReportApi.exportAllLeaveReports({
          year: selectedYear,
          employeeName: selectedEmployee || undefined,
        });
      } else {
        if (tab === 0) blob = await leaveReportApi.exportLeaveBalanceCSV();
        if (isManager && tab === 1)
          blob = await leaveReportApi.exportTeamLeaveSummaryCSV(
            undefined as unknown as number,
            selectedYear
          );
      }

      if (blob) {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `Leave_Report_${now.toISOString().slice(0, 10)}.csv`;
        link.click();
      }
    } catch (err) {
      console.error('[Reports] Export failed', err);
      // Silently fail export; user can retry
    }
  };

  const fetchAllLeaveReports = async () => {
    try {
      setLoadingTab(true);

      // First, fetch page 1 to get total pages and limit
      let allEmployeeReports: EmployeeReport[] = [];
      let paginationLimit = 25;
      let totalPagesFromBackend = 1;
      const firstPageData = await leaveReportApi.getAllLeaveReports(
        1,
        undefined,
        selectedYear,
        selectedEmployee || undefined
      );

      // Extract limit and total pages from first page
      if (
        firstPageData.employeeReports &&
        typeof firstPageData.employeeReports === 'object' &&
        'items' in firstPageData.employeeReports
      ) {
        const reportsObj = firstPageData.employeeReports as {
          items: EmployeeReport[];
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        };
        paginationLimit = reportsObj.limit || firstPageData.limit || 25;
        totalPagesFromBackend =
          reportsObj.totalPages || firstPageData.totalPages || 1;

        // Get first page employees
        if (reportsObj.items && reportsObj.items.length > 0) {
          allEmployeeReports = [...reportsObj.items];
        }
      } else if (Array.isArray(firstPageData.employeeReports)) {
        allEmployeeReports = [...firstPageData.employeeReports];
        paginationLimit = firstPageData.limit || 25;
        totalPagesFromBackend = firstPageData.totalPages || 1;
      }

      // Fetch all remaining pages if there are more pages
      if (totalPagesFromBackend > 1) {
        for (let page = 2; page <= totalPagesFromBackend; page++) {
          try {
            const pageData = await leaveReportApi.getAllLeaveReports(
              page,
              undefined,
              selectedYear,
              selectedEmployee || undefined
            );

            let pageEmployeeReports: EmployeeReport[] = [];
            if (
              pageData.employeeReports &&
              typeof pageData.employeeReports === 'object' &&
              'items' in pageData.employeeReports
            ) {
              const reportsObj = pageData.employeeReports as {
                items: EmployeeReport[];
              };
              pageEmployeeReports = reportsObj.items || [];
            } else if (Array.isArray(pageData.employeeReports)) {
              pageEmployeeReports = pageData.employeeReports;
            }

            if (pageEmployeeReports.length > 0) {
              allEmployeeReports = [
                ...allEmployeeReports,
                ...pageEmployeeReports,
              ];
            }
          } catch (err) {
            console.error('[Reports] Failed to fetch page, continuing', err);
            // Continue with next page even if one fails
          }
        }
      }

      // Store all fetched records
      setAllLeaveReports(allEmployeeReports);
      setPaginationLimit(paginationLimit);
      const totalLeaveTypeRows = allEmployeeReports.reduce((total, emp) => {
        return (
          total +
          (emp.leaveSummary && emp.leaveSummary.length > 0
            ? emp.leaveSummary.length
            : 1)
        );
      }, 0);
      const ITEMS_PER_PAGE_LEAVE_ROWS = paginationLimit || 25;
      const finalTotalPages = Math.ceil(
        totalLeaveTypeRows / ITEMS_PER_PAGE_LEAVE_ROWS
      );

      setTotalPages(Math.max(1, finalTotalPages));
      setTotalRecords(totalLeaveTypeRows);

      setPage(1);

      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    if (!userInfo || !userInfo.userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setError(null);

        if (isAdminView) {
          // fetchAllLeaveReports handles its own loading state
          // Fetch all records from backend, then paginate leave type rows client-side
          await fetchAllLeaveReports();
        } else {
          // For tab changes, use tab-specific loading instead of full page loading
          setLoadingTab(true);
          if (tab === 0) {
            const data = await leaveReportApi.getLeaveBalance();
            setLeaveBalance(data.balances || []);
          } else if (isManager && tab === 1) {
            const data = await leaveReportApi.getTeamLeaveSummary(
              undefined as unknown as number,
              selectedYear
            );
            setTeamSummary(data.teamMembers || []);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        if (!isAdminView) {
          setLoadingTab(false);
        }
      }
    };

    fetchData();
    // Remove 'page' from dependencies - we use client-side pagination for leave type rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, userInfo, isAdminView, isManager, selectedYear, selectedEmployee]);

  // Reset employee filter when month/year changes
  useEffect(() => {
    setPage(1);
  }, [selectedYear]);

  if (!userInfo) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight={400}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!userId) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight={400}
      >
        <Typography color='error'>User not found. Please re-login.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='60vh'
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
          width: '100%',
        }}
      >
        <AppPageTitle>Leave Reports</AppPageTitle>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' },
          }}
        >
          {isAdminView && (
            <AppDropdown
              label='Employee'
              showLabel={false}
              value={selectedEmployee || 'all'}
              onChange={handleEmployeeChange}
              options={[
                { label: 'All Employees', value: 'all' },
                ...allEmployees.map(emp => ({
                  label: emp.name,
                  value: emp.name,
                })),
              ]}
              placeholder='Select Employee'
              containerSx={{ minWidth: { xs: '100%', sm: 200 } }}
              inputBackgroundColor={theme.palette.background.paper}
              loading={loadingEmployees}
            />
          )}

          {isAdminView && (
            <AppDropdown
              label='Year'
              showLabel={false}
              value={selectedYear}
              onChange={handleYearChange}
              options={yearOptions}
              placeholder='Select Year'
              containerSx={{ minWidth: { xs: '100%', sm: 150 } }}
              inputBackgroundColor={theme.palette.background.paper}
            />
          )}

          {/* Employee filter removed per request */}

          {(isAdminView || isManager) && (
            <Tooltip title='Export CSV'>
              <IconButton
                color='primary'
                onClick={handleExport}
                sx={{
                  backgroundColor: 'var(--primary-dark-color)',
                  borderRadius: '6px',
                  color: 'white',
                  '&:hover': { backgroundColor: 'var(--primary-dark-color)' },
                }}
              >
                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {isAdminView && (
        <Box>
          {error && <Typography color='error'>{error}</Typography>}
          <AppCard
            sx={{
              padding: 0,
              backgroundColor: 'background.paper',
            }}
          >
            <AppTable tableProps={{ sx: { minWidth: 1100 } }}>
              <TableHead sx={{ backgroundColor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    <b>Employee Name</b>
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    <b>Department</b>
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    <b>Designation</b>
                  </TableCell>
                  <TableCell sx={{ color: theme.palette.text.primary }}>
                    <b>Leave Type</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Total</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Used</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Remaining</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Approved Days</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Pending Days</b>
                  </TableCell>
                  <TableCell
                    align='center'
                    sx={{ color: theme.palette.text.primary }}
                  >
                    <b>Rejected Days</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingTab ? (
                  <TableRow
                    sx={{
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <TableCell
                      colSpan={11}
                      align='center'
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredEmployeeReports.length === 0 ? (
                  <TableRow
                    sx={{
                      backgroundColor: 'background.paper',
                    }}
                  >
                    <TableCell
                      colSpan={11}
                      align='center'
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      No leave reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    // Flatten all leave type rows first
                    type LeaveTypeRow = {
                      employeeId: string;
                      employeeName: string;
                      department: string;
                      designation: string;
                      summary: LeaveSummaryItem | null;
                      index: number;
                      key: string;
                    };

                    const allLeaveTypeRows: LeaveTypeRow[] =
                      filteredEmployeeReports.flatMap(emp => {
                        if (emp.leaveSummary && emp.leaveSummary.length > 0) {
                          return emp.leaveSummary.map(
                            (summary, index): LeaveTypeRow => ({
                              employeeId: emp.employeeId,
                              employeeName: emp.employeeName,
                              department: emp.department,
                              designation: emp.designation,
                              summary: summary,
                              index,
                              key: `${emp.employeeId}-${index}`,
                            })
                          );
                        } else {
                          return [
                            {
                              employeeId: emp.employeeId,
                              employeeName: emp.employeeName,
                              department: emp.department,
                              designation: emp.designation,
                              summary: null,
                              index: -1,
                              key: `${emp.employeeId}-no-leaves`,
                            } as LeaveTypeRow,
                          ];
                        }
                      });

                    // Paginate the flattened leave type rows using backend limit
                    const ITEMS_PER_PAGE = paginationLimit || 25;
                    const startIndex = (page - 1) * ITEMS_PER_PAGE;
                    const endIndex = startIndex + ITEMS_PER_PAGE;
                    const paginatedRows = allLeaveTypeRows.slice(
                      startIndex,
                      endIndex
                    );

                    return paginatedRows.map((row: LeaveTypeRow) =>
                      row.summary ? (
                        <TableRow
                          key={row.key}
                          sx={{
                            backgroundColor: 'background.paper',
                            '&:hover': {
                              backgroundColor: 'background.default',
                            },
                          }}
                        >
                          <TableCell
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.employeeName}
                          </TableCell>
                          <TableCell
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.department}
                          </TableCell>
                          <TableCell
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.designation}
                          </TableCell>
                          <TableCell
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.leaveTypeName
                              ? row.summary.leaveTypeName
                                  .charAt(0)
                                  .toUpperCase() +
                                row.summary.leaveTypeName.slice(1)
                              : ''}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.maxDaysPerYear}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.totalDays ?? 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.remainingDays ?? 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.approvedDays ?? 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.pendingDays ?? 0}
                          </TableCell>
                          <TableCell
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.summary.rejectedDays ?? 0}
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow
                          key={row.key}
                          sx={{
                            backgroundColor: 'background.paper',
                          }}
                        >
                          <TableCell
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.employeeName}
                          </TableCell>
                          <TableCell
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.department}
                          </TableCell>
                          <TableCell
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            {row.designation}
                          </TableCell>
                          <TableCell
                            colSpan={8}
                            align='center'
                            sx={{ color: theme.palette.text.secondary }}
                          >
                            No leave data available
                          </TableCell>
                        </TableRow>
                      )
                    );
                  })()
                )}
              </TableBody>
            </AppTable>
          </AppCard>

          {(() => {
            // Calculate all leave type rows for pagination logic
            type LeaveTypeRow = {
              employeeId: string;
              employeeName: string;
              department: string;
              designation: string;
              summary: LeaveSummaryItem | null;
              index: number;
              key: string;
            };

            const allLeaveTypeRows: LeaveTypeRow[] =
              filteredEmployeeReports.flatMap(emp => {
                if (emp.leaveSummary && emp.leaveSummary.length > 0) {
                  return emp.leaveSummary.map(
                    (summary, index): LeaveTypeRow => ({
                      employeeId: emp.employeeId,
                      employeeName: emp.employeeName,
                      department: emp.department,
                      designation: emp.designation,
                      summary: summary,
                      index,
                      key: `${emp.employeeId}-${index}`,
                    })
                  );
                } else {
                  return [
                    {
                      employeeId: emp.employeeId,
                      employeeName: emp.employeeName,
                      department: emp.department,
                      designation: emp.designation,
                      summary: null,
                      index: -1,
                      key: `${emp.employeeId}-no-leaves`,
                    } as LeaveTypeRow,
                  ];
                }
              });

            // Use backend limit (stored in state) or default to 25
            const ITEMS_PER_PAGE = paginationLimit || 25;
            const totalLeaveTypeRows = allLeaveTypeRows.length;
            const calculatedTotalPages = Math.ceil(
              totalLeaveTypeRows / ITEMS_PER_PAGE
            );

            // Get current page rows
            const startIndex = (page - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const currentPageRows = allLeaveTypeRows.slice(
              startIndex,
              endIndex
            );
            const currentPageRowsCount = currentPageRows.length;

            // Pagination buttons logic:
            // - On first page: Only show if current page has full limit (to indicate more pages exist)
            // - On other pages (including last page): Always show if there are multiple pages
            // This allows navigation between pages even from the last page
            const shouldShowPagination =
              calculatedTotalPages > 1 &&
              (page === 1
                ? currentPageRowsCount === ITEMS_PER_PAGE // First page: only show if full limit
                : true); // Other pages: always show if totalPages > 1

            return (
              <>
                {shouldShowPagination && (
                  <Box display='flex' justifyContent='center' mt={2}>
                    <Pagination
                      count={calculatedTotalPages}
                      page={page}
                      onChange={(_, value) => setPage(value)}
                      color='primary'
                      shape='rounded'
                      size='small'
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: '50%',
                          minWidth: 32,
                          height: 32,
                        },
                      }}
                    />
                  </Box>
                )}
                {totalLeaveTypeRows > 0 && (
                  <Box display='flex' justifyContent='center' mt={1}>
                    <Typography
                      variant='body2'
                      sx={{ color: 'text.secondary' }}
                    >
                      Showing page {page} of {calculatedTotalPages} (
                      {totalLeaveTypeRows} total records)
                    </Typography>
                  </Box>
                )}
              </>
            );
          })()}
        </Box>
      )}

      {!isAdminView && (
        <>
          {loadingTab ? (
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              py={4}
            >
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                {leaveBalance.map((item, idx) => (
                  <AppCard key={idx} compact sx={getCardStyle()}>
                    <Typography
                      sx={{ color: theme.palette.text.primary }}
                      gutterBottom
                    >
                      {item.leaveTypeName
                        ? item.leaveTypeName.charAt(0).toUpperCase() +
                          item.leaveTypeName.slice(1)
                        : ''}
                    </Typography>
                    <Typography
                      variant='h4'
                      fontWeight={600}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      {item.remaining}
                    </Typography>
                    <Typography
                      sx={{ color: theme.palette.text.primary }}
                      variant='body2'
                    >
                      Used: {item.used} / {item.maxDaysPerYear}
                    </Typography>
                  </AppCard>
                ))}
              </Box>

              <AppCard
                sx={{
                  p: 0,
                  boxShadow: 'none',
                  backgroundColor: 'unset',
                  overflowX: 'auto',
                }}
              >
                <AppTable tableProps={{ sx: { minWidth: 650 } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'background.paper' }}>
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Leave Type
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Max Days
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Used
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Remaining
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary }}>
                        Carry Forward
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveBalance.map((item, idx) => (
                      <TableRow
                        key={idx}
                        hover
                        sx={{
                          backgroundColor: 'background.paper',
                        }}
                      >
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.leaveTypeName
                            ? item.leaveTypeName.charAt(0).toUpperCase() +
                              item.leaveTypeName.slice(1)
                            : ''}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.maxDaysPerYear}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.used}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.remaining}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary }}>
                          {item.carryForward ? 'Yes' : 'No'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </AppTable>
              </AppCard>
            </>
          )}
        </>
      )}
    </Box>
  );
};

export default Reports;
