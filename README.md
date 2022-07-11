<h1 align="center">https://kfurtak1024.github.io</h1>

<p align="center">
  <a href="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/npm-gulp.yml">
    <img src="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/npm-gulp.yml/badge.svg">
  </a>
  <a href="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/pages/pages-build-deployment">
    <img src="https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/pages/pages-build-deployment/badge.svg">
  </a>
  <a href="https://validator.nu/?doc=https%3A%2F%2Fkrzysztoffurtak.dev">
    <img src="https://img.shields.io/w3c-validation/html?targetUrl=https%3A%2F%2Fkrzysztoffurtak.dev">
  </a>
</p>

This is repository of my homepage hosted at GitHub Pages and accessible from https://krzysztoffurtak.dev.

> The idea of this website is to be my business card and the home of my projects.

## :ship: Deployment

The deployment of the website is full automated.

:warning: *Each commit to ``main`` branch results in website publish!* :warning:

### Workflow overview

On each push to ``main`` the following GitHub Actions are triggered:
- [Build](https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/npm-gulp.yml) - create *ready-to-be-deployed* version of the site (minified css, html, all assets grouped in folders) and pushes it to GitHub Pages dedicated branch: [github-pages](https://github.com/kfurtak1024/kfurtak1024.github.io/tree/github-pages)
- [pages-build-deployment](https://github.com/kfurtak1024/kfurtak1024.github.io/actions/workflows/pages/pages-build-deployment) - publish content of [github-pages](https://github.com/kfurtak1024/kfurtak1024.github.io/tree/github-pages) branch to GitHub Pages. Changes become **PUBLIC** after this action!

## :rocket: Development setup

### Install prerequisites

Download **Node.js** (version **16.x** or newer) from https://nodejs.org/ and install it :file_folder:.

### Clone repository

Clone repository in the directory of your choice :computer::

```
git clone https://github.com/kfurtak1024/kfurtak1024.github.io.git
```

### Install NPM dependencies

Navigate to the directory where the repository was clonned to and install NPM dependencies by running :computer::

```
npm install
```
*Make sure ``npm`` is on your PATH*

### Build the site

From the same directory, build the site by running :computer::

```
gulp
```
After that, the *ready-to-be-deployed* website can be found at ``./dist/``
