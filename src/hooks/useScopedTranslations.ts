import { useMemo } from 'react';
import { useLanguage } from './useLanguage';
import { translations, type TranslationCatalogue } from '../utils/i18n';

type StringPair = { en: string; ar: string };

/**
 * Returns a flat `{ key: translatedString }` object for a given catalogue scope,
 * bound to the current language. Updates automatically when language changes.
 *
 * Usage:
 *   const t = useScopedTranslations('navbar');
 *   <Typography>{t.notifications}</Typography>
 *
 * This eliminates the `getText(_n.x.en, _n.x.ar)` pattern — keys are directly
 * accessible as typed strings.
 */
export function useScopedTranslations<K extends keyof TranslationCatalogue>(
  scope: K
): Record<keyof TranslationCatalogue[K], string> {
  const { language } = useLanguage();
  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(translations[scope]).map(([k, v]) => [
          k,
          (v as StringPair)[language],
        ])
      ) as Record<keyof TranslationCatalogue[K], string>,
    [scope, language]
  );
}
