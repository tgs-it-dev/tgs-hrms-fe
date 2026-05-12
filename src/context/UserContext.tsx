import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { profileApiService } from '../api/profileApi';
import type { UserProfile } from '../types/user';
import type { UserContextType } from '../types/context';
import { setupTokenValidation, clearAuthData } from '../utils/authValidation';

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null
  );

  // Update user state and localStorage
  const updateUser = useCallback((updatedUser: UserProfile) => {
    setUser(updatedUser);
    setLoading(false); // Ensure loading state is false after update
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      setLoading(true);
      const profileData = await profileApiService.getUserProfile();
      setUser(profileData);
      localStorage.setItem('user', JSON.stringify(profileData));
    } catch {
      // Don't clear user data on API error, keep localStorage data
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfilePicture = useCallback((url: string | null) => {
    setProfilePictureUrl(url);
  }, []);

  const clearProfilePicture = useCallback(() => {
    setProfilePictureUrl(null);
  }, []);

  // Clear user data (for logout)
  const clearUser = useCallback(() => {
    setUser(null);
    setProfilePictureUrl(null);
    clearAuthData();
  }, []);

  // Load user data from localStorage on mount and refresh from API
  useEffect(() => {
    const loadUserData = async () => {
      let userLoadedFromStorage = false;

      try {
        // Check if user is authenticated
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }

        // Load from localStorage for immediate display first
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setLoading(false); // Set loading to false immediately after loading from localStorage
            userLoadedFromStorage = true;
          } catch {
            clearAuthData();
            setUser(null);
          }
        }

        // Try to refresh from API to ensure consistency (don't block on this)
        try {
          const apiUser = await profileApiService.getUserProfile();
          setUser(apiUser);
          localStorage.setItem('user', JSON.stringify(apiUser));
        } catch (error: unknown) {
          // If API call fails, check if it's due to user deletion
          const errorResponse = error as {
            response?: { status?: number };
            message?: string;
          };
          if (
            errorResponse?.response?.status === 401 ||
            errorResponse?.response?.status === 403
          ) {
            clearAuthData();
            setUser(null);
            setLoading(false);
          } else {
            // For other errors (network, server issues), keep the localStorage data
            // Don't set loading to false here if we already loaded from localStorage
            if (!userLoadedFromStorage) {
              setLoading(false);
            }
          }
        }
      } catch {
        clearAuthData();
        setUser(null);
        setLoading(false);
      } finally {
        // Ensure loading is false if we haven't set it yet
        if (!userLoadedFromStorage) {
          const hasUserData = localStorage.getItem('user');
          if (!hasUserData) {
            setLoading(false);
          }
        }
      }
    };

    loadUserData();

    // Set up periodic token validation (every 10 minutes - less aggressive)
    const cleanup = setupTokenValidation(10);
    return cleanup;
  }, []);

  const contextValue: UserContextType = useMemo(
    () => ({
      user,
      loading,
      updateUser,
      refreshUser,
      clearUser,
      profilePictureUrl,
      updateProfilePicture,
      clearProfilePicture,
    }),
    [
      user,
      loading,
      updateUser,
      refreshUser,
      clearUser,
      profilePictureUrl,
      updateProfilePicture,
      clearProfilePicture,
    ]
  );

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};

// Export provider separately
export { UserProvider };

/**
 * Backward-compat alias — prefer useUser() for new code.
 * All profile picture state is now part of UserContext.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useProfilePicture = () => {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useProfilePicture must be used within UserProvider');
  }
  const { profilePictureUrl, updateProfilePicture, clearProfilePicture } =
    context;
  return { profilePictureUrl, updateProfilePicture, clearProfilePicture };
};
