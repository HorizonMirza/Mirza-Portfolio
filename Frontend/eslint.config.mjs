import { fixupConfigRules } from '@eslint/compat'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'

// ESLint 10 menghapus API lama yang masih dipakai eslint-plugin-react, jsx-a11y, dan import
// (bawaan eslint-config-next). fixupConfigRules dari tim ESLint menambal API tersebut.
// Hapus pembungkus ini bila plugin-plugin itu sudah mendukung ESLint 10.
const eslintConfig = defineConfig([
  ...fixupConfigRules([...nextVitals, ...nextTs]),
  prettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/generated/**',
    'playwright-report/**',
    'test-results/**',
  ]),
])

export default eslintConfig
