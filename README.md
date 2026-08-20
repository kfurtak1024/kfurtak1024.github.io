<p align="center">
  <img src="public/images/avatar.png" width="96" height="96" alt="">
</p>

<h1 align="center">krzysztoffurtak.dev</h1>

<p align="center"><em>My business card, and the home of my projects.</em></p>

<p align="center">
  <a href="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/build.yml">
    <img alt="Build" src="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/build.yml/badge.svg">
  </a>
  <a href="https://krzysztoffurtak.dev">
    <img alt="Website" src="https://img.shields.io/website?url=https%3A%2F%2Fkrzysztoffurtak.dev&label=site">
  </a>
  <a href="https://validator.nu/?doc=https%3A%2F%2Fkrzysztoffurtak.dev">
    <img alt="W3C validation" src="https://img.shields.io/w3c-validation/html?targetUrl=https%3A%2F%2Fkrzysztoffurtak.dev">
  </a>
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

### Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reloading |
| `npm run build` | Build the deployable site into `./dist/` |
| `npm run preview` | Serve the built `./dist/` exactly as GitHub Pages does |
| `npm run verify` | Assert the build is complete and every local reference resolves |
| `npm test` | Playwright smoke tests — Chromium, Firefox and a mobile viewport |
| `npm run lint` | ESLint, Stylelint and html-validate |

Run `npm run build` before `npm test` or `npm run lint` — both inspect the built output rather than the sources.

### Configuration

Two values are injected at build time and read from the environment by Vite:

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_EMAIL_BASE64` | Contact address, base64-encoded to slow down scrapers |
| `VITE_FULLPAGE_LICENSE_KEY` | fullPage.js licence key |

[`.env`](.env) holds harmless development defaults so a fresh clone builds and tests without any secrets. CI supplies the real values from repository secrets, and `npm run verify -- --require-secrets` fails the build if the development defaults would have shipped. To build locally as production does, put real values in `.env.local` (gitignored).

The email variable accepts either base64 or a plain address, and whitespace is trimmed either way — it is always re-encoded to base64 before it reaches the page.
