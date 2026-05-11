import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Alert,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate, useSearchParams } from 'react-router-dom';
import billingApi from '../../api/billingApi';

/**
 * PayPal redirects back to /employees after the user approves (or cancels) an
 * employee-slot addon purchase.
 *
 * Success URL shape:
 *   /employees?payment=success&purchaseId=<internal-id>&token=<paypal-order-id>
 *
 * Cancel URL shape:
 *   /employees?payment=cancelled
 */
const EmployeePaymentReturn: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<
    'loading' | 'success' | 'cancelled' | 'error'
  >('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [employeeCount, setEmployeeCount] = useState<number | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const payment = searchParams.get('payment');

    if (payment === 'cancelled') {
      setStatus('cancelled');
      return;
    }

    if (payment !== 'success') {
      // No payment params — just go to the employee list.
      navigate('/dashboard/employee-manager', { replace: true });
      return;
    }

    // PayPal returns token = orderId, purchaseId from backend return URL config.
    const orderId =
      searchParams.get('token') || searchParams.get('orderId') || '';
    const purchaseId =
      searchParams.get('purchaseId') ||
      localStorage.getItem('pendingAddonPurchaseId') ||
      '';

    if (!orderId || !purchaseId) {
      setErrorMessage(
        'Missing payment details. The purchase may have already been processed.'
      );
      setStatus('error');
      return;
    }

    billingApi
      .captureAddon({ orderId, purchaseId })
      .then(result => {
        if (result.status === 'COMPLETED') {
          localStorage.removeItem('pendingAddonPurchaseId');
          setEmployeeCount(result.employeeCount ?? null);
          setStatus('success');
        } else {
          setErrorMessage(
            `Payment capture returned status: ${result.status}. Please contact support.`
          );
          setStatus('error');
        }
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (err as Error)?.message ||
          'Failed to capture payment.';
        setErrorMessage(msg);
        setStatus('error');
      });
  }, [navigate, searchParams]);

  // Redirect to employee list after a brief success display.
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => {
      navigate('/dashboard/employee-manager', { replace: true });
    }, 2500);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={56} />
        <Typography variant='h6' color='text.secondary'>
          Completing your purchase...
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Please wait while we confirm your employee slots
        </Typography>
      </Box>
    );
  }

  if (status === 'cancelled') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 480, textAlign: 'center' }}>
          <Alert severity='info' sx={{ mb: 3 }}>
            Payment cancelled. No charge was made.
          </Alert>
          <Typography color='text.secondary' sx={{ mb: 3 }}>
            You can purchase employee slots again from the Employees page.
          </Typography>
          <Button
            variant='contained'
            onClick={() =>
              navigate('/dashboard/employee-manager', { replace: true })
            }
          >
            Back to Employees
          </Button>
        </Paper>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 480, textAlign: 'center' }}>
          <Alert severity='error' sx={{ mb: 3 }}>
            {errorMessage}
          </Alert>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Purchase Could Not Be Completed
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 3 }}>
            If you were charged, please contact support and we will resolve it
            promptly.
          </Typography>
          <Button
            variant='contained'
            onClick={() =>
              navigate('/dashboard/employee-manager', { replace: true })
            }
          >
            Back to Employees
          </Button>
        </Paper>
      </Box>
    );
  }

  // success
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 480, textAlign: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant='h5' sx={{ mb: 1, color: 'success.main' }}>
          Purchase Successful!
        </Typography>
        {employeeCount !== null && (
          <Typography variant='body1' sx={{ mb: 2 }}>
            {employeeCount} employee slot
            {employeeCount !== 1 ? 's' : ''} added to your plan.
          </Typography>
        )}
        <Typography color='text.secondary' sx={{ mb: 3 }}>
          Redirecting back to employees...
        </Typography>
        <CircularProgress size={24} />
      </Paper>
    </Box>
  );
};

export default EmployeePaymentReturn;
