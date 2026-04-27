import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Link,
  CircularProgress,
} from '@mui/material';
import authApi from '../../api/authApi';
import { validateEmailAddress } from '../../utils/validation';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppInputField from '../common/AppInputField';
import { Icons } from '../../assets/icons';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const Forget = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { snackbar, showError, closeSnackbar } = useErrorHandler();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  
  const mainBgColor = '#3083DC';
  const successBg = '#E8F5E9';
  const infoBg = '#D1E4FF';

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');

    if (value) {
      const error = validateEmailAddress(value);
      if (error) {
        setEmailError(error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const error = validateEmailAddress(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setLoading(true);
    setEmailError('');

    try {
      const response = await authApi.forgotPassword({ email }) as {
        message?: string;
        errors?: unknown[];
        statusCode?: number;
      };

      // API returns error body (e.g. 400 "In Valid email address") when email doesn't exist
      const statusCode = response?.statusCode;
      if (
        response &&
        (statusCode === 400 || statusCode === 404 || statusCode === 422)
      ) {
        setEmailError(
          response.message ||
            (lang === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address')
        );
        return;
      }

      if (response && response.errors) {
        setEmailError(response.message || (lang === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address'));
        return;
      }

      if (response && response.message && !response.errors) {
        setEmailSent(true);
        setEmail('');
      } else {
        setEmail('');
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as {
          response: { status: number; data?: { message?: string } };
        };
        if (
          apiError.response.status === 400 ||
          apiError.response.status === 404 ||
          apiError.response.status === 422
        ) {
          setEmailError(
            apiError.response.data?.message ||
              (lang === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address')
          );
        } else {
          showError(apiError.response.data?.message || 'Something went wrong.');
        }
      } else {
        showError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        maxWidth: '100%', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: mainBgColor,
        overflowX: 'hidden',
        overflowY: 'hidden', 
        p: { xs: 2, sm: 3 }, 
        boxSizing: 'border-box',
      }}
    >
      {/* Logo */}
      <Box
        component='img'
        src={Icons.logoWhite}
        alt='Logo'
        sx={{ 
          maxHeight: { xs: 32, sm: 40 }, 
          width: 'auto', 
          mb: { xs: 3, sm: 4 },
          flexShrink: 0 
        }}
      />

      {/* Main Container Card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: '420px', 
          backgroundColor: '#F9FAFB',
          borderRadius: '32px',
          p: { xs: 3, sm: 5 },
          textAlign: 'center',
          boxShadow: '0px 10px 40px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          mx: 'auto',
        }}
      >
        {/* Conditional Icon Header */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: emailSent ? successBg : infoBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2.5,
            flexShrink: 0
          }}
        >
          {emailSent ? (
            <CheckIcon sx={{ color: '#4CAF50', fontSize: 32 }} />
          ) : (
            <LockOutlinedIcon sx={{ color: '#3083DC', fontSize: 28 }} />
          )}
        </Box>

        {emailSent ? (
          <Box>
            <Typography variant='h5' sx={{ fontWeight: 700, mb: 1, color: '#2C2C2C' }}>
              {lang === 'ar' ? 'تم إرسال البريد الإلكتروني' : 'Email Sent'}
            </Typography>
            <Typography sx={{ color: '#888', mb: 3, fontSize: { xs: '14px', sm: '16px' } }}>
              {lang === 'ar' ? 'تحقق من بريدك الوارد' : 'Check your inbox for a reset link!'}
            </Typography>
          </Box>
        ) : (
          <>
            <Typography 
              variant='h5' 
              sx={{ 
                fontWeight: 700, 
                mb: 1, 
                color: '#2C2C2C',
                fontSize: { xs: '1.4rem', sm: '1.6rem' } 
              }}
            >
              {lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
            </Typography>

            <Typography sx={{ color: '#888', mb: 3, fontSize: { xs: '14px', sm: '16px' } }}>
              {lang === 'ar'
                ? 'سنرسل لك رابطًا لإعادة تعيين كلمة المرور'
                : "We'll email you a link to reset your password"}
            </Typography>

            <Box component='form' onSubmit={handleSubmit} sx={{ textAlign: 'left' }}>
              <Box sx={{ mb: 2.5 }}>
                <AppInputField
                  name='email'
                  label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  type='email'
                  required
                  fullWidth
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                  error={Boolean(emailError)}
                  helperText={emailError}
                  placeholder={lang === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                />
              </Box>

              <Button
                type='submit'
                variant='contained'
                fullWidth
                disabled={!email || Boolean(emailError) || loading}
                sx={{
                  backgroundColor: '#3083DC',
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: '12px',
                  py: 1.4,
                  textTransform: 'none',
                  fontSize: '16px',
                  mb: 2.5,
                  '&:hover': { backgroundColor: '#2669B2' },
                }}
              >
                {loading ? <CircularProgress size={20} color='inherit' /> : 'Send an email'}
              </Button>
            </Box>
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Link
            component={RouterLink}
            to='/'
            sx={{
              color: '#656565',
              textDecoration: 'none',
              fontSize: { xs: '14px', sm: '16px' },
              fontWeight: 400,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: '12px' }} />
            {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to login'}
          </Link>
        </Box>
      </Box>

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default Forget;
