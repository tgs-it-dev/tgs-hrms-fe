import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './providers';
import App from './App';
import './i18n'; // initialise react-i18next before App renders

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- root element is guaranteed by index.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);

// Dynamic import so web-vitals is tree-shaken from the production bundle entirely.
// PerformanceObserver listeners are only registered in development.
if (import.meta.env.DEV) {
  void import('./utils/reportWebVitals').then(({ reportWebVitals }) =>
    reportWebVitals(console.log)
  );
}
