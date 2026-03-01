module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
  ],
  plugins: ["react", "react-hooks"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: "detect" },
  },
  rules: {
    // React hooks
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    // Disable noisy React rules that don't apply with JSX transform
    "react/prop-types": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",

    // Quality
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-console": "warn",
    "no-debugger": "error",

    // Style (keep loose — Prettier handles formatting)
    "no-var": "error",
    "prefer-const": "warn",

    // Relax for existing patterns
    "no-empty": ["warn", { allowEmptyCatch: true }],
  },
  ignorePatterns: ["dist/", "node_modules/", "api/"],
};
