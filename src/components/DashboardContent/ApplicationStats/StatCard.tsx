import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { useLanguage } from '../../../hooks/useLanguage';

interface StatCardProps {
  iconLeft: React.ReactNode;
  iconRight: React.ReactNode;
  count: number;
  label: string;
}

const StatCard: React.FC<StatCardProps> = ({
  iconLeft,
  iconRight,
  count,
  label,
}) => {
  const { language } = useLanguage();
  const theme = useTheme();

  const bgColor = theme.palette.background.paper;
  const borderColor = theme.palette.divider;
  const textColor = theme.palette.text.secondary;

  // Label Translations
  const labelTranslations: Record<string, { en: string; ar: string }> = {
    'Total Employees': { en: 'Total Employees', ar: 'إجمالي الموظفين' },
    'New Hires': { en: 'New Hires', ar: 'الموظفون الجدد' },
    'Active Users': { en: 'Active Users', ar: 'المستخدمون النشطون' },
    'Interviews Scheduled': {
      en: 'Interviews Scheduled',
      ar: 'المقابلات المجدولة',
    },
    'Leaves Approved': { en: 'Leaves Approved', ar: 'الإجازات المعتمدة' },
    Interviews: { en: 'Interviews', ar: 'المقابلات' },
    Hired: { en: 'Hired', ar: 'تم التوظيف' },
  };

  const translatedLabel = labelTranslations[label]
    ? labelTranslations[label][language]
    : label; // fallback if label not found

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 2,
        border: `1px solid ${borderColor}`,
        borderRadius: '0.375rem',
        backgroundColor: bgColor,
        direction: language === 'ar' ? 'rtl' : 'ltr', // RTL/LTR Support
      }}
    >
      {/* Left Icon + Text */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            // Figma-specified mint green icon bg — not yet in design tokens
            bgcolor: '#a0d9b4',
            p: 1.5,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
          }}
        >
          {iconLeft}
        </Box>

        <Box>
          <Typography
            variant='h6'
            fontWeight={600}
            lineHeight={1.2}
            color={textColor}
          >
            {count}
          </Typography>
          <Typography variant='body2' color={textColor}>
            {translatedLabel}
          </Typography>
        </Box>
      </Box>

      {/* Right Icon */}
      <Box>{iconRight}</Box>
    </Box>
  );
};

export default StatCard;
