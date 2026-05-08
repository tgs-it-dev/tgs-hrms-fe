import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Reports Core Web Vitals metrics to the provided callback.
 * Integrate with analytics services (e.g., Google Analytics, Datadog) by
 * passing a handler as `onPerfEntry`.
 *
 * Usage in main.tsx (dev only):
 *   import { reportWebVitals } from './utils/reportWebVitals';
 *   reportWebVitals(console.log);
 */
export function reportWebVitals(onPerfEntry?: (metric: Metric) => void): void {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onINP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
  }
}
