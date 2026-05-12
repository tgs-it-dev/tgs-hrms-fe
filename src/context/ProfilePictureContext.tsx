import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { ProfilePictureContextType } from '../types/context';

// eslint-disable-next-line react-refresh/only-export-components
export const ProfilePictureContext = createContext<
  ProfilePictureContextType | undefined
>(undefined);

const ProfilePictureProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );

  const updateProfilePicture = useCallback((url: string | null) => {
    setProfilePictureUrl(url);
  }, []);

  const clearProfilePicture = useCallback(() => {
    setProfilePictureUrl(null);
  }, []);

  const contextValue: ProfilePictureContextType = useMemo(
    () => ({
      profilePictureUrl,
      updateProfilePicture,
      clearProfilePicture,
    }),
    [profilePictureUrl, updateProfilePicture, clearProfilePicture]
  );

  return (
    <ProfilePictureContext.Provider value={contextValue}>
      {children}
    </ProfilePictureContext.Provider>
  );
};

export { ProfilePictureProvider };

// eslint-disable-next-line react-refresh/only-export-components
export const useProfilePicture = (): ProfilePictureContextType => {
  const context = React.useContext(ProfilePictureContext);
  if (!context) {
    throw new Error(
      'useProfilePicture must be used within ProfilePictureProvider'
    );
  }
  return context;
};
