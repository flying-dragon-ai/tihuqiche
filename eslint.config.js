import js from '@eslint/js';
import globals from 'globals';
import vue from 'eslint-plugin-vue';
import unusedImports from 'eslint-plugin-unused-imports';

const browserGlobals = {
  ...globals.browser,
  __pelicanBoot: 'readonly',
};

const unusedRules = {
  'no-unused-vars': 'off',
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': [
    'error',
    { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
  ],
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'vendor/**',
      'public/**',
      'docs/**',
      'test-results/**',
      'src/share-qr.js',
      'src/outfit-thumbnails.js',
    ],
  },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['src/**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: browserGlobals,
    },
    plugins: { 'unused-imports': unusedImports },
    rules: {
      ...unusedRules,
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/no-unused-components': 'error',
    },
  },
  {
    files: ['scripts/**/*.mjs', 'vite.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: { 'unused-imports': unusedImports },
    rules: unusedRules,
  },
  {
    files: ['tests/**/*.{js,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    plugins: { 'unused-imports': unusedImports },
    rules: {
      ...unusedRules,
      'no-undef': 'off',
    },
  },
];
