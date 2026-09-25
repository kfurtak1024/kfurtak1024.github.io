<p align="center">
  <img src="public/images/avatar.png" width="96" height="96" alt="">
</p>

<h1 align="center">krzysztoffurtak.dev</h1>

<p align="center"><em>My business card, and the home of my projects.</em></p>

<!-- Each badge's <a> and <img> stay on one line: whitespace inside the link is
     rendered as an underlined space, which shows up as a stray underscore. -->
<p align="center">
  <a href="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/build.yml"><img alt="Build" src="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/build.yml/badge.svg"></a>
  <a href="https://krzysztoffurtak.dev"><img alt="Website" src="https://img.shields.io/website?url=https%3A%2F%2Fkrzysztoffurtak.dev&label=site"></a>
  <a href="https://validator.nu/?doc=https%3A%2F%2Fkrzysztoffurtak.dev"><img alt="W3C validation" src="https://img.shields.io/w3c-validation/html?targetUrl=https%3A%2F%2Fkrzysztoffurtak.dev"></a>
</p>

<p align="center">
  <a href="https://krzysztoffurtak.dev"><strong>Visit the site →</strong></a>
</p>

Source for my personal homepage: a single-page static site — three sections, no framework — built with Vite and deployed to GitHub Pages.

## :ship: Deployment

Deployment is fully automated, and gated.

Every push and pull request runs the [Build](https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/build.yml) workflow, which builds the site, lints it, verifies the output and runs the browser test suite. **Only a push to `main` deploys** — pull requests build and test but never publish. `main` is protected, so in practice everything reaches the site through a pull request that passed the `Build & verify` check.

The deploy job publishes the exact artifact the checks ran against, via GitHub's own Pages deployment, so what ships is byte-for-byte what was tested.

> [!WARNING]
> The branch ruleset requires a status check named **`Build & verify`**. Renaming that job in `build.yml` does not fail anything — it silently removes the requirement, and `main` stops being protected.

## :rocket: Development

```
git clone https://github.com/kfurtak1024/kfurtak1024.github.io.git
cd kfurtak1024.github.io
npm ci
```

The supported Node version is declared as `engines` in [`package.json`](package.json) and enforced by [`.npmrc`](.npmrc), so `npm ci` fails fast on an unsupported one. CI builds on Node 24.

### Project layout

| Path | What's there |
| --- | --- |
| [`src/`](src) | The Vite root: `index.html`, `404.html` (built as a second page so it shares the site's fonts), `css/` and `js/` |
| [`public/`](public) | Copied verbatim with stable URLs: `CNAME`, favicons, the web manifest, `robots.txt`, `sitemap.xml` and images |
| [`scripts/`](scripts) | `verify.mjs` and the artwork generators; [`scripts/assets/`](scripts/assets) holds their source images |
| [`tests/`](tests) | The Playwright smoke suite |

### Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reloading |
| `npm run build` | Build the deployable site into `./dist/` |
| `npm run preview` | Serve the built `./dist/` locally (unlike GitHub Pages, a missing URL gets a bare 404 rather than `404.html` — open `/404.html` to see it) |
| `npm run verify` | Assert the build is complete and every local reference resolves |
| `npm test` | Playwright smoke tests — Chromium, Firefox and a mobile viewport |
| `npm run lint` | ESLint, Stylelint and html-validate |

Run `npm run build` before `npm test` or `npm run lint` — both inspect the built output rather than the sources.

### Generated artwork

Two images in [`public/images/`](public/images) are produced by scripts rather than exported by hand. Both are **committed**, and neither runs as part of `npm run build` — a deploy should not depend on shelling out to a headless browser. Re-run them by hand when the palette or the copy they carry changes.

| Command | Produces |
| --- | --- |
| `node scripts/make-og-image.mjs` | `og-image.jpg` — the 1200×630 card social platforms show when the site is linked |
| `node scripts/make-contact-starfield.mjs` | `contact-starfield.svg` — the texture under the Contact section |

The starfield is deterministic: same seed, same bytes, so re-running it produces no diff unless you changed something. It is 9.4 kB that gzips to 2.1 kB.

The OG card renders over the hero photograph, with a portrait from `scripts/assets/`, and in the site's real fonts, pulled out of `node_modules` and inlined as `data:` URIs — a page built with `setContent()` has no origin and Chromium silently refuses to load `file://` subresources into it, so the script asserts both faces actually loaded before it screenshots. It is 81 kB, but no visitor ever downloads it; only link-preview scrapers do.

### Configuration

One value is injected at build time and read from the environment by Vite:

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_EMAIL_BASE64` | Contact address, base64-encoded to slow down scrapers |

[`.env`](.env) holds harmless development defaults so a fresh clone builds and tests without any secrets. CI supplies the real value from the `MY_EMAIL_BASE64` repository secret, and `npm run verify -- --require-secrets` fails the build if the development default would have shipped. To build locally as production does, put a real value in `.env.local` (gitignored).

The email variable accepts either base64 or a plain address, and whitespace is trimmed either way — it is always re-encoded to base64 before it reaches the page.
