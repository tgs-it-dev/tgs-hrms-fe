import { Box, Typography, CircularProgress, useTheme, Tooltip } from '@mui/material';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../../hooks/useLanguage';
import systemEmployeeApiService from '../../api/systemEmployeeApi';
import systemDashboardApiService from '../../api/systemDashboardApi';
import { getCurrentUser } from '../../utils/auth';
import { isSystemAdmin } from '../../utils/roleUtils';
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

const TenantGrowthChart: React.FC = () => {
  const theme = useTheme();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [tenantGrowthData, setTenantGrowthData] = useState<TenantGrowth[]>([]);

  // Check if user is system admin
  const currentUser = getCurrentUser();
  const userRole = currentUser?.role;
  const isSysAdmin = isSystemAdmin(userRole);

  const labels = {
    en: 'Tenant Growth Overview',
    ar: 'نظرة عامة على نمو المستأجرين',
  };

  useEffect(() => {
    // Only fetch tenants for system admin
    if (!isSysAdmin) {
      setLoadingTenants(false);
      return;
    }

    const fetchTenants = async () => {
      try {
        // Use the same API as Employee List to get all tenants
        const data = await systemEmployeeApiService.getAllTenants(true);
        // Show all tenants (no filtering) - same as Employee List
        setTenants((data || []) as unknown as Tenant[]);

        if (data && data.length > 0) {
          const ibexTenant = data.find(
            (t: Record<string, unknown>) => t.name === 'Ibex Tech.'
          );
          if (ibexTenant) {
            setSelectedTenant(ibexTenant.id as string);
          } else {
            setSelectedTenant(
              (data[0] as Record<string, unknown>).id as string
            );
          }
        }
      } catch {
        // Ignore tenant dropdown errors; chart will just have no data
      } finally {
        setLoadingTenants(false);
      }
    };

    fetchTenants();
  }, [isSysAdmin]);

  useEffect(() => {
    // Only fetch tenant growth data for system admin
    if (!isSysAdmin || !selectedTenant) return;

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
  }, [isSysAdmin, selectedTenant, selectedYear]);

  const months = tenantGrowthData.map(d => d.monthName);
  const employeesData = tenantGrowthData.map(d => d.employees);
  const departmentsData = tenantGrowthData.map(d => d.departments);
  const designationsData = tenantGrowthData.map(d => d.designations);

  const selectedTenantName =
    tenants.find(t => t.id === selectedTenant)?.name || '';

  const series = [
    { name: 'Employees', data: employeesData },
    { name: 'Departments', data: departmentsData },
    { name: 'Designations', data: designationsData },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: { horizontal: false, columnWidth: '55%' },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 1, colors: ['#fff'] },
    xaxis: {
      categories: months,
      labels: {
        style: { fontSize: '12px', colors: theme.palette.text.primary },
      },
    },
    yaxis: {
      labels: {
        formatter: val => `${val}`,
        style: { fontSize: '12px', colors: theme.palette.text.primary },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: language === 'ar' ? 'left' : 'right',
      labels: { colors: theme.palette.text.primary },
    },
    grid: {
      borderColor: theme.palette.divider,
      padding: { top: 20, left: 10, right: 10, bottom: 10 },
    },
    colors: ['#4E79A7', '#F28E2B', '#E15759'],
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
        borderRadius: '0.375rem',
        backgroundColor: theme.palette.background.paper,
        direction: language === 'ar' ? 'rtl' : 'ltr',
        height: 400,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography
          fontWeight='bold'
          fontSize={{ xs: 18, sm: 20 }}
          sx={{ color: theme.palette.text.primary }}
        >
          {labels[language]} ({selectedYear})
        </Typography>

        <Box display='flex' gap={2}>
          <AppDropdown
            label='Year'
            value={selectedYear}
            onChange={e => {
              const v = e.target.value as string | number;
              if (v === '') return;
              const num = typeof v === 'number' ? v : parseInt(v as string);
              if (!isNaN(num)) setSelectedYear(num);
            }}
            options={Array.from(
              { length: 6 },
              (_, i) => {
                const year = currentYear - 4 + i;
                return { value: year, label: String(year) };
              }
            )}
            containerSx={{ minWidth: 120 }}
            sx={{
              width: { xs: '100%', sm: 120 },
              '& .MuiOutlinedInput-root': { minHeight: '48px' },
            }}
          />
          <Tooltip
            title={selectedTenantName || ''}
            placement='top'
            arrow
            disableInteractive
          >
            <Box>
              <AppDropdown
                label='Tenant'
                value={selectedTenant}
                onChange={e => setSelectedTenant(e.target.value as string)}
                options={tenants.map(t => ({ value: t.id, label: t.name }))}
                containerSx={{ minWidth: 160 }}
                sx={{
                  width: { xs: '100%', sm: 120 },
                  '& .MuiOutlinedInput-root': {
                    minHeight: '48px',
                    color: theme.palette.text.primary,
                    '& fieldset': {
                      borderColor: theme.palette.divider,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.divider,
                    },
                  },
                }}
              />
            </Box>
          </Tooltip>
        </Box>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          alignItems: 'center',
        }}
      >
        <Chart options={options} series={series} type='bar' height='100%' />
      </Box>
    </Box>
  );
};

export default TenantGrowthChart;
