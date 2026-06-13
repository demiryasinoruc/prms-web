import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Alt çizgi öneki = bilinçli kullanılmayan parametre (stub/imza koruma)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // react-hooks v6+ ile gelen React Compiler kuralları: bilinçli desenleri
      // (dialog reset key, controlled wizard state vb.) da işaretliyor. Gate'i
      // kırmasınlar diye warn; yeni kod yazarken yine görünür kalırlar.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  {
    // Bileşen + sabit/yardımcı ihracını birlikte yapan altyapı dosyaları:
    // shadcn ui varyantları, router guard'ları, test yardımcıları.
    // HMR (fast refresh) kuralı bu dosyalarda yapısal olarak anlamsız.
    files: ['src/components/ui/**', 'src/router/**', 'src/test/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
