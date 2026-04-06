import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { validatePasswordStrength } from '../../utils/validation';
import authApi from '../../api/authApi';
import AppButton from '../common/AppButton';
import { COLORS } from '../../constants/appConstants';

const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    const pwdError = validatePasswordStrength(password);
    if (pwdError) {
      setError(pwdError);
      return;
    }

    if (!confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');

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
      setError(errorMessage);
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
          bgcolor: '#f5f5f5',
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
            sx={{ backgroundColor: COLORS.PRIMARY }}
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
        bgcolor: '#f5f5f5',
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
          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label='New Password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            margin='normal'
            required
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
            onChange={e => setConfirmPassword(e.target.value)}
            margin='normal'
            required
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
            sx={{ mt: 2, mb: 2}}
            startIcon={loading ? <CircularProgress size={24} /> : undefined}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default PasswordReset;
