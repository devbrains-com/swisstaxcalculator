require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-typescript',
    '@nuxtjs/eslint-config-typescript',
    'plugin:jsonc/recommended-with-jsonc',
    'prettier'
  ],
  plugins: ['sort-class-members'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'vue/multi-word-component-names': 'off',
    'jsonc/sort-keys': 'error',
    semi: ['error', 'always'],
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc' /* sort in ascending order. Options: ['ignore', 'asc', 'desc'] */,
          caseInsensitive: true /* ignore case. Options: [true, false] */
        },
        'newlines-between': 'never',
        groups: ['external', 'builtin', 'internal', 'sibling', 'parent', 'index']
      }
    ],
    'sort-class-members/sort-class-members': [
      2,
      {
        order: [
          '[static-properties]',
          '[static-methods]',
          '[properties]',
          '[conventional-private-properties]',
          'constructor',
          '[methods]',
          '[conventional-private-methods]'
        ],
        accessorPairPositioning: 'getThenSet'
      }
    ]
  }
};
