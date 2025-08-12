module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/**/*', 'node_modules/**/*'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off', // Disabled for now
    '@typescript-eslint/no-unused-vars': 'off', // Disabled for now
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-console': 'off', // Disabled for now
    'no-debugger': 'error',
    'no-duplicate-imports': 'warn',
    'no-unused-expressions': 'warn',
    'prefer-template': 'warn',
    'template-curly-spacing': 'off',
    'object-curly-spacing': 'off',
    'array-bracket-spacing': 'off',
    'comma-dangle': 'off',
    'semi': 'off',
    'quotes': 'off',
    'indent': 'off',
    'max-len': 'off',
    'no-unused-vars': 'off',
    'no-useless-escape': 'off',
    // Security rules - these are the important ones
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
  },
};
