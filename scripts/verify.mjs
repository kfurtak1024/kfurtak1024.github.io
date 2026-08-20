import { readFile, stat, readdir } from 'node:fs/promises';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'dist');

// Every un-hashed file the deployed site is expected to contain -- i.e. the
// entry document plus everything Vite copies verbatim out of public/. The
// hashed bundles under assets/ deliberately are NOT listed: their names change
// every build, and checkReferences() proves they exist by following the actual
// <script>/<link> tags out of index.html.
const EXPECTED = [
  'index.html', 'CNAME', 'site.webmanifest',
  'images/avatar.png', 'images/intro_background.jpg',
  'images/projects_background.png',
  'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png', 'android-chrome-512x512.png'
];

// Vite must emit exactly one JS and one CSS bundle for the single entry point.
// Zero means the entry stopped being processed; more than one means an
// unintended code split that index.html may not reference.
const EXPECTED_BUNDLES = [
  { what: 'JS bundle', re: /^assets\/index-[\w-]+\.js$/ },
  { what: 'CSS bundle', re: /^assets\/index-[\w-]+\.css$/ }
];

// Tokens that must never survive into a deployed bundle. The first two are the
// build-time define names -- if they appear as bare identifiers, substitution
// did not happen and the page will throw a ReferenceError on load.
const FORBIDDEN = [
  'VITE_SITE_EMAIL_BASE64', 'VITE_FULLPAGE_LICENSE_KEY',
  'import.meta.env',
  'MY_EMAIL_BASE64', 'YOUR_KEY_HERE'
];

