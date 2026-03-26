import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Grid,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CardContent,
  Avatar,
  CircularProgress,
  Pagination,
  Tooltip,
  IconButton,
} from '@mui/material';
import AppTable from '../common/AppTable';
import AppCard from '../common/AppCard';
import AppDropdown from '../common/AppDropdown';
import DownloadIcon from '@mui/icons-material/Download';
import { useLanguage } from '../../hooks/useLanguage';
import systemDashboardApiService, {
  type SystemDashboardResponse,
  type RecentLog,
} from '../../api/systemDashboardApi';
import { getDashboardKpi, getAttendanceSummary } from '../../api/dashboardApi';

// AvailabilityCardsGrid removed — availability column removed from dashboard
import GenderPercentageChart from './GenderPercentageChart';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
} from 'recharts';
// import TopPerformersProps from '../DashboardContent/TopPerformance/TopPerformersProps';
// import IconImageCardProps from '../DashboardContent/TotalApplication/IconImageCardProps';
// import ApplicationStats from '../DashboardContent/ApplicationStats/ApplicationStats';
// import UpcomingInterviews from '../DashboardContent/ComingInterview/UpcomingInterviews';
import KPICard from './KPICard';

import ApartmentIcon from '@mui/icons-material/Apartment';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import TenantGrowthChart from './TenantGrowthChart';
import EmployeeGrowthChart from './EmployeeGrowthChart';
import SystemUptimeCard from './SystemUptimeCard';
import RecentActivityLogs from './RecentActivityLogs';
import { getCurrentUser } from '../../utils/auth';
// import SalaryOverviewChart from './SalaryOverviewChart';
// import AttendanceDepartmentChart from './AttendanceDepartmentChart';
import { isSystemAdmin } from '../../utils/roleUtils';
import { PAGINATION } from '../../constants/appConstants';
import AppPageTitle from '../common/AppPageTitle';

const labels = {
  en: { title: 'Dashboard' },
  ar: { title: 'لوحة تحكم الموارد البشرية' },
};

