import React, { useState } from 'react';
import { Avatar, type AvatarProps } from '@mui/material';
import { useProfilePicture } from '../../context/UserContext';
import { useUser } from '../../hooks/useUser';
import { colorTokens } from '../../theme';

interface UserAvatarProps extends Omit<AvatarProps, 'src' | 'alt'> {
  user: {
    id?: string;
    first_name: string;
    last_name: string;
    profile_pic?: string | null;
  };
  size?: number;
  clickable?: boolean;
  onClick?: () => void;
}

const UserAvatar = React.forwardRef<HTMLDivElement, UserAvatarProps>(
  (
    { user, size = 40, clickable = false, onClick, sx, ...avatarProps },
    ref
  ) => {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const { profilePictureUrl } = useProfilePicture();
    const { user: currentUser } = useUser();

    const [imgError, setImgError] = useState(false);
    // const [defaultError] = useState(false);

    const getInitials = (first: string, last: string) =>
      `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();

    const generateAvatarColor = (name: string) =>
      colorTokens.avatar[name.charCodeAt(0) % colorTokens.avatar.length];

    const isCurrentUser = currentUser?.id === user.id;
    const effectiveProfilePictureUrl = isCurrentUser ? profilePictureUrl : null;

    // const defaultImageUrl = '/avatar.png';

    const avatarStyle = {
      width: size,
      height: size,
      fontSize: `${size * 0.4}px`,
      cursor: clickable ? 'pointer' : 'default',
      backgroundColor: imgError
        ? 'text.secondary'
        : effectiveProfilePictureUrl || user.profile_pic
          ? 'transparent'
          : generateAvatarColor(user.first_name),
      '& .MuiAvatar-img': {
        objectFit: 'cover',
        objectPosition: 'top',
      },
      '&:hover': clickable
        ? {
            opacity: 0.8,
            transform: 'scale(1.05)',
            transition: 'all 0.2s ease-in-out',
          }
        : {},
      ...sx,
    };
    let imageUrl: string | null = null;

    if (effectiveProfilePictureUrl) {
      imageUrl = effectiveProfilePictureUrl;
    } else if (user.profile_pic) {
      imageUrl = user.profile_pic.startsWith('http')
        ? user.profile_pic
        : `${API_BASE_URL}/users/${user.id}/profile-picture`;
    }

    if (!imageUrl || imgError) {
      imageUrl = null;
    }

    return (
      <Avatar
        ref={ref}
        sx={avatarStyle}
        onClick={onClick}
        {...avatarProps}
        alt={`${user.first_name} ${user.last_name}`}
      >
        {imageUrl && !imgError ? (
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
              borderRadius: '50%',
            }}
          />
        ) : imgError ? null : (
          getInitials(user.first_name, user.last_name)
        )}
      </Avatar>
    );
  }
);

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;
