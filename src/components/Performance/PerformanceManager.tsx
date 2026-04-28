import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import AppDropdown from '../common/AppDropdown';
import PerformanceKpiGrid from './KPIPerformanceOverview';
import PerformanceTrendChart from './PerformanceTrend';
import PromotionsList from './PromotionsTable';
import { systemEmployeeApiService } from '../../api/systemEmployeeApi';
import type { Tenant } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';

const PerformanceDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [loadingTenants, setLoadingTenants] = useState(true);
  const { snackbar, showError, closeSnackbar } = useErrorHandler();

  const fetchTenants = useCallback(async () => {
    setLoadingTenants(true);
    try {
      const data = await systemEmployeeApiService.getAllTenants(true);
      // Filter to only show active tenants
      const activeTenants = data.filter(t => t.status === 'active');
      setTenants(activeTenants);

      if (activeTenants.length > 0) {
        if (
          !selectedTenant ||
          !activeTenants.find(t => t.id === selectedTenant)
        ) {
          const testifyTenant = activeTenants.find(
            t => t.name === 'Testify Solutions'
          );
          if (testifyTenant) {
            setSelectedTenant(testifyTenant.id);
          } else {
            setSelectedTenant(activeTenants[0].id);
          }
        }
      }
    } catch {
      showError('Failed to fetch tenants.');
    } finally {
      setLoadingTenants(false);
    }
  }, [selectedTenant, showError]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return (
    <Box>
      <Typography
        variant='h4'
        fontWeight={600}
        fontSize={{ xs: '32px', lg: '48px' }}
        mb={2}
      >
        Performance Dashboard
      </Typography>

      <Box display='flex' gap={2} mb={3} flexWrap='wrap'>
        <AppDropdown
          label='Tenant'
          options={
            loadingTenants
              ? [{ value: '', label: 'Loading...' }]
              : tenants.length === 0
                ? [{ value: '', label: 'No tenants available' }]
                : [
                    { value: '', label: 'All' },
                    ...tenants.map(t => ({ value: t.id, label: t.name })),
                  ]
          }
          value={selectedTenant || ''}
          onChange={e => setSelectedTenant(String(e.target.value))}
          containerSx={{ minWidth: { xs: '100%', sm: 160 }, maxWidth: 220 }}
          size='small'
        />
      </Box>

      {loadingTenants || !selectedTenant ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='400px'
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ mb: 3, boxShadow: 'none', backgroundColor: 'unset' }}>
            <PerformanceKpiGrid tenantId={selectedTenant} />
          </Paper>

          {/* <Paper sx={{ mb: 3, boxShadow: 'none', p: 0 }}> */}
          <PerformanceTrendChart tenantId={selectedTenant} />
          {/* </Paper> */}

          <Paper sx={{ mt: 3, p: 2, boxShadow: 'none' }}>
            <PromotionsList tenantId={selectedTenant} />
          </Paper>
        </>
      )}

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default PerformanceDashboard;
