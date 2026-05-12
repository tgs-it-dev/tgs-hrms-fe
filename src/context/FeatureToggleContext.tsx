import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import workflowApi from '../api/workflowApi';

type FeatureKey =
  | 'attendance'
  | 'performance'
  | 'recruitment'
  | 'announcements'
  | 'projects'
  | 'accounts'
  | 'app'
  | 'leaveAnalytics'
  | 'leave_workflow_enabled'
  | 'wfh_workflow_enabled'
  | 'overtime_workflow_enabled';

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
  leave_workflow_enabled: false,
  wfh_workflow_enabled: false,
  overtime_workflow_enabled: false,
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
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FeatureState>;
        setFeatures(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore invalid storage
    }

    // Fetch server-side workflow flag
    const fetchWorkflowFlag = async () => {
      try {
        const response = await workflowApi.getFeatureFlag();
        setFeatures(prev => ({
          ...prev,
          // workflow: response.wfh_workflow_enabled,
          leave_workflow_enabled: response.leave_workflow_enabled,
          wfh_workflow_enabled: response.wfh_workflow_enabled,
          overtime_workflow_enabled: response.overtime_workflow_enabled,
        }));
      } catch (error) {
        console.error('Failed to fetch workflow feature flag:', error);
      }
    };
    fetchWorkflowFlag();
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

  const value: FeatureToggleContextValue = useMemo(
    () => ({ features, isFeatureEnabled, setFeatureEnabled, resetToDefaults }),
    [features, isFeatureEnabled, setFeatureEnabled, resetToDefaults]
  );

  return (
    <FeatureToggleContext.Provider value={value}>
      {children}
    </FeatureToggleContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
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