const Dashboard: React.FC = () => {
  const { language } = useLanguage();
  const lang = labels[language];
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  const isSysAdmin = isSystemAdmin(userRole);

  const [dashboardData, setDashboardData] =
    useState<SystemDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE; // Backend returns records per page

  useEffect(() => {
    const fetchData = async () => {
      if (isSysAdmin) {
        setLoading(true);
        const data = await systemDashboardApiService.getSystemDashboard();
        setDashboardData(data);
        setLoading(false);
      }
    };
    fetchData();
  }, [isSysAdmin]);

  const fetchLogs = useCallback(async (page: number = 1) => {
    try {
      setLogsLoading(true);
      const response = await systemDashboardApiService.getSystemLogs(page);
      setLogs(response);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSysAdmin) fetchLogs(currentPage);
  }, [isSysAdmin, currentPage, fetchLogs]);

  // Live KPI state (no frontend mock; show loader while fetching)
  type LiveKpi = {
    totalEmployees?: number;
    salaryPaid?: number;
    salaryUnpaid?: number;
    presentToday?: number;
    onLeave?: number;
  };

  const [liveKpi, setLiveKpi] = useState<LiveKpi | null>(null);
  const [kpiLoading, setKpiLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const fetchKpi = async () => {
      try {
        if (mounted) setKpiLoading(true);
        const mapped = await getDashboardKpi();
        if (mounted && mapped) setLiveKpi(mapped);
      } catch (err) {
        console.warn('Failed to fetch dashboard KPI', err);
      } finally {
        if (mounted) setKpiLoading(false);
      }
    };

    fetchKpi();

    return () => {
      mounted = false;
    };
  }, []);

  const displayedKpi =
    liveKpi ??
    ({
      totalEmployees: 0,
      salaryPaid: 0,
      salaryUnpaid: 0,
      presentToday: 0,
      onLeave: 0,
    } as LiveKpi);

  const salaryOverview = [
    { name: 'Paid', value: displayedKpi.salaryPaid },
    { name: 'Unpaid', value: displayedKpi.salaryUnpaid },
  ];

  // Live attendance summary fetched from backend
  const [attendanceData, setAttendanceData] = useState<
    Array<{
      department: string;
      total: number;
      present: number;
      absent: number;
    }>
  >([]);

  const [attendanceLoading, setAttendanceLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const fetchAttendance = async () => {
      try {
        setAttendanceLoading(true);
        const data = await getAttendanceSummary();
        if (mounted) setAttendanceData(data);
      } catch (err) {
        console.warn('Failed to fetch attendance summary', err);
      } finally {
        if (mounted) setAttendanceLoading(false);
      }
    };

    fetchAttendance();

    return () => {
      mounted = false;
    };
  }, []);

  // Horizontal-scroll helpers for Attendance chart (px per bar)
  const attendanceBarSize = 28;
  const [selectedDept, setSelectedDept] = useState<string | number>('');

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...attendanceData.map(d => ({ value: d.department, label: d.department })),
  ];

  const displayedAttendance =
    !selectedDept || selectedDept === 'all'
      ? attendanceData
      : attendanceData.filter(d => d.department === selectedDept);

  const attendanceMinChartWidth =
    displayedAttendance.length > 0
      ? Math.max(displayedAttendance.length * attendanceBarSize, 600)
      : 0;

  const attendanceForceScrollThreshold = 6; // bars
  const attendanceShouldForceMinWidthOnXs =
    displayedAttendance.length > attendanceForceScrollThreshold;

  const handleExportLogs = async () => {
    const blob = await systemDashboardApiService.exportSystemLogs();
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'system_logs.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  if (isSysAdmin && loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <CircularProgress sx={{ color: 'var(--primary-dark-color)' }} />
      </Box>
    );
  }

  const hasMorePages = logs.length === itemsPerPage;
  const estimatedTotalRecords = hasMorePages
    ? currentPage * itemsPerPage
    : (currentPage - 1) * itemsPerPage + logs.length;
  const estimatedTotalPages = hasMorePages ? currentPage + 1 : currentPage;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: theme.palette.text.primary,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AppPageTitle isRtl={language === 'ar'}>{lang.title}</AppPageTitle>

      {isSysAdmin ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              borderRadius: '20px',
              backgroundColor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <Grid container spacing={3} sx={{ width: '100%' }}>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }} flexGrow={1}>
                <KPICard
                  title='Total Tenants'
                  value={dashboardData?.totalTenants ?? 0}
                  icon={<ApartmentIcon />}
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }} flexGrow={1}>
                <KPICard
                  title='Active Tenants'
                  value={dashboardData?.activeTenants ?? 0}
                  icon={<VerifiedUserIcon />}
                  color={theme.palette.success.main}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              width: '100%',
              borderRadius: '20px',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <TenantGrowthChart />
          </Paper>

          <Grid
            container
            spacing={3}
            sx={{
              width: '100%',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}
            >
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '20px',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  boxShadow: 'none',
                  height: '100%',
                  width: '100%',
                }}
              >
                <Box sx={{ flexShrink: 0 }}>
                  <KPICard
                    title='Total Employees'
                    value={dashboardData?.totalEmployees ?? 0}
                    icon={<PeopleAltIcon />}
                    color={theme.palette.info.main}
                  />
                </Box>

                <Box
                  sx={{
                    overflow: 'hidden',
                    borderRadius: '20px',
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography
                    variant='h6'
                    mb={1}
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      px: 2,
                      pt: 2,
                    }}
                  >
                    Active Employees per Tenant
                  </Typography>

                  <Box
                    sx={{
                      flexGrow: 1,
                      overflowY: 'auto',
                      overflowX: 'auto',
                      px: 2,
                      pb: 2,
                      maxHeight: '200px', // Fixed height to show scrollbar after ~4 records
                    }}
                  >
                    <AppTable
                      tableProps={{ size: 'small', stickyHeader: true }}
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              backgroundColor:
                                theme.palette.mode === 'dark'
                                  ? 'var(--primary-light-color)'
                                  : 'var(--primary-color)',
                              color:
                                theme.palette.mode === 'dark'
                                  ? '#ffffff'
                                  : '#2C2C2C',
                              fontWeight: 700,
                            }}
                          >
                            Tenant
                          </TableCell>
                          <TableCell
                            align='right'
                            sx={{
                              backgroundColor:
                                theme.palette.mode === 'dark'
                                  ? 'var(--primary-light-color)'
                                  : 'var(--primary-color)',
                              color:
                                theme.palette.mode === 'dark'
                                  ? '#ffffff'
                                  : '#2C2C2C',
                              fontWeight: 700,
                            }}
                          >
                            Active Employees
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dashboardData?.activeEmployeesPerTenant?.map(
                          (row, idx) => (
                            <TableRow
                              key={idx}
                              sx={{
                                '&:hover': {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              }}
                            >
                              <TableCell
                                sx={{
                                  color: theme.palette.text.primary,
                                  borderBottom: `0.5px solid ${theme.palette.divider}`,
                                }}
                              >
                                {row.tenantName}
                              </TableCell>
                              <TableCell
                                align='right'
                                sx={{
                                  color: theme.palette.text.primary,
                                  borderBottom: `0.5px solid ${theme.palette.divider}`,
                                }}
                              >
                                {row.activeCount}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </AppTable>
                  </Box>
                </Box>

                <Box sx={{ flexShrink: 0 }}>
                  <EmployeeGrowthChart />
                </Box>
              </Paper>
            </Grid>

            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                width: '100%',
              }}
            >
              <SystemUptimeCard
                uptimeSeconds={dashboardData?.systemUptimeSeconds || 0}
              />
              <RecentActivityLogs logs={dashboardData?.recentLogs || []} />
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: '20px',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                mb: 2,
                gap: 1,
              }}
            >
              <Typography
                variant='h6'
                fontWeight='bold'
                sx={{ color: theme.palette.text.primary }}
              >
                System Logs
              </Typography>
              <Tooltip title='Export Recent 1000 system logs'>
                <IconButton
                  onClick={handleExportLogs}
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    borderRadius: '6px',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    },
                  }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ overflowX: 'auto' }}>
              <AppTable tableProps={{ stickyHeader: true }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark' ? '#ffffff' : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      Action
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark' ? '#ffffff' : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      Entity
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark' ? '#ffffff' : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      User Role
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark' ? '#ffffff' : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      Tenant Id
                    </TableCell>
                    <TableCell
                      sx={{
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? 'var(--primary-light-color)'
                            : 'var(--primary-color)',
                        color:
                          theme.palette.mode === 'dark' ? '#ffffff' : '#2C2C2C',
                        fontWeight: 700,
                      }}
                    >
                      Timestamp
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
                        <CircularProgress
                          sx={{ color: 'var(--primary-dark-color)' }}
                        />
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align='center'
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map(log => (
                      <TableRow
                        key={log.id}
                        hover
                        sx={{
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {log.action}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {log.entityType}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {log.userRole || '-'}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {log.tenantId}
                        </TableCell>
                        <TableCell
                          sx={{
                            color: theme.palette.text.primary,
                            borderBottom: `0.5px solid ${theme.palette.divider}`,
                          }}
                        >
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </AppTable>
            </Box>

            {(() => {
              const currentPageRowsCount = logs.length;
              const shouldShowPagination =
                estimatedTotalPages > 1 &&
                (currentPage === 1
                  ? currentPageRowsCount === itemsPerPage
                  : true);

              return shouldShowPagination ? (
                <Box display='flex' justifyContent='center' mt={2}>
                  <Pagination
                    count={estimatedTotalPages}
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                    color='primary'
                    showFirstButton
                    showLastButton
                  />
                </Box>
              ) : null;
            })()}

            {estimatedTotalRecords > 0 && (
              <Box display='flex' justifyContent='center' mt={1}>
                <Typography
                  variant='body2'
                  sx={{ color: theme.palette.text.secondary }}
                >
                  Showing page {currentPage} of {estimatedTotalPages} (
                  {estimatedTotalRecords} total records)
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* KPI Row */}
          {/* KPI Row */}
          {kpiLoading ? (
            <Box
              display='flex'
              justifyContent='center'
              alignItems='center'
              minHeight={120}
            >
              <CircularProgress sx={{ color: 'var(--primary-dark-color)' }} />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 2,
                alignItems: 'stretch',
                flexWrap: { xs: 'wrap', lg: 'nowrap' },
              }}
            >
              <Box sx={{ flex: { xs: '0 0 100%', lg: '1 1 0' }, minWidth: 0 }}>
                <AppCard
                  sx={{
                    borderRadius: '20px',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0,
                      overflow: 'visible',
                      width: '100%',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 0.5,
                          fontWeight: 500,
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.875rem',
                            lg: '0.78rem',
                          },
                        }}
                      >
                        Total Employees
                      </Typography>
                      <Typography
                        variant='h4'
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                          fontSize: { xs: '1.5rem', sm: '2rem', lg: '1.6rem' },
                        }}
                      >
                        {displayedKpi.totalEmployees}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.info.main,
                        color: theme.palette.getContrastText(
                          theme.palette.info.main
                        ),
                        width: { xs: 40, sm: 48 },
                        height: { xs: 40, sm: 48 },
                        ml: 0,
                        flexShrink: 0,
                        '& svg': { fontSize: { xs: '1rem', sm: '1.2rem' } },
                      }}
                    >
                      <PeopleAltIcon />
                    </Avatar>
                  </CardContent>
                </AppCard>
              </Box>

              <Box sx={{ flex: { xs: '0 0 100%', lg: '1 1 0' }, minWidth: 0 }}>
                <AppCard
                  sx={{
                    borderRadius: '20px',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0,

                      overflow: 'visible',
                      width: '100%',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 0.5,
                          fontWeight: 500,
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.875rem',
                            lg: '0.78rem',
                          },
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Salary Paid
                      </Typography>
                      <Tooltip
                        title={`$${(displayedKpi.salaryPaid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      >
                        <Typography
                          variant='h4'
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 700,
                            fontSize: {
                              xs: '1.4rem',
                              sm: '1.5rem',
                              lg: '1.3rem',
                            },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {`$${(displayedKpi.salaryPaid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Typography>
                      </Tooltip>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.getContrastText(
                          theme.palette.primary.main
                        ),
                        width: { xs: 40, sm: 48, md: 48, lg: 44 },
                        height: { xs: 40, sm: 48, md: 48, lg: 44 },
                        ml: 1,
                        flexShrink: 0,
                        '& svg': {
                          fontSize: {
                            xs: '1rem',
                            sm: '1.2rem',
                            md: '1.1rem',
                            lg: '1.05rem',
                          },
                        },
                      }}
                    >
                      <AttachMoneyIcon />
                    </Avatar>
                  </CardContent>
                </AppCard>
              </Box>

              <Box sx={{ flex: { xs: '0 0 100%', lg: '1 1 0' }, minWidth: 0 }}>
                <AppCard
                  sx={{
                    borderRadius: '20px',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0,

                      overflow: 'visible',
                      width: '100%',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 0.5,
                          fontWeight: 500,
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.875rem',
                            lg: '0.78rem',
                          },
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Salary Unpaid
                      </Typography>
                      <Tooltip
                        title={`$${(displayedKpi.salaryUnpaid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      >
                        <Typography
                          variant='h4'
                          sx={{
                            color: theme.palette.text.primary,
                            fontWeight: 700,
                            fontSize: {
                              xs: '1.4rem',
                              sm: '1.5rem',
                              lg: '1.3rem',
                            },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {`$${(displayedKpi.salaryUnpaid ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Typography>
                      </Tooltip>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.error.main,
                        color: theme.palette.getContrastText(
                          theme.palette.error.main
                        ),
                        width: { xs: 40, sm: 48, md: 48, lg: 44 },
                        height: { xs: 40, sm: 48, md: 48, lg: 44 },
                        ml: 1,
                        flexShrink: 0,
                        '& svg': {
                          fontSize: {
                            xs: '1rem',
                            sm: '1.2rem',
                            md: '1.1rem',
                            lg: '1.05rem',
                          },
                        },
                      }}
                    >
                      <MoneyOffIcon />
                    </Avatar>
                  </CardContent>
                </AppCard>
              </Box>

              <Box sx={{ flex: { xs: '0 0 100%', lg: '1 1 0' }, minWidth: 0 }}>
                <AppCard
                  sx={{
                    borderRadius: '20px',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0,
                      overflow: 'visible',
                      width: '100%',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 0.5,
                          fontWeight: 500,
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.875rem',
                            lg: '0.78rem',
                          },
                        }}
                      >
                        Present Today
                      </Typography>
                      <Typography
                        variant='h4'
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                          fontSize: { xs: '1.5rem', sm: '2rem', lg: '1.6rem' },
                        }}
                      >
                        {displayedKpi.presentToday ?? 0}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.success.main,
                        color: theme.palette.getContrastText(
                          theme.palette.success.main
                        ),
                        width: { xs: 40, sm: 48 },
                        height: { xs: 40, sm: 48 },
                        ml: 0,
                        flexShrink: 0,
                        '& svg': { fontSize: { xs: '1rem', sm: '1.2rem' } },
                      }}
                    >
                      <PeopleAltIcon />
                    </Avatar>
                  </CardContent>
                </AppCard>
              </Box>

              <Box sx={{ flex: { xs: '0 0 100%', lg: '1 1 0' }, minWidth: 0 }}>
                <AppCard
                  sx={{
                    borderRadius: '20px',
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0,
                      overflow: 'visible',
                      width: '100%',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant='body2'
                        sx={{
                          color: theme.palette.text.secondary,
                          mb: 0.5,
                          fontWeight: 500,
                          fontSize: {
                            xs: '0.8rem',
                            sm: '0.875rem',
                            lg: '0.78rem',
                          },
                        }}
                      >
                        On Leave
                      </Typography>
                      <Typography
                        variant='h4'
                        sx={{
                          color: theme.palette.text.primary,
                          fontWeight: 700,
                          fontSize: { xs: '1.5rem', sm: '2rem', lg: '1.6rem' },
                        }}
                      >
                        {displayedKpi.onLeave ?? 0}
                      </Typography>
                    </Box>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.warning.main,
                        color: theme.palette.getContrastText(
                          theme.palette.warning.main
                        ),
                        width: { xs: 40, sm: 48 },
                        height: { xs: 40, sm: 48 },
                        ml: 0,
                        flexShrink: 0,
                        '& svg': { fontSize: { xs: '1rem', sm: '1.2rem' } },
                      }}
                    >
                      <PeopleAltIcon />
                    </Avatar>
                  </CardContent>
                </AppCard>
              </Box>
            </Box>
          )}
          {/* Salary Overview (compact left) + Employee Growth (wide right) - Box-based layout for large screens */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 2, md: 3 },
              alignItems: 'stretch',
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 0 } }}>
              <AppCard
                sx={{
                  p: 3,
                  minHeight: { xs: 280, md: 420 },
                  borderRadius: '20px',
                }}
              >
                <EmployeeGrowthChart />
              </AppCard>
            </Box>
            <Box
              sx={{
                width: { xs: '100%', md: '45%', lg: '33%' },
                minWidth: 0,
                maxWidth: '100%',
                order: { xs: 2, md: 0 },
              }}
            >
              <AppCard
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: { xs: '16px', sm: '20px' },
                  height: '100%',
                  overflow: 'hidden',
                  maxWidth: '100%',
                }}
              >
                <Typography
                  variant='h6'
                  mb={1}
                  sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Salary Overview
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    maxWidth: '100%',
                    height: { xs: 220, sm: 260, md: 320 },
                    minHeight: 180,
                  }}
                >
                  <ResponsiveContainer width='100%' height='91%'>
                    <PieChart
                      margin={{ top: 0, right: 0, bottom: 20, left: 0 }}
                    >
                      <Pie
                        data={salaryOverview}
                        dataKey='value'
                        nameKey='name'
                        innerRadius={isMobile ? 45 : 60}
                        outerRadius={isMobile ? 70 : 90}
                        paddingAngle={3}
                        stroke='none'
                        strokeWidth={0}
                        startAngle={50}
                        endAngle={450}
                        label={({ percent }) =>
                          `${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {salaryOverview.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              index === 0
                                ? theme.palette.success.main
                                : theme.palette.error.main
                            }
                            style={{ outline: 'none' }}
                          />
                        ))}
                      </Pie>
                      <Legend
                        verticalAlign='bottom'
                        height={36}
                        iconType='circle'
                      />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box mt={1}>
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      Total payroll and unpaid summary for current cycle
                    </Typography>
                  </Box>
                </AppCard>
            </Box>
          </Box>

          {/* Attendance and Gender */}
          <Box
            sx={{
              display: 'flex',
              // Stack on small screens, side-by-side on md+
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3,
              alignItems: 'stretch',
            }}
          >
            <Box
              sx={{
                // Attendance takes full width on xs, and two-thirds on md
                flex: { xs: '1 1 100%', md: '1 1 66.666%' },
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <AppCard
                sx={{
                  p: 2,
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography variant='h6' sx={{ fontWeight: 600 }}>
                    Attendance by Department
                  </Typography>
                  <AppDropdown
                    label=''
                    options={departmentOptions}
                    value={selectedDept}
                    onChange={e => setSelectedDept(e.target.value as string)}
                    disabled={attendanceLoading}
                    showLabel={false}
                    containerSx={{
                      minWidth: { xs: 140, md: 220 },
                      width: { xs: '120px', md: '220px' },
                    }}
                  />
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    flex: 1,
                    minHeight: { xs: 360, md: 420 },
                    overflowX: 'auto',
                    overflowY: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      minWidth: {
                        xs: attendanceShouldForceMinWidthOnXs
                          ? `${attendanceMinChartWidth}px`
                          : '100%',
                        md:
                          attendanceShouldForceMinWidthOnXs
                            ? `${attendanceMinChartWidth}px`
                            : '100%',
                      },
                      height: { xs: 360, md: 420 },
                    }}
                  >
                    {attendanceLoading ? (
                      <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        height='100%'
                      >
                        <CircularProgress
                          sx={{ color: 'var(--primary-dark-color)' }}
                        />
                      </Box>
                    ) : displayedAttendance.length === 0 ? (
                      <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                        height='100%'
                      >
                        <Typography color='text.secondary'>
                          No attendance data
                        </Typography>
                      </Box>
                    ) : (
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart
                          data={displayedAttendance}
                          margin={{ top: 10, right: 20, left: -10, bottom: 70 }}
                          barSize={attendanceBarSize}
                        >
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis
                            dataKey='department'
                            interval={0}
                            height={70}
                            tick={{
                              angle: -45,
                              textAnchor: 'end',
                              fontSize: 12,
                            }}
                          />
                          <YAxis />
                          <ReTooltip />
                          <Bar
                            dataKey='present'
                            stackId='a'
                            fill={theme.palette.primary.main}
                            style={{ outline: 'none' }}
                          />
                          <Bar
                            dataKey='absent'
                            stackId='a'
                            fill={theme.palette.error.main}
                            style={{ outline: 'none' }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Box>
                </Box>
              </AppCard>
            </Box>

            {/* Availability column removed as requested */}

            <Box
              sx={{
                // Gender stacks below on xs (full width), and sits in the side column on md
                flex: { xs: '1 1 100%', md: '0 0 33.333%' },
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <AppCard
                sx={{
                  p: 2,
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <Typography variant='h6' mb={1} sx={{ fontWeight: 600 }}>
                  Gender Distribution
                </Typography>
                <Box sx={{ flex: 1, minHeight: 260 }}>
                  <GenderPercentageChart />
                </Box>
              </AppCard>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
