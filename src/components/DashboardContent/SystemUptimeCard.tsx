import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Chart from 'react-apexcharts';
import ApexCharts from 'apexcharts';
// useOutletContext not needed; darkMode unused

interface SystemUptimeCardProps {
  uptimeSeconds?: number;
}

const SystemUptimeCard: React.FC<SystemUptimeCardProps> = ({
  uptimeSeconds = 0,
}) => {
  const theme = useTheme();
  // darkMode not used

  const [liveUptime, setLiveUptime] = useState(uptimeSeconds);
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLiveUptime(uptimeSeconds);
  }, [uptimeSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUptime(prev => {
        const next = prev + 1;
        const percent = Math.min(
          100,
          Number(((next / 86400) * 100).toFixed(2))
        );

        if (chartRef.current) {
          ApexCharts.exec('uptime-chart', 'updateSeries', [percent]);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const uptimePercentage = Math.min(
    100,
    Number(((liveUptime / 86400) * 100).toFixed(2))
  );

  const options: ApexCharts.ApexOptions = {
    chart: {
      id: 'uptime-chart',
      type: 'radialBar',
      sparkline: { enabled: true },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 500,
        dynamicAnimation: { enabled: true, speed: 350 },
      },
    },
    colors: [theme.palette.success.main],
    plotOptions: {
      radialBar: {
        hollow: { size: '70%' },
        dataLabels: {
          name: { show: false },
          value: {
            formatter: val => `${val}%`,
            color: theme.palette.text.primary,
            fontSize: '16px',
            fontWeight: 600,
            offsetY: 55,
          },
        },
      },
    },
    stroke: { lineCap: 'round' },
  };

  const series = [uptimePercentage];

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: '20px',
        backgroundColor: theme.palette.background.paper,
        textAlign: 'center',
        boxShadow: 'none',
        width: '100%',
      }}
      elevation={3}
    >
      <Typography
        variant='h6'
        fontWeight='bold'
        sx={{ color: theme.palette.text.primary, mb: 2 }}
      >
        System Uptime
      </Typography>

      <Box
        sx={{ position: 'relative', display: 'inline-block' }}
        ref={chartRef}
      >
        <Chart
          options={options}
          series={series}
          type='radialBar'
          height={200}
        />

        <AccessTimeIcon
          sx={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 42,
            color: theme.palette.success.main,
          }}
        />
      </Box>

      <Typography sx={{ color: theme.palette.text.primary }} mt={1}>
        {uptimePercentage.toFixed(2)}% uptime in the last 24 hours
      </Typography>
      <Typography variant='body2' sx={{ color: theme.palette.text.secondary }}>
        ({liveUptime.toLocaleString()} seconds active)
      </Typography>
    </Paper>
  );
};

export default SystemUptimeCard;
