import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FeatureKey =
  | 'attendance'
  | 'performance'
  | 'recruitment'
  | 'announcements'
  | 'projects'
  | 'accounts'
  | 'app'
  | 'leaveAnalytics';

export type FeatureState = Record<FeatureKey, boolean>;

const defaultFeatures: FeatureState = {
  attendance: true,
  performance: true,
  recruitment: true,
  announcements: true,
  projects: true,
  accounts: true,
  app: true,
  leaveAnalytics: true,
};

interface FeatureToggleStoreState {
  features: FeatureState;
  isFeatureEnabled: (key: FeatureKey) => boolean;
  setFeatureEnabled: (key: FeatureKey, enabled: boolean) => void;
  resetToDefaults: () => void;
}

export const useFeatureToggleStore = create<FeatureToggleStoreState>()(
  persist(
    (set, get) => ({
      features: defaultFeatures,
      isFeatureEnabled: (key: FeatureKey) => get().features[key],
      setFeatureEnabled: (key: FeatureKey, enabled: boolean) =>
        set(state => ({ features: { ...state.features, [key]: enabled } })),
      resetToDefaults: () => set({ features: defaultFeatures }),
    }),
    { name: 'feature-toggles' }
  )
);
