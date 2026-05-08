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

const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLang] = useState<'en' | 'ar'>(() => {
    const saved = localStorage.getItem(LANG_KEY) as 'en' | 'ar' | null;
    const initial = saved === 'ar' ? 'ar' : 'en';
    // Set synchronously so the first paint already has the correct dir/lang —
    // avoids a flash of incorrect layout on refresh with Arabic selected.
    applyLang(initial);
    return initial;
  });

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
