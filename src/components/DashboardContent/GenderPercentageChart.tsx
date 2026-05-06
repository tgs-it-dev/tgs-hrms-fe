import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  CircularProgress,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
// useOutletContext removed (darkMode not used)
import { useLanguage } from '../../hooks/useLanguage';
import employeeApi from '../../api/employeeApi';
import type { GenderPercentage } from '../../types/employee';

type GenderDataItem = {
  name: 'Male' | 'Female';
  value: number;
  color: string;
  percentage: number;
};

// Translations
const labels = {
  activity: { en: 'Activity', ar: 'النشاط' },
  activeEmployees: { en: 'Active Employees', ar: 'الموظفين النشطين' },
  male: { en: 'Male', ar: 'ذكر' },
  female: { en: 'Female', ar: 'أنثى' },
  error: {
    en: 'Failed to load total employee data. Please try again later.',
    ar: 'Failed to load total employee data. Please try again later.',
  },
};

// Custom Tooltip
const CustomTooltip = ({
  active,
  payload,
  language,
}: {
  active?: boolean;
  payload?: Array<{
    payload: { color: string; percentage: number };
    name: string;
  }>;
  language: 'en' | 'ar';
}) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const color = item.payload.color;
    const translatedName =
      item.name === 'Male' ? labels.male[language] : labels.female[language];

    return (
      <Box
        sx={{
          backgroundColor: color,
          color: theme.palette.common.white,
          p: '8px 12px',
          borderRadius: '8px',
          fontSize: '14px',
        }}
      >
        {translatedName}: <b>{item.payload.percentage}</b>
      </Box>
    );
  }

  return null;
};

export default function GenderPercentageChart() {
  const { language } = useLanguage();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const [genderData, setGenderData] = useState<GenderDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Responsive donut chart dimensions
  const chartHeight = isSmallScreen ? 200 : 300;
  const innerRadius = isSmallScreen ? 50 : 80;
  const outerRadius = isSmallScreen ? 75 : 120;

  useEffect(() => {
    const fetchGenderData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data: GenderPercentage = await employeeApi.getGenderPercentage();

        const transformedData: GenderDataItem[] = [
          {
            name: 'Male',
            value: data.male,
            color: theme.palette.primary.main,
            percentage: data.male,
          },
          {
            name: 'Female',
            value: data.female,
            color: theme.palette.secondary.main,
            percentage: data.female,
          },
        ];
        setGenderData(transformedData);
      } catch {
        // If there's an error (including tenant with zero employees), render zeros
        setError(null);
        setGenderData([
          {
            name: 'Male',
            value: 0,
            color: theme.palette.primary.main,
            percentage: 0,
          },
          {
            name: 'Female',
            value: 0,
            color: theme.palette.secondary.main,
            percentage: 0,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchGenderData();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '0.375rem',
          backgroundColor: theme.palette.background.paper,
          direction: language === 'ar' ? 'rtl' : 'ltr',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '0.375rem',
          backgroundColor: theme.palette.background.paper,
          direction: language === 'ar' ? 'rtl' : 'ltr',
        }}
      >
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          height={100}
        >
          <Typography variant='body2' color='error' textAlign='center'>
            {labels.error[language]}
          </Typography>
        </Box>
      </Box>
    );
  }

  const totalEmployees = genderData.reduce((sum, item) => sum + item.value, 0);

  // Debug: Log the current state being rendered

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      {/* Title with Legend on Right */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
        }}
      >
        <Stack direction='row' spacing={{ xs: 1, lg: 2 }} alignItems='center'>
          {genderData.map((item, index) => (
            <React.Fragment key={item.name}>
              <Stack direction='row' alignItems='center' spacing={1}>
                <Box
                  sx={{
                    width: { xs: '12px', lg: '20px' },
                    height: { xs: '12px', lg: '20px' },
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />
                <Typography
                  fontSize={{ xs: '12px', lg: '20px' }}
                  lineHeight={{ xs: '24px', lg: '28px' }}
                  letterSpacing='-1%'
                  fontWeight={500}
                  sx={{ color: theme.palette.text.primary }}
                >
                  {item.name === 'Male'
                    ? labels.male[language]
                    : labels.female[language]}{' '}
                  <Box component='span' fontWeight={500}>
                    {item.value}
                  </Box>
                </Typography>
              </Stack>
              {index < genderData.length - 1 && (
                <Divider
                  orientation='vertical'
                  flexItem
                  sx={{
                    height: '24px',
                    borderColor: 'var(--light-grey-color)',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </Stack>
      </Box>

      {/* Donut Chart with Center Text */}
      <Box
        tabIndex={-1}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: chartHeight,
          '& svg, & path': {
            outline: 'none',
            border: 'none',
          },
        }}
      >
        <ResponsiveContainer width='100%' height={chartHeight}>
          <PieChart>
            <Pie
              data={genderData}
              cx='50%'
              cy='50%'
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={4}
              cornerRadius={6}
              dataKey='value'
              startAngle={90}
              endAngle={-270}
            >
              {genderData.map((entry, _index) => (
                <Cell key={`cell-${_index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip language={language} />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '10px', lg: '14px' },
              lineHeight: { xs: '14px', lg: '20px' },
              letterSpacing: '-1%',
              fontWeight: 400,
              color: theme.palette.text.secondary,
              mb: 0.5,
            }}
          >
            {labels.activeEmployees[language]}
          </Typography>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: { xs: '18px', lg: '28px' },
              lineHeight: { xs: '24px', lg: '36px' },
              letterSpacing: '-2%',
              color: theme.palette.text.primary,
            }}
          >
            {totalEmployees}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
