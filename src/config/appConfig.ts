/**
 * Centralised application configuration object.
 *
 * All environment variable access is consolidated here so that:
 * 1. Components never reference `import.meta.env.*` directly.
 * 2. A single file lists every env var the app depends on.
 * 3. TypeScript catches any accidental reference to a missing variable.
 *
 * `src/config/env.ts` owns strict validation (throws on missing required vars).
 * This file reads optional vars with safe fallbacks for non-critical config.
 */

export const appConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? 30_000),
  },
  auth: {
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  },
  maps: {
    googlePlacesApiKey: import.meta.env.VITE_GOOGLE_PLACES_API_KEY ?? '',
  },
} as const;
