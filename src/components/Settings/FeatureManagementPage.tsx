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
import { useUser } from '../../hooks/useUser';
import { isAdmin, isSystemAdmin } from '../../utils/roleUtils';
import {
  useFeatureToggles,
  type FeatureKey,
} from '../../context/FeatureToggleContext';
import workflowApi, { type WorkflowRequestType } from '../../api/workflowApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const featureDefinitions: {
  key: FeatureKey;
  label: string;
  description: string;
}[] = [
  // {
  //   key: 'attendance',
  //   label: 'Attendance & Leaves',
  //   description:
  //     'Track attendance, geofencing, daily attendance, reports, and leave requests.',
  // },
  // {
  //   key: 'leaveAnalytics',
  //   label: 'Leave Analytics',
  //   description:
  //     'View leave analytics, reports, and cross-tenant leave metrics.',
  // },
  // {
  //   key: 'performance',
  //   label: 'Performance',
  //   description:
  //     'Enable performance dashboards and insights for employees and teams.',
  // },
  // {
  //   key: 'announcements',
  //   label: 'Announcements',
  //   description: 'Company-wide announcements module.',
  // },
  {
    key: 'leave_workflow_enabled',
    label: 'Leave Approval',
    description: 'Enable leave request approval workflows.',
  },
  {
    key: 'wfh_workflow_enabled',
    label: 'WFH Request',
    description: 'Display work from home request in the sidebar.',
  },
  {
    key: 'overtime_workflow_enabled',
    label: 'Overtime Request',
    description: 'Display overtime request in the sidebar.',
  },
];

const FeatureManagementPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useUser();
  const { features, setFeatureEnabled, resetToDefaults } = useFeatureToggles();
  const { showError } = useErrorHandler();

  const isSystemAdminUser = isSystemAdmin(user?.role) || isAdmin(user?.role);

  const handleFeatureToggle = async (key: FeatureKey, checked: boolean) => {
    let requestType: WorkflowRequestType | null = null;
    if (key === 'leave_workflow_enabled') requestType = 'leave';
    else if (key === 'wfh_workflow_enabled') requestType = 'wfh';
    else if (key === 'overtime_workflow_enabled') requestType = 'overtime';

    try {
      if (requestType) {
        await workflowApi.updateWorkflowSettings({
          request_type: requestType,
          enabled: checked,
        });
      }
      setFeatureEnabled(key, checked);
    } catch (error) {
      showError(error);
    }
  };

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
          color: theme.palette.text.secondary,
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
                backgroundColor: 'background.default',
                border: `1px solid ${theme.palette.divider}`,
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
                    color: 'text.secondary',
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
                      handleFeatureToggle(feature.key, checked)
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
