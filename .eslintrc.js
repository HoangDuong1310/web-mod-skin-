module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'prettier',
  ],
  rules: {
    'prefer-const': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'react/no-unescaped-entities': 'warn',
    'no-inner-declarations': 'warn',
    'no-constant-condition': 'warn',
    'no-redeclare': 'warn',
  },
}

