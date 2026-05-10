import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
} from '@mui/material';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppInputField from '../common/AppInputField';
import AuthSidebar from '../common/AuthSidebar';
import { Icons } from '../../assets/icons';
import AppPageTitle from '../common/AppPageTitle';

const CompanyDetails: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [loading, setLoading] = useState(false);
  const { snackbar, showSuccess, showError, closeSnackbar } = useErrorHandler();

  const [formData, setFormData] = useState({
    companyName: '',
    domain: '',
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState({
    companyName: '',
    domain: '',
  });

  // Check if user has signupSessionId, redirect if not
  useEffect(() => {
    const signupSessionId = localStorage.getItem('signupSessionId');
    if (!signupSessionId) {
      navigate('/signup');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageFile = (file: File) => {
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError(new Error('File size must be less than 10MB'));
      return;
    }
    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
      showError(new Error('Only JPEG, PNG and GIF formats are allowed'));
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = e => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const validateForm = () => {
    const nextErrors = {
      companyName: '',
      domain: '',
    };

    if (!formData.companyName.trim()) {
      nextErrors.companyName = 'Company name is required';
    }

    if (!formData.domain.trim()) {
      nextErrors.domain = 'Domain is required';
    }

    setFieldErrors(nextErrors);
    const hasErrors = Object.values(nextErrors).some(Boolean);
    return !hasErrors;
  };

  const isSubmitDisabled =
    loading ||
    !formData.companyName.trim() ||
    !formData.domain.trim() ||
    Object.values(fieldErrors).some(Boolean);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const signupSessionId = localStorage.getItem('signupSessionId');
      if (!signupSessionId) {
        throw new Error('Signup session not found. Please start over.');
      }

      const companyData: {
        companyName: string;
        domain: string;
        logoBase64?: string;
        logoFileName?: string;
        logoFileType?: string;
      } = {
        companyName: formData.companyName.trim(),
        domain: formData.domain.trim(),
      };

      if (selectedImage && imagePreview) {
        companyData.logoBase64 = imagePreview;
        companyData.logoFileName = selectedImage.name;
        companyData.logoFileType = selectedImage.type;
      }

      localStorage.setItem('companyDetails', JSON.stringify(companyData));

      showSuccess(
        lang === 'ar'
          ? 'تم حفظ تفاصيل الشركة بنجاح!'
          : 'Company details saved successfully!'
      );

      setTimeout(() => {
        navigate('/signup/select-plan');
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
          showError(new Error(String(errorData)));
        }
      } else if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        showError(new Error(String(errorMessages.join(', '))));
      } else if (error.message) {
        showError(error);
      } else {
        showError(
          new Error('Failed to save company details. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/signup');
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
          // maxWidth: '1440px',
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
            marginLeft: { xs: 0, lg: '-24px' },
            paddingLeft: { xs: '12px', sm: '16px', lg: 'calc(48px + 12px)' },
            paddingRight: { xs: '12px', sm: '16px', lg: '48px' },
            marginTop: { xs: 'auto', lg: 0 },
            pt: { xs: '30px', lg: '48px' },
            boxSizing: 'border-box',
            minWidth: 0,
            borderTopLeftRadius: { xs: 0, lg: '30px' },
            borderBottomLeftRadius: { xs: 0, lg: '30px' },
          }}
        >
          {/* Mobile / Tablet Logo */}
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
              width: '100%',
              mx: 'auto',
              backgroundColor: { xs: 'background.paper', lg: 'transparent' },
              borderRadius: { xs: '20px', lg: 0 },
              p: { xs: 2, sm: 3, md: 4 },
              mt: { xs: 0, lg: 0 },
              boxSizing: 'border-box',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '64px',
            }}
          >
            {/* Div 1: Language Selector */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <FormControl size='small' sx={{ minWidth: 100 }}>
                <Select
                  value={lang}
                  onChange={e => setLang(e.target.value as 'en' | 'ar')}
                  sx={{
                    borderRadius: 'var(--border-radius-lg)',
                  }}
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
                Company Details
              </AppPageTitle>
              <Typography
                className='body'
                sx={{
                  color: { xs: 'text.secondary', lg: 'var(--dark-grey-color)' },
                  fontSize: { xs: '16px', lg: '24px' },
                  fontWeight: 400,
                }}
              >
                Tell us more about your company.
              </Typography>
            </Box>

            {/* Div 3: Form Content */}
            <Box
              component='form'
              onSubmit={handleSubmit}
              noValidate
              sx={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: '64px',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '32px',
                }}
              >
                <AppInputField
                  name='companyName'
                  label='Company Name'
                  required
                  fullWidth
                  value={formData.companyName}
                  onChange={handleChange}
                  disabled={loading}
                  error={Boolean(fieldErrors.companyName)}
                  helperText={fieldErrors.companyName}
                  placeholder='Name'
                />

                <AppInputField
                  name='domain'
                  label='Domain'
                  required
                  fullWidth
                  value={formData.domain}
                  onChange={handleChange}
                  disabled={loading}
                  error={Boolean(fieldErrors.domain)}
                  helperText={fieldErrors.domain}
                  placeholder='Domain (e.g. Development)'
                />

                <Box>
                  <Typography
                    component='label'
                    className='label'
                    sx={{
                      fontSize: { xs: '14px', lg: '20px' },
                      fontWeight: { xs: 400, lg: 500 },
                      lineHeight: { xs: '20px', lg: 'auto' },
                      letterSpacing: { xs: '-1%', lg: 'normal' },
                      display: 'block',
                      mb: 0.5,
                      color: {
                        xs: 'text.primary',
                        lg: 'var(--dark-black-color)',
                      },
                    }}
                  >
                    Company Logo
                  </Typography>
                  {!imagePreview ? (
                    <Box
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() =>
                        document.getElementById('logo-upload')?.click()
                      }
                      sx={{
                        border: '2px dashed var(--light-grey-color)',
                        borderRadius: 'var(--border-radius-lg)',
                        p: 4,
                        my: 2,
                        textAlign: 'center',
                        backgroundColor: 'var(--white-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        // '&:hover': {
                        //   backgroundColor: 'var(--light-grey-100-color)',
                        //   borderColor: 'var(--primary-dark-color)',
                        // },
                      }}
                    >
                      <input
                        id='logo-upload'
                        type='file'
                        accept='image/jpeg,image/png,image/gif'
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <Box
                        component='img'
                        src={Icons.upload}
                        alt='Upload'
                        sx={{
                          width: '48px',
                          height: '48px',
                          mb: 2,
                          filter:
                            'brightness(0) saturate(100%) invert(45%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(95%)',
                        }}
                      />
                      <Typography
                        className='label'
                        sx={{
                          fontSize: { xs: '16px', lg: 'inherit' },
                          fontWeight: { xs: 400, lg: 'inherit' },
                          lineHeight: { xs: '20px', lg: 'inherit' },
                          letterSpacing: { xs: '-1%', lg: 'inherit' },
                          color: {
                            xs: 'text.primary',
                            lg: 'var(--text-color)',
                          },
                          mb: 1,
                        }}
                      >
                        Choose a file or drag & drop it here
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: { xs: 400, lg: 'inherit' },
                          lineHeight: { xs: '16px', lg: 'inherit' },
                          color: {
                            xs: 'text.secondary',
                            lg: 'var(--dark-grey-color)',
                          },
                        }}
                      >
                        JPEG, PNG and GIF formats, up to 10 MB
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-block',
                        border: '2px solid var(--light-grey-200-color)',
                        borderRadius: 'var(--border-radius-lg)',
                        p: 1,
                      }}
                    >
                      <Box
                        component='img'
                        src={imagePreview}
                        alt='Company Logo Preview'
                        loading='lazy'
                        sx={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: 'var(--border-radius-lg)',
                        }}
                      />
                      <Button
                        size='small'
                        onClick={handleRemoveImage}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          minWidth: 'auto',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--secondary-color)',
                          color: 'var(--white-color)',
                          padding: 0,
                          // '&:hover': {
                          //   backgroundColor: 'var(--secondary-color)',
                          //   opacity: 0.8,
                          // },
                        }}
                      >
                        ×
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Div 4: Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Button
                  variant='outlined'
                  type='button'
                  onClick={handleBack}
                  disabled={loading}
                  sx={{
                    borderColor: 'text.primary',
                    color: { xs: 'text.primary', lg: 'text.primary' },
                    backgroundColor: 'transparent',
                    borderRadius: '12px',
                    fontSize: { xs: '16px', lg: 'var(--body-font-size)' },
                    fontWeight: { xs: 700, lg: 400 },
                    textTransform: 'none',
                    padding: { xs: '8px 32px', lg: '8px 30px' },
                    height: { xs: '40px', lg: 'auto' },
                    gap: { xs: '4px', lg: 0 },
                    // '&:hover': {
                    //   borderColor: 'var(--primary-dark-color)',
                    //   backgroundColor: 'rgba(48, 131, 220, 0.1)',
                    // },
                  }}
                >
                  Back
                </Button>
                <Button
                  variant='contained'
                  type='submit'
                  disabled={isSubmitDisabled}
                  sx={{
                    backgroundColor: 'var(--primary-dark-color)',
                    color: 'var(--white-color)',
                    borderRadius: '12px',
                    fontSize: { xs: '16px', lg: 'var(--body-font-size)' },
                    fontWeight: { xs: 700, lg: 400 },
                    textTransform: 'none',
                    padding: { xs: '8px 32px', lg: '8px 30px' },
                    height: { xs: '40px', lg: 'auto' },
                    gap: { xs: '4px', lg: 0 },
                    // '&:hover': {
                    //   backgroundColor: 'var(--primary-light-color)',
                    // },
                    '&:disabled': {
                      backgroundColor: 'var(--grey-color)',
                    },
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} color='inherit' />
                      Processing...
                    </Box>
                  ) : (
                    'Next'
                  )}
                </Button>
              </Box>
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
    </Box>
  );
};

export default CompanyDetails;
