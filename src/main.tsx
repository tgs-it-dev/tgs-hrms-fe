import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- root element is guaranteed by index.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Dynamic import so web-vitals is tree-shaken from the production bundle entirely.
// PerformanceObserver listeners are only registered in development.
if (import.meta.env.DEV) {
  void import('./utils/reportWebVitals').then(({ reportWebVitals }) =>
    reportWebVitals(console.log)
  );
}
