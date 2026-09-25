/* Renders public/images/contact-starfield.svg -- the texture under the Contact
 * section.
 *
 *   node scripts/make-contact-starfield.mjs
 *
 * It replaces a 14 kB raster of a stock dark polygonal abstract. Three reasons
 * it is generated rather than exported:
 *
 *   1. It is resolution independent, so it can never reacquire the @2x problem
 *      that once shipped 3 MB of near-black texture to every retina laptop.
 *   2. It is text, so it diffs, and its density, seed and palette are inputs
 *      rather than something baked into pixels.
 *   3. The raster's own faint accent was olive-gold -- a fourth colour on a page
 *      that had just finished reducing itself to two.
 *
 * The subject is not arbitrary. The hero says "...and when the night begins to
 * shine, I become a solo game developer"; a night sky is that line made visible.
 *
 * Output is deterministic: same seed, same bytes.
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'public/images/contact-starfield.svg');

const WIDTH = 1600;
const HEIGHT = 1000;
const COUNT = 260;
const SEED = 20260904;

// mulberry32. Any small seeded PRNG would do; the point is only that it is not
// Math.random(), so re-running the script does not produce a new file and a
// pointless diff every time.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(SEED);

// Opacity is quantised into a handful of buckets so the stars can be grouped
// under a <g opacity>, which is what keeps the file small: the alternative is
// an opacity attribute on all 260 circles, nearly none of them shared.
const BUCKETS = [0.14, 0.22, 0.32, 0.45, 0.62, 0.85];
const buckets = new Map(BUCKETS.map((o) => [o, []]));

for (let i = 0; i < COUNT; i++) {
  // A few bright stars carry the eye; the rest is dust.
  const bright = rnd() > 0.92;
  const x = Math.round(rnd() * WIDTH);
  const y = Math.round(rnd() * HEIGHT);
  const r = +(bright ? 1.2 + rnd() * 1.1 : 0.45 + rnd() * 0.7).toFixed(2);
  const wanted = bright ? 0.5 + rnd() * 0.4 : 0.12 + rnd() * 0.34;
  const bucket = BUCKETS.reduce((best, o) =>
    Math.abs(o - wanted) < Math.abs(best - wanted) ? o : best);
  buckets.get(bucket).push(`<circle cx="${x}" cy="${y}" r="${r}"/>`);
}

const groups = [...buckets]
  .filter(([, circles]) => circles.length)
  .map(([o, circles]) => `<g opacity="${o}">${circles.join('')}</g>`)
  .join('');

// preserveAspectRatio="xMidYMid slice" matches what background-size: cover does
// anyway, and states it in the file rather than relying on the consumer.
const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" ` +
  `preserveAspectRatio="xMidYMid slice">` +
  `<g fill="#fff">${groups}</g>` +
  `</svg>\n`;

await writeFile(OUT, svg);

const { gzipSync } = await import('node:zlib');
console.log(
  `contact-starfield.svg written: ${COUNT} stars, ` +
  `${(svg.length / 1024).toFixed(1)} kB raw, ` +
  `${(gzipSync(svg).length / 1024).toFixed(1)} kB gzipped`);
