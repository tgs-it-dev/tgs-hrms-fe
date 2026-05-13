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

/**
 * Feature flags are authoritative from VITE_* env vars.
 * localStorage overrides only work in DEV mode.
 *
 * In production the `defaultFeatures` object below is the sole source of truth.
 * Users cannot self-enable disabled features by editing localStorage in production.
 */
const defaultFeatures: FeatureState = {
  attendance: true,
  performance: true,
  recruitment: true,
  announcements: true,
  projects: true,
  accounts: true,
  app: true,
  leaveAnalytics: true,
  leave_workflow_enabled: true,
  wfh_workflow_enabled: true,
  overtime_workflow_enabled: true,
};

/**
 * Read a single feature flag.
 * - VITE_* env vars are checked first (authoritative in all environments).
 * - localStorage overrides are allowed only in DEV mode for local testing.
 */
function getFlag(key: FeatureKey, defaultValue: boolean): boolean {
  // Check VITE_ env var override (format: VITE_FEATURE_<KEY> = 'true'|'false')
  const envKey = `VITE_FEATURE_${key.toUpperCase()}`;
  const envVal = (import.meta.env as Record<string, string | undefined>)[
    envKey
  ];
  if (envVal !== undefined) return envVal === 'true';

  // Only allow localStorage overrides in development
  if (import.meta.env.DEV) {
    try {
      const override = localStorage.getItem(`flag_${key}`);
      if (override !== null) return override === 'true';
    } catch {
      // ignore
    }
  }

  return defaultValue;
}

/** Compute initial state from env/localStorage at mount time. */
function buildInitialFeatures(): FeatureState {
  return (Object.keys(defaultFeatures) as FeatureKey[]).reduce<FeatureState>(
    (acc, key) => {
      acc[key] = getFlag(key, defaultFeatures[key]);
      return acc;
    },
    { ...defaultFeatures }
  );
}

const FeatureToggleContext = createContext<FeatureToggleContextValue | null>(
  null
);

export const FeatureToggleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [features, setFeatures] = useState<FeatureState>(buildInitialFeatures);

  // In DEV mode, also merge any persisted toggles from the UI toggle panel.
  // This allows devs to flip flags via the FeatureManagementPage without losing
  // them across page reloads. In production this block is skipped entirely.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<FeatureState>;
        setFeatures(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore invalid storage
    }


  }, []);

  useEffect(() => {
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
  }, [])

  // Persist feature toggles to localStorage only in DEV mode.
  // In production, flags come from VITE_* env vars and are never user-editable.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
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
