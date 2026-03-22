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
];
