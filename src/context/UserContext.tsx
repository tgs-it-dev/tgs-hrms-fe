/**
 * UserContext is kept for backward-compat exports only.
 * All state is now managed by useUserStore (src/store/userStore.ts).
 * Consumers should import useUser() from src/hooks/useUser or
 * useUserStore from src/store directly.
 */
import type { ReactNode } from 'react';
import { useUserStore } from '../store/userStore';

/** @deprecated Use useUser() from src/hooks/useUser instead. */
// eslint-disable-next-line react-refresh/only-export-components
export const useProfilePicture = () => {
  const { profilePictureUrl, updateProfilePicture, clearProfilePicture } =
    useUserStore();
  return { profilePictureUrl, updateProfilePicture, clearProfilePicture };
};

/**
 * No-op provider kept so existing JSX (<UserProvider>) compiles without changes.
 * The real bootstrap happens in AppBootstrapper (src/providers/AppProviders.tsx).
 */
export const UserProvider = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
