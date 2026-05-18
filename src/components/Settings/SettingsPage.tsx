import React, { useState } from 'react';
import { Box, Tabs, Tab, useTheme } from '@mui/material';
import CompanyPage from './CompanyPage';
import FeatureManagementPage from './FeatureManagementPage';
import AppPageTitle from '../common/AppPageTitle';
import { useScopedTranslations } from '../../hooks/useScopedTranslations';
import WorkflowPage from './WorkflowPage';
import IpManagement from './IpManagement';
import { isAdmin } from '../../utils/roleUtils';
import { useUser } from '../../hooks/useUser';

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const t = useScopedTranslations('settings');
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useUser();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ py: 2 }}>
      <AppPageTitle
        sx={{
          mb: 3,
          color: theme.palette.text.secondary,
        }}
      >
        {t.title}
      </AppPageTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label='settings tabs'
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              minWidth: 120,
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab label={t.workflow} />
          <Tab label={t.company} />
          <Tab label={t.ipManagement} />
        </Tabs>
      </Box>

      {isAdmin(user?.role) && (
        <Box sx={{ mt: 2 }}>
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <FeatureManagementPage />
              <WorkflowPage />
            </Box>
          )}
          {activeTab === 1 && <CompanyPage />}
          {activeTab === 2 && <IpManagement />}
        </Box>
      )}
    </Box>
  );
};

export default SettingsPage;
