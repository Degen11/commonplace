import reactHooks from 'eslint-plugin-react-hooks';

export default [
  reactHooks.configs.flat['recommended-latest'],
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // Serverless functions — plain Node, no React. Core correctness rules only
  // (no @eslint/js dependency), with the runtime globals the endpoints use.
  {
    files: ['api/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        Headers: 'readonly',
        AbortSignal: 'readonly',
        AbortController: 'readonly',
        Buffer: 'readonly',
        globalThis: 'readonly',
        crypto: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
