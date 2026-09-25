import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },

  js.configs.recommended,

  {
    files: ['src/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser
    }
  },

  {
    // Build tooling, config and tests all run in Node.
    files: ['scripts/**/*.mjs', '*.config.js', '*.config.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    }
  },

  {
    // Drives a headless browser, so the bodies of page.evaluate() run in the
    // page rather than in Node -- the same split the test files have. Scoped to
    // this one file so that plain Node scripts like verify.mjs keep failing on
    // a stray `document`.
    files: ['scripts/make-og-image.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser }
    }
  },

  {
    // Test files run in Node, but the bodies of page.evaluate() run in the
    // browser, so both sets of globals are legitimately in scope.
    files: ['tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser }
    }
  }
]
