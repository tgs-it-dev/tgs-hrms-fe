import { useLanguage } from './useLanguage';

/**
 * Returns a `getText(en, ar)` function bound to the current language.
 * Prefer `useScopedTranslations` for component-level translations.
 * Use this hook only for one-off strings not in the catalogue.
 */
export function useGetText(): (en: string, ar: string) => string {
  const { language } = useLanguage();
  return (en: string, ar: string) => (language === 'ar' ? ar : en);
}
