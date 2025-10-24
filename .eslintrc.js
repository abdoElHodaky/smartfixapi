module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'jest.config.js', 'dist', 'node_modules', 'examples', 'scripts'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Quality gates - treat these as errors to prevent accumulation
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'ignoreRestSiblings': true 
    }],
    '@typescript-eslint/no-non-null-assertion': 'warn', // Keep as warning for now
    
    // Auto-fixable rules
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Code quality rules
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
  },
};
