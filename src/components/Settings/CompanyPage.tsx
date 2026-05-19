import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Avatar,
  CircularProgress,
  useMediaQuery,
  Switch,
} from '@mui/material';
import { useCompany } from '../../context/CompanyContext';
import { useUser } from '../../hooks/useUser';
import companyApi from '../../api/companyApi';
import { SystemTenantApi } from '../../api/systemTenantApi';
import BusinessIcon from '@mui/icons-material/Business';
import LanguageIcon from '@mui/icons-material/Language';
import { CameraAlt, BusinessCenter, Smartphone } from '@mui/icons-material';
import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppFormModal from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';
import AppPageTitle from '../common/AppPageTitle';
import ErrorSnackbar from '../common/ErrorSnackbar';
import { Icons } from '../../assets/icons';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const CompanyPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { snackbar, showSuccess, showError, closeSnackbar } = useErrorHandler();
  const { user } = useUser();
  const {
    companyDetails: contextCompanyDetails,
    companyName,
    companyLogo,
    refreshCompanyDetails,
  } = useCompany();

  // CompanyContext doesn't expose a loading flag; this page renders with available data.
  const contextLoading = false;

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [, setIsEditing] = useState(true);
  const [editFormData, setEditFormData] = useState({
    company_name: '',
    domain: '',
  });
  const [modalCompanyLogo, setModalCompanyLogo] = useState<string | null>(null);
  const [modalLogoLoading, setModalLogoLoading] = useState(false);
  const [logoUploading] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    company_name?: string;
    domain?: string;
  }>({});

  const [mobileLoginLoading, setMobileLoginLoading] = useState(false);
  const tenantId = contextCompanyDetails?.tenant_id;

  const isModalOpenRef = useRef(false);

  const handleEditCompanyDetails = useCallback(async () => {
    if (!user) return;

    setCompanyModalOpen(true);
    setIsEditing(true);
    isModalOpenRef.current = true;

    try {
      setModalLogoLoading(true);

      if (contextCompanyDetails) {
        setEditFormData({
          company_name: contextCompanyDetails.company_name,
          domain: contextCompanyDetails.domain,
        });
        setModalCompanyLogo(contextCompanyDetails.logo_url || companyLogo);
      }
    } catch {
      setError('Failed to load company details');
    } finally {
      setModalLogoLoading(false);
      isModalOpenRef.current = false;
    }
  }, [contextCompanyDetails, companyLogo, user]);

  const handleCloseCompanyModal = useCallback(() => {
    setCompanyModalOpen(false);
    setIsEditing(false);
    setModalCompanyLogo(null);
  }, []);

  const handleFormChange = useCallback((field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSaveCompany = useCallback(async () => {
    if (!contextCompanyDetails) return;

    // Validate before API call
    const nextFormErrors: { company_name?: string; domain?: string } = {};
    if (!editFormData.company_name?.trim()) {
      nextFormErrors.company_name = 'Company name is required';
    }
    if (
      editFormData.domain &&
      !/^[a-zA-Z0-9-]+$/.test(editFormData.domain.trim())
    ) {
      nextFormErrors.domain =
        'Domain may only contain letters, numbers, and hyphens';
    }
    if (Object.keys(nextFormErrors).length > 0) {
      setFormErrors(nextFormErrors);
      return;
    }
    setFormErrors({});

    setEditLoading(true);
    try {
      // If a new logo was selected, upload it first
      if (selectedLogoFile) {
        await companyApi.uploadCompanyLogo(selectedLogoFile);
      }

      // Then update the company details
      await companyApi.updateCompanyDetails({
        company_name: editFormData.company_name,
        domain: editFormData.domain,
      });

      await refreshCompanyDetails();

      showSuccess('Company details updated successfully.');
      setIsEditing(false);
      setCompanyModalOpen(false);
      setSelectedLogoFile(null); // clear after saving
      setError(null);
    } catch (err) {
      showError(err);
    } finally {
      setEditLoading(false);
    }
  }, [
    editFormData,
    selectedLogoFile,
    contextCompanyDetails,
    refreshCompanyDetails,
    showSuccess,
    showError,
  ]);

  const handleLogoUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }

      // Preview only
      const previewUrl = URL.createObjectURL(file);
      setModalCompanyLogo(previewUrl);
      setSelectedLogoFile(file);
    },
    []
  );

  // Mobile Login Settings
  const handleToggleMobileLogin = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!tenantId) {
        showError('Tenant ID not found');
        return;
      }

      setMobileLoginLoading(true);
      try {
        const response = await SystemTenantApi.updateMobileLogin(tenantId, {
          enabled: event.target.checked,
        });
        if (response?.mobileLoginEnabled) {
          showSuccess('Mobile login enabled successfully.');
        } else {
          showSuccess('Mobile login disabled successfully.');
        }
        await refreshCompanyDetails();
      } catch (err) {
        showError(err);
      } finally {
        setMobileLoginLoading(false);
      }
    },
    [refreshCompanyDetails, showError, showSuccess, tenantId]
  );

  useEffect(() => {
    if (companyLogo && companyModalOpen && !logoUploading) {
      setModalCompanyLogo(companyLogo);
    }
  }, [companyLogo, companyModalOpen, logoUploading]);

  const domainText = contextCompanyDetails?.domain || 'Not specified';
  const controlBg =
    theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : 'background.default';

  const hasCompanyChanges = Boolean(
    contextCompanyDetails &&
    (editFormData.company_name !== contextCompanyDetails.company_name ||
      editFormData.domain !== contextCompanyDetails.domain ||
      Boolean(selectedLogoFile))
  );

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'nowrap',
        }}
      >
        <AppPageTitle
          sx={{
            mb: 0,
            color: theme.palette.text.secondary,
          }}
        >
          Company Information
        </AppPageTitle>

        <AppButton
          onClick={handleEditCompanyDetails}
          variant='contained'
          variantType='primary'
          startIcon={
            <Box
              component='img'
              src={Icons.edit}
              alt=''
              aria-hidden='true'
              sx={{
                width: { xs: 16, sm: 20 },
                height: { xs: 16, sm: 20 },
                filter: 'brightness(0) invert(1)',
              }}
            />
          }
          sx={{
            fontSize: 'var(--body-font-size)',
            lineHeight: 'var(--body-line-height)',
            letterSpacing: 'var(--body-letter-spacing)',
            boxShadow: 'none',
            minWidth: { xs: 'auto', sm: 200 },
            px: { xs: 2, sm: 2 },
            py: { xs: 1, sm: 1 },
            width: { xs: '100%', sm: 'auto' },
            mt: { xs: 2, sm: 0 },
            '& .MuiButton-startIcon': {
              marginRight: { xs: 0.5, sm: 1 },
              display: 'flex',
              alignItems: 'center',
            },
          }}
        >
          <Box component='span' sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Edit Company Details
          </Box>
          <Box component='span' sx={{ display: { xs: 'inline', sm: 'none' } }}>
            Edit
          </Box>
        </AppButton>
      </Box>

      {/* Company Info Card */}
      <AppCard
        elevation={1}
        sx={{
          borderRadius: 3,
          border: 'none',
          p: { xs: 2, sm: 3, lg: 4 },
          mb: 3,
        }}
      >
        {contextLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Logo */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: { xs: 3, sm: 4 },
                pb: { xs: 3, sm: 4 },
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: { xs: 110, sm: 150 },
                  height: { xs: 110, sm: 150 },
                  borderRadius: '50%',
                  backgroundColor: 'background.default',
                  border: `3px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {companyLogo ? (
                  <Box
                    component='img'
                    src={companyLogo}
                    alt='Company Logo'
                    loading='lazy'
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <BusinessIcon
                    sx={{
                      fontSize: { xs: 52, sm: 70 },
                      color: theme.palette.text.disabled,
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Company Name */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: { xs: 2, sm: 3 },
                pb: { xs: 2, sm: 3 },
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  width: { xs: 42, sm: 50 },
                  height: { xs: 42, sm: 50 },
                  borderRadius: '50%',
                  backgroundColor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: { xs: 2, sm: 3 },
                }}
              >
                <BusinessIcon
                  sx={{
                    fontSize: { xs: 22, sm: 28 },
                    color: theme.palette.text.disabled,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant='body2'
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 0.5,
                    fontSize: { xs: '11px', sm: '12px' },
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  Company Name
                </Typography>
                <Typography
                  variant='h6'
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: { xs: '16px', sm: '18px' },
                    fontWeight: 600,
                  }}
                  title={companyName || ''}
                >
                  {isMobile && companyName && companyName.length > 30
                    ? `${companyName.slice(0, 30)}...`
                    : companyName}
                </Typography>
              </Box>
            </Box>

            {/* Company Domain */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: { xs: 42, sm: 50 },
                  height: { xs: 42, sm: 50 },
                  borderRadius: '50%',
                  backgroundColor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: { xs: 2, sm: 3 },
                }}
              >
                <LanguageIcon
                  sx={{
                    fontSize: { xs: 22, sm: 28 },
                    color: theme.palette.text.disabled,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant='body2'
                  sx={{
                    color: theme.palette.text.secondary,
                    mb: 0.5,
                    fontSize: { xs: '11px', sm: '12px' },
                    textTransform: 'uppercase',
                    fontWeight: 500,
                  }}
                >
                  Company Domain
                </Typography>
                <Typography
                  variant='body1'
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: { xs: '14px', sm: '16px' },
                    fontWeight: 500,
                  }}
                  title={domainText}
                >
                  {isMobile && domainText.length > 30
                    ? `${domainText.slice(0, 30)}...`
                    : domainText}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </AppCard>

      <Box display={'flex'} flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
        {/* Mobile Login Settings */}

        <AppCard
          elevation={1}
          sx={{
            flex: 1,
            borderRadius: 3,
            border: 'none',
            p: { xs: 2, sm: 3, lg: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: { xs: 42, sm: 50 },
                  height: { xs: 42, sm: 50 },
                  borderRadius: '50%',
                  backgroundColor: 'background.default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: { xs: 2, sm: 3 },
                }}
              >
                <Smartphone
                  sx={{
                    fontSize: { xs: 22, sm: 28 },
                    color: theme.palette.text.disabled,
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant='body1'
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: { xs: '14px', sm: '16px' },
                  }}
                >
                  Mobile Application Login
                </Typography>
                <Typography
                  variant='body2'
                  sx={{
                    color: theme.palette.text.secondary,
                    fontSize: { xs: '12px', sm: '13px' },
                  }}
                >
                  Allow tenant to log in using the mobile app
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {mobileLoginLoading && (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              )}
              <Switch
                checked={contextCompanyDetails?.mobile_login_enabled || false}
                onChange={handleToggleMobileLogin}
                disabled={mobileLoginLoading}
                color='primary'
              />
            </Box>
          </Box>
        </AppCard>
      </Box>

      {/* Company Details Modal */}
      <AppFormModal
        open={companyModalOpen}
        onClose={handleCloseCompanyModal}
        title='Company Details'
        onSubmit={handleSaveCompany}
        cancelLabel='Cancel'
        submitLabel={editLoading ? 'Updating...' : 'Update'}
        submitStartIcon={
          editLoading ? <CircularProgress size={16} /> : undefined
        }
        submitDisabled={
          editLoading || !contextCompanyDetails || !hasCompanyChanges
        }
        submitTitle={!hasCompanyChanges ? 'No changes made' : undefined}
        hasChanges={hasCompanyChanges}
        wrapInForm={false}
        maxWidth='sm'
      >
        {modalLogoLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : contextCompanyDetails ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 3 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessCenter />
              <Typography
                sx={{ color: theme.palette.text.primary, fontWeight: 500 }}
              >
                Company Details
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 2,
                mt: 1,
              }}
            >
              {logoUploading ? (
                <CircularProgress size={60} />
              ) : (
                <Box
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    '&:hover .camera-overlay': { opacity: 1 },
                    '&:hover .avatar': { filter: 'brightness(0.7)' },
                  }}
                >
                  <Avatar
                    className='avatar'
                    sx={{
                      width: { xs: 120, sm: 150 },
                      height: { xs: 120, sm: 150 },
                      border: `2px solid ${theme.palette.divider}`,
                      fontSize: '48px',
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.primary.main,
                      color: 'white',
                      transition: 'filter 0.3s ease',
                    }}
                  >
                    {modalCompanyLogo ? (
                      <img
                        src={modalCompanyLogo}
                        alt='Company Logo'
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      contextCompanyDetails.company_name.charAt(0).toUpperCase()
                    )}
                  </Avatar>
                  <Box
                    className='camera-overlay'
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      borderRadius: '50%',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                    }}
                  >
                    <CameraAlt
                      sx={{ color: 'white', fontSize: { xs: 32, sm: 40 } }}
                    />
                  </Box>

                  <input
                    accept='image/*'
                    style={{ display: 'none' }}
                    id='logo-upload'
                    type='file'
                    onChange={handleLogoUpload}
                    disabled={logoUploading || editLoading}
                  />
                  <label
                    htmlFor='logo-upload'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      cursor: 'pointer',
                      borderRadius: '50%',
                    }}
                  />
                </Box>
              )}
            </Box>

            <AppInputField
              label='Company Name'
              value={editFormData.company_name}
              onChange={e => handleFormChange('company_name', e.target.value)}
              inputProps={{ maxLength: 50 }}
              disabled={editLoading}
              placeholder='Enter company name'
              inputBackgroundColor={controlBg}
              error={Boolean(formErrors.company_name)}
              helperText={formErrors.company_name}
            />

            <AppInputField
              label='Domain'
              value={editFormData.domain}
              onChange={e => handleFormChange('domain', e.target.value)}
              inputProps={{ maxLength: 50 }}
              disabled={editLoading}
              placeholder='Enter domain'
              inputBackgroundColor={controlBg}
              error={Boolean(formErrors.domain)}
              helperText={formErrors.domain}
            />
          </Box>
        ) : (
          <Typography sx={{ textAlign: 'center', py: 2 }}>
            No company details available
          </Typography>
        )}
      </AppFormModal>

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default CompanyPage;
