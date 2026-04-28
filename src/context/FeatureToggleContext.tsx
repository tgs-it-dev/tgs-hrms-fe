import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type FeatureKey =
  | 'attendance'
  | 'performance'
  | 'recruitment'
  | 'announcements'
  | 'projects'
  | 'accounts'
  | 'app'
  | 'leaveAnalytics';

type FeatureState = Record<FeatureKey, boolean>;

interface FeatureToggleContextValue {
  features: FeatureState;
  isFeatureEnabled: (key: FeatureKey) => boolean;
  setFeatureEnabled: (key: FeatureKey, enabled: boolean) => void;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'feature-toggles';

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

const FeatureToggleContext = createContext<FeatureToggleContextValue | null>(
  null
);

export const FeatureToggleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [features, setFeatures] = useState<FeatureState>(defaultFeatures);

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Partial<FeatureState>;
      setFeatures(prev => ({ ...prev, ...parsed }));
    } catch {
      // Ignore invalid storage
    }
  }, []);

  // Persist to localStorage whenever features change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
    } catch {
      // Ignore write errors
    }
  }, [features]);

  const isFeatureEnabled = useCallback(
    (key: FeatureKey) => {
      return features[key];
    },
    [features]
  );

  const setFeatureEnabled = useCallback((key: FeatureKey, enabled: boolean) => {
    setFeatures(prev => ({
      ...prev,
      [key]: enabled,
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setFeatures(defaultFeatures);
  }, []);

  const value: FeatureToggleContextValue = {
    features,
    isFeatureEnabled,
    setFeatureEnabled,
    resetToDefaults,
  };

  return (
    <FeatureToggleContext.Provider value={value}>
      {children}
    </FeatureToggleContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- hook must be co-located with its context provider
export const useFeatureToggles = (): FeatureToggleContextValue => {
  const ctx = useContext(FeatureToggleContext);
  if (!ctx) {
    throw new Error(
      'useFeatureToggles must be used within a FeatureToggleProvider'
    );
  }
  return ctx;
};

export type { FeatureKey, FeatureState };

