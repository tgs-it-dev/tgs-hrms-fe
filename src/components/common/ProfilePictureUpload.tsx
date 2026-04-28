import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Avatar,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Fade,
} from '@mui/material';
import { PhotoCamera, Delete, Close, Edit } from '@mui/icons-material';
import { profileApiService, type UserProfile } from '../../api/profileApi';
import { useUser } from '../../hooks/useUser';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from './ErrorSnackbar';
import AppButton from './AppButton';

interface ProfilePictureUploadProps {
  user: UserProfile;
  onProfileUpdate: (updatedUser: UserProfile) => void;
  size?: number;
  showUploadButton?: boolean;
  showRemoveButton?: boolean;
  clickable?: boolean;
  showEditOverlay?: boolean;
  onPictureChanged?: (changed: boolean) => void;
  deferUpload?: boolean;
  onFileSelected?: (file: File) => void;
  previewImageOverride?: string | null;
  deferDelete?: boolean;
  onRemoveSelected?: () => void;
  suppressExistingImage?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = React.memo(
  ({
    user,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onProfileUpdate,
    size = 80,
    showUploadButton = true,
    showRemoveButton = true,
    clickable = true,
    onPictureChanged,
    deferUpload = false,
    onFileSelected,
    previewImageOverride,
    deferDelete = false,
    onRemoveSelected,
    suppressExistingImage = false,
  }) => {
    const { updateUser } = useUser();
    const { snackbar, showSuccess, showError, closeSnackbar } =
      useErrorHandler();
    const { updateProfilePicture, clearProfilePicture } = useProfilePicture();
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [, setError] = useState<string | null>(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const [imgError, setImgError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

    const getInitials = (first: string, last: string): string => {
      return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
    };

    const generateAvatarColor = (name: string): string => {
      const colors = [
        '#f44336',
        '#e91e63',
        '#6054f4',
        '#673ab7',
        '#3f51b5',
        '#2196f3',
        '#03a9f4',
        '#00bcd4',
        '#009688',
        '#4caf50',
        '#8bc34a',
        '#cddc39',
        '#ffeb3b',
        '#ffc107',
        '#ff9800',
        '#ff5722',
        '#795548',
        '#9e9e9e',
        '#607d8b',
      ];
      const index = name.charCodeAt(0) % colors.length;
      return colors[index];
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPG, PNG, or GIF)');
        showError(
          new Error('Please select a valid image file (JPG, PNG, or GIF)')
        );
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        setError(
          `File size (${fileSizeMB} MB) must be less than 5MB. Please select a smaller image.`
        );
        showError(
          new Error(
            `File size (${fileSizeMB} MB) must be less than 5MB. Please select a smaller image.`
          )
        );
        return;
      }

      setError(null);
      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = e => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      if (deferUpload) {
        if (onFileSelected) onFileSelected(file);
        if (onPictureChanged) onPictureChanged(true);
      } else {
        setShowUploadDialog(true);
        if (onPictureChanged) onPictureChanged(true);
      }
    };

    const handleUpload = useCallback(async () => {
      if (!selectedFile) return;

      setUploading(true);
      setError(null);

      try {
        // Get the correct user ID from JWT token
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found');
        }

        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const correctUserId = tokenPayload.sub;

        const response = await profileApiService.uploadProfilePicture(
          correctUserId, // Use the correct user ID from JWT
          selectedFile
        );

        // Update profile picture context with the full API URL
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const profilePicUrl = response.user.profile_pic
          ? `${API_BASE_URL}/users/${correctUserId}/profile-picture?t=${Date.now()}`
          : null;

        updateProfilePicture(profilePicUrl);

        // ✅ Removed refreshUser() call - this causes full page re-render
        // The profile picture context update is sufficient for UI updates

        showSuccess('Profile picture uploaded successfully!');
        setShowUploadDialog(false);
        setSelectedFile(null);
        setPreviewUrl(null);
        if (onPictureChanged) onPictureChanged(true);
      } catch (err: unknown) {
        let errorMessage = 'Failed to upload profile picture';

        if (err && typeof err === 'object' && 'response' in err) {
          const apiError = err as {
            response: { data?: { message?: string }; status?: number };
          };
          if (apiError.response.data?.message) {
            errorMessage = apiError.response.data.message;
          } else if (apiError.response.status === 400) {
            errorMessage = 'Bad request - check file format and size';
          } else if (apiError.response.status === 403) {
            errorMessage =
              'Permission denied - you can only update your own profile picture';
          } else if (apiError.response.status === 401) {
            errorMessage = 'Authentication failed - please log in again';
          }
        } else if ((err as Error).message) {
          errorMessage = (err as Error).message;
        }

        setError(errorMessage);
        showError(err);
      } finally {
        setUploading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFile, updateProfilePicture]); // ✅ Removed refreshUser from dependencies

    const handleRemove = useCallback(async () => {
      if (deferDelete) {
        // Preview-only removal in parent modal; do not call API here
        setSelectedFile(null);
        setPreviewUrl(null);
        if (onRemoveSelected) onRemoveSelected();
        if (onPictureChanged) onPictureChanged(true);
        return;
      }

      setRemoving(true);
      setError(null);

      try {
        await profileApiService.removeProfilePicture();

        // Update profile picture context - this will update the UI immediately
        clearProfilePicture();

        // Also update the user context so components relying on user.profile_pic react instantly
        updateUser({ ...user, profile_pic: null });

        // ✅ Removed refreshUser() call - this causes full page re-render
        // The profile picture context update is sufficient for UI updates

        showError(new Error('Profile picture removed successfully!'));
        if (onPictureChanged) onPictureChanged(true);
      } catch (err: unknown) {
        const errorMessage =
          (err && typeof err === 'object' && 'response' in err
            ? (err as { response: { data?: { message?: string } } }).response
                .data?.message
            : null) || 'Failed to remove profile picture';
        setError(errorMessage);
        showError(err);
      } finally {
        setRemoving(false);
      }
    }, [
      clearProfilePicture,
      deferDelete,
      onRemoveSelected,
      onPictureChanged,
      updateUser,
      user,
    ]); // ✅ Removed refreshUser from dependencies

    const handleAvatarClick = useCallback(() => {
      if (clickable && showUploadButton) {
        fileInputRef.current?.click();
      }
    }, [clickable, showUploadButton]);

    const avatarStyle = useMemo(
      () => ({
        width: size,
        height: size,
        fontSize: `${size * 0.4}px`,
        cursor: clickable ? 'pointer' : 'default',
        backgroundColor: imgError
          ? '#9e9e9e'
          : user.profile_pic
            ? 'transparent'
            : generateAvatarColor(user.first_name),
        transition: 'all 0.3s ease-in-out',
        '& .MuiAvatar-img': {
          objectFit: 'cover',
          objectPosition: 'top', // ✅ NEW: Centers image at top
        },
        '&:hover': clickable
          ? {
              transform: 'scale(1.02)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            }
          : {},
      }),
      [size, clickable, user.profile_pic, user.first_name, imgError]
    );

    const { profilePictureUrl } = useProfilePicture();

    const imageUrl = useMemo(() => {
      // Highest priority: explicit override from parent (e.g., EditProfile preview)
      if (previewImageOverride) {
        return previewImageOverride;
      }
      // Optionally suppress existing image to show initials in preview mode
      if (suppressExistingImage) {
        return null;
      }
      // Then use context URL if available
      if (profilePictureUrl) {
        return profilePictureUrl;
      } else if (user.profile_pic) {
        return `${API_BASE_URL}/users/${user.id}/profile-picture`;
      }
      return null;
    }, [
      previewImageOverride,
      suppressExistingImage,
      profilePictureUrl,
      user.profile_pic,
      user.id,
      API_BASE_URL,
    ]);

    const renderAvatar = useCallback(() => {
      const hasProfilePicture =
        (!!previewImageOverride && !suppressExistingImage) ||
        (!suppressExistingImage && (profilePictureUrl || user.profile_pic));

      if (hasProfilePicture && imageUrl && !imgError) {
        return (
          <Avatar sx={avatarStyle} onClick={handleAvatarClick}>
            <img
              src={imageUrl}
              alt={`${user.first_name} ${user.last_name}`}
              onError={() => setImgError(true)}
              loading='lazy'
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top',
              }}
            />
          </Avatar>
        );
      }

      return (
        <Avatar sx={avatarStyle} onClick={handleAvatarClick}>
          {imgError ? null : getInitials(user.first_name, user.last_name)}
        </Avatar>
      );
    }, [
      previewImageOverride,
      suppressExistingImage,
      profilePictureUrl,
      user.profile_pic,
      imageUrl,
      user.first_name,
      user.last_name,
      avatarStyle,
      handleAvatarClick,
      imgError,
    ]);

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {/* Avatar with Professional Hover Overlay */}
        <Box
          sx={{ position: 'relative' }}
          onMouseEnter={() => setShowOverlay(true)}
          onMouseLeave={() => setShowOverlay(false)}
        >
          {renderAvatar()}

          {/* Professional Hover Overlay */}
          {clickable && showUploadButton && !uploading && (
            <Fade in={showOverlay}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  backdropFilter: 'blur(2px)',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  {!suppressExistingImage &&
                  (previewImageOverride ||
                    profilePictureUrl ||
                    user.profile_pic) ? (
                    <Edit
                      sx={{
                        color: 'white',
                        fontSize: size * 0.25,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      }}
                    />
                  ) : (
                    <PhotoCamera
                      sx={{
                        color: 'white',
                        fontSize: size * 0.25,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Fade>
          )}

          {/* Delete Icon - Only show when profile picture exists */}
          {!suppressExistingImage &&
            (profilePictureUrl || user.profile_pic) &&
            showRemoveButton &&
            !uploading && (
              <Fade in={showOverlay}>
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 5,
                    right: -10,
                    backgroundColor: '#f44336',
                    color: 'white',
                    width: 28,
                    height: 28,
                    boxShadow: '0 2px 8px rgba(244, 67, 54, 0.3)',
                    '&:hover': {
                      backgroundColor: '#d32f2f',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  disabled={removing}
                >
                  {removing ? (
                    <CircularProgress size={16} sx={{ color: 'white' }} />
                  ) : (
                    <Delete sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
              </Fade>
            )}

          {/* Loading Overlay */}
          {uploading && (
            <Fade in={uploading}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(2px)',
                }}
              >
                <CircularProgress size={size * 0.3} sx={{ color: 'white' }} />
              </Box>
            </Fade>
          )}
        </Box>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Upload Dialog */}
        <Dialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          maxWidth='sm'
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e0e0e0',
              pb: 2,
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              Upload Profile Picture
            </Typography>
            <IconButton
              onClick={() => setShowUploadDialog(false)}
              sx={{ color: 'var(--primary-dark-color)' }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ py: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              {previewUrl && (
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    mb: 3,
                    display: 'inline-block',
                    borderRadius: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      border: '3px solid #e0e0e0',
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt='Preview'
                      loading='lazy'
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top',
                      }}
                    />
                  </Avatar>
                </Paper>
              )}
              <Typography variant='body1' sx={{ fontWeight: 500, mb: 1 }}>
                {selectedFile?.name}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                File size:{' '}
                {selectedFile
                  ? (selectedFile.size / 1024 / 1024).toFixed(2)
                  : '0'}{' '}
                MB
              </Typography>
              {selectedFile && selectedFile.size > 5 * 1024 * 1024 && (
                <Alert severity='error' sx={{ mb: 2 }}>
                  File size exceeds 5MB limit. Please select a smaller image.
                </Alert>
              )}
              <Typography variant='caption' color='text.secondary'>
                This will replace your current profile picture
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <AppButton
              onClick={() => setShowUploadDialog(false)}
              variant='outlined'
              variantType='secondary'
              sx={{
                textTransform: 'none',
                borderColor: 'var(--primary-dark-color)',
                color: 'var(--primary-dark-color)',
                '&:hover': {
                  borderColor: 'var(--primary-dark-color)',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              Cancel
            </AppButton>
            <AppButton
              onClick={handleUpload}
              variant='contained'
              variantType='primary'
              disabled={Boolean(
                uploading ||
                (selectedFile && selectedFile.size > 5 * 1024 * 1024)
              )}
              startIcon={uploading ? <CircularProgress size={16} /> : null}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </AppButton>
          </DialogActions>
        </Dialog>

        <ErrorSnackbar
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        />
      </Box>
    );
  }
);

export default ProfilePictureUpload;
