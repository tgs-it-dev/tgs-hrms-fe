import { Box, Typography, useTheme } from '@mui/material';
import InterviewItem from './InterviewItem';
import { upcomingInterviews } from '../../../Data/upcomingInterviews.ts';
import { useLanguage } from '../../../hooks/useLanguage';

export default function UpcomingInterviews() {
  const { language } = useLanguage();
  const theme = useTheme();

  const bgColor = theme.palette.background.paper;
  const borderColor = theme.palette.divider;
  const textColor = theme.palette.text.secondary;

  const labels = {
    en: 'Upcoming Interviews',
    ar: 'المقابلات القادمة',
  };

  return (
    <Box
      sx={{
        mt: 1,
        p: 2,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.375rem',
        backgroundColor: bgColor,
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <Typography fontWeight='bold' fontSize={16} mb={2} color={textColor}>
        {labels[language]}
      </Typography>

      {upcomingInterviews[language].map(interview => (
        <InterviewItem key={interview.name} {...interview} />
      ))}
    </Box>
  );
}
