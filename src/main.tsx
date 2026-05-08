import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { reportWebVitals } from './utils/reportWebVitals';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- root element is guaranteed by index.html
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Report Core Web Vitals in development to aid performance debugging.
// Replace `console.log` with your analytics ingest function in production.
if (import.meta.env.DEV) {
  reportWebVitals(console.log);
}
