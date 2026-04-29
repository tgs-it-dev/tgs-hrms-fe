import { Avatar, Box, Typography, useTheme } from '@mui/material';
import type { Interview } from '../../../types/interview';
import { useLanguage } from '../../../hooks/useLanguage';

export default function InterviewItem({
  name,
  role,
  time,
  avatarUrl,
}: Interview) {
  const { language } = useLanguage();
  const theme = useTheme();

  const textColor = theme.palette.text.secondary;
  const borderBottomColor = theme.palette.divider;

  const roleTranslations: Record<string, { en: string; ar: string }> = {
    'UI/UX Designer': { en: 'UI/UX Designer', ar: 'مصمم UI/UX' },
    'Frontend Developer': {
      en: 'Frontend Developer',
      ar: 'مطور الواجهة الأمامية',
    },
    'Backend Developer': { en: 'Backend Developer', ar: 'مطور Backend' },
    'React Developer': { en: 'React Developer', ar: 'مطور React' },
    'Product Manager': { en: 'Product Manager', ar: 'مدير منتج' },
    'HR Manager': { en: 'HR Manager', ar: 'مدير الموارد البشرية' },
    'QA Engineer': { en: 'QA Engineer', ar: 'مهندس ضمان الجودة' },
    Developer: { en: 'Developer', ar: 'مطور' },
    Designer: { en: 'Designer', ar: 'مصمم' },
  };

  const translatedRole = roleTranslations[role]?.[language] || role;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1.5,
        mb: 1,
        borderBottom: `1px solid ${borderBottomColor}`,
        direction: language === 'ar' ? 'rtl' : 'ltr',
      }}
    >
      <Avatar alt={name} src={avatarUrl} sx={{ width: 48, height: 48 }} />

      <Box
        sx={{
          flexGrow: 1,
          ml: language === 'ar' ? 0 : 2,
          mr: language === 'ar' ? 2 : 0,
        }}
      >
        <Typography fontWeight='bold' color={textColor}>
          {name}
        </Typography>
        <Typography fontSize={14} color={textColor}>
          {translatedRole}
        </Typography>
      </Box>

      <Box>
        <Typography fontSize={14} color={textColor}>
          {time}
        </Typography>
      </Box>
    </Box>
  );
}
