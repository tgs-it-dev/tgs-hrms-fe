import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  memo,
  useMemo,
} from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Pagination,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { Dayjs } from 'dayjs';
import Chart from 'react-apexcharts';
import { TenantLeaveApi } from '../../api/TenantLeaveApi';
import type {
  Department as ApiDepartment,
  SystemLeaveFilters,
  SystemLeaveResponse,
  SystemLeaveSummary,
} from '../../api/TenantLeaveApi';
import { departmentApiService } from '../../api/departmentApi';
import { SystemTenantApi } from '../../api/systemTenantApi';
import type { SystemTenant } from '../../api/systemTenantApi';
import { useUser } from '../../hooks/useUser';
import { isSystemAdmin } from '../../utils/auth';
import { formatDate } from '../../utils/dateUtils';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { PAGINATION } from '../../constants/appConstants';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppDropdown from '../common/AppDropdown';
import AppPageTitle from '../common/AppPageTitle';
import AppTable from '../common/AppTable';
import AppButton from '../common/AppButton';

type LeaveStatus = '' | 'pending' | 'approved' | 'rejected' | 'withdrawn';

type FiltersState = {
  tenantId: string;
  departmentId: string;
  status: LeaveStatus;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
};

type DepartmentOption = Pick<ApiDepartment, 'id' | 'name' | 'tenant_id'>;

