import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { LanguageContextType } from '../types/context';

// eslint-disable-next-line react-refresh/only-export-components
export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const LANG_KEY = 'lang';

function applyLang(lang: 'en' | 'ar') {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

// Run once at module load — before the React tree mounts — so the correct
// dir/lang is already set on the first paint with no flash.
// Wrapped in try/catch to guard against SSR/test environments where
// localStorage may not be available.
const _initialLang = ((): 'en' | 'ar' => {
  try {
    const saved = localStorage.getItem(LANG_KEY) as 'en' | 'ar' | null;
    const lang = saved === 'ar' ? 'ar' : 'en';
    applyLang(lang);
    return lang;
  } catch {
    return 'en';
  }
})();

const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<'en' | 'ar'>(_initialLang);

  useEffect(() => {
    applyLang(language);
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  const setLanguage = useCallback((lang: 'en' | 'ar') => {
    setLang(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Export provider separately
export { LanguageProvider };
