import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AppButton from '../common/AppButton';

const SignupSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear signup data from localStorage
    localStorage.removeItem('signupSessionId');
    localStorage.removeItem('companyDetails');
    try {
      sessionStorage.removeItem('pendingSignupCredentials');
    } catch {
      // Ignore sessionStorage errors
    }

    // Redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleGoHome = () => {
    navigate('/');
  };

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
      <Paper elevation={3} sx={{ p: 6, maxWidth: 600, textAlign: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 100, color: 'success.main', mb: 3 }} />

        <Typography
          variant='h3'
          sx={{ mb: 2, color: 'success.main', fontWeight: 700 }}
        >
          Welcome to Your HRMS!
        </Typography>

        <Typography variant='h6' color='text.secondary' sx={{ mb: 4 }}>
          Your account has been created successfully and your subscription is
          now active.
        </Typography>

        <Box
          sx={{ bgcolor: 'background.default', p: 3, borderRadius: 2, mb: 4 }}
        >
          <Typography variant='body1' sx={{ mb: 1 }}>
            ✅ Account created successfully
          </Typography>
          <Typography variant='body1' sx={{ mb: 1 }}>
            ✅ Subscription activated
          </Typography>
          <Typography variant='body1' sx={{ mb: 1 }}>
            ✅ Payment processed
          </Typography>
          <Typography variant='body1'>
            ✅ Ready to start managing your team
          </Typography>
        </Box>

        <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
          You will be automatically redirected to your dashboard in a few
          seconds.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <AppButton
            variantType='contained'
            text='Go to Dashboard'
            onClick={handleGoToDashboard}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 600,
            }}
          />
          <AppButton
            variantType='outlined'
            text='Go Home'
            onClick={handleGoHome}
            sx={{
              px: 4,
              py: 1.5,
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default SignupSuccess;
