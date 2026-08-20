import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },

  js.configs.recommended,

  {
    // Browser code. `fullpage_api` is assigned onto window by fullpage.js at
    // runtime rather than exported, so it has to be declared here.
    files: ['src/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, fullpage_api: 'readonly' }
    }
  },

  {
    // Build tooling, config and tests all run in Node.
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', '*.config.js', '*.config.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    }
  }
]
