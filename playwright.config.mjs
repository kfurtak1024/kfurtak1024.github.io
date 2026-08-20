import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 8123);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.mjs',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // The html reporter is what actually writes playwright-report/, which CI
  // uploads on failure. Without it that upload finds nothing and a red build
  // gives you no diagnostics at all.
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry'
  },
  // Firefox earns its place here: the one production bug this suite was built
  // around (a gradient that left text invisible) reproduced only in Firefox and
  // was completely invisible to Chromium.
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } }
  ],
  // `vite preview` serves the built dist/ from the site root, the way GitHub
  // Pages does, so root-absolute asset paths behave exactly as in production.
  // Tests therefore always run against a real build, never the dev server.
  webServer: {
    command: `npm run preview -- --port=${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Never reuse a server that happens to be on the port: it would very likely
    // be serving an older dist/ than the one just built, so the suite would
    // silently test stale output. Combined with --strictPort, a leftover
    // `npm run preview` now fails the run loudly instead of corrupting it.
    reuseExistingServer: false
  }
});
