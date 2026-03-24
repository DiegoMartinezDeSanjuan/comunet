import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const legacyAnyFiles = [
  'src/app/**/communities/**/*.tsx',
  'src/app/**/finance/**/*.tsx',
  'src/app/**/owners/**/*.tsx',
  'src/app/**/tenants/**/*.tsx',
  'src/components/ui/use-toast.ts',
  'src/modules/audit/server/services.ts',
  'src/modules/communities/server/community-actions.ts',
  'src/modules/contacts/server/contact-actions.ts',
  'src/modules/finances/server/actions.ts',
  'src/modules/finances/server/budget-repository.ts',
  'src/modules/units/server/unit-actions.ts',
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'fix-dynamic.js',
  ]),
  {
    files: legacyAnyFiles,
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])

export default eslintConfig
