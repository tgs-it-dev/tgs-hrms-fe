import { useState, useEffect } from 'react';
import {
  useNavigate,
  useSearchParams,
  Link as RouterLink,
} from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Link,
  CircularProgress,
  IconButton,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import authApi from '../../api/authApi';
import { validatePasswordStrength } from '../../utils/validation';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppInputField from '../common/AppInputField';
import { Icons } from '../../assets/icons';
import AuthSidebar from '../common/AuthSidebar';
import AppPageTitle from '../common/AppPageTitle';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  useEffect(() => {
    if (!token) {
      setErrors({
        general: 'Invalid reset link. Please request a new password reset.',
      });
    }
  }, [token]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const pwd = formData.password;

    if (!pwd) {
      newErrors.password = 'Password is required';
    } else {
      const pwdError = validatePasswordStrength(pwd);
      if (pwdError) {
        newErrors.password = pwdError;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      const value = typeof e === 'string' ? e : (e?.target?.value ?? '');
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.resetPassword({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- token is validated as truthy before this block
        token: token!,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (response.message) {
        showSuccess(response.message);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        showError('Failed to reset password. Please try again.');
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { message?: string })?.message || String(error);

      if (errorMessage.includes('Invalid or expired')) {
        setErrors({
          general:
            'This reset link has expired or is invalid. Please request a new one.',
        });
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
            backgroundColor: { xs: '#3083DC', lg: 'var(--white-100-color)' },
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
              backgroundColor: { xs: '#FFFFFF', lg: 'transparent' },
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

            {!token || errors.general ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Typography
                  variant='h1'
                  sx={{
                    fontSize: { xs: '24px', sm: '28px' },
                    fontWeight: 700,
                    textAlign: 'center',
                    mb: 1,
                    color: '#D32F2F',
                  }}
                >
                  {lang === 'ar' ? 'رابط غير صالح' : 'Invalid Link'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '14px', sm: '16px' },
                    textAlign: 'center',
                    mb: 3,
                    color: '#666',
                    fontWeight: 400,
                  }}
                >
                  {errors.general ||
                    (lang === 'ar'
                      ? 'رابط إعادة التعيين هذا غير صالح أو منتهي الصلاحية.'
                      : 'This reset link is invalid or has expired.')}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Button
                    component={RouterLink}
                    to='/forget'
                    variant='contained'
                    sx={{
                      backgroundColor: 'var(--primary-dark-color)',
                      color: 'var(--white-color)',
                      fontWeight: 600,
                      borderRadius: '12px',
                      fontSize: '16px',
                      textTransform: 'none',
                      padding: { xs: '8px 32px', lg: '8px 32px' },
                      height: { xs: '40px', lg: 'auto' },
                    }}
                  >
                    {lang === 'ar' ? 'طلب رابط جديد' : 'Request New Link'}
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
                      color: '#656565',
                      textDecoration: 'none',
                      fontSize: { xs: '14px', sm: '16px' },
                      fontWeight: 400,
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
                    color: { xs: '#001218', lg: 'inherit' },
                  }}
                >
                  {lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                </AppPageTitle>

                <Typography
                  sx={{
                    color: { xs: '#888888', lg: 'var(--dark-grey-color)' },
                    mb: 3,
                    fontSize: { xs: '14px', sm: '16px', lg: '24px' },
                    fontWeight: 400,
                  }}
                >
                  {lang === 'ar'
                    ? 'أدخل كلمة المرور الجديدة أدناه'
                    : 'Enter your new password below'}
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
                      name='password'
                      label={
                        lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'
                      }
                      type={showPassword ? 'text' : 'password'}
                      required
                      fullWidth
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      disabled={loading}
                      error={Boolean(errors.password)}
                      helperText={errors.password}
                      placeholder={
                        lang === 'ar' ? 'أدخل كلمة المرور' : 'Enter password'
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge='end'
                              aria-label='toggle password visibility'
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <AppInputField
                      name='confirmPassword'
                      label={
                        lang === 'ar'
                          ? 'تأكيد كلمة المرور'
                          : 'Confirm New Password'
                      }
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      fullWidth
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      disabled={loading}
                      error={Boolean(errors.confirmPassword)}
                      helperText={errors.confirmPassword}
                      placeholder={
                        lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm password'
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge='end'
                              aria-label='toggle password visibility'
                            >
                              {showConfirmPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}
                  >
                    <Button
                      type='submit'
                      variant='contained'
                      disabled={
                        loading ||
                        !formData.password ||
                        !formData.confirmPassword ||
                        Boolean(errors.password) ||
                        Boolean(errors.confirmPassword)
                      }
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
                          color: '#FFFFFF',
                        },
                      }}
                    >
                      {loading ? (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <CircularProgress size={16} color='inherit' />
                          {lang === 'ar' ? 'جاري التحديث...' : 'Updating...'}
                        </Box>
                      ) : lang === 'ar' ? (
                        'تحديث كلمة المرور'
                      ) : (
                        'Reset Password'
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
                        color: '#656565',
                        textDecoration: 'none',
                        fontSize: { xs: '14px', sm: '16px' },
                        fontWeight: 400,
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

export default ResetPassword;
