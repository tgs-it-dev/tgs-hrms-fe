import { useCallback } from 'react';
import { useLanguage } from './useLanguage';

/**
 * Returns a `getText(en, ar)` function bound to the current language.
 *
 * Usage:
 *   const getText = useGetText();
 *   <Typography>{getText('Save', 'حفظ')}</Typography>
 *
 * This is the canonical way for components to perform inline translations
 * without repeating the `language === 'ar' ? ar : en` pattern everywhere.
 */
export function useGetText(): (en: string, ar: string) => string {
  const { language } = useLanguage();
  return useCallback(
    (en: string, ar: string) => (language === 'ar' ? ar : en),
    [language]
  );
}