const CrossTenantLeaveManagement: React.FC = () => {
  const { user } = useUser();
  const isSystemAdminUser = isSystemAdmin();

  const getTenantIdFromStorage = useCallback((): string => {
    try {
      const storedTenantId = localStorage.getItem('tenant_id');
      if (storedTenantId) {
        return String(storedTenantId).trim();
      }
    } catch {
      // Ignore; fall through to other sources
    }

    // Fallback: Get from user object in localStorage (login response format)
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userFromStorage = JSON.parse(userStr);
        const tenantId = userFromStorage?.tenant_id || '';
        if (tenantId) return String(tenantId).trim();
      }
    } catch {
      // Ignore; fall through to user context
    }

    // Last fallback: Get from user context
    if (user) {
      const userWithTenant = user as { tenant_id?: string; tenant?: string };
      const tenantId = userWithTenant.tenant_id || userWithTenant.tenant || '';
      if (tenantId) return String(tenantId).trim();
    }

    return '';
  }, [user]);

  const userTenantId = getTenantIdFromStorage();

  // For non-system-admin users, initialize with their tenant_id from localStorage
  const initialTenantId = isSystemAdminUser ? '' : userTenantId;

  const [filters, setFilters] = useState<FiltersState>({
    tenantId: initialTenantId,
    departmentId: '',
    status: '',
    startDate: null,
    endDate: null,
  });

  // Keep ref in sync with filters.tenantId
  useEffect(() => {
    currentTenantIdRef.current = filters.tenantId;
  }, [filters.tenantId]);

  const [tenants, setTenants] = useState<SystemTenant[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [leaves, setLeaves] = useState<SystemLeaveResponse[]>([]);
  const [summary, setSummary] = useState<SystemLeaveSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const { snackbar, showError, closeSnackbar } = useErrorHandler();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE; // Backend returns records per page
  const isInitialTenantSet = useRef(false);
  const isInitialLoad = useRef(true);
  const hasLoadedDataOnce = useRef(false);
  const isInitialMount = useRef(true);
  const currentTenantIdRef = useRef<string>('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    []
  );

  const handleFilterChange = useCallback(
    <K extends keyof FiltersState>(field: K, value: FiltersState[K]) => {
      // Admin (not system-admin) tenant change nahi kar sakta
      if (field === 'tenantId' && !isSystemAdminUser) {
        return; // Tenant change allow nahi karega
      }

      setFilters(prev => {
        if (field === 'tenantId') {
          const newTenantId = value as string;
          currentTenantIdRef.current = newTenantId;
          return {
            ...prev,
            tenantId: newTenantId,
            departmentId: '',
          };
        }

        return { ...prev, [field]: value };
      });
      setCurrentPage(1);
    },
    [isSystemAdminUser]
  );

  const handleClearFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      departmentId: '',
      status: '' as LeaveStatus,
      startDate: null,
      endDate: null,
    }));
    setCurrentPage(1);
  }, []);

  const fetchTenants = useCallback(async () => {
    try {
      const allTenants = await SystemTenantApi.getAllTenants(true);
      let filteredTenants = allTenants;
      if (!isSystemAdminUser && userTenantId) {
        filteredTenants = allTenants.filter(
          tenant => String(tenant.id).trim() === userTenantId
        );

        if (filteredTenants.length === 0) {
          showError('Your tenant is not found or inactive');
        }
      }

      setTenants(filteredTenants);

      if (filteredTenants.length > 0 && !isInitialTenantSet.current) {
        let defaultTenant: SystemTenant | undefined;

        if (!isSystemAdminUser && userTenantId) {
          defaultTenant = filteredTenants.find(
            t => String(t.id).trim() === userTenantId
          );
        } else if (isSystemAdminUser) {
          // System Admin: Select default (ibex or first) only if no tenant is selected
          const currentTenantId = currentTenantIdRef.current;
          if (!currentTenantId) {
            const ibexTech = filteredTenants.find(t =>
              t.name.toLowerCase().includes('ibex')
            );
            defaultTenant = ibexTech || filteredTenants[0];
          }
        }

        if (defaultTenant) {
          isInitialTenantSet.current = true;
          const tenantIdStr = String(defaultTenant.id).trim();
          currentTenantIdRef.current = tenantIdStr;
          setFilters(prev => ({
            ...prev,
            tenantId: tenantIdStr,
          }));
        } else if (!isSystemAdminUser && userTenantId) {
          // For non-system-admin, ensure tenant filter is set even if tenant not found in list
          // This allows the API to still filter by tenant_id
          isInitialTenantSet.current = true;
          currentTenantIdRef.current = userTenantId;
          setFilters(prev => {
            if (prev.tenantId !== userTenantId) {
              return {
                ...prev,
                tenantId: userTenantId,
              };
            }
            return prev;
          });
        }
      }
    } catch {
      showError('Failed to load tenant list');
    }
  }, [isSystemAdminUser, userTenantId, showError]);

  const fetchDepartments = useCallback(
    async (tenantId: string | null) => {
      if (!tenantId) {
        setDepartments([]);
        return;
      }

      try {
        const tenantIdStr = String(tenantId).trim();
        const res = await departmentApiService.getAllTenantsWithDepartments(
          tenantIdStr
        );

        const tenantData = res?.tenants?.find(
          t => t.tenant_id === tenantIdStr || String(t.tenant_id) === tenantIdStr
        );

        const deptList = tenantData?.departments ?? [];

        if (deptList.length > 0) {
          const normalizedDepartments: DepartmentOption[] = deptList
            .filter(
              dept =>
                dept &&
                dept.id &&
                dept.name &&
                String(dept.id).trim() !== '' &&
                String(dept.name).trim() !== ''
            )
            .map(dept => ({
              id: String(dept.id).trim(),
              name: String(dept.name).trim(),
              tenant_id: tenantIdStr,
            }));

          setDepartments(normalizedDepartments);
        } else {
          setDepartments([]);
        }
      } catch {
        // Centralized error handling
        try {
          showError('Failed to load departments');
        } catch {
          // ignore
        }
        setDepartments([]);
      }
    },
    [showError]
  );

  const fetchSummary = useCallback(
    async (tenantId?: string) => {
      try {
        let tenantIdToUse: string | undefined;
        if (!isSystemAdminUser && userTenantId) {
          tenantIdToUse = userTenantId;
        } else {
          tenantIdToUse = tenantId || filters.tenantId || undefined;
        }

        if (!tenantIdToUse) return;

        const summaryData = await TenantLeaveApi.getSystemLeaveSummary({
          tenantId: tenantIdToUse,
        });

        let filteredData = summaryData;
        if (tenantIdToUse) {
          filteredData = summaryData.filter(
            item => item.tenantId === tenantIdToUse
          );

          if (filteredData.length === 0) {
            const selectedTenant = tenants.find(t => t.id === tenantIdToUse);
            if (selectedTenant) {
              filteredData = [
                {
                  tenantId: selectedTenant.id,
                  tenantName: selectedTenant.name,
                  totalLeaves: 0,
                  approvedCount: 0,
                  rejectedCount: 0,
                  pendingCount: 0,
                  cancelledCount: 0,
                },
              ];
            }
          }
        }

        const sortedSummary = [...filteredData].sort((a, b) =>
          (a.tenantName || '').localeCompare(b.tenantName || '')
        );

        setSummary(
          sortedSummary.map(item => ({
            tenantId: item.tenantId,
            tenantName: item.tenantName || 'Unknown Tenant',
            totalLeaves: item.totalLeaves ?? 0,
            approvedCount: item.approvedCount ?? 0,
            rejectedCount: item.rejectedCount ?? 0,
            pendingCount: item.pendingCount ?? 0,
            cancelledCount: item.cancelledCount ?? 0,
          }))
        );
      } catch {
        showError('Failed to load summary');
      }
    },
    [tenants, isSystemAdminUser, userTenantId, filters.tenantId, showError]
  );

  const fetchLeaves = useCallback(async () => {
    const shouldShowFullPageLoader =
      isInitialMount.current &&
      !hasLoadedDataOnce.current &&
      !isInitialTenantSet.current;

    try {
      if (shouldShowFullPageLoader) {
        setLoading(true);
      } else {
        setTableLoading(true);
      }
      let tenantIdToUse: string | undefined;
      if (!isSystemAdminUser && userTenantId) {
        tenantIdToUse = userTenantId;
      } else {
        tenantIdToUse = filters.tenantId || undefined;
      }

      const apiFilters: SystemLeaveFilters = {
        tenantId: tenantIdToUse,
        departmentId:
          filters.departmentId && filters.departmentId.trim() !== ''
            ? filters.departmentId.trim()
            : undefined,
        status: filters.status ? filters.status : undefined,
        startDate: filters.startDate
          ? filters.startDate.format('YYYY-MM-DD')
          : undefined,
        endDate: filters.endDate
          ? filters.endDate.format('YYYY-MM-DD')
          : undefined,
        page: currentPage,
        limit: itemsPerPage,
      };

      const response = await TenantLeaveApi.getSystemLeaves(apiFilters);

      const departmentMap: Record<string, string> = {};
      departments.forEach(dept => {
        if (dept.id && dept.name) {
          departmentMap[String(dept.id).trim()] = dept.name;
        }
      });

      let mappedLeaves: SystemLeaveResponse[] = response.items.map(leave => {
        let departmentName: string | undefined = leave.departmentName;
        if (!departmentName && leave.departmentId) {
          const deptId = String(leave.departmentId).trim();
          departmentName = departmentMap[deptId] || undefined;
        }

        return {
          ...leave,
          tenantName: leave.tenantName ?? 'Unknown Tenant',
          departmentName: departmentName ?? 'N/A',
        };
      });

      // If a department is selected, ensure only that department's records are shown in the table
      const hasDepartmentFilter =
        apiFilters.departmentId && apiFilters.departmentId.trim() !== '';
      if (hasDepartmentFilter) {
        const departmentIdToFilter = apiFilters.departmentId!.trim();
        mappedLeaves = mappedLeaves.filter(
          leave => String(leave.departmentId).trim() === departmentIdToFilter
        );
      }

      setLeaves(mappedLeaves);

      // Pagination:
      // - Normal case (no department filter): trust backend totals
      // - Department filter active: use filtered count so UI pages/records match what user sees
      if (hasDepartmentFilter) {
        const totalFiltered = mappedLeaves.length;
        const pages = Math.max(
          1,
          Math.ceil(totalFiltered / (itemsPerPage || 1))
        );
        setTotalRecords(totalFiltered);
        setTotalPages(pages);
      } else {
        // Backend returns 25 records per page (fixed page size)
        const hasMorePages = mappedLeaves.length === itemsPerPage;

        // Use backend pagination info if available, otherwise estimate
        if (response.totalPages && response.total) {
          setTotalPages(response.totalPages);
          setTotalRecords(response.total);
        } else {
          // Fallback: estimate based on current page and records received
          setTotalPages(hasMorePages ? currentPage + 1 : currentPage);
          setTotalRecords(
            hasMorePages
              ? currentPage * itemsPerPage
              : (currentPage - 1) * itemsPerPage + mappedLeaves.length
          );
        }
      }

      hasLoadedDataOnce.current = true;
      if (isInitialLoad.current) isInitialLoad.current = false;
      if (isInitialMount.current) isInitialMount.current = false;
    } catch {
      showError('Failed to load leave data');
      if (isInitialLoad.current) isInitialLoad.current = false;
    } finally {
      if (shouldShowFullPageLoader) {
        setLoading(false);
      } else {
        setTableLoading(false);
      }
      setInitialDataLoaded(prev => (prev ? prev : true));
    }
  }, [
    filters.tenantId,
    filters.status,
    filters.startDate,
    filters.endDate,
    filters.departmentId,
    currentPage,
    isSystemAdminUser,
    userTenantId,
    departments,
    itemsPerPage,
    showError,
  ]);

  // Fetch tenants only once on mount
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // For non-system-admin users: ensure tenant filter is always set to their tenant_id from localStorage
  // This ensures data is always filtered by their tenant, even if tenant list hasn't loaded yet
  useEffect(() => {
    if (!isSystemAdminUser && userTenantId) {
      // Always use tenant_id from localStorage for non-system-admin users
      // Match with tenant list if available, otherwise use the tenant_id directly
      const matchedTenant = tenants.find(
        t => String(t.id).trim() === userTenantId
      );
      const tenantIdToUse = matchedTenant
        ? String(matchedTenant.id).trim()
        : userTenantId;

      if (filters.tenantId !== tenantIdToUse) {
        currentTenantIdRef.current = tenantIdToUse;
        setFilters(prev => ({
          ...prev,
          tenantId: tenantIdToUse,
        }));
      }
    }
  }, [isSystemAdminUser, userTenantId, tenants, filters.tenantId]);

  useEffect(() => {
    if (filters.tenantId) fetchDepartments(filters.tenantId);
    else setDepartments([]);
  }, [filters.tenantId, fetchDepartments]);

  // Use ref to track last fetched tenant to prevent duplicate calls
  const lastFetchedSummaryTenant = useRef<string>('');
  useEffect(() => {
    if (
      filters.tenantId &&
      filters.tenantId !== lastFetchedSummaryTenant.current
    ) {
      lastFetchedSummaryTenant.current = filters.tenantId;
      fetchSummary(filters.tenantId);
    }
  }, [filters.tenantId, fetchSummary]);

  // Use ref to track last fetched filters to prevent duplicate calls
  const lastFetchedLeavesParams = useRef<string>('');
  useEffect(() => {
    if (!filters.tenantId) return;

    const paramsKey = `${filters.tenantId}-${filters.status}-${filters.startDate?.format('YYYY-MM-DD') || ''}-${filters.endDate?.format('YYYY-MM-DD') || ''}-${filters.departmentId}-${currentPage}`;

    if (paramsKey !== lastFetchedLeavesParams.current) {
      lastFetchedLeavesParams.current = paramsKey;
      fetchLeaves();
    }
  }, [
    filters.tenantId,
    filters.status,
    filters.startDate,
    filters.endDate,
    filters.departmentId,
    currentPage,
    fetchLeaves,
  ]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) =>
    setCurrentPage(page);

  // Memoize chart options and series to prevent unnecessary re-renders
  const chartOptions = useMemo<ApexCharts.ApexOptions>(
    () => ({
      chart: {
        type: 'bar',
        stacked: !!filters.tenantId,
        toolbar: {
          show: false,
          tools: {
            download: false,
          },
        },
        zoom: { enabled: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: filters.tenantId ? '40%' : '20%',
          borderRadius: 4,
          distributed: !filters.tenantId,
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 1, colors: ['#fff'] },
      xaxis: { categories: summary.map(item => item.tenantName) },
      yaxis: { labels: { formatter: val => `${val}` } },
      legend: { position: 'top', horizontalAlign: 'right' },
    }),
    [filters.tenantId, summary]
  );

  const chartSeries = useMemo(
    () =>
      filters.tenantId
        ? [
            { name: 'Approved', data: summary.map(s => s.approvedCount) },
            { name: 'Rejected', data: summary.map(s => s.rejectedCount) },
            { name: 'Pending', data: summary.map(s => s.pendingCount) },
            { name: 'Withdrawn', data: summary.map(s => s.cancelledCount) },
          ]
        : [{ name: 'Total Leaves', data: summary.map(s => s.totalLeaves) }],
    [filters.tenantId, summary]
  );

  const ChartSection = memo(() => (
    <Paper sx={{ p: 3, mb: 3, overflowX: 'auto', boxShadow: 'none' }}>
      <Typography variant='h4' fontWeight={600} mb={2}>
        Leave Summary
      </Typography>
      <Chart
        options={chartOptions}
        series={chartSeries}
        type='bar'
        height={400}
      />
    </Paper>
  ));

  const TableSection = memo(
    ({
      tableLoading,
      filters,
      leaves,
      departments,
      currentPage,
      totalPages,
      totalRecords,
      isMobile,
      handleFilterChange,
      handlePageChange,
      handleClearFilters,
    }: {
      tableLoading: boolean;
      filters: {
        tenantId: string;
        departmentId: string;
        status: LeaveStatus;
        startDate: Dayjs | null;
        endDate: Dayjs | null;
      };
      leaves: SystemLeaveResponse[];
      departments: DepartmentOption[];
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      isMobile: boolean;
      handleFilterChange: <K extends keyof FiltersState>(
        field: K,
        value: FiltersState[K]
      ) => void;
      handlePageChange: (
        event: React.ChangeEvent<unknown>,
        page: number
      ) => void;
      handleClearFilters: () => void;
    }) => (
      <Paper sx={{ p: 3, position: 'relative', boxShadow: 'none' }}>
        <Typography variant='h4' fontWeight={600} mb={2}>
          Leave Management Table
        </Typography>
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          mb={3}
          flexWrap='wrap'
          useFlexGap
        >
          <AppDropdown
            // label='Department'
            showLabel={false}
            value={filters.departmentId}
            onChange={(e: SelectChangeEvent<string | number>) =>
              handleFilterChange(
                'departmentId',
                String(e.target.value || '') as FiltersState['departmentId']
              )
            }
            placeholder='Select Department'
            options={[
              { value: '', label: 'All' },
              ...departments.map(dep => ({ value: dep.id, label: dep.name })),
            ]}
            containerSx={{ minWidth: 180 }}
          />

          <AppDropdown
            // label='Status'
            showLabel={false}
            value={filters.status}
            onChange={(e: SelectChangeEvent<string | number>) =>
              handleFilterChange(
                'status',
                String(e.target.value || '') as LeaveStatus
              )
            }
            placeholder='Select Status'
            options={[
              { value: '', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'withdrawn', label: 'Withdrawn' },
            ]}
            containerSx={{ minWidth: 160 }}
          />
          <DatePicker
            label='Start Date'
            value={filters.startDate}
            onChange={date =>
              handleFilterChange('startDate', date as Dayjs | null)
            }
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label='End Date'
            value={filters.endDate}
            onChange={date =>
              handleFilterChange('endDate', date as Dayjs | null)
            }
            slotProps={{ textField: { size: 'small' } }}
          />
          <AppButton
            variant='outlined'
            variantType='secondary'
            startIcon={<FilterIcon />}
            onClick={handleClearFilters}
            sx={{
              p: 0.9,
              width: { xs: '100%', sm: 'auto' },
              color: 'var(--primary-dark-color)',
              borderColor: 'var(--primary-dark-color)',
              '&:hover': {
                borderColor: 'var(--primary-dark-color)',
                backgroundColor: 'transparent',
              },
            }}
          >
            Clear Filters
          </AppButton>
        </Stack>
        <AppTable>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Leave Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Total Days</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {tableLoading ? (
              <TableRow>
                <TableCell colSpan={8} align='center'>
                  <CircularProgress sx={{ color: 'var(--primary-dark-color)' }} />
                </TableCell>
              </TableRow>
            ) : leaves.length > 0 ? (
              leaves.map(leave => (
                <TableRow key={leave.id}>
                  <TableCell>{leave.employeeName}</TableCell>
                  <TableCell>{leave.departmentName || '-'}</TableCell>
                  <TableCell>
                    {leave.leaveType
                      ? leave.leaveType.charAt(0).toUpperCase() +
                        leave.leaveType.slice(1)
                      : '-'}
                  </TableCell>
                  <TableCell>{formatDate(leave.startDate)}</TableCell>
                  <TableCell>{formatDate(leave.endDate)}</TableCell>
                  <TableCell>{leave.totalDays}</TableCell>
                  <TableCell
                    sx={{
                      color:
                        leave.status === 'approved'
                          ? 'green'
                          : leave.status === 'rejected'
                            ? 'red'
                            : leave.status === 'withdrawn' ||
                                leave.status === 'cancelled'
                              ? '#607d8b'
                              : '#ff9800',
                    }}
                  >
                    {leave.status === 'cancelled' ? 'withdrawn' : leave.status}
                  </TableCell>
                  <TableCell>
                    <Tooltip
                      title={leave.reason || 'N/A'}
                      placement='top'
                      arrow
                    >
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align='center'>
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </AppTable>

        {totalPages > 1 && (
          <Box display='flex' justifyContent='center' mt={3}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              sx={{
                '& .MuiPaginationItem-root': {
                  color: 'var(--primary-dark-color)',
                },
                '& .MuiPaginationItem-root.Mui-selected': {
                  backgroundColor: 'var(--primary-dark-color)',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: 'var(--primary-dark-color)',
                  },
                },
              }}
              showFirstButton
              showLastButton
            />
          </Box>
        )}
        {leaves.length > 0 && (
          <Box display='flex' justifyContent='center' mt={1}>
            <Typography variant='body2' color='textSecondary'>
              Showing page {currentPage} of {totalPages} ({leaves.length}{' '}
              records)
            </Typography>
          </Box>
        )}
      </Paper>
    )
  );

  if (loading || !initialDataLoaded)
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ minHeight: '100vh' }} onKeyDown={handleKeyDown}>
        <Paper
          sx={{
            p: 3,
            mb: 3,
            boxShadow: 'none',
            backgroundColor: 'transparent',
          }}
        >
          <AppPageTitle>Tenant Leave Management</AppPageTitle>
          <Stack direction={isMobile ? 'column' : 'row'} flexWrap='wrap'>
            {isSystemAdminUser && (
              <Box
                sx={{ minWidth: 200, maxWidth: { xs: '100%', sm: '400px' } }}
              >
                <AppDropdown
                  label='Tenant'
                  value={filters.tenantId}
                  onChange={e =>
                    handleFilterChange('tenantId', String(e.target.value || ''))
                  }
                  placeholder='Select Tenant'
                  options={[
                    { value: 'all', label: 'All Tenants' },
                    ...tenants.map(t => ({ value: t.id, label: t.name })),
                  ]}
                />
              </Box>
            )}
          </Stack>
        </Paper>
        <ChartSection />
        <TableSection
          tableLoading={tableLoading}
          filters={filters}
          leaves={leaves}
          departments={departments}
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          isMobile={isMobile}
          handleFilterChange={handleFilterChange}
          handlePageChange={handlePageChange}
          handleClearFilters={handleClearFilters}
        />

        <ErrorSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default CrossTenantLeaveManagement;
