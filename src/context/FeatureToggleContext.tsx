import React from 'react';
import {
  useFeatureToggleStore,
  type FeatureKey,
  type FeatureState,
} from '../store/featureToggleStore';

export type { FeatureKey, FeatureState };

/** No-op provider — state lives in Zustand (useFeatureToggleStore). */
export const FeatureToggleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;

// eslint-disable-next-line react-refresh/only-export-components
export const useFeatureToggles = () => useFeatureToggleStore();
