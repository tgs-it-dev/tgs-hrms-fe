import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Link,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import authApi from '../../api/authApi';
import { validateEmailAddress } from '../../utils/validation';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppInputField from '../common/AppInputField';
import { Icons } from '../../assets/icons';
import AuthSidebar from '../common/AuthSidebar';
import AppPageTitle from '../common/AppPageTitle';

const Forget = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { snackbar, showError, closeSnackbar } = useErrorHandler();
  const [lang, setLang] = useState<'en' | 'ar'>('en');

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
      const response = (await authApi.forgotPassword({ email })) as {
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
            (lang === 'ar'
              ? 'البريد الإلكتروني غير صالح'
              : 'Invalid email address')
        );
        return;
      }

      if (response && response.errors) {
        setEmailError(
          response.message ||
            (lang === 'ar'
              ? 'البريد الإلكتروني غير صالح'
              : 'Invalid email address')
        );
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
              (lang === 'ar'
                ? 'البريد الإلكتروني غير صالح'
                : 'Invalid email address')
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
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: 'var(--white-100-color)',
        overflowX: 'hidden',
      }}
    >
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <AuthSidebar />

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: { xs: '16px 12px', sm: '24px 16px', md: '48px' },
            backgroundColor: {
              xs: 'primary.main',
              lg: 'var(--white-100-color)',
            },
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: 1,
            marginLeft: { xs: 0, lg: '-20px' },
            paddingLeft: { xs: '12px', sm: '16px', lg: 'calc(48px + 12px)' },
            paddingRight: { xs: '12px', sm: '16px', lg: '48px' },
            marginTop: { xs: 'auto', lg: 0 },
            pt: { xs: '30px', lg: '48px' },
            boxSizing: 'border-box',
            minWidth: 0,
            borderTopLeftRadius: { xs: 0, lg: '20px' },
            borderBottomLeftRadius: { xs: 0, lg: '20px' },
          }}
        >
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              width: '90%',
              justifyContent: 'center',
              alignItems: 'center',
              mb: { xs: 6, lg: 0 },
              position: { xs: 'relative', lg: 'absolute' },
              top: { xs: 10, lg: 32 },
              left: { xs: 'auto', lg: '50%' },
              transform: { xs: 'none', lg: 'translateX(-50%)' },
              zIndex: 2,
            }}
          >
            <Box
              component='img'
              src={Icons.logoWhite}
              alt='Logo'
              sx={{
                width: { xs: '100%', lg: 'auto' },
                maxWidth: { xs: '100%', md: '520px', lg: 'none' },
                maxHeight: { xs: 'auto', lg: 40 },
                objectFit: 'contain',
              }}
            />
          </Box>

          <Box
            sx={{
              width: '100%',
              mx: 'auto',
              backgroundColor: { xs: 'background.paper', lg: 'transparent' },
              borderRadius: { xs: '30px', lg: 0 },
              p: { xs: 2, sm: 3, md: 4 },
              mt: { xs: 0, lg: 0 },
              boxSizing: 'border-box',
              minWidth: 0,
            }}
          >
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <FormControl size='small' sx={{ minWidth: 100 }}>
                <Select
                  value={lang}
                  onChange={e => setLang(e.target.value as 'en' | 'ar')}
                >
                  <MenuItem value='en'>English</MenuItem>
                  <MenuItem value='ar'>عربى</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {emailSent ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mb: 3,
                  }}
                >
                  <Box
                    component='img'
                    src={Icons.sent}
                    alt='Email Sent'
                    sx={{
                      width: { xs: '80px', sm: '80px' },
                      height: { xs: '80px', sm: '80px' },
                    }}
                  />
                </Box>

                <Typography
                  variant='h1'
                  sx={{
                    fontSize: { xs: '28px', sm: '32px' },
                    fontWeight: 700,
                    textAlign: 'center',
                    mb: 1,
                    color: 'text.primary',
                  }}
                >
                  {lang === 'ar' ? 'تم إرسال البريد الإلكتروني' : 'Email Sent'}
                </Typography>

                <Typography
                  sx={{
                    fontSize: { xs: '14px', sm: '16px' },
                    textAlign: 'center',
                    mb: 3,
                    color: 'text.secondary',
                    fontWeight: 400,
                  }}
                >
                  {lang === 'ar'
                    ? 'تحقق من بريدك الوارد للحصول على رابط إعادة التعيين!'
                    : 'Check your inbox for a reset link!'}
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                  }}
                >
                  <Link
                    component={RouterLink}
                    to='/'
                    sx={{
                      color: 'text.secondary',
                      textDecoration: 'none',
                      fontSize: { xs: '14px', sm: '16px' },
                      fontWeight: 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to login'}
                  </Link>
                </Box>
              </Box>
            ) : (
              <>
                <AppPageTitle
                  isRtl={lang === 'ar'}
                  sx={{
                    mb: 0,
                    fontWeight: 700,
                    color: { xs: 'text.primary', lg: 'inherit' },
                  }}
                >
                  {lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                </AppPageTitle>

                <Typography
                  sx={{
                    color: {
                      xs: 'text.secondary',
                      lg: 'var(--dark-grey-color)',
                    },
                    mb: 3,
                    fontSize: { xs: '14px', sm: '16px', lg: '24px' },
                    fontWeight: 400,
                  }}
                >
                  {lang === 'ar'
                    ? 'سنرسل لك رابطًا لإعادة تعيين كلمة المرور'
                    : "We'll email you a link to reset your password"}
                </Typography>

                <Box
                  component='form'
                  onSubmit={handleSubmit}
                  sx={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                  }}
                >
                  <Box sx={{ mb: 3 }}>
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
                      placeholder={
                        lang === 'ar'
                          ? 'أدخل بريدك الإلكتروني'
                          : 'Enter your email'
                      }
                    />
                  </Box>

                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}
                  >
                    <Button
                      type='submit'
                      variant='contained'
                      disabled={!email || Boolean(emailError) || loading}
                      sx={{
                        backgroundColor: 'var(--primary-dark-color)',
                        color: 'var(--white-color)',
                        fontWeight: 600,
                        borderRadius: '12px',
                        fontSize: '16px',
                        textTransform: 'none',
                        padding: { xs: '8px 32px', lg: '8px 32px' },
                        height: { xs: '40px', lg: 'auto' },
                        gap: { xs: '4px', lg: 0 },
                        width: { xs: '100%', lg: '200px' },
                        '&:disabled': {
                          backgroundColor: 'var(--grey-color)',
                          color: 'common.white',
                        },
                      }}
                    >
                      {loading ? (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <CircularProgress size={16} color='inherit' />
                          {lang === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                        </Box>
                      ) : lang === 'ar' ? (
                        'إرسال بريد إلكتروني'
                      ) : (
                        'Send an email'
                      )}
                    </Button>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Link
                      component={RouterLink}
                      to='/'
                      sx={{
                        color: 'text.secondary',
                        textDecoration: 'none',
                        fontSize: { xs: '14px', sm: '16px' },
                        fontWeight: 400,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {lang === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to login'}
                    </Link>
                  </Box>
                </Box>
              </>
            )}
          </Box>
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
