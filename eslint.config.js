const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

const angularStrictRules = {
  '@angular-eslint/no-empty-lifecycle-method': 'error',
  '@angular-eslint/use-lifecycle-interface': 'error',
  '@angular-eslint/no-output-on-prefix': 'error',
  '@angular-eslint/prefer-on-push-component-change-detection': 'error',
  '@angular-eslint/no-input-rename': 'error',
  '@angular-eslint/no-output-rename': 'error',
  '@angular-eslint/use-pipe-transform-interface': 'error',
  '@angular-eslint/no-conflicting-lifecycle': 'error',
  '@angular-eslint/contextual-lifecycle': 'error',
};

const typescriptStrictRules = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
  '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true, allowTypedFunctionExpressions: true }],
  '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
  '@typescript-eslint/prefer-readonly': 'error',
  '@typescript-eslint/naming-convention': [
    'error',
    { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
    { selector: 'typeAlias', format: ['PascalCase'], prefix: ['T'] },
    { selector: 'enum', format: ['PascalCase'], prefix: ['E'] },
    { selector: 'enumMember', format: ['UPPER_CASE'] },
  ],
};

const generalStrictRules = {
  'no-console': ['error'],
  'eqeqeq': ['error', 'always'],
  'complexity': ['error', { max: 10 }],
  'max-depth': ['error', { max: 3 }],
};

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      ...angularStrictRules,
      ...typescriptStrictRules,
      ...generalStrictRules,
    },
  },
  {
    files: ['src/ui-kit/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'uiKit', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'ui-kit', style: 'kebab-case' }],
      ...angularStrictRules,
      ...typescriptStrictRules,
      ...generalStrictRules,
    },
  },
  {
    files: ['**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
