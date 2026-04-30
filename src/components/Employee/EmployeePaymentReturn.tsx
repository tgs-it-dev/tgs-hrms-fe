import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Stripe success/cancel URLs for employee purchase may redirect back to `/employees`.
 * This route handler forwards the browser to the unified confirmation page.
 */
const EmployeePaymentReturn: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkoutSessionId =
      searchParams.get('checkout_session_id') ||
      searchParams.get('checkoutSessionId') ||
      searchParams.get('session_id');

    const paymentResult =
      searchParams.get('payment') || searchParams.get('payment_result');

    // If we have a session id but no stored pending state (new tab, refresh, etc),
    // create a minimal pending payload so `/signup/confirm-payment` can treat it
    // as an employee flow.
    if (checkoutSessionId) {
      try {
        const existing = sessionStorage.getItem('pendingEmployeePayment');
        if (!existing) {
          sessionStorage.setItem(
            'pendingEmployeePayment',
            JSON.stringify({
              checkoutSessionId,
              returnTo: '/dashboard/employee-manager',
              createdAt: new Date().toISOString(),
            })
          );
        }
      } catch {
        // ignore
      }
    }

    // If payment was cancelled or we don't have a session, just go back to employees list.
    if (!checkoutSessionId || (paymentResult && paymentResult !== 'success')) {
      navigate('/dashboard/employee-manager', { replace: true });
      return;
    }

    navigate(
      `/signup/confirm-payment?checkout_session_id=${encodeURIComponent(
        checkoutSessionId
      )}`,
      { replace: true }
    );
  }, [navigate, searchParams]);

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
        Redirecting...
      </Typography>
    </Box>
  );
};

export default EmployeePaymentReturn;
