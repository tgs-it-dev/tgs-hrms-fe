import React, { useState, useLayoutEffect, useRef, useCallback } from 'react';
import {
  Box,
  CircularProgress,
  InputAdornment,
  useTheme,
} from '@mui/material';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import './PhoneInput.css';
import {
  profileApiService,
  type UpdateProfileRequest,
} from '../../api/profileApi';
import type { UserProfile } from '../../api/profileApi';
import ProfilePictureUpload from '../common/ProfilePictureUpload';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { validateEmailAddress } from '../../utils/validation';
import { env } from '../../config/env';
import { TIMEOUTS, ERROR_MESSAGES } from '../../constants/appConstants';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppFormModal from '../common/AppFormModal';
import AppInputField from '../common/AppInputField';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  user,
  onProfileUpdated,
}) => {
  const theme = useTheme();
  const { snackbar, showSuccess, showError, closeSnackbar } = useErrorHandler();
  const { updateProfilePicture, clearProfilePicture } = useProfilePicture();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedPictureFile, setSelectedPictureFile] = useState<File | null>(
    null
  );
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);
  const hasSyncedRef = useRef(false);

  // Sync form data when modal opens (useLayoutEffect = before paint, no empty flash)
  useLayoutEffect(() => {
    if (!open) {
      hasSyncedRef.current = false;
      return;
    }
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setError(null);
      setValidationErrors({});
      setHasChanges(false);
      setSelectedPictureFile(null);
      setPreviewImageUrl(null);
      setRemoveRequested(false);
      setLoading(false);
      hasSyncedRef.current = true;
    }
  }, [open, user]);

  // Show user data on first paint when opening (before state update) so fields don't appear empty
  const displayData =
    open && user && !hasSyncedRef.current
      ? {
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
        }
      : formData;

  // Check if form has changes compared to original user data
  const checkForChanges = useCallback(
    (newFormData: typeof formData) => {
      if (!user) return false;

      const hasChanges =
        newFormData.first_name !== (user.first_name || '') ||
        newFormData.last_name !== (user.last_name || '') ||
        newFormData.email !== (user.email || '') ||
        newFormData.phone !== (user.phone || '');

      setHasChanges(hasChanges);
      return hasChanges;
    },
    [user]
  );

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // First name validation (matching backend DTO: MinLength(2), MaxLength(50))
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    } else if (formData.first_name.trim().length > 50) {
      errors.first_name = 'First name must be less than 50 characters';
    }

    // Last name validation (matching backend DTO: MinLength(2), MaxLength(50))
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    } else if (formData.last_name.trim().length > 50) {
      errors.last_name = 'Last name must be less than 50 characters';
    }

    // Email validation – reuse shared signup rules
    if (formData.email.trim()) {
      const emailError = validateEmailAddress(formData.email);
      if (emailError) {
        errors.email = emailError;
      }
    } else {
      errors.email = 'Email is required';
    }

    // Phone number validation
    if (formData.phone && formData.phone.trim()) {
      // Basic validation for phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const newFormData = {
        ...formData,
        [field]: event.target.value,
      };

      setFormData(newFormData);

      // Check for changes
      checkForChanges(newFormData);

      // Clear validation error for this field when user starts typing
      if (validationErrors[field]) {
        setValidationErrors(prev => ({
          ...prev,
          [field]: '',
        }));
      }
    };

  const handlePhoneChange = (value: string | undefined) => {
    const phoneValue = value || '';
    const newFormData = {
      ...formData,
      phone: phoneValue,
    };

    setFormData(newFormData);

    // Check for changes
    checkForChanges(newFormData);

    // Clear validation error for phone field when user starts typing
    if (validationErrors.phone) {
      setValidationErrors(prev => ({
        ...prev,
        phone: '',
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    // Add timeout to prevent loader from getting stuck
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError(ERROR_MESSAGES.TIMEOUT);
    }, TIMEOUTS.API_REQUEST);

    try {
      const token = localStorage.getItem('accessToken');
      let successMessage: string | null = null;

      // 1) If delete requested, remove first and clear global picture context
      if (removeRequested) {
        const removeRes = await profileApiService.removeProfilePicture();
        if (removeRes.message) successMessage = removeRes.message;
        clearProfilePicture();
      }

      // 2) If a new picture file was selected in this modal, upload it next
      if (selectedPictureFile) {
        if (!token) throw new Error('No access token found');
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const correctUserId = tokenPayload.sub;
        const response = await profileApiService.uploadProfilePicture(
          correctUserId,
          selectedPictureFile
        );
        if (response.message) successMessage = response.message;
        const profilePicUrl = response.user.profile_pic
          ? `${env.apiBaseUrl}/users/${correctUserId}/profile-picture?t=${Date.now()}`
          : null;
        updateProfilePicture(profilePicUrl);
      }

      // 3) Then update textual profile fields
      const updateData: UpdateProfileRequest = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null, // Send null to clear phone if empty
      };

      const updatedUser = await profileApiService.updateProfile(updateData);

      onProfileUpdated(updatedUser);
      showSuccess(successMessage || 'Profile updated successfully');
      onClose();
    } catch (err: unknown) {
      setError(null);
      showError(err);
    } finally {
      // Clear timeout and ensure loading state is always reset
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      // Allow closing even when loading, but show confirmation
      if (
        window.confirm('Update is in progress. Are you sure you want to close?')
      ) {
        setLoading(false); // Reset loading state
        onClose();
      }
    } else {
      onClose();
    }
  };

  const controlBg =
    theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : '#F8F8F8';
  const submitDisabled =
    loading || (!hasChanges && !selectedPictureFile && !removeRequested);
  const submitTitle =
    !hasChanges && !selectedPictureFile && !removeRequested
      ? 'No changes made'
      : undefined;

  return (
    <>
      <AppFormModal
        open={open}
        onClose={handleClose}
        title='Edit Profile'
      onSubmit={handleSubmit}
      submitLabel={loading ? 'Updating...' : 'Update Profile'}
      cancelLabel='Cancel'
      isSubmitting={loading}
      hasChanges={!submitDisabled}
      submitDisabled={submitDisabled}
      submitTitle={submitTitle}
      submitStartIcon={loading ? <CircularProgress size={16} /> : undefined}
      maxWidth='sm'
    >
      <Box sx={{ pt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <ProfilePictureUpload
            user={user}
            onProfileUpdate={onProfileUpdated}
            size={100}
            showUploadButton={true}
            showRemoveButton={true}
            clickable={true}
            deferUpload={true}
            onFileSelected={file => {
              setSelectedPictureFile(file);
              const reader = new FileReader();
              reader.onload = e =>
                setPreviewImageUrl(e.target?.result as string);
              reader.readAsDataURL(file);
            }}
            previewImageOverride={previewImageUrl}
            deferDelete={true}
            onRemoveSelected={() => {
              setSelectedPictureFile(null);
              setPreviewImageUrl(null);
              setRemoveRequested(true);
            }}
            suppressExistingImage={removeRequested}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AppInputField
            label='First Name'
            value={displayData.first_name}
            onChange={handleInputChange('first_name')}
            error={!!validationErrors.first_name}
            helperText={validationErrors.first_name}
            disabled={loading}
            inputProps={{ maxLength: 50 }}
            placeholder='Enter first name'
            inputBackgroundColor={controlBg}
          />

          <AppInputField
            label='Last Name'
            value={displayData.last_name}
            onChange={handleInputChange('last_name')}
            error={!!validationErrors.last_name}
            helperText={validationErrors.last_name}
            disabled={loading}
            inputProps={{ maxLength: 50 }}
            placeholder='Enter last name'
            inputBackgroundColor={controlBg}
          />

          <AppInputField
            label='Phone Number'
            value={displayData.phone}
            onChange={e => handlePhoneChange(e.target.value)}
            error={!!validationErrors.phone}
            helperText={validationErrors.phone}
            disabled={loading}
            placeholder='Enter phone number (optional)'
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position='start'
                  sx={{ margin: 0, padding: '28px 0px' }}
                >
                  <PhoneInput
                    defaultCountry='pk'
                    value={displayData.phone}
                    onChange={handlePhoneChange}
                    disabled={loading}
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
                      fontSize: '0.9rem',
                      backgroundColor: 'transparent',
                      width: '100%',
                      boxSizing: 'border-box',
                      flex: 1,
                      height: '100%',
                      color: theme.palette.text.primary,
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
                        color: theme.palette.text.primary,
                      },
                    }}
                    className='phone-input-textfield-adornment'
                  />
                </InputAdornment>
              ),
            }}
            inputBackgroundColor={controlBg}
          />

          <AppInputField
            label='Email Address'
            type='email'
            value={displayData.email}
            onChange={handleInputChange('email')}
            error={!!validationErrors.email}
            helperText={validationErrors.email}
            disabled={loading}
            placeholder='Enter email address'
            inputBackgroundColor={controlBg}
          />
        </Box>
      </Box>
    </AppFormModal>
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      />
    </>
  );
};

export default EditProfileModal;
