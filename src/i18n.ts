/**
 * i18next configuration for TGS HRMS.
 *
 * This module initialises i18next with the LanguageDetector so that it reads the
 * current language from the 'lang' localStorage key (the same key used by
 * LanguageContext). Translation JSON files live in public/locales/<lang>/<ns>.json
 * and are loaded at runtime, which keeps the initial JS bundle lean.
 *
 * The existing `useScopedTranslations` hook continues to work unchanged — it reads
 * from the in-memory `translations` catalogue in src/utils/i18n.ts. This module is
 * a forward-compatible foundation so that future work can migrate namespaces to
 * JSON files without touching every consumer at once.
 *
 * When `LanguageContext.setLanguage` is called it also invokes `i18n.changeLanguage`
 * (see LanguageContext.tsx), keeping both systems in sync.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    defaultNS: 'common',
    ns: ['common', 'navbar', 'sidebar'],
    detection: {
      // Use the same localStorage key as LanguageContext so they stay in sync
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    // Translation JSON files are served from public/locales/<lng>/<ns>.json.
    // The backend property tells i18next where to load them from.
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // resources is left empty so i18next-http-backend (or fetch) loads the JSON files.
    // If i18next-http-backend is not installed, add inline resources here as a fallback.
    resources: {},
  })
  .catch((err: unknown) => {
    // Non-fatal — the app falls back to useScopedTranslations from src/utils/i18n.ts
    console.warn('[i18n] Initialisation warning:', err);
  });

export default i18n;
