import type { UserProfile } from './user';

export interface UserContextType {
  user: UserProfile | null;
  loading: boolean;
  updateUser: (updatedUser: UserProfile) => void;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
}

export interface LanguageContextType {
  language: 'en' | 'ar';
  setLanguage: (lang: 'en' | 'ar') => void;
}
