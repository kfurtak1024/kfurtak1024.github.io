<h1 align="center">https://krzysztoffurtak.dev</h1>

<p align="center">
  <a href="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/build.yml">
    <img src="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/build.yml/badge.svg">
  </a>
  <a href="https://validator.nu/?doc=https%3A%2F%2Fkrzysztoffurtak.dev">
    <img src="https://img.shields.io/w3c-validation/html?targetUrl=https%3A%2F%2Fkrzysztoffurtak.dev">
  </a>
</p>

This is repository of my homepage hosted at GitHub Pages and accessible from https://krzysztoffurtak.dev.

> The idea of this website is to be my business card and the home of my projects.

## :ship: Deployment

Deployment is fully automated, and gated.

Every push and pull request runs the [Build](https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/build.yml) workflow, which builds the site, lints it, verifies the output and runs the browser test suite. **Only a push to `main` deploys** — pull requests build and test but never publish. `main` is protected, so in practice everything reaches the site through a pull request that passed the `Build & verify` check.

The deploy job publishes the exact artifact the checks ran against, via GitHub's own Pages deployment, so what ships is byte-for-byte what was tested.

### One-time repository setup

Deployment uses `actions/deploy-pages`, which only works once these are in place:

1. **Settings → Pages → Source** must be **GitHub Actions**, not "Deploy from a branch". While the source is set to a branch, the deploy job fails and the site silently stops updating.
2. **Settings → Pages → Custom domain** must read `krzysztoffurtak.dev`. Under Actions-based deployment the custom domain is held in this setting — not in the `CNAME` file. The file still ships in the artifact, and `scripts/verify.mjs` still asserts it is present, but it is no longer what configures the domain.
3. **Settings → Rules → Rulesets** protects `main`: pull request required, the **`Build & verify`** status check required, force pushes blocked. Renaming that job in `build.yml` silently disables the requirement.

The `github-pages` branch is a leftover from the previous deployment method and is no longer read by anything.

## :rocket: Development setup

### Install prerequisites

Install **Node.js** — the version is pinned in [`.nvmrc`](.nvmrc), so `nvm use` picks the right one.

### Clone and install

```
git clone https://github.com/kfurtak1024/kfurtak1024.github.io.git
cd kfurtak1024.github.io
npm ci
```

### Everyday commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reloading |
| `npm run build` | Build the deployable site into `./dist/` |
| `npm run preview` | Serve the built `./dist/` exactly as GitHub Pages does |
| `npm run verify` | Assert the build is complete and every local reference resolves |
| `npm test` | Playwright smoke tests, desktop + mobile |
| `npm run lint` | ESLint, Stylelint and html-validate |

Run `npm run build` before `npm test` or `npm run lint` — both inspect the built output rather than the sources.

### Configuration

Two values are injected at build time and read from the environment by Vite:

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_EMAIL_BASE64` | Contact address, base64-encoded to slow down scrapers |
| `VITE_FULLPAGE_LICENSE_KEY` | fullPage.js licence key |

[`.env`](.env) holds harmless development defaults so a fresh clone builds and tests without any secrets. CI supplies the real values from repository secrets, and `npm run verify -- --require-secrets` fails the build if the development defaults would have shipped. To build locally as production does, put real values in `.env.local` (gitignored).
