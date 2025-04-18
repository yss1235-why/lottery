// File: .eslintrc.js
module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react/no-unescaped-entities': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_" 
    }]
  }
};
