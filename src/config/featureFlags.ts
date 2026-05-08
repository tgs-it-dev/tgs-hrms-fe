/**
 * Feature flags driven by environment variables.
 * Add new flags here and declare the corresponding VITE_* variable in .env files.
 *
 * Usage:
 *   import { featureFlags } from '@/config/featureFlags';
 *   if (featureFlags.enableAnalytics) { ... }
 */
export const featureFlags = {
  /** Enable third-party analytics tracking (e.g. GA4, Mixpanel). */
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',

  /** Enable experimental geofencing features. */
  enableGeofencing: import.meta.env.VITE_ENABLE_GEOFENCING === 'true',

  /** Enable in-app notification push. */
  enablePushNotifications:
    import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true',

  /** Use local mock data for the HR Policies feature instead of live API calls. */
  useMockPolicies: import.meta.env.VITE_USE_MOCK_POLICIES === 'true',
} as const;

export type FeatureFlags = typeof featureFlags;
