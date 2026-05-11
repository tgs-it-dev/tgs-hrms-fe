import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import signupApi from '../../api/signupApi';
import { useUser } from '../../hooks/useUser';
import { persistAuthSession } from '../../utils/authSession';

const cleanupPendingSignupData = () => {
  try {
    sessionStorage.removeItem('pendingSignupCredentials');
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem('signupSessionId');
  } catch {
    // ignore
  }
};

// Maps PayPal subscription status codes to user-facing messages.
const statusMessage = (status: string | undefined): string => {
  switch (status) {
    case 'APPROVAL_PENDING':
      return 'Your PayPal approval is still pending. Please complete the payment on PayPal and try again.';
    case 'SUSPENDED':
    case 'CANCELLED':
      return 'Your subscription was cancelled or suspended. Please try a different plan or contact support.';
    default:
      return 'Payment could not be confirmed. Please try again or contact support.';
  }
};

const ConfirmPayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { updateUser, refreshUser } = useUser();
  const hasStartedRef = useRef(false);

  const hydrateUserContext = useCallback(
    async (userPayload?: Record<string, unknown>) => {
      if (userPayload && Object.keys(userPayload).length) {
        try {
          updateUser(
            userPayload as unknown as Parameters<typeof updateUser>[0]
          );
        } catch {
          // ignore
        }
      }
      try {
        await refreshUser();
      } catch {
        // best-effort — session is already persisted
      }
    },
    [refreshUser, updateUser]
  );

  const handlePaymentConfirmation = useCallback(async () => {
    try {
      setLoading(true);

      // PayPal return URL: /signup/confirm-payment?subscription_id=I-xxx&signupSessionId=xxx
      const subscriptionId = searchParams.get('subscription_id');
      const signupSessionId = searchParams.get('signupSessionId');
      const storedAccessToken = localStorage.getItem('accessToken');

      const isSignupFlow = Boolean(signupSessionId);
      const isLoginFlow = Boolean(storedAccessToken && !signupSessionId);

      if (!subscriptionId) {
        throw new Error('Missing PayPal subscription information.');
      }

      if (!isSignupFlow && !isLoginFlow) {
        throw new Error('Invalid payment session. Please try again.');
      }

      // Step 4: POST /signup/payment/confirm
      // The PayPal subscription ID (I-xxx) is sent as checkoutSessionId per backend contract.
      const paymentResult = await signupApi.confirmPayment({
        signupSessionId: signupSessionId || null,
        checkoutSessionId: subscriptionId,
      });

      const isPaid =
        paymentResult.isPaid === true ||
        paymentResult.status === 'APPROVED' ||
        paymentResult.status === 'ACTIVE';

      if (!isPaid) {
        throw new Error(
          paymentResult.message || statusMessage(paymentResult.status)
        );
      }

      if (isSignupFlow && signupSessionId) {
        // Step 5: POST /signup/complete → { accessToken, refreshToken }
        const completeResult = await signupApi.completeSignup({ signupSessionId });

        if (!completeResult.accessToken) {
          throw new Error(
            'Signup complete but no access token received. Please log in manually.'
          );
        }

        persistAuthSession({
          accessToken: completeResult.accessToken,
          refreshToken: completeResult.refreshToken,
        });

        await hydrateUserContext();
        cleanupPendingSignupData();
      } else if (isLoginFlow) {
        await hydrateUserContext();
        try {
          localStorage.removeItem('signupSessionId');
          localStorage.removeItem('company');
          localStorage.removeItem('companyDetails');
        } catch {
          // ignore
        }
      }

      setSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Payment confirmation failed');
    } finally {
      setLoading(false);
    }
  }, [searchParams, navigate, hydrateUserContext]);

  useEffect(() => {
    // Guard against React StrictMode double-firing in dev.
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    handlePaymentConfirmation();
  }, [handlePaymentConfirmation]);

  const handleRetry = () => navigate('/signup/select-plan');
  const handleGoHome = () => navigate('/');

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant='h6' color='text.secondary'>
          Confirming your payment...
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Please wait while we activate your subscription
        </Typography>
      </Box>
    );
  }

  if (error) {
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
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Typography variant='h6' sx={{ mb: 3 }}>
            Payment Confirmation Failed
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 3 }}>
            There was an issue confirming your payment. Please try again.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant='contained' onClick={handleRetry}>
              Try Again
            </Button>
            <Button variant='outlined' onClick={handleGoHome}>
              Go Home
            </Button>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant='body2' color='text.secondary'>
              Already have an account?{' '}
              <Button
                variant='text'
                color='primary'
                onClick={() => navigate('/')}
                sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
              >
                Login here
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (success) {
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
        <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
          <CheckCircleIcon
            sx={{ fontSize: 80, color: 'success.main', mb: 2 }}
          />
          <Typography variant='h4' sx={{ mb: 2, color: 'success.main' }}>
            Payment Successful!
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 3 }}>
            Your subscription is now active. Redirecting to dashboard...
          </Typography>
          <CircularProgress size={24} />
        </Paper>
      </Box>
    );
  }

  return null;
};

export default ConfirmPayment;
