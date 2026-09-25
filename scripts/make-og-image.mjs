/* Renders public/images/og-image.jpg -- the 1200x630 card social platforms show
 * when the site is linked.
 *
 * This is a generator rather than a hand-made export so the card cannot drift
 * away from the site: it pulls the real tokens, the real Orbitron and Roboto
 * Condensed from node_modules, the hero photograph and a portrait. When the
 * palette moves, re-run it. It is NOT wired into `npm run build` -- the output is committed,
 * because a build that shells out to a headless browser to produce a static
 * asset would make every deploy depend on it.
 *
 *   node scripts/make-og-image.mjs
 *
 * og:image wants 1200x630 (1.91:1). The previous image was avatar.png, a 1:1
 * square: LinkedIn and X both crop it to a letterbox, so it lost the top and
 * bottom of a face that was the whole point of it.
 *
 * scripts/assets/og-portrait.jpg is a 440px square crop of a studio portrait
 * with its grey backdrop darkened, so the circle sits in the dark card instead
 * of being its brightest area. It lives here rather than in public/ because
 * only this script uses it. The site itself keeps the pixel avatar as its logo.
 */
import { chromium } from '@playwright/test';
import { writeFile, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'public/images/og-image.jpg');

const WIDTH = 1200;
const HEIGHT = 630;

// Everything the card needs is inlined as a data: URI, fonts included. A page
// built with setContent() has no real origin, so Chromium refuses to load
// file:// subresources into it -- silently, as a failed request rather than an
// error. Linking the woff2 files therefore produced a card that rendered
// entirely in fallback faces and still exited 0.
const dataUri = async (path, mime) =>
  `data:${mime};base64,${(await readFile(join(ROOT, path))).toString('base64')}`;

const fontUri = (pkg, file) =>
  dataUri(join('node_modules', pkg, 'files', file), 'font/woff2');

const [orbitron, robotoCondensed, portrait, photo] = await Promise.all([
  fontUri('@fontsource-variable/orbitron', 'orbitron-latin-wght-normal.woff2'),
  fontUri('@fontsource-variable/roboto-condensed',
          'roboto-condensed-latin-wght-normal.woff2'),
  dataUri('scripts/assets/og-portrait.jpg', 'image/jpeg'),
  dataUri('public/images/intro_background.jpg', 'image/jpeg')
]);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: "Orbitron";
    src: url("${orbitron}") format("woff2-variations");
    font-weight: 400 900;
  }
  @font-face {
    font-family: "Roboto Condensed";
    src: url("${robotoCondensed}") format("woff2-variations");
    font-weight: 100 900;
  }

  /* Kept in step with src/css/main.css by hand. */
  :root {
    --surface: #0b0d0f;
    --light-green: #9acd4a;
    --violet: #a78bfa;
    --white: #fff;
    --body: #b7bec2;
    --grey: #8a9399;
  }

  * { box-sizing: border-box; margin: 0; }

  body {
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 26px;
    padding: 0 88px;
    background: var(--surface);
    font-family: "Roboto Condensed", sans-serif;
    color: var(--body);
    -webkit-font-smoothing: antialiased;
  }

  /* The hero's own photograph under the hero's own scrim, so the card looks
     like the page it links to. */
  .photo {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to right, rgb(11 13 15 / 93%) 0%, rgb(11 13 15 / 80%) 50%, rgb(11 13 15 / 58%) 100%),
      url("${photo}") center / cover no-repeat;
  }

  .content { position: relative; }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 16px;
    font-family: "Orbitron", sans-serif;
    font-size: 21px;
    font-weight: 500;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--light-green);
  }
  .eyebrow::after {
    content: "";
    width: 56px;
    height: 2px;
    background: currentcolor;
    opacity: .5;
  }

  h1 {
    font-family: "Orbitron", sans-serif;
    font-weight: 700;
    font-size: 82px;
    line-height: 1.06;
    letter-spacing: 0;
    color: var(--white);
  }

  .roles { font-size: 33px; line-height: 1.45; max-width: 34ch; }
  .roles strong { font-weight: 700; color: var(--light-green); }
  .roles .after-hours { font-weight: 700; color: var(--violet); }

  .portrait {
    position: absolute;
    top: 50%;
    right: 110px;
    width: 216px;
    height: 216px;
    transform: translateY(-50%);
    border-radius: 50%;
    border: 3px solid rgb(255 255 255 / 14%);
    box-shadow: 0 18px 48px rgb(0 0 0 / 50%);
  }

  .domain {
    position: absolute;
    left: 88px;
    bottom: 56px;
    font-family: "Orbitron", sans-serif;
    font-size: 20px;
    font-weight: 500;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: var(--grey);
  }
</style>
</head>
<body>
  <div class="photo"></div>
  <img class="portrait" src="${portrait}" alt="">
  <div class="content">
    <p class="eyebrow">Software Engineer</p>
  </div>
  <h1 class="content">Krzysztof<br>Furtak</h1>
  <p class="roles content">
    <strong>Java</strong> enterprise applications by day,<br>
    <span class="after-hours">indie games</span> after hours.
  </p>
  <p class="domain">krzysztoffurtak.dev</p>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1
});
await page.setContent(html, { waitUntil: 'load' });
// setContent resolves before the webfonts are ready, and a card screenshotted
// mid-swap ships with the fallback face.
await page.evaluate(() => document.fonts.ready);

// A @font-face that fails to load leaves the card looking plausible -- the text
// is all still there, just in the wrong faces -- so assert it rather than
// trusting the screenshot. This is exactly how the first version shipped.
const fonts = await page.evaluate(() =>
  [...document.fonts].map((f) => ({ family: f.family, status: f.status })));
const broken = fonts.filter((f) => f.status !== 'loaded');
if (broken.length || fonts.length !== 2) {
  await browser.close();
  throw new Error(
    `expected 2 loaded webfaces, got ${JSON.stringify(fonts)}`);
}
// JPEG, not PNG. The card is a photograph-like field of soft gradients over
// near-black, which is the case PNG is worst at: lossless it came to 176 kB,
// larger than every other file in the build. At quality 92 it is ~69 kB and
// measures 46 dB PSNR against the lossless render -- higher fidelity than the
// hero image already ships at.
const image = await page.screenshot({ type: 'jpeg', quality: 92 });
await browser.close();

await writeFile(OUT, image);
console.log(`og-image.jpg written: ${WIDTH}x${HEIGHT}, ${(image.length / 1024).toFixed(1)} kB`);
