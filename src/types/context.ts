import type { UserProfile } from './user';

export interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  updateUser: (updatedUser: UserProfile) => void;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  /** Resolved profile picture URL (may differ from user.profile_pic after an upload) */
  profilePictureUrl: string | null;
  updateProfilePicture: (url: string | null) => void;
  clearProfilePicture: () => void;
}

export interface LanguageContextType {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
}

/**
 * @deprecated ProfilePictureContextType has been merged into UserContextType.
 * Import from UserContext instead: `useUser()` exposes profilePictureUrl,
 * updateProfilePicture, and clearProfilePicture.
 */
export interface ProfilePictureContextType {
  profilePictureUrl: string | null;
  updateProfilePicture: (url: string | null) => void;
  clearProfilePicture: () => void;
}
