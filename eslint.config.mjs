import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const scopedNextVitals = nextVitals.map((config, index) =>
  index === 0
    ? {
        ...config,
        files: ['**/*.{js,jsx,mjs,tsx}'],
      }
    : config,
)

export default defineConfig([
  ...scopedNextVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: false,
          vars: 'all',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  globalIgnores([
    '.next/**',
    '_examples_/**',
    'playwright-report/**',
    'test-results/**',
    '*.config.*',
    'eslint.config.mjs',
  ]),
])
