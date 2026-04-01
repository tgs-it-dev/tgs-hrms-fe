import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Typography,
  Stack,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useOutletContext } from 'react-router-dom';
import dayjs from 'dayjs';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { payrollApi, type PayrollStatistics } from '../../api/payrollApi';
import systemEmployeeApiService, {
  type SystemEmployee,
} from '../../api/systemEmployeeApi';
import { useIsDarkMode } from '../../theme';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppDropdown from '../common/AppDropdown';
// SelectChangeEvent import removed (unused)
import AppPageTitle from '../common/AppPageTitle';

const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null) return '-';
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numberValue)) return String(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(numberValue);
};

const PayrollReports: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { snackbar, closeSnackbar, showError } = useErrorHandler();
  const { darkMode: outletDarkMode } = useOutletContext<{
    darkMode: boolean;
  }>();
  const effectiveDarkMode =
    typeof outletDarkMode === 'boolean' ? outletDarkMode : darkMode;

  const [statistics, setStatistics] = useState<PayrollStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [tenants, setTenants] = useState<SystemEmployee[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [loadingTenants, setLoadingTenants] = useState<boolean>(false);

  const bgColor = effectiveDarkMode
    ? '#121212'
    : theme.palette.background.default;
  const textColor = theme.palette.text.primary;

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingTenants(true);
        setStatsLoading(true);

        const allTenants = await systemEmployeeApiService.getAllTenants(true);
        // Filter to only show active tenants
        const activeTenants = allTenants.filter(t => t.status === 'active');
        setTenants(activeTenants);

        // Default tenant: "Testify Solutions"
        let defaultTenantId = '';
        const testifyTenant = activeTenants.find(
          t => t.name.toLowerCase() === 'testify solutions'
        );
        if (testifyTenant) {
          defaultTenantId = testifyTenant.id;
        } else if (activeTenants.length > 0) {
          defaultTenantId = activeTenants[0].id;
        }
        setSelectedTenantId(defaultTenantId);

        // Load statistics for default tenant
        const stats = await payrollApi.getPayrollStatistics({
          tenantId: defaultTenantId,
        });
        setStatistics(stats);
      } catch {
        showError(new Error('Failed to load payroll data'));
      } finally {
        setLoadingTenants(false);
        setStatsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;

    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const stats = await payrollApi.getPayrollStatistics({
          tenantId: selectedTenantId,
        });
        setStatistics(stats);
      } catch {
        showError(new Error('Failed to load payroll statistics'));
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, [selectedTenantId]);

  const trendSeries = useMemo(() => {
    if (!statistics?.monthlyTrend || statistics.monthlyTrend.length === 0)
      return [];
    return [
      {
        name: 'Gross',
        data: statistics.monthlyTrend.map(item => Number(item.totalGross) || 0),
      },
      {
        name: 'Deductions',
        data: statistics.monthlyTrend.map(
          item => Number(item.totalDeductions) || 0
        ),
      },
      {
        name: 'Bonuses',
        data: statistics.monthlyTrend.map(
          item => Number(item.totalBonuses) || 0
        ),
      },
      {
        name: 'Net',
        data: statistics.monthlyTrend.map(item => Number(item.totalNet) || 0),
      },
    ];
  }, [statistics]);

  const trendOptions: ApexOptions = useMemo(() => {
    const categories =
      statistics?.monthlyTrend?.map(item =>
        dayjs(`${item.year}-${item.month}-01`).format('MMM YYYY')
      ) ?? [];
    return {
      chart: { type: 'line', toolbar: { show: false } },
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 4 },
      xaxis: { categories },
      tooltip: { y: { formatter: val => formatCurrency(val) } },
    };
  }, [statistics]);

  const departmentSeries = useMemo(() => {
    if (
      !statistics?.departmentComparison ||
      statistics.departmentComparison.length === 0
    )
      return [];
    return [
      {
        name: 'Gross',
        data: statistics.departmentComparison.map(
          item => Number(item.totalGross) || 0
        ),
      },
      {
        name: 'Deductions',
        data: statistics.departmentComparison.map(
          item => Number(item.totalDeductions) || 0
        ),
      },
      {
        name: 'Bonuses',
        data: statistics.departmentComparison.map(
          item => Number(item.totalBonuses) || 0
        ),
      },
      {
        name: 'Net',
        data: statistics.departmentComparison.map(
          item => Number(item.totalNet) || 0
        ),
      },
    ];
  }, [statistics]);

  const departmentOptions: ApexOptions = useMemo(() => {
    if (
      !statistics?.departmentComparison ||
      statistics.departmentComparison.length === 0
    ) {
      return {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
        yaxis: { labels: { style: { fontSize: '13px', colors: textColor } } },
        xaxis: { labels: { formatter: val => formatCurrency(val) } },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: val => formatCurrency(val) } },
      };
    }

    // Extract department names in the same order as the data
    const categories = statistics.departmentComparison.map(item =>
      item.department.trim()
    );

    return {
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
      chart: { type: 'bar', toolbar: { show: false }, offsetX: 0 },
      grid: { padding: { left: 72, right: 16 } },
      responsive: [
        {
          breakpoint: 900,
          options: {
            grid: { padding: { left: 48, right: 12 } },
          },
        },
        {
          breakpoint: 600,
          options: {
            grid: { padding: { left: 24, right: 8 } },
          },
        },
      ],
      yaxis: {
        categories: categories,
        labels: {
          style: { fontSize: '13px', colors: textColor },
          formatter: (val: number) => {
            // ApexCharts passes numeric index, map it to category name
            if (val >= 0 && val < categories.length) {
              return categories[Math.floor(val)];
            }
            return val;
          },
        },
      },
      xaxis: { labels: { formatter: val => formatCurrency(val) } },
      dataLabels: { enabled: false },
      tooltip: {
        y: { formatter: val => formatCurrency(val) },
        offsetX: 80,
        offsetY: 0,
      },
    };
  }, [statistics, textColor]);

  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        minHeight: '100vh',
        color: textColor,
        '& .MuiButton-contained': {
          backgroundColor: 'var(--primary-dark-color)',
          // '&:hover': { backgroundColor: 'var(--primary-dark-color)' },
        },
        '& .MuiButton-outlined': {
          borderColor: 'var(--primary-dark-color)',
          color: 'var(--primary-dark-color)',
          // '&:hover': {
          //   borderColor: 'var(--primary-dark-color)',
          //   backgroundColor: 'var(--primary-color)',
          // },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <AppPageTitle>Payroll Reports</AppPageTitle>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          <AppDropdown
            label='Tenant'
            options={tenants.map(t => ({ value: t.id, label: t.name }))}
            value={selectedTenantId}
            onChange={e => setSelectedTenantId(String(e.target.value))}
            size='small'
            showLabel={true}
            disabled={loadingTenants}
            containerSx={{ minWidth: { xs: '100%', md: 200 } }}
            inputBackgroundColor={effectiveDarkMode ? '#1e1e1e' : '#fff'}
            sx={{
              '& .MuiSelect-select': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiSelect-icon': {
                color: effectiveDarkMode ? '#fff' : '#000',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: theme.palette.divider,
                },
              },
            }}
          />
        </Stack>
      </Box>

      <Paper sx={{ backgroundColor: 'unset', boxShadow: 'none' }}>
        {statsLoading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !statistics ? (
          <Alert severity='info'>No statistics available</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper sx={{ p: 2, boxShadow: 'none' }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                Monthly Trend
              </Typography>
              {trendSeries.length === 0 ? (
                <Alert severity='info' sx={{ mt: 2 }}>
                  No monthly trend data
                </Alert>
              ) : (
                <Box sx={{ width: '100%', overflowX: 'auto' }}>
                  <Box sx={{ minWidth: { xs: 520, sm: 0 } }}>
                    <Chart
                      options={trendOptions}
                      series={trendSeries}
                      type='line'
                      height={320}
                    />
                  </Box>
                </Box>
              )}
            </Paper>

            <Paper sx={{ p: 2, boxShadow: 'none', overflow: 'visible' }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                Department Comparison
              </Typography>
              {departmentSeries.length === 0 ? (
                <Alert severity='info' sx={{ mt: 2 }}>
                  No department data
                </Alert>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    p: 0,
                    pt: 1,
                  }}
                >
                  <Box
                    sx={{
                      minWidth: { xs: 520, sm: 0 },
                      p: 0,
                      overflow: 'visible',
                      '& .apexcharts-inner': { overflow: 'visible !important' },
                      '& .apexcharts-tooltip': { overflow: 'visible' },
                    }}
                  >
                    <Chart
                      options={departmentOptions}
                      series={departmentSeries}
                      type='bar'
                      height={320}
                    />
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Paper>
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      />
    </Box>
  );
};

export default PayrollReports;
