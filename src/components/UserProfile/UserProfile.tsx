import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  Typography,
  Box,
  Divider,
  Chip,
  CircularProgress,
  useTheme,
  Paper,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Email,
  AdminPanelSettings,
  Phone,
  Business,
  CalendarToday,
} from '@mui/icons-material';
// UserProfile type available if needed
import { useUser } from '../../hooks/useUser';
import type { UserProfile } from '../../types/user';
import { profileApiService } from '../../api/profileApi';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { env } from '../../config/env';
import {
  getRoleName,
  getRoleColor,
  isEmployee,
  isManager,
} from '../../utils/roleUtils';
import ProfilePictureUpload from '../common/ProfilePictureUpload';
import EmployeeProfileView from '../Employee/EmployeeProfileView';
import EditProfileModal from './EditProfileModal';
import { formatDate } from '../../utils/dateUtils';
import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppPageTitle from '../common/AppPageTitle';
import { Icons } from '../../assets/icons';

const PROFILE_ITEM_ICON_SX = {
  color: 'primary.main',
  fontSize: { xs: 20, sm: 24 },
} as const;

const UserProfileComponent = React.memo(() => {
  const { user: profile, loading, updateUser } = useUser();
  const { updateProfilePicture } = useProfilePicture();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const tenantFetchedRef = useRef(false);

  // Silently fetch tenant if missing (without causing loading state)
  useEffect(() => {
    // Only fetch tenant if profile exists, tenant is missing, and we haven't fetched yet
    if (profile && !profile.tenant && !loading && !tenantFetchedRef.current) {
      tenantFetchedRef.current = true;
      // Fetch directly from API and update state without triggering loading
      profileApiService
        .getUserProfile()
        .then(updatedProfile => {
          // Update user state directly without going through refreshUser (which sets loading)
          updateUser(updatedProfile);
        })
        .catch(() => {
          // Silently fail - keep existing data
          tenantFetchedRef.current = false; // Allow retry if needed
        });
    } else if (profile?.tenant) {
      // Tenant exists, mark as fetched
      tenantFetchedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.tenant, loading]); // Only run when tenant or loading changes

  // Profile picture is already handled by Navbar component, no need to update here
  // This prevents unnecessary re-renders when navigating to profile page

  const handleProfileUpdate = useCallback(() => {
    // The UserContext will handle the update automatically
    // This function is kept for compatibility with ProfilePictureUpload
  }, []);

  const handleEditProfile = useCallback(() => {
    setEditModalOpen(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
  }, []);

  const handleProfileUpdated = useCallback(
    (updatedUser: UserProfile) => {
      // Merge with existing profile to avoid wiping fields and reduce re-renders
      updateUser({ ...(profile || {}), ...updatedUser });

      // Close modal
      setEditModalOpen(false);

      // Normalize profile picture URL and update picture context
      if (updatedUser.profile_pic) {
        const profilePicUrl = updatedUser.profile_pic.startsWith('http')
          ? updatedUser.profile_pic
          : `${env.apiBaseUrl}/users/${updatedUser.id}/profile-picture`;
        updateProfilePicture(profilePicUrl);
      }
    },
    [profile, updateUser, updateProfilePicture]
  );

  // Determine if the user should see the employee profile view (managers included)
  const userIsEmployee = isEmployee(profile?.role) || isManager(profile?.role);

  const profileItems = useMemo(() => {
    if (!profile) return [];
    return [
      {
        icon: <Person sx={PROFILE_ITEM_ICON_SX} />,
        label: 'First Name',
        value: profile.first_name,
      },
      {
        icon: <Person sx={PROFILE_ITEM_ICON_SX} />,
        label: 'Last Name',
        value: profile.last_name,
      },
      {
        icon: <Email sx={PROFILE_ITEM_ICON_SX} />,
        label: 'Email Address',
        value: profile.email,
      },
      {
        icon: <Phone sx={PROFILE_ITEM_ICON_SX} />,
        label: 'Phone',
        value: profile.phone,
      },
      {
        icon: <AdminPanelSettings sx={PROFILE_ITEM_ICON_SX} />,
        label: 'Role',
        value: getRoleName(profile.role),
      },
      {
        icon: <Business sx={PROFILE_ITEM_ICON_SX} />,
        label: 'Tenant',
        value: profile.tenant,
      },
      {
        icon: <CalendarToday sx={PROFILE_ITEM_ICON_SX} />,
        label: 'Joined',
        value: formatDate(profile.created_at),
      },
    ];
  }, [profile]);

  // Only show loading if we truly don't have profile data and it's still loading
  // If we have profile data, show it even if loading is true (might be fetching tenant in background)
  if (loading && !profile) {
    return (
      <Box display='flex' justifyContent='center' mt={6}>
        <CircularProgress />
      </Box>
    );
  }
  if (!profile) return null;

  return (
    <Box sx={{ py: 2 }}>
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          bgcolor: 'transparent',
          alignItems: 'flex-start',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 3,
            width: '100%',
          }}
        >
          <AppPageTitle
            sx={{
              mb: 0,
              color: theme.palette.text.secondary,
            }}
          >
            User Profile
          </AppPageTitle>
          <AppButton
            onClick={handleEditProfile}
            variant='contained'
            variantType='primary'
            startIcon={
              <Box
                component='img'
                src={Icons.edit}
                alt=''
                aria-hidden='true'
                sx={{
                  width: { xs: '100%', sm: 20 },
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
            <Box
              component='span'
              sx={{ display: { xs: 'none', sm: 'inline' } }}
            >
              Edit profile
            </Box>
            <Box
              component='span'
              sx={{ display: { xs: 'inline', sm: 'none' } }}
            >
              Edit
            </Box>
          </AppButton>
        </Box>
        <AppCard
          elevation={1}
          sx={{
            borderRadius: 3,
            border: 'none',
            width: '100%',
            maxWidth: '100%',
            px: { xs: 1.5, md: 3 },
            py: { xs: 2, md: 3 },
          }}
        >
          {/* Header Section with Profile Picture Upload */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              mb: { xs: 3, sm: 4 },
              gap: { xs: 2, sm: 3 },
            }}
          >
            <ProfilePictureUpload
              user={profile}
              onProfileUpdate={handleProfileUpdate}
              size={isMobile ? 88 : 100}
              showUploadButton={true}
              showRemoveButton={true}
              clickable={true}
            />
            <Box
              sx={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', sm: 'flex-start' },
              }}
            >
              <Typography
                variant='h5'
                component='h2'
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  textAlign: { xs: 'center', sm: 'left' },
                  fontSize: { xs: '24px', sm: '28px' },
                  color: theme.palette.text.primary,
                }}
              >
                {profile.first_name} {profile.last_name}
              </Typography>
              <Chip
                label={getRoleName(profile.role)}
                color={getRoleColor(profile.role)}
                size='small'
                sx={{
                  fontWeight: 500,
                  mb: 1,
                  height: { xs: 26, sm: 28 },
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: { xs: '12px', sm: '13px' },
                    fontWeight: 500,
                  },
                }}
              />
              <Typography
                variant='body2'
                sx={{
                  mb: 0.5,
                  color: theme.palette.text.secondary,
                  textAlign: { xs: 'center', sm: 'left' },
                }}
              >
                {profile.email}
              </Typography>
              {profile.phone && (
                <Typography
                  variant='body2'
                  sx={{
                    color: theme.palette.text.secondary,
                    textAlign: { xs: 'center', sm: 'left' },
                  }}
                >
                  {profile.phone}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />
          {/* Profile Info */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            {profileItems.map((item, index) => (
              <Box
                key={index}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 48%' },
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ mr: { xs: 1.5, sm: 2 }, mt: 0.25 }}>{item.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant='body2'
                    sx={{
                      mb: 0.5,
                      fontWeight: 500,
                      fontSize: { xs: '13px', sm: '14px' },
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{
                      fontWeight: 400,
                      wordBreak: 'break-word',
                      fontSize: { xs: '14px', sm: '16px' },
                    }}
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </AppCard>
        {/* Show EmployeeProfileView if user is an employee */}
        {userIsEmployee && (
          <Box mt={4} sx={{ width: '100%', maxWidth: '100%' }}>
            <Box sx={{ width: '100%', maxWidth: '100%' }}>
              <EmployeeProfileView />
            </Box>
          </Box>
        )}
      </Paper>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={handleCloseEditModal}
          user={profile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </Box>
  );
});

export default UserProfileComponent;
