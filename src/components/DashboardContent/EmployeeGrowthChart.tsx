import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import systemDashboardApiService from '../../api/systemDashboardApi';
import { getStoredUser, getTenantIdFromUser } from '../../utils/authSession';
import { isSystemAdmin } from '../../utils/roleUtils';
import { useUser } from '../../hooks/useUser';
import AppDropdown from '../common/AppDropdown';
// using shared AppDropdown for time selector

interface Tenant {
  id: string;
  name: string;
  status: string;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface TenantGrowth {
  tenantId: string;
  tenantName: string;
  month: string;
  monthName: string;
  employees: number;
  departments: number;
  designations: number;
}

const EmployeeGrowthChart: React.FC = () => {
  const theme = useTheme();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();
  const { user } = useUser();

  const userRole = user?.role;
  const isSysAdmin = isSystemAdmin(userRole);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [tenantGrowthData, setTenantGrowthData] = useState<TenantGrowth[]>([]);

  const labels = {
    en: 'Employee Growth',
    ar: 'نمو الموظفين',
  };

  // Tenant admin: use tenant ID from localStorage (set at login); System admin: fetch tenants and let user select
  useEffect(() => {
    if (!isSysAdmin) {
      const storedTenantId = localStorage.getItem('tenant_id');
      const tenantId =
        (storedTenantId && storedTenantId.trim()) ||
        getTenantIdFromUser(getStoredUser() ?? undefined) ||
        (currentUser?.tenant_id as string) ||
        '';
      if (tenantId) setSelectedTenant(String(tenantId).trim());
      setLoadingTenants(false);
      return;
    }

    const fetchTenants = async () => {
      try {
        const data = await systemEmployeeApiService.getAllTenants(true);
        setTenants((data || []) as unknown as Tenant[]);

        if (data && data.length > 0) {
          setSelectedTenant(data[0].id);
        }
      } catch {
        // Ignore tenant dropdown errors; chart will just have no data
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [isSysAdmin, currentUser?.tenant_id]);

  useEffect(() => {
    if (!selectedTenant) return;
    const fetchTenantGrowth = async () => {
      try {
        const data = await systemDashboardApiService.getTenantGrowth(
          selectedYear,
          selectedTenant
        );
        setTenantGrowthData(data);
      } catch {
        setTenantGrowthData([]);
      }
    };

    fetchTenantGrowth();
  }, [selectedTenant, selectedYear]);

  useEffect(() => {
    if (tenantGrowthData.length === 0) return;
    const mm = String(new Date().getMonth() + 1).padStart(2, '0');
    const match = tenantGrowthData.find(
      d =>
        d.month === mm ||
        d.month.endsWith('-' + mm) ||
        d.month === String(new Date().getMonth() + 1)
    );
    if (match) setSelectedMonth(match.month);
  }, [tenantGrowthData]);

  // Filter data by selected month if a month is selected
  const filteredData = selectedMonth
    ? tenantGrowthData.filter(d => d.month === selectedMonth)
    : tenantGrowthData;

  const months = filteredData.map(d => d.monthName);
  const employeesData = filteredData.map(d => d.employees);

  // Get unique months from API response for dropdown
  const availableMonths = Array.from(
    new Set(tenantGrowthData.map(d => d.month))
  ).sort();

  // TimeRangeSelector options (years)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear - i);
  const yearOptions = availableYears.includes(selectedYear)
    ? availableYears
    : [selectedYear, ...availableYears].sort((a, b) => b - a);

  const series = [{ name: 'Employees', data: employeesData }];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: [theme.palette.secondary.main],
    },
    markers: {
      size: 5,
      colors: [theme.palette.secondary.main],
      strokeColors: theme.palette.common.white,
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: months,
      labels: {
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: true,
        trim: true,
        style: {
          fontSize: '11px',
          colors: theme.palette.text.primary,
        },
      },
    },
    yaxis: {
      labels: {
        formatter: val => `${val}`,
        style: { fontSize: '11px', colors: theme.palette.text.primary },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: language === 'ar' ? 'left' : 'right',
      labels: { colors: theme.palette.text.primary },
    },
    grid: {
      borderColor: theme.palette.divider,
      padding: { top: 20, left: 15, right: 15, bottom: 10 },
    },
    colors: [theme.palette.secondary.main],
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      y: { formatter: (val: number) => `${val}` },
    },
  };

  if (loadingTenants) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height={400}
      >
        <CircularProgress sx={{ color: 'var(--primary-dark-color)' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '0.375rem',
        backgroundColor: theme.palette.background.paper,
        direction: language === 'ar' ? 'rtl' : 'ltr',
        minHeight: { xs: 'auto', sm: 420 },
        height: { xs: 'auto', sm: 420 },
        display: 'flex',
        flexDirection: 'column',
        padding: 2,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap',
          // gap: 1,
        }}
      >
        <Typography
          fontWeight='bold'
          fontSize={{ xs: '20px', lg: '28px' }}
          sx={{ color: theme.palette.text.primary }}
        >
          {labels[language]} ({selectedYear})
        </Typography>

        <Box display='flex' gap={1} flexWrap='wrap'>
          {isSysAdmin && (
            <AppDropdown
              label='Tenant'
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value as string)}
              options={tenants.map(t => ({ value: t.id, label: t.name }))}
              containerSx={{
                minWidth: { xs: '100%', sm: 140 },
                width: { xs: '100%', sm: 'auto' },
              }}
              sx={{
                '& .MuiOutlinedInput-root': { minHeight: '40px' },
                '& .MuiSelect-select': {
                  color: theme.palette.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  maxWidth: { xs: '100%', sm: 200 },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
              }}
            />
          )}

          <AppDropdown
            label='Month'
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value as string)}
            options={[
              {
                value: '',
                label: language === 'ar' ? 'كل الشهور' : 'All Months',
              },
              ...availableMonths.map(m => ({
                value: m,
                label:
                  tenantGrowthData.find(d => d.month === m)?.monthName || m,
              })),
            ]}
            containerSx={{
              minWidth: { xs: '100%', sm: 120 },
              width: { xs: '100%', sm: 120 },
            }}
            sx={{
              '& .MuiOutlinedInput-root': { minHeight: '40px' },
              '& .MuiSelect-select': {
                color: theme.palette.text.primary,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.divider,
              },
            }}
            disabled={availableMonths.length === 0}
          />

          <AppDropdown
            label='Year'
            value={selectedYear}
            onChange={e => {
              const v = e.target.value as string | number;
              if (v === '' || v === 'all') return;
              const num = typeof v === 'number' ? v : parseInt(v as string);
              if (!isNaN(num)) setSelectedYear(num);
            }}
            options={yearOptions.map(y => ({ value: y, label: String(y) }))}
            containerSx={{
              minWidth: { xs: '100%', sm: 120 },
              width: { xs: '100%', sm: 120 },
            }}
            sx={{
              '& .MuiOutlinedInput-root': { minHeight: '40px' },
              width: { xs: '100%', sm: 120 },
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          alignItems: 'center',
          minHeight: { xs: 250, sm: 300 },
          overflow: 'visible',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: 0,
          '& .apexcharts-tooltip': {
            zIndex: 9999,
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: { xs: 270, sm: 350 },
            '& .apexcharts-canvas': { width: '100% !important' },
            padding: 0,
          }}
        >
          <Chart
            options={options}
            series={series}
            type='line'
            width='100%'
            height={300}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default EmployeeGrowthChart;