// Read the committed dev defaults straight out of .env rather than repeating
// them here. A hard-coded copy silently rots the moment .env is edited: the
// guard would go on matching strings that appear in no build, passing while dev
// values ship.
async function readDevFallbacks() {
  let text;
  try {
    text = await readFile(join(ROOT, '.env'), 'utf8');
  } catch {
    fail('.env is missing -- cannot tell dev fallback values from real ones');
    return [];
  }
  const values = [];
  for (const line of text.split('\n')) {
    if (/^\s*(#|$)/.test(line)) continue;
    const m = line.match(/^\s*VITE_[A-Z0-9_]+\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    const value = m[1].replace(/^(['"])(.*)\1$/, '$2');
    if (value) values.push(value);
  }
  if (!values.length) fail('no VITE_* dev fallback values found in .env');
  return values;
}

const TEXT_EXT = /\.(html|css|js|json|webmanifest)$/;
const errors = [];
const fail = (msg) => errors.push(msg);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
}

async function checkExpectedFiles() {
  for (const rel of EXPECTED) {
    try {
      const s = await stat(join(DIST, rel));
      if (s.size === 0) fail(`empty file: ${rel}`);
    } catch {
      fail(`missing expected file: ${rel}`);
    }
  }
}

function checkBundles(files) {
  const rel = files.map((f) => relative(DIST, f).split(sep).join('/'));
  for (const { what, re } of EXPECTED_BUNDLES) {
    const hits = rel.filter((r) => re.test(r));
    if (hits.length !== 1) {
      fail(`expected exactly 1 ${what} matching ${re}, found ${hits.length}` +
           (hits.length ? `: ${hits.join(', ')}` : ''));
    }
  }
}

async function checkForbiddenTokens(files) {
  for (const f of files.filter((f) => TEXT_EXT.test(f))) {
    const text = await readFile(f, 'utf8');
    for (const token of FORBIDDEN) {
      if (text.includes(token)) {
        fail(`unsubstituted placeholder "${token}" in ${relative(DIST, f)}`);
      }
    }
  }
}

// Follows every local reference out of the HTML, CSS and manifest and asserts
// the target actually exists. This is what catches a renamed or no-longer-
// copied asset, the failure mode that produces a build-green/site-broken deploy.
async function checkReferences(files) {
  const isLocal = (u) =>
    u && !/^(https?:)?\/\//.test(u) && !u.startsWith('data:') &&
    !u.startsWith('mailto:') && !u.startsWith('#');

  const resolveRef = (fromFile, url) => {
    const clean = url.split(/[?#]/)[0];
    if (clean === '' ) return null;
    return clean.startsWith('/')
      ? join(DIST, clean)
      : resolve(dirname(fromFile), clean);
  };

  const refs = [];
  for (const f of files.filter((f) => /\.(html|css|webmanifest)$/.test(f))) {
    const text = await readFile(f, 'utf8');
    if (f.endsWith('.html')) {
      for (const m of text.matchAll(/\b(?:src|href)\s*=\s*"([^"]*)"/g)) {
        refs.push([f, m[1]]);
      }
    } else if (f.endsWith('.css')) {
      for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
        refs.push([f, m[1]]);
      }
    } else {
      for (const icon of JSON.parse(text).icons ?? []) refs.push([f, icon.src]);
    }
  }

  for (const [from, url] of refs) {
    if (!isLocal(url)) continue;
    const target = resolveRef(from, url);
    if (!target) continue;
    try {
      const s = await stat(target);
      // A bare "/" legitimately resolves to the directory holding index.html.
      if (s.isDirectory()) await stat(join(target, 'index.html'));
    } catch {
      fail(`broken reference "${url}" in ${relative(DIST, from)}`);
    }
  }
  return refs.length;
}

// The email is injected as base64 and decoded in the browser. Scanning for
// "a base64-looking literal" is not enough now that fullpage.js is bundled into
// the same file -- plenty of its minified strings look like base64. So decode
// every candidate literal and require that at least one yields a real address.
async function checkInjectedEmail(requireReal, files) {
  const bundles = files.filter((f) => /assets[\\/][^\\/]+\.js$/.test(f));
  if (!bundles.length) return fail('no JS bundle found to check the email in');
  const js = (await Promise.all(bundles.map((f) => readFile(f, 'utf8'))))
    .join('\n');

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const decoded = [];
  for (const m of js.matchAll(/["'`]([A-Za-z0-9+/]{12,}={0,2})["'`]/g)) {
    try {
      const v = Buffer.from(m[1], 'base64').toString('utf8');
      // Reject mojibake from decoding strings that were never base64.
      if (!v.includes('\uFFFD')) decoded.push(v);
    } catch {
      // Not base64 -- simply not a candidate.
    }
  }

  const found = decoded.find(isEmail);
  if (!found) {
    return fail('no base64 literal in the bundle decodes to an email address ' +
                '(is VITE_SITE_EMAIL_BASE64 set and valid base64?)');
  }
  if (requireReal) {
    const devFallbacks = await readDevFallbacks();
    const shipped = devFallbacks.filter((d) => js.includes(d));
    if (shipped.length) {
      fail(`dev fallback value(s) from .env present in a build that requires ` +
           `real ones: ${shipped.join(', ')} ` +
           '(set VITE_SITE_EMAIL_BASE64 and VITE_FULLPAGE_LICENSE_KEY)');
    }
  }
  return found;
}

const requireReal = process.argv.includes('--require-secrets');

try {
  if (!(await stat(DIST)).isDirectory()) throw new Error('not a directory');
} catch {
  console.error(`verify FAILED: ${relative(ROOT, DIST)}/ is missing — ` +
                'run `npm run build` first');
  process.exit(1);
}

const files = await walk(DIST);
await checkExpectedFiles();
checkBundles(files);
await checkForbiddenTokens(files);
const refCount = await checkReferences(files);
await checkInjectedEmail(requireReal, files);

if (errors.length) {
  console.error(`verify FAILED (${errors.length} problem(s)):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`verify OK: ${files.length} files, ${EXPECTED.length} required ` +
            `present, ${refCount} references resolved` +
            (requireReal ? ', real secrets injected' : ''));
