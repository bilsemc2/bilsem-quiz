import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      '.playwright',
      'playwright-report',
      'test-results',
      'next-app-skeleton/**',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '**/app/**'],
              message: 'Shared katmani app katmanindan import etmemelidir.'
            },
            {
              group: ['@/features/*', '**/features/**'],
              message: 'Shared katmani feature katmanindan import etmemelidir.'
            },
            {
              group: ['@/server/*', '**/server/**'],
              message: 'Shared katmani server katmanindan import etmemelidir.'
            },
            {
              group: ['@/pages/*', '**/pages/**', '@/components/*', '**/components/**'],
              message: 'Shared katmani UI katmanindan import etmemelidir.'
            },
            {
              group: ['@/contexts/*', '**/contexts/**', '@/hooks/*', '**/hooks/**', '@/routes/*', '**/routes/**'],
              message: 'Shared katmani orchestration katmanlarindan import etmemelidir.'
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/server/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/pages/*', '**/pages/**'],
              message: 'Features/server katmani pages katmanindan import etmemelidir.'
            },
            {
              group: ['@/components/*', '**/components/**'],
              message: 'Features/server katmani UI components katmanindan import etmemelidir.'
            },
            {
              group: ['@/contexts/*', '**/contexts/**', '@/hooks/*', '**/hooks/**', '@/routes/*', '**/routes/**'],
              message: 'Features/server katmani orchestration katmanlarindan import etmemelidir.'
            },
            {
              group: ['@/app/*', '**/app/**'],
              message: 'Features/server katmani app katmanindan import etmemelidir.'
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/pages/**/*.{ts,tsx}',
      'src/components/**/*.{ts,tsx}',
      'src/contexts/**/*.{ts,tsx}',
      'src/hooks/**/*.{ts,tsx}',
      'src/routes/**/*.{ts,tsx}',
      'src/services/**/*.{ts,tsx}',
      'src/utils/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/supabase', '@/lib/supabase.ts', '**/lib/supabase', '**/lib/supabase.ts'],
              message: 'UI/orchestration katmani Supabase clientini dogrudan import etmemelidir. Repository veya use case katmanini kullanin.'
            },
          ],
        },
      ],
    },
  },
)
