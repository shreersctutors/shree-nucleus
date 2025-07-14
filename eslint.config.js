import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import importPlugin from 'eslint-plugin-import'
import unusedImportsPlugin from 'eslint-plugin-unused-imports'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.eslint.json'
      },
      globals: {
        // Node.js-specific global variables
        process: true,
        module: true,
        require: true,
        exports: true,
        __dirname: true,
        __filename: true,
        global: true,
        Buffer: true,
        // ES6 global variables
        Promise: true
      }
    },
    plugins: {
      import: importPlugin,
      '@typescript-eslint': tseslint.plugin,
      'unused-imports': unusedImportsPlugin
    },
    rules: {
      indent: ['error', 'tab'],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { allowTemplateLiterals: true }],
      semi: ['error', 'never'],
      'import/no-unused-modules': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  prettierConfig
)
