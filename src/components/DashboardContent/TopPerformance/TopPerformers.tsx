import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  useTheme,
} from '@mui/material';
import { useLanguage } from '../../../hooks/useLanguage';

type Performer = {
  name: string;
  email: string;
  percentage: number;
  icon: React.ReactNode;
};

type TopPerformersProps = {
  title?: string;
  subtitle?: string;
  newTask: number;
  completedTask: number;
  newTaskLabel: string;
  completedTaskLabel: string;
  performers: Performer[];
};

const TopPerformers: React.FC<TopPerformersProps> = ({
  title = 'Top Performers',
  subtitle = 'You have 140 influencers in your company.',
  newTask,
  completedTask,
  newTaskLabel,
  completedTaskLabel,
  performers,
}) => {
  const { language } = useLanguage();
  const theme = useTheme();

  const bgColor = theme.palette.background.paper;
  const textColor = theme.palette.text.secondary;

  return (
    <Box
      p={1}
      bgcolor='#f1c8db'
      borderRadius={'0.375rem'}
      boxShadow={2}
      sx={{ direction: language === 'ar' ? 'rtl' : 'ltr' }} // Apply RTL
    >
      <Box p={2}>
        <Typography
          variant='h6'
          fontWeight={700}
          fontSize={16}
          gutterBottom
          mb={3}
          color={textColor}
        >
          {title}
        </Typography>
        <Typography variant='body2' color={textColor}>
          {subtitle}
        </Typography>
      </Box>

      {/* Task Stats */}
      <Box
        display='flex'
        justifyContent={'space-between'}
        gap={2}
        mb={1}
        p={2}
        pt={0}
        borderRadius={'0.375rem'}
        sx={{ maxWidth: { md: 279 } }}
      >
        <Box>
          <Typography
            variant='h5'
            fontWeight={700}
            textAlign={'center'}
            color={textColor}
          >
            {newTask.toLocaleString(language)}
          </Typography>
          <Typography fontSize={14} color={textColor} textAlign={'center'}>
            {newTaskLabel}
          </Typography>
        </Box>
        <Box>
          <Typography variant='h5' fontWeight={700} color={textColor}>
            {completedTask.toLocaleString(language)}
          </Typography>
          <Typography fontSize={14} color={textColor}>
            {completedTaskLabel}
          </Typography>
        </Box>
      </Box>

      {/* Performers */}
      <Box display='flex' flexWrap='wrap' justifyContent='center' gap={2}>
        {performers.map((p, i) => (
          <Card
            key={i}
            sx={{
              flex: {
                xs: '0 0 calc(50% - 16px)',
                sm: '0 0 calc(33.33% - 16px)',
              },
              maxWidth: '100%',
              borderRadius: '0.375rem',
              boxShadow: '0 .5rem 1rem rgba(0, 0, 0, 0.15)',
              textAlign: 'center',
              backgroundColor: bgColor,
            }}
          >
            <CardContent>
              <Avatar sx={{ margin: '0 auto', bgcolor: '#1976d2' }}>
                {p.icon}
              </Avatar>
              <Typography
                mt={1}
                fontWeight={600}
                fontSize={'14px'}
                color={textColor}
              >
                {p.name}
              </Typography>
              <Typography fontSize={'12px'} color={textColor}>
                {p.email}
              </Typography>
              <Typography
                mt={1}
                fontWeight={700}
                sx={{ fontSize: { xs: '29px', md: '38px' } }}
                color='#484c7f'
              >
                {p.percentage.toLocaleString(language)}%
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default TopPerformers;
