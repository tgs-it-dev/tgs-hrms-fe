import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Typography,
  useTheme,
  Grid,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  CircularProgress,
} from '@mui/material';
import Chart from 'react-apexcharts';
import {
  systemPerformanceApiService,
  type PerformanceRecord,
} from '../../api/systemPerformanceApi';
import {
  systemEmployeeApiService,
  type SystemEmployee,
} from '../../api/systemEmployeeApi';
import { formatDate } from '../../utils/dateUtils';
import AppCard from '../common/AppCard';
import AppTextField from '../common/AppTextField';
import AppDropdown from '../common/AppDropdown';
import AppTable from '../common/AppTable';
import { PAGINATION } from '../../constants/appConstants';

interface PerformanceTrendProps {
  tenantId: string;
}

const PerformanceTrend: React.FC<PerformanceTrendProps> = ({ tenantId }) => {
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [employees, setEmployees] = useState<SystemEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = PAGINATION.DEFAULT_PAGE_SIZE;
  const theme = useTheme();

  const fetchPerformance = useCallback(async () => {
    try {
      const params: {
        tenantId: string;
        page: number;
        limit: number;
        status?: 'under_review' | 'completed';
        startDate?: string;
        endDate?: string;
      } = {
        tenantId,
        page: currentPage,
        limit: itemsPerPage,
      };
      if (statusFilter === 'completed' || statusFilter === 'under_review') {
        params.status = statusFilter as 'under_review' | 'completed';
      }
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response =
        await systemPerformanceApiService.getPerformanceRecords(params);
      setRecords(response.items || []);
    } catch {
      setRecords([]);
    }
  }, [tenantId, currentPage, itemsPerPage, statusFilter, startDate, endDate]);

  const fetchEmployees = useCallback(async () => {
    try {
      const data = await systemEmployeeApiService.getSystemEmployees({
        tenantId,
        page: null,
      });
      // Handle paginated response
      const employeesList = Array.isArray(data)
        ? data
        : 'items' in data
          ? data.items
          : [];
      setEmployees(employeesList);
    } catch {
      setEmployees([]);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      setCurrentPage(1);
    }
  }, [tenantId, statusFilter, startDate, endDate]);

  useEffect(() => {
    if (tenantId) {
      setLoading(true);
      Promise.all([fetchEmployees(), fetchPerformance()]).finally(() => {
        setLoading(false);
      });
    }
  }, [tenantId, fetchEmployees, fetchPerformance]);

  const employeeMap = useMemo(() => {
    return employees.reduce(
      (map, emp) => {
        // SystemEmployee type has name property, user might be available at runtime
        const employeeWithUser = emp as SystemEmployee & {
          user?: { fullname?: string };
        };
        map[emp.id] = employeeWithUser.user?.fullname || emp.name || 'N/A';
        return map;
      },
      {} as Record<string, string>
    );
  }, [employees]);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesEmployee = selectedEmployee
        ? record.employee_id === selectedEmployee
        : true;
      const matchesStatus = statusFilter
        ? record.status === statusFilter
        : true;
      const matchesStartDate = startDate
        ? new Date(record.createdAt) >= new Date(startDate)
        : true;
      const matchesEndDate = endDate
        ? new Date(record.createdAt) <= new Date(endDate)
        : true;
      return (
        matchesEmployee && matchesStatus && matchesStartDate && matchesEndDate
      );
    });
  }, [records, selectedEmployee, statusFilter, startDate, endDate]);

  const gaugeScore = useMemo(() => {
    if (selectedEmployee) {
      const employeeRecords = records.filter(
        record => record.employee_id === selectedEmployee
      );
      if (employeeRecords.length === 0) {
        return 0;
      }
      const averageScore =
        employeeRecords.reduce((sum, r) => sum + (r.overallScore || 0), 0) /
        employeeRecords.length;
      return averageScore * 20;
    }

    if (records.length === 0) {
      return 0;
    }
    const averageScore =
      records.reduce((sum, r) => sum + (r.overallScore || 0), 0) /
      records.length;
    return averageScore * 20;
  }, [records, selectedEmployee]);

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: 'radialBar' as const,
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: {
            margin: 0,
            size: '70%',
            background: theme.palette.background.paper,
          },
          track: {
            background: theme.palette.divider,
            strokeWidth: '67%',
            margin: 0,
          },
          dataLabels: {
            show: true,
            name: {
              show: false,
            },
            value: {
              offsetY: -10,
              fontSize: '22px',
              fontWeight: 600,
              color: theme.palette.text.primary,
              formatter: (val: number) => {
                return `${val.toFixed(1)}%`;
              },
            },
          },
        },
      },
      fill: {
        type: 'gradient' as const,
        gradient: {
          shade: 'dark' as const,
          type: 'horizontal' as const,
          shadeIntensity: 0.5,
          gradientToColors:
            gaugeScore >= 60
              ? [theme.palette.success.main]
              : gaugeScore >= 30
                ? [theme.palette.warning.light]
                : [theme.palette.error.main],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
      colors:
        gaugeScore >= 60
          ? [theme.palette.success.main]
          : gaugeScore >= 30
            ? [theme.palette.warning.light]
            : [theme.palette.error.main],
      stroke: {
        lineCap: 'round' as const,
      },
      labels: [selectedEmployee ? 'Employee Score' : 'Overall Score'],
    }),
    [
      gaugeScore,
      selectedEmployee,
      theme.palette.text.primary,
      theme.palette.background.paper,
      theme.palette.divider,
      theme.palette.success.main,
      theme.palette.warning.light,
      theme.palette.error.main,
    ]
  );

  const chartSeries = useMemo(
    () => [Math.min(Math.max(gaugeScore, 0), 100)],
    [gaugeScore]
  );

  if (loading) {
    return (
      <AppCard>
        <Box sx={{ p: 3 }}>
          <Typography variant='h5' fontWeight={600} gutterBottom>
            Company Performance
          </Typography>
          <Typography variant='body2' color='text.secondary' gutterBottom>
            Overview gauge by tenant
          </Typography>
          <Box
            display='flex'
            justifyContent='center'
            alignItems='center'
            minHeight='400px'
          >
            <CircularProgress />
          </Box>
        </Box>
      </AppCard>
    );
  }

  return (
    <AppCard>
      <Box sx={{ p: 3 }}>
        <Typography variant='h5' fontWeight={600} gutterBottom>
          Company Performance
        </Typography>
        <Typography variant='body2' color='text.secondary' gutterBottom>
          Overview gauge by tenant
        </Typography>
        {/* Labels row to align with controls (hidden on small screens) */}
        {/* <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            gap: 2,
            mb: 0.5,
            alignItems: 'center',
          }}
        >
          <Box sx={{ minWidth: 220 }}>
            <Typography className='subheading2' sx={{ fontWeight: 500 }}>
              Employee
            </Typography>
          </Box>

          <Box sx={{ minWidth: 220 }}>
            <Typography className='subheading2' sx={{ fontWeight: 500 }}>
              Status
            </Typography>
          </Box>

          <Box sx={{ minWidth: 220 }}>
            <Typography className='subheading2' sx={{ fontWeight: 500 }}>
              Start Date
            </Typography>
          </Box>

          <Box sx={{ minWidth: 220 }}>
            <Typography className='subheading2' sx={{ fontWeight: 500 }}>
              End Date
            </Typography>
          </Box>
        </Box> */}

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'wrap',
            overflowX: 'auto',
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <Box sx={{ minWidth: { xs: '100%', sm: 190 }, maxWidth: 490 }}>
            <AppDropdown
              label='Employee'
              options={[
                { value: '', label: 'All Employees' },
                ...employees.map(emp => ({
                  value: emp.id,
                  label: employeeMap[emp.id],
                })),
              ]}
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value as string)}
              containerSx={{ width: '100%' }}
              size='small'

              // placeholder='Employee'
            />
          </Box>

          <Box sx={{ minWidth: { xs: '100%', sm: 190 }, maxWidth: 490 }}>
            <AppDropdown
              label='Status'
              options={[
                { value: 'completed', label: 'Completed' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'pending', label: 'Pending' },
              ]}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as string)}
              containerSx={{ width: '100%' }}
              size='small'
            />
          </Box>

          <Box sx={{ minWidth: { xs: '100%', sm: 200 }, maxWidth: 200 }}>
            <Typography
              className='subheading2'
              sx={{ fontWeight: 500, color: theme.palette.text.primary }}
            >
              Start Date
            </Typography>
            <AppTextField
              type='date'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStartDate(e.target.value)
              }
              size='small'
              sx={{
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  minHeight: '48px',
                  borderRadius: '12px',
                  color: theme.palette.text.primary,
                },
                '& input[type="date"]': {
                  padding: '10px 12px',
                  height: '32px',
                  boxSizing: 'border-box',
                },
              }}
            />
          </Box>

          <Box sx={{ minWidth: { xs: '100%', sm: 200 }, maxWidth: 200 }}>
            <Typography
              className='subheading2'
              sx={{ fontWeight: 500, color: theme.palette.text.primary }}
            >
              End Date
            </Typography>
            <AppTextField
              type='date'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEndDate(e.target.value)
              }
              size='small'
              sx={{
                mt: 1,
                '& .MuiOutlinedInput-root': {
                  minHeight: '48px',
                  borderRadius: '12px',
                  color: theme.palette.text.primary,
                },
                '& input[type="date"]': {
                  padding: '10px 12px',
                  height: '32px',
                  boxSizing: 'border-box',
                },
              }}
            />
          </Box>
        </Box>

        <Grid
          container
          spacing={4}
          sx={{
            flexWrap: {
              xs: 'wrap',
              md: 'nowrap',
            },
          }}
        >
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Chart
                key={`gauge-${gaugeScore}-${selectedEmployee || 'all'}`}
                options={chartOptions}
                series={chartSeries}
                type='radialBar'
                height={280}
              />
              <Typography align='center' variant='h6' mt={1}>
                {selectedEmployee
                  ? `Employee Score: ${gaugeScore.toFixed(1)}%`
                  : `Overall Score: ${gaugeScore.toFixed(1)}%`}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <AppTable
              size='small'
              noPaper
              sx={{ width: '100%', overflow: 'auto' }}
            >
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Cycle</TableCell>
                  <TableCell>Overall Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map(row => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {employeeMap[row.employee?.id] || 'N/A'}
                      </TableCell>
                      <TableCell>{row.cycle}</TableCell>
                      <TableCell>{row.overallScore}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{formatDate(row.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      No performance records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </AppTable>
          </Grid>
        </Grid>
      </Box>
    </AppCard>
  );
};

export default PerformanceTrend;
