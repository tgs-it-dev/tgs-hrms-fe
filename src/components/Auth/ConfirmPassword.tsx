import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { validatePasswordStrength } from '../../utils/validation';
import authApi from '../../api/authApi';
import AppButton from '../common/AppButton';

const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (!token) {
      setErrors({ password: 'Invalid or missing reset token' });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: { password?: string; confirmPassword?: string } = {};

    if (!token) {
      nextErrors.password = 'Invalid or missing reset token';
      setErrors(nextErrors);
      return;
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else {
      const pwdError = validatePasswordStrength(password);
      if (pwdError) nextErrors.password = pwdError;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Password do not match';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Include confirmPassword in the request to match backend validation
      const requestData = {
        token,
        password,
        confirmPassword, // Add this field to match backend DTO
      };

      await authApi.resetPassword(requestData);

      // If we get here, the request was successful (no error thrown)

      // Clear all authentication tokens to ensure user goes to login page
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Test navigation
      try {
        navigate('/', { replace: true });
      } catch {
        // Fallback: try window.location
        window.location.href = '/';
      }
    } catch (err: unknown) {
      const errorResponse = err as {
        response?: { data?: { message?: string } };
      };

      const errorMessage =
        errorResponse?.response?.data?.message ||
        'Failed to reset password. Please try again.';
      setErrors({ password: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Paper
          elevation={3}
          sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}
        >
          <Typography variant='h5' color='error' gutterBottom>
            Invalid Reset Link
          </Typography>
          <AppButton
            variant='contained'
            text='Back to Login'
            onClick={() => navigate('/', { replace: true })}
            sx={{ backgroundColor: 'primary.main' }}
          />
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography
          variant='h5'
          gutterBottom
          sx={{ textAlign: 'center', mb: 3 }}
        >
          Reset Your Password
        </Typography>

        <Box component='form' onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label='New Password'
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (errors.password)
                setErrors(prev => ({ ...prev, password: undefined }));
            }}
            margin='normal'
            required
            error={Boolean(errors.password)}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge='end'
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            label='Confirm New Password'
            value={confirmPassword}
            onChange={e => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword)
                setErrors(prev => ({ ...prev, confirmPassword: undefined }));
            }}
            margin='normal'
            required
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge='end'
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <AppButton
            type='submit'
            fullWidth
            variant='contained'
            text={loading ? 'Resetting...' : 'Reset Password'}
            disabled={loading}
            sx={{ mt: 2, mb: 2 }}
            startIcon={loading ? <CircularProgress size={24} /> : undefined}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default PasswordReset;
