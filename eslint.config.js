// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  [
    { ignores: ['dist', 'node_modules', 'build', 'coverage'] },
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
        reactHooks.configs['recommended-latest'],
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        ecmaVersion: 'latest',
        globals: globals.browser,
        parserOptions: {
          ecmaFeatures: { jsx: true },
        },
      },
      rules: {
        // ── TypeScript ────────────────────────────────────────────────
        // Unused vars: allow underscore-prefixed names to be ignored
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        // Explicit any is always a red flag
        '@typescript-eslint/no-explicit-any': 'error',
        // Non-null assertions hide runtime crashes; flag them
        '@typescript-eslint/no-non-null-assertion': 'warn',
        // Enforce `import type` for type-only imports (helps tree-shaking)
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        // Prevent type-import side-effects
        '@typescript-eslint/no-import-type-side-effects': 'error',
        // ── General JS best practices ─────────────────────────────────
        // Require === / !== everywhere (except null checks)
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        // Ban var; always use const/let
        'no-var': 'error',
        // Warn on console.log left in production code; allow warn/error
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        // Disallow debugger statements
        'no-debugger': 'error',
      },
    },
  ],
  storybook.configs['flat/recommended']
);
