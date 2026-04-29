import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type SelectChangeEvent = React.ChangeEvent<{ value: unknown }>;

const mockData: Record<string, { name: string; value: number }[]> = {
  Ali: [
    { name: 'Sick Leave', value: 4 },
    { name: 'Casual Leave', value: 2 },
    { name: 'Annual Leave', value: 3 },
  ],
  Sara: [
    { name: 'Sick Leave', value: 1 },
    { name: 'Casual Leave', value: 3 },
    { name: 'Annual Leave', value: 5 },
  ],
  HR: [
    { name: 'Sick Leave', value: 6 },
    { name: 'Casual Leave', value: 4 },
    { name: 'Annual Leave', value: 2 },
  ],
  IT: [
    { name: 'Sick Leave', value: 3 },
    { name: 'Casual Leave', value: 1 },
    { name: 'Annual Leave', value: 6 },
  ],
};

import { colorTokens } from '../../theme';
const CHART_COLORS = colorTokens.chart;

const LeaveSummaryChart: React.FC = () => {
  const [selected, setSelected] = useState('Ali');

  const handleChange = (event: SelectChangeEvent) =>
    setSelected(event.target.value as string);

  const chartData = mockData[selected] || [];

  return (
    <Box mt={4}>
      <Box width={{ xs: '100%', sm: '50%' }} mb={3}>
        <FormControl fullWidth size='small'>
          <InputLabel id='select-label' sx={{ top: '-6px' }}>
            User / Department
          </InputLabel>
          <Select
            labelId='select-label'
            value={selected}
            onChange={handleChange}
          >
            <MenuItem value='Ali'>Ali</MenuItem>
            <MenuItem value='Sara'>Sara</MenuItem>
            <MenuItem value='HR'>HR Department</MenuItem>
            <MenuItem value='IT'>IT Department</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Typography variant='h6' gutterBottom>
        Leave Summary – {selected}
      </Typography>

      <Box height={300}>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie
              data={chartData}
              cx='50%'
              cy='50%'
              outerRadius={80}
              dataKey='value'
              label
            >
              {chartData.map((_entry, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default LeaveSummaryChart;
