import {
  Box,
  Typography,
  useMediaQuery,
  CircularProgress,
  useTheme,
} from '@mui/material';
import Chart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { useLanguage } from '../../hooks/useLanguage';
import { useState, useEffect } from 'react';
import {
  getEmployeeJoiningReport,
  type EmployeeJoiningReport,
} from '../../api/employeeApi';
import TimeRangeSelector from '../common/TimeRangeSelector';

export default function EmployeesInfoChart() {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningData, setJoiningData] = useState<EmployeeJoiningReport[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    string | number | null
  >('all-time');

  useEffect(() => {
    const fetchJoiningData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEmployeeJoiningReport();
        setJoiningData(data);
      } catch {
        setError(null);
        const currentYear = new Date().getFullYear();
        setJoiningData(
          Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            year: currentYear,
            total: 0,
          }))
        );
      } finally {
        setLoading(false);
      }
    };

    fetchJoiningData();
  }, []);

  const availableYears = [...new Set(joiningData.map(item => item.year))].sort(
    (a, b) => b - a
  );

  const filteredData =
    selectedTimeRange === 'all-time' || selectedTimeRange === null
      ? joiningData
      : joiningData.filter(item => item.year === (selectedTimeRange as number));

  const chartTitle = { en: 'Employee Growth', ar: 'نمو الموظفين' };

  const monthKeys = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthLabels: Record<string, Record<string, string>> = {
    Jan: { en: 'Jan', ar: 'يناير' },
    Feb: { en: 'Feb', ar: 'فبراير' },
    Mar: { en: 'Mar', ar: 'مارس' },
    Apr: { en: 'Apr', ar: 'أبريل' },
    May: { en: 'May', ar: 'مايو' },
    Jun: { en: 'Jun', ar: 'يونيو' },
    Jul: { en: 'Jul', ar: 'يوليو' },
    Aug: { en: 'Aug', ar: 'أغسطس' },
    Sep: { en: 'Sep', ar: 'سبتمبر' },
    Oct: { en: 'Oct', ar: 'أكتوبر' },
    Nov: { en: 'Nov', ar: 'نوفمبر' },
    Dec: { en: 'Dec', ar: 'ديسمبر' },
  };

  const categories = monthKeys.map(m => monthLabels[m][language]);

  const seriesData = monthKeys.map((_, i) => {
    const monthIndex = i + 1;
    if (selectedTimeRange === 'all-time' || selectedTimeRange === null) {
      return filteredData
        .filter(item => item.month === monthIndex)
        .reduce((sum, item) => sum + item.total, 0);
    }
    return filteredData.find(item => item.month === monthIndex)?.total ?? 0;
  });

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      background: 'transparent',
      animations: { enabled: false },
    },
    theme: { mode: theme.palette.mode },
    stroke: { curve: 'smooth', width: 3 },
    colors: [theme.palette.secondary.main],
    markers: { size: 3, colors: [theme.palette.warning.light] },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: false } },
      borderColor: theme.palette.divider,
    },
    xaxis: {
      categories,
      labels: {
        rotate: isMobile ? -45 : 0,
        style: {
          colors: theme.palette.text.primary,
          fontSize: '12px',
        },
      },
      axisBorder: { color: theme.palette.divider },
      axisTicks: { color: theme.palette.divider },
    },
    yaxis: { labels: { show: false }, axisBorder: { show: false } },
    tooltip: {
      theme: theme.palette.mode,
      style: { fontSize: '14px' },
    },
    legend: { show: false },
  };

  return (
    <Box
      sx={{
        direction: language === 'ar' ? 'rtl' : 'ltr',
        width: '100%',
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
          gap: { xs: 1.25, sm: 2 },
          mb: 2,
        }}
      >
        <Typography
          fontWeight={500}
          fontSize={{ xs: '20px', lg: '28px' }}
          lineHeight='36px'
          letterSpacing='-2%'
          sx={{ color: theme.palette.text.primary }}
        >
          {chartTitle[language]}
        </Typography>

        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TimeRangeSelector
            value={selectedTimeRange}
            options={availableYears}
            onChange={setSelectedTimeRange}
            allTimeLabel={language === 'ar' ? 'كل الوقت' : 'All Time'}
            language={language}
            buttonSx={{ width: { xs: '100%', sm: 'auto' } }}
          />
        </Box>
      </Box>

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height={220}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height={220}
        >
          <Typography color='error' variant='body2'>
            {error}
          </Typography>
        </Box>
      ) : (
        <Chart
          type='line'
          series={[{ name: chartTitle[language], data: seriesData }]}
          options={options}
          height={220}
          width='100%'
        />
      )}
    </Box>
  );
}
