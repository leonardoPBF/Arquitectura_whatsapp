module.exports = {
  env: { browser: true, node: true, es2021: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint'],
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    'react/react-in-jsx-scope': 'off'
  },
  settings: {
    react: { version: 'detect' }
  }
};
