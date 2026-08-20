import { defineConfig } from 'vite'

// --- Environment normalisation -------------------------------------------
// All of this has to run before Vite loads any env, hence module scope.

// GitHub Actions substitutes a missing, renamed or unset secret with an EMPTY
// STRING rather than leaving the variable unset -- and an empty VITE_* value in
// process.env takes precedence over .env, so the dev fallback never applies and
// the build silently ships an empty email. Treat empty as absent, and trim the
// rest: a secret pasted into the GitHub UI very easily carries a trailing
// newline, which would otherwise end up inside the generated string literal.
for (const key of Object.keys(process.env)) {
  if (!key.startsWith('VITE_')) continue
  const trimmed = process.env[key].trim()
  if (trimmed === '') delete process.env[key]
  else process.env[key] = trimmed
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// The secret is named ..._BASE64, but the previous build injected it with sed
// into a `try { atob(x) } catch {} finally { show(x) }`, which displayed the
// value whether or not it was actually base64. So the stored secret may be
// either form. Accept both and always emit canonical base64, so the address
// stays obfuscated in the bundle and the page has a single case to handle.
const rawEmail = process.env.VITE_SITE_EMAIL_BASE64
if (rawEmail) {
  const decoded = Buffer.from(rawEmail, 'base64').toString('utf8')
  if (isEmail(decoded)) {
    process.env.VITE_SITE_EMAIL_BASE64 =
      Buffer.from(decoded, 'utf8').toString('base64')
  } else if (isEmail(rawEmail)) {
    process.env.VITE_SITE_EMAIL_BASE64 =
      Buffer.from(rawEmail, 'utf8').toString('base64')
  } else {
    // Deliberately does not echo the value -- it is a secret in CI.
    throw new Error(
      'VITE_SITE_EMAIL_BASE64 is neither base64 of an email address nor a ' +
      `plain email address (got ${rawEmail.length} characters). ` +
      'Check the MY_EMAIL_BASE64 repository secret.'
    )
  }
}

export default defineConfig({
  // Sources live in src/, but the config and .env stay at the project root.
  root: 'src',
  envDir: '..',
  // This is a plain multi-page static site, not an SPA. Without this, the dev
  // and preview servers rewrite any unknown path to index.html with a 200,
  // which hides missing assets: a broken <img> would quietly serve HTML
  // instead of 404ing, and the smoke tests would pass on a broken build.
  // GitHub Pages returns a real 404, so this keeps local behaviour faithful.
  appType: 'mpa',
  // Copied to the site root verbatim and never hashed: CNAME, the favicons,
  // and the images referenced by og:image and site.webmanifest, all of which
  // need stable public URLs.
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    // Without this, esbuild "minifies" `@media (max-width: 991px)` into Level 4
    // range syntax (`@media (width <= 991px)`), which browsers older than
    // Chrome 104 / Firefox 102 / Safari 16.4 drop wholesale -- taking the
    // mobile nav with it. Targeting older engines also keeps the vendor
    // prefixes those browsers need (e.g. -webkit-background-clip).
    cssTarget: ['chrome87', 'firefox78', 'safari14', 'edge88']
  }
})
