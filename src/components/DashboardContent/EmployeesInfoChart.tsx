import {
  Box,
  Typography,
  useMediaQuery,
  CircularProgress,
  useTheme,
} from '@mui/material';
// useOutletContext removed (darkMode not used)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
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

  // Fetch employee joining report data
  useEffect(() => {
    const fetchJoiningData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getEmployeeJoiningReport();

        setJoiningData(data);
      } catch {
        // If API fails (including 401), show zero-values instead of an error block
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

  // Get unique years from API data
  const availableYears = [...new Set(joiningData.map(item => item.year))].sort(
    (a, b) => b - a
  );

  // Filter data by selected time range
  const filteredData =
    selectedTimeRange === 'all-time' || selectedTimeRange === null
      ? joiningData
      : joiningData.filter(item => item.year === (selectedTimeRange as number));

  // Translations
  const chartTitle = {
    en: 'Employee Growth',
    ar: 'نمو الموظفين',
  };

  const months: Record<string, Record<string, string>> = {
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

  // Process API data for chart - show only month names
  const originalDates = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug', // Added August to show backend data
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  // Map API data to original chart format
  const chartData = originalDates.map(monthStr => {
    const monthIndex =
      [
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
      ].indexOf(monthStr) + 1;

    // If "All Time" is selected, aggregate data across all years for this month
    if (selectedTimeRange === 'all-time' || selectedTimeRange === null) {
      const monthData = filteredData.filter(item => item.month === monthIndex);
      const value = monthData.reduce((sum, item) => sum + item.total, 0);
      return {
        date: monthStr,
        value: value,
      };
    }

    // For specific year, find corresponding API data for this month
    const apiData = filteredData.find(item => item.month === monthIndex);
    const value = apiData ? apiData.total : 0;

    return {
      date: monthStr,
      value: value,
    };
  });

  // Translate data - show month names in selected language
  const translatedData = chartData.map(item => {
    return {
      date: months[item.date]?.[language] || item.date,
      value: item.value,
    };
  });

  return (
    <Box
      sx={{
        direction: language === 'ar' ? 'rtl' : 'ltr',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        className='Ramish selected'
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
            buttonSx={{
              width: { xs: '100%', sm: 'auto' },
            }}
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
        <Box
          sx={{
            '& svg': {
              outline: 'none',
              border: 'none',
            },
            width: '100%',
            height: '200px',
            overflow: 'hidden',
          }}
        >
          <ResponsiveContainer width='100%' height={200}>
            <LineChart
              data={translatedData}
              margin={{ top: 10, right: 10, bottom: 10, left: -40 }}
            >
              <CartesianGrid horizontal={false} vertical={false} />
              <XAxis
                dataKey='date'
                tick={props => {
                  const { x, y, payload } = props;
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={16}
                      fontSize={12}
                      transform={
                        isMobile ? `rotate(-45, ${x}, ${y})` : undefined
                      }
                      textAnchor={isMobile ? 'end' : 'middle'}
                      fill={theme.palette.text.primary}
                    >
                      {payload.value}
                    </text>
                  );
                }}
                height={isMobile ? 50 : 30}
                interval={0}
                axisLine={{
                  stroke:
                    theme.palette.mode === 'dark'
                      ? theme.palette.divider
                      : theme.palette.divider,
                }}
                tickLine={{
                  stroke:
                    theme.palette.mode === 'dark'
                      ? theme.palette.divider
                      : theme.palette.divider,
                }}
              />

              <YAxis
                stroke={
                  theme.palette.mode === 'dark'
                    ? theme.palette.divider
                    : theme.palette.divider
                }
                axisLine={{
                  stroke:
                    theme.palette.mode === 'dark'
                      ? theme.palette.divider
                      : theme.palette.divider,
                }}
                tickLine={false}
                tick={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '6px',
                  color: theme.palette.text.primary,
                  fontSize: '14px',
                }}
                labelStyle={{
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                }}
              />

              <Line
                type='monotone'
                dataKey='value'
                stroke={theme.palette.secondary.main}
                strokeWidth={3}
                dot={{ r: 3, fill: theme.palette.warning.light }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
