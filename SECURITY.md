# Security policy

This repository is the source of [krzysztoffurtak.dev](https://krzysztoffurtak.dev), a static personal site served by GitHub Pages. It has no backend, no accounts and no forms, and it stores nothing about its visitors.

## Supported versions

Only the live site — the current `main` branch — is supported. Fixes are deployed there and nowhere else.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Report it privately instead, through GitHub's [private vulnerability reporting](https://github.com/kfurtak1024/kfurtak1024.github.io/security/advisories/new). If that is not available to you, use the email address on [the site's contact section](https://krzysztoffurtak.dev/#section-contact).

A useful report says what is affected (a page, a file in this repository, the build pipeline), how to reproduce it, and what an attacker could do with it.

This is a personal project maintained in my spare time, so responses are best effort. I aim to acknowledge a report within a week and to keep you informed until it is resolved. I am happy to credit you once it is fixed, unless you would rather stay anonymous.

## Scope

**In scope:**

- The site's own pages and scripts (`src/`, `public/`)
- The build and deployment pipeline (`.github/workflows/`, `scripts/`, `vite.config.js`)
- Anything in this repository that could leak a secret or let someone change what gets published

**Out of scope:**

- The projects the site links to — [bansoko](https://github.com/kfurtak1024/bansoko), [t0d0](https://github.com/kfurtak1024/t0d0) and [zecret](https://github.com/kfurtak1024/zecret) — which have repositories of their own; please report issues there
- GitHub Pages itself, and HTTP response headers it does not let a site configure
- Reports from automated scanners with no demonstrated impact
- Social engineering, and denial-of-service attacks
