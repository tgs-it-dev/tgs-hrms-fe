import React from 'react';
import {
  Box,
  Typography,
  useTheme,
  Stack,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AppPageTitle from '../common/AppPageTitle';
import AppCard from '../common/AppCard';
import AppButton from '../common/AppButton';
import { useIsDarkMode } from '../../theme';
import { useUser } from '../../hooks/useUser';
import { isSystemAdmin } from '../../utils/roleUtils';
import {
  useFeatureToggles,
  type FeatureKey,
} from '../../context/FeatureToggleContext';

const featureDefinitions: {
  key: FeatureKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'payroll',
    label: 'Payroll',
    description:
      'Run payroll, manage employee salaries, and view payroll reports.',
  },
  {
    key: 'attendance',
    label: 'Attendance & Leaves',
    description:
      'Track attendance, geofencing, daily attendance, reports, and leave requests.',
  },
  {
    key: 'leaveAnalytics',
    label: 'Leave Analytics',
    description:
      'View leave analytics, reports, and cross-tenant leave metrics.',
  },
  {
    key: 'benefits',
    label: 'Benefits',
    description:
      'Configure benefits, assign employee benefits, and view benefit reports.',
  },
  {
    key: 'performance',
    label: 'Performance',
    description:
      'Enable performance dashboards and insights for employees and teams.',
  },
  {
    key: 'announcements',
    label: 'Announcements',
    description: 'Company-wide announcements module.',
  },
];

const FeatureManagementPage: React.FC = () => {
  const theme = useTheme();
  const darkMode = useIsDarkMode();
  const { user } = useUser();
  const { features, setFeatureEnabled, resetToDefaults } = useFeatureToggles();

  const isSystemAdminUser = isSystemAdmin(user?.role);

  if (!isSystemAdminUser) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography
          variant='h6'
          sx={{ color: theme.palette.text.secondary, textAlign: 'center' }}
        >
          You do not have permission to access Feature Management.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <AppPageTitle
        sx={{
          mb: 2,
          color: darkMode ? '#8f8f8f' : theme.palette.text.primary,
        }}
      >
        Feature Management
      </AppPageTitle>

      <AppCard
        elevation={1}
        sx={{
          borderRadius: 3,
          border: 'none',
          p: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Stack spacing={2}>
          {featureDefinitions.map(feature => (
            <Box
              key={feature.key}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 2,
                px: { xs: 1, sm: 1.5 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                backgroundColor: darkMode ? '#1f1f1f' : '#fafafa',
                border: `1px solid ${
                  darkMode ? '#333' : 'rgba(0,0,0,0.04)'
                }`,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant='subtitle1'
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 0.5,
                  }}
                >
                  {feature.label}
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: darkMode ? '#a0a0a0' : '#666',
                  }}
                >
                  {feature.description}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={features[feature.key]}
                    onChange={(_, checked) =>
                      setFeatureEnabled(feature.key, checked)
                    }
                    color='primary'
                  />
                }
                label={features[feature.key] ? 'Enabled' : 'Disabled'}
                sx={{
                  m: 0,
                  ml: 'auto',
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                }}
              />
            </Box>
          ))}
        </Stack>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            mt: 3,
          }}
        >
          <AppButton
            onClick={resetToDefaults}
            variant='outlined'
            variantType='secondary'
          >
            Reset to defaults
          </AppButton>
        </Box>
      </AppCard>
    </Box>
  );
};

export default FeatureManagementPage;

