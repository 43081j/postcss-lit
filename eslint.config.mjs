import eslintjs from '@eslint/js';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';

export default defineConfig([
  {
    files: ['src/**/*.ts'],
    plugins: {
      eslint: eslintjs,
      typescript: tseslint
    },
    languageOptions: {
      parserOptions: {
        projectService: true
      },
      globals: {
        console: 'readonly',
      }
    },
    extends: [
      tseslint.configs.strict,
      eslintjs.configs.recommended
    ],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    files: ['src/test/**/*.ts'],
    languageOptions: {
      globals: {
        it: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
      }
    },
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off'
    }
  }
]);
