/* eslint-disable unicorn/prefer-module */

module.export = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    node: true,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb',
  ],
  parserOptions: {
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'none',
      },
    ],
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-prototype-builtins': 'off',
    '@typescript-eslint/no-empty-function': 'off',
  },
};
