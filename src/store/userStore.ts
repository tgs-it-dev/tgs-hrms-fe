import { create } from 'zustand';
import { profileApiService } from '../api/profileApi';
import { clearAuthData, setupTokenValidation } from '../utils/authValidation';
import type { UserProfile } from '../types/user';

interface UserState {
  user: UserProfile | null;
  loading: boolean;
  profilePictureUrl: string | null;
  updateUser: (updatedUser: UserProfile) => void;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  updateProfilePicture: (url: string | null) => void;
  clearProfilePicture: () => void;
  /** Called once on app mount to load user from localStorage and refresh from API. */
  bootstrap: () => () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  loading: true,
  profilePictureUrl: null,

  updateUser: updatedUser => {
    set({ user: updatedUser, loading: false });
    localStorage.setItem('user', JSON.stringify(updatedUser));
  },

  refreshUser: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      set({ loading: true });
      const profileData = await profileApiService.getUserProfile();
      set({ user: profileData, loading: false });
      localStorage.setItem('user', JSON.stringify(profileData));
    } catch {
      set({ loading: false });
    }
  },

  clearUser: () => {
    set({ user: null, profilePictureUrl: null });
    clearAuthData();
  },

  updateProfilePicture: url => set({ profilePictureUrl: url }),
  clearProfilePicture: () => set({ profilePictureUrl: null }),

  bootstrap: () => {
    const load = async () => {
      let loadedFromStorage = false;
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ loading: false });
          return;
        }

        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            set({ user: JSON.parse(stored), loading: false });
            loadedFromStorage = true;
          } catch {
            clearAuthData();
            set({ user: null });
          }
        }

        try {
          const apiUser = await profileApiService.getUserProfile();
          set({ user: apiUser });
          localStorage.setItem('user', JSON.stringify(apiUser));
        } catch (error: unknown) {
          const status = (error as { response?: { status?: number } })?.response
            ?.status;
          if (status === 401 || status === 403) {
            clearAuthData();
            set({ user: null, loading: false });
          } else if (!loadedFromStorage) {
            set({ loading: false });
          }
        }
      } catch {
        clearAuthData();
        set({ user: null, loading: false });
      } finally {
        if (!loadedFromStorage && !get().user) {
          set({ loading: false });
        }
      }
    };

    load();
    return setupTokenValidation(10);
  },
}));
