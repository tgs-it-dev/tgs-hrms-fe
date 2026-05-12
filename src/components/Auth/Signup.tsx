import { useState, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Link,
  FormControl,
  MenuItem,
  Select,
  Checkbox,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import '../UserProfile/PhoneInput.css';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import signupApi, { type PersonalDetailsRequest } from '../../api/signupApi';
import {
  validateEmailAddress,
  validatePasswordStrength,
} from '../../utils/validation';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppInputField from '../common/AppInputField';
import AuthSidebar from '../common/AuthSidebar';
import { Icons } from '../../assets/icons';
import AppPageTitle from '../common/AppPageTitle';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setSuccess] = useState<string | null>(null);
  const { snackbar, showSuccess, showError, closeSnackbar } = useErrorHandler();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [termsError, setTermsError] = useState('');
  const isSubmitting = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors(prev => {
      const next = { ...prev, [name]: '' };

      // Live password validation (min 8, 1 upper, 1 lower, 1 number, 1 special)
      if (name === 'password') {
        const pwd = value;
        if (!pwd) {
          next.password = '';
        } else {
          const pwdError = validatePasswordStrength(pwd);
          next.password = pwdError ?? '';
        }

        // Keep confirmPassword in sync when user changes main password
        if (formData.confirmPassword) {
          next.confirmPassword =
            pwd === formData.confirmPassword ? '' : 'Password do not match';
        }
      }

      // Live confirm password validation
      if (name === 'confirmPassword') {
        const confirm = value;
        const pwd = formData.password;

        if (!confirm) {
          next.confirmPassword = 'Please confirm your password';
        } else if (confirm !== pwd) {
          next.confirmPassword = 'Password do not match';
        } else {
          next.confirmPassword = '';
        }
      }

      return next;
    });

    setSuccess(null);
  };

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || '';
    setFormData(prev => ({ ...prev, phone: phoneValue }));
    setFieldErrors(prev => ({ ...prev, phone: '' }));
    setSuccess(null);
  };

  const handleTogglePassword = (): void => setShowPassword(prev => !prev);
  const handleToggleConfirmPassword = (): void =>
    setShowConfirmPassword(prev => !prev);

  const validateForm = () => {
    const nextErrors = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    } as typeof fieldErrors;

    if (!formData.first_name.trim()) {
      nextErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      nextErrors.first_name = 'First name must be at least 2 characters';
    } else if (formData.first_name.trim().length > 50) {
      nextErrors.first_name = 'First name must be 50 characters or less';
    }

    if (!formData.last_name.trim()) {
      nextErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      nextErrors.last_name = 'Last name must be at least 2 characters';
    } else if (formData.last_name.trim().length > 50) {
      nextErrors.last_name = 'Last name must be 50 characters or less';
    }

    const emailError = validateEmailAddress(formData.email);
    if (emailError) {
      nextErrors.email = emailError;
    }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required';
    } else if (phoneDigits.length < 10) {
      nextErrors.phone = 'Please enter your phone number';
    } else if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phone)) {
        nextErrors.phone = 'Please enter a valid phone number';
      }
    }
    if (formData.password) {
      const pwdError = validatePasswordStrength(formData.password);
      if (pwdError) {
        nextErrors.password = pwdError;
      }
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Password do not match';
    }

    setFieldErrors(nextErrors);
    let hasErrors = Object.values(nextErrors).some(Boolean);
    if (!acceptedTerms) {
      setTermsError('You must accept the Terms and Conditions');
      hasErrors = true;
    } else {
      setTermsError('');
    }
    return !hasErrors;
  };

  const emailValidationError = formData.email.trim()
    ? validateEmailAddress(formData.email)
    : null;

  const phoneDigitCount = formData.phone.replace(/\D/g, '').length;
  const hasPhoneNumberEntered = phoneDigitCount >= 10;

  const isSubmitDisabled =
    loading ||
    !formData.first_name.trim() ||
    !formData.last_name.trim() ||
    !formData.email.trim() ||
    !hasPhoneNumberEntered ||
    !formData.password ||
    !formData.confirmPassword ||
    !!emailValidationError ||
    Object.values(fieldErrors).some(Boolean) ||
    !acceptedTerms;

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (isSubmitting.current) {
      return;
    }

    setError(null);
    setSuccess(null);
    setTermsError('');
    if (!validateForm()) {
      return;
    }

    isSubmitting.current = true;
    setLoading(true);

    try {
      const personalDetails: PersonalDetailsRequest = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      };

      const response = await signupApi.createPersonalDetails(personalDetails);

      setSuccess('Personal details saved successfully!');
      showSuccess(
        lang === 'ar'
          ? 'تم إنشاء الحساب بنجاح!'
          : 'Personal details saved successfully!'
      );

      localStorage.setItem('signupSessionId', response.signupSessionId);
      try {
        sessionStorage.setItem(
          'pendingSignupCredentials',
          JSON.stringify({
            email: personalDetails.email,
            password: personalDetails.password,
          })
        );
      } catch {
        // Ignore storage errors
      }

      setTimeout(() => {
        navigate('/signup/company-details');
      }, 2000);
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            message?: unknown;
            errors?: Record<string, unknown[]>;
          };
        };
        message?: string;
      };

      // Network or unexpected errors: show global snackbar, not field errors
      if (!error.response) {
        showError(
          lang === 'ar'
            ? 'حدث خطأ في الشبكة. يرجى التحقق من اتصالك ثم حاول مرة أخرى.'
            : 'Network error. Please check your connection and try again.'
        );
        setError(null);
        setFieldErrors({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
        });
        return;
      }

      // Clear all field errors and general error first
      setError(null);
      setFieldErrors({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });

      if (error.response?.data?.message) {
        const errorData = error.response.data.message;
        if (
          typeof errorData === 'object' &&
          errorData !== null &&
          'field' in errorData &&
          'message' in errorData
        ) {
          const field = String(errorData.field) as keyof typeof fieldErrors;
          setFieldErrors(prev => ({
            ...prev,
            [field]: String(errorData.message),
          }));
        } else {
          // For small screens, show in Alert banner
          setError(String(errorData));
          // For large screens, try to determine which field the error relates to
          const errorMsg = String(errorData).toLowerCase();
          if (errorMsg.includes('email') || errorMsg.includes('e-mail')) {
            setFieldErrors(prev => ({ ...prev, email: String(errorData) }));
          } else if (errorMsg.includes('password')) {
            setFieldErrors(prev => ({ ...prev, password: String(errorData) }));
          } else if (errorMsg.includes('phone')) {
            setFieldErrors(prev => ({ ...prev, phone: String(errorData) }));
          } else if (errorMsg.includes('first') || errorMsg.includes('name')) {
            setFieldErrors(prev => ({
              ...prev,
              first_name: String(errorData),
            }));
          } else {
            // Default to email field for general errors
            setFieldErrors(prev => ({ ...prev, email: String(errorData) }));
          }
        }
      } else if (error.response?.data?.errors) {
        // Handle field-specific errors from errors object
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        // For small screens, show in Alert banner
        setError(String(errorMessages.join(', ')));
        // For large screens, show on specific fields
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          if (errors.first_name) {
            newErrors.first_name = Array.isArray(errors.first_name)
              ? errors.first_name.join(', ')
              : String(errors.first_name);
          }
          if (errors.last_name) {
            newErrors.last_name = Array.isArray(errors.last_name)
              ? errors.last_name.join(', ')
              : String(errors.last_name);
          }
          if (errors.email) {
            newErrors.email = Array.isArray(errors.email)
              ? errors.email.join(', ')
              : String(errors.email);
          }
          if (errors.phone) {
            newErrors.phone = Array.isArray(errors.phone)
              ? errors.phone.join(', ')
              : String(errors.phone);
          }
          if (errors.password) {
            newErrors.password = Array.isArray(errors.password)
              ? errors.password.join(', ')
              : String(errors.password);
          }
          return newErrors;
        });
      } else if (error.message) {
        // For small screens, show in Alert banner
        setError(error.message);
        // For large screens, try to determine which field the error relates to
        const errorMsg = String(error.message).toLowerCase();
        const errorMessage = String(error.message);
        if (errorMsg.includes('email') || errorMsg.includes('e-mail')) {
          setFieldErrors(prev => ({ ...prev, email: errorMessage }));
        } else if (errorMsg.includes('password')) {
          setFieldErrors(prev => ({ ...prev, password: errorMessage }));
        } else if (errorMsg.includes('phone')) {
          setFieldErrors(prev => ({ ...prev, phone: errorMessage }));
        } else {
          setFieldErrors(prev => ({ ...prev, email: errorMessage }));
        }
      } else {
        const defaultError = 'Failed to create account. Please try again.';
        setError(defaultError);
        setFieldErrors(prev => ({
          ...prev,
          email: defaultError,
        }));
      }
    } finally {
      setLoading(false);
      isSubmitting.current = false;
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
          // maxWidth: '1700px',
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
            padding: { xs: '16px 12px', sm: '24px 16px', md: '30px' },
            backgroundColor: {
              xs: 'primary.main',
              lg: 'var(--white-100-color)',
            },
            overflowY: 'auto',
            overflowX: 'hidden',
            position: 'relative',
            zIndex: 1,
            marginLeft: { xs: 0, lg: '-24px' },
            // paddingLeft: { xs: '12px', sm: '16px', lg: 'calc(48px + 12px)' },
            // paddingRight: { xs: '12px', sm: '16px', lg: '48px' },
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
              top: { xs: 1, lg: 32 },
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
              // maxWidth: { xs: '100%', sm: '90%' },
              maxWidth: '700px',
              width: '100%',
              mx: 'auto',
              backgroundColor: { xs: 'background.paper', lg: 'transparent' },
              borderRadius: { xs: '20px', lg: 0 },
              p: { xs: 2, sm: 3, md: 0 },
              mt: { xs: 0, lg: 0 },
              boxSizing: 'border-box',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '40px',
            }}
          >
            {/* Div 1: Language Selector */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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

            {/* Div 2: Title and Tagline */}
            <Box>
              <AppPageTitle
                sx={{
                  mb: '6px',
                  fontWeight: 700,
                  color: { xs: 'text.primary', lg: 'inherit' },
                }}
              >
                Create Account
              </AppPageTitle>
              <Typography
                sx={{
                  color: { xs: 'text.secondary', lg: 'var(--dark-grey-color)' },
                  fontSize: { xs: '16px', lg: '24px' },
                  fontWeight: 400,
                }}
              >
                For business, brand or celebrity.
              </Typography>
            </Box>

            {/* Div 3: Form Content */}
            <Box
              component='form'
              onSubmit={handleSubmit}
              sx={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden',
                overflowY: 'scroll',
                display: 'flex',
                flexDirection: 'column',
                gap: '40px',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px',
                }}
              >
                {error && (
                  <Alert
                    severity='error'
                    sx={{
                      display: { xs: 'block', sm: 'none' },
                      '& .MuiAlert-message': {
                        fontSize: { xs: '12px', sm: '14px' },
                      },
                    }}
                  >
                    {error}
                  </Alert>
                )}
                <Box
                  sx={{
                    display: 'flex',
                    gap: '32px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <AppInputField
                      name='first_name'
                      label='First Name'
                      required
                      fullWidth
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={loading}
                      error={Boolean(fieldErrors.first_name)}
                      helperText={fieldErrors.first_name}
                      placeholder='First Name'
                      hideErrorsOnSmallScreen={true}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <AppInputField
                      name='last_name'
                      label='Last Name'
                      required
                      fullWidth
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={loading}
                      error={Boolean(fieldErrors.last_name)}
                      helperText={fieldErrors.last_name}
                      placeholder='Last Name'
                      hideErrorsOnSmallScreen={true}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '32px',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <AppInputField
                      name='email'
                      label='Email'
                      type='email'
                      required
                      fullWidth
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={e => {
                        const value = e.target.value;
                        const trimmed = value.trim();
                        const emailError = trimmed
                          ? validateEmailAddress(trimmed)
                          : null;
                        setFieldErrors(prev => ({
                          ...prev,
                          email: emailError ?? '',
                        }));
                      }}
                      disabled={loading}
                      error={Boolean(fieldErrors.email)}
                      helperText={fieldErrors.email}
                      placeholder='Enter your email'
                      hideErrorsOnSmallScreen={true}
                    />
                  </Box>
                  <Box
                    sx={{ flex: 1, position: 'relative', minWidth: 0 }}
                    className='signup-phone-input'
                  >
                    <AppInputField
                      name='phone'
                      label='Phone #'
                      type='tel'
                      required
                      fullWidth
                      value={formData.phone}
                      onChange={e => handlePhoneChange(e.target.value)}
                      disabled={loading}
                      error={Boolean(fieldErrors.phone)}
                      helperText={fieldErrors.phone}
                      hideErrorsOnSmallScreen={true}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment
                            position='start'
                            sx={{ margin: 0, padding: '28px 0px' }}
                          >
                            <PhoneInput
                              defaultCountry='pk'
                              value={formData.phone}
                              onChange={handlePhoneChange}
                              style={{
                                border: 'none',
                                outline: 'none',
                                background: 'transparent',
                                width: '100%',
                              }}
                              inputStyle={{
                                border: 'none',
                                outline: 'none',
                                padding: '0',
                                margin: '0',
                                fontSize: isMobile ? '14px' : '16px',
                                fontWeight: 400,
                                fontFamily:
                                  '"Roboto", "Helvetica", "Arial", sans-serif',
                                backgroundColor: 'transparent',
                                width: '100%',
                                boxSizing: 'border-box',
                                flex: 1,
                                height: '100%',
                              }}
                              countrySelectorStyleProps={{
                                buttonStyle: {
                                  border: 'none',
                                  background: 'transparent',
                                  padding: '0',
                                  margin: '0',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                },
                              }}
                              className='phone-input-textfield-adornment'
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Box>

                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: '32px',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <AppInputField
                        name='password'
                        label='Password'
                        type={showPassword ? 'text' : 'password'}
                        required
                        fullWidth
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        error={Boolean(fieldErrors.password)}
                        helperText={fieldErrors.password}
                        placeholder='********'
                        hideErrorsOnSmallScreen={true}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton
                                onClick={handleTogglePassword}
                                edge='end'
                                sx={{ color: 'var(--dark-grey-color)' }}
                              >
                                {showPassword ? (
                                  <IoEyeOutline />
                                ) : (
                                  <IoEyeOffOutline />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <AppInputField
                        name='confirmPassword'
                        label='Confirm Password'
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        fullWidth
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        error={Boolean(fieldErrors.confirmPassword)}
                        helperText={fieldErrors.confirmPassword}
                        hideErrorsOnSmallScreen={true}
                        placeholder='********'
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position='end'>
                              <IconButton
                                onClick={handleToggleConfirmPassword}
                                edge='end'
                                sx={{ color: 'var(--dark-grey-color)' }}
                              >
                                {showConfirmPassword ? (
                                  <IoEyeOutline />
                                ) : (
                                  <IoEyeOffOutline />
                                )}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      rowGap: '12px',
                      '& .MuiCheckbox-root': {
                        padding: 0,
                        margin: 0,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Checkbox
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        sx={{
                          color: 'var(--dark-grey-color)',
                          '&.Mui-checked': {
                            color: 'var(--primary-dark-color)',
                          },
                        }}
                      />
                      <Typography
                        component='span'
                        sx={{
                          fontSize: { xs: '14px', sm: '16px' },
                          fontWeight: 400,
                        }}
                      >
                        Remember me
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Checkbox
                        checked={acceptedTerms}
                        onChange={e => setAcceptedTerms(e.target.checked)}
                        sx={{
                          color: 'var(--dark-grey-color)',
                          '&.Mui-checked': {
                            color: 'var(--primary-dark-color)',
                          },
                        }}
                      />
                      <Typography
                        component='span'
                        sx={{
                          fontSize: { xs: '14px', sm: '16px' },
                          fontWeight: 400,
                        }}
                      >
                        I agree to all the{' '}
                        <Link
                          component={RouterLink}
                          to='/terms'
                          sx={{
                            color: 'var(--primary-dark-color)',
                            textDecoration: 'none',
                            fontWeight: 500,
                            fontSize: 'inherit',
                          }}
                        >
                          Terms{' '}
                        </Link>
                        and{' '}
                        <Link
                          component={RouterLink}
                          to='/privacy-policy'
                          sx={{
                            color: 'var(--primary-dark-color)',
                            textDecoration: 'none',
                            fontWeight: 500,
                            fontSize: 'inherit',
                          }}
                        >
                          Privacy policy
                        </Link>
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {termsError && (
                  <Typography
                    sx={{
                      color: 'error.main',
                      fontSize: { xs: '12px', sm: '14px' },
                      mb: 1,
                      textAlign: 'center',
                    }}
                  >
                    {termsError}
                  </Typography>
                )}
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    type='submit'
                    variant='contained'
                    disabled={isSubmitDisabled}
                    sx={{
                      backgroundColor: 'var(--primary-dark-color)',
                      color: 'var(--white-color)',
                      fontWeight: 600,
                      borderRadius: '12px',
                      fontSize: 'var(--body-font-size)',
                      textTransform: 'none',
                      padding: { xs: '8px 32px', lg: '8px 32px' },
                      height: { xs: '40px', lg: '40px' },
                      gap: { xs: '4px', lg: 0 },
                      width: { xs: '100%', lg: '200px' },
                      // '&:hover': {
                      //   backgroundColor: 'var(--primary-light-color)',
                      // },
                      '&:disabled': { backgroundColor: 'var(--grey-color)' },
                    }}
                  >
                    {loading ? (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <CircularProgress size={16} color='inherit' />
                        Processing...
                      </Box>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </Box>
                <Typography
                  align='center'
                  className='label'
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '14px', sm: '16px' },
                    fontWeight: 400,
                    mt: 2,
                  }}
                >
                  Already have an account?
                  <Link
                    component={RouterLink}
                    to='/'
                    sx={{
                      color: 'var(--primary-dark-color)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: 'inherit',
                      // '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {' '}
                    Log In
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <ErrorSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        />
      </Box>
    </Box>
  );
};

export default Signup;
