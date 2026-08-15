module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist',
    'node_modules',
    'data',
    'tmp',
    'docs',
    '.firebase',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  plugins: ['react-refresh'],
  rules: {
    // Il progetto non usa PropTypes (nessun file li definisce)
    'react/prop-types': 'off',
    // Il testo dell'interfaccia è in italiano: gli apostrofi sono frequenti
    'react/no-unescaped-entities': 'off',
    // I context esportano hook e provider insieme per design
    'react-refresh/only-export-components': 'off',
    // I loop `while (true)` per i tiri di dado del gioco sono intenzionali
    'no-constant-condition': ['error', { checkLoops: false }],
    // Variabili `_prefisse` (es. `_id` in rest-destructuring) sono intenzionalmente inutilizzate
    'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Script Node.js (ESM) e file di configurazione Vite
      files: ['scripts/**/*.js', 'vite.config.js'],
      env: {
        node: true,
      },
    },
    {
      // Backend Cloud Functions (CommonJS)
      files: ['functions/**/*.js'],
      env: {
        node: true,
        commonjs: true,
      },
      parserOptions: {
        sourceType: 'commonjs',
      },
    },
  ],
};
