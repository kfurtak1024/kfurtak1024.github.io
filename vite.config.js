import { defineConfig } from 'vite'

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
