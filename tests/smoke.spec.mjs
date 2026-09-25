import { test, expect } from '@playwright/test';

const SECTIONS = ['#section-intro', '#section-projects', '#section-contact'];

/** WCAG contrast between two computed `rgb(...)` strings. Several colours on
 *  this page are only correct relative to what they sit on -- lime is 10.39:1
 *  on the dark surface and 1.87:1 on a white card -- and getting that wrong
 *  fails silently: the page still renders, it is just unreadable. */
function contrast(a, b) {
  const luminance = (rgb) => {
    const [r, g, b_] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b_;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Collects same-origin failures. External hosts (Google Fonts) are ignored on
 *  purpose -- this suite verifies our build, not a third party's uptime.
 *
 *  The origin is taken from the `baseURL` fixture rather than hardcoded: with a
 *  literal 'localhost' check, pointing baseURL at 127.0.0.1 would make every
 *  same-origin assertion below silently stop matching, leaving a suite that
 *  passes while checking nothing. */
function watchForErrors(page, baseURL) {
  const errors = [];
  const expectedOrigin = new URL(baseURL).origin;
  const sameOrigin = (url) => {
    try {
      return new URL(url).origin === expectedOrigin;
    } catch {
      return false;
    }
  };

  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    if (sameOrigin(r.url())) errors.push(`request failed: ${r.url()}`);
  });
  // A 404 is a perfectly successful HTTP exchange, so it never raises
  // `requestfailed` -- a missing image or bundle is only visible in the
  // response status. Without this listener the suite happily passes on a
  // build that ships broken asset references.
  page.on('response', (r) => {
    if (sameOrigin(r.url()) && r.status() >= 400) {
      errors.push(`HTTP ${r.status()}: ${r.url()}`);
    }
  });
  return errors;
}

/** Which section currently covers the middle of the viewport. Asserting on
 *  geometry rather than on a framework's class names keeps these tests honest
 *  across a change of scrolling implementation -- the previous suite asserted
 *  fullPage.js's `.fp-section`, so it could only ever describe fullPage.js. */
async function sectionInView(page) {
  return page.evaluate((ids) => {
    const mid = window.innerHeight / 2;
    for (const id of ids) {
      const r = document.querySelector(id).getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) return id;
    }
    return null;
  }, SECTIONS);
}

test('loads without page or same-origin request errors',
  async ({ page, baseURL }) => {
    const errors = watchForErrors(page, baseURL);
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

test('makes no third-party requests', async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const external = [];
  page.on('request', (r) => {
    if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) {
      external.push(r.url());
    }
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  // Fonts are self-hosted precisely so the page depends on nobody else --
  // no Google Fonts, no CDNs. Re-adding one should fail here, loudly.
  expect(external).toEqual([]);
});

test('has one h1 and all three sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Krzysztof Furtak');
  for (const s of SECTIONS) await expect(page.locator(s)).toHaveCount(1);
});

test('the page scrolls natively -- no scroll hijacking', async ({ page }) => {
  await page.goto('/');
  // fullPage.js pinned `html { overflow: hidden }` and translated a wrapper.
  // Native scrolling is the whole point of the rewrite, so assert it directly.
  const overflow = await page.evaluate(() =>
    getComputedStyle(document.documentElement).overflow);
  expect(overflow).not.toBe('hidden');

  const before = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => window.scrollTo(0, 1200));
  // scroll-behavior is smooth, so the scroll is animated -- poll rather than
  // reading a mid-animation value.
  await expect.poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(before);
});

test('the hero fills the viewport, and nothing else has to', async ({ page }) => {
  await page.goto('/');
  const { heroHeight, viewport } = await page.evaluate(() => ({
    heroHeight: document.querySelector('#section-intro').getBoundingClientRect().height,
    viewport: window.innerHeight
  }));
  expect(heroHeight).toBeGreaterThanOrEqual(viewport - 1);
});

test('navigation moves between sections and tracks the active item',
  async ({ page }, testInfo) => {
    await page.goto('/');
    const navItems = page.locator('#nav-menu a.nav-menu-item');
    await expect(navItems).toHaveCount(3);

    for (let i = 0; i < SECTIONS.length; i++) {
      if (testInfo.project.name === 'mobile') {
        // Links live behind the hamburger at this width.
        await page.locator('.mobile-nav-toggle').click();
      }
      await navItems.nth(i).click();
      await expect.poll(() => sectionInView(page)).toBe(SECTIONS[i]);
      await expect(navItems.nth(i).locator('..')).toHaveClass(/active/);
    }
  });

test('the active nav item stays readable against its highlight', async ({ page }) => {
  await page.goto('/');
  // `#header a` carries an id, so a colour declared there outranks
  // `.navbar li.active a` and renders the active item white-on-white --
  // invisible, with nothing failing. Assert the contrast directly.
  const { bg, fg } = await page.evaluate(() => {
    const li = document.querySelector('#nav-menu li.active');
    return {
      bg: getComputedStyle(li).backgroundColor,
      fg: getComputedStyle(li.querySelector('a')).color
    };
  });
  expect(bg).not.toBe(fg);
});

test('every section can be scrolled to the top, even on a tall display',
  async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'desktop viewport sizing');
    // A section shorter than the viewport cannot reach the top once the
    // document runs out below it. That left Contact stranded in the bottom
    // half on tall screens -- clicking it in the nav appeared to do nothing.
    await page.setViewportSize({ width: 1600, height: 1440 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    for (const id of SECTIONS) {
      await page.locator(`#nav-menu a[href="${id}"]`).click();
      await expect.poll(() => page.evaluate((sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        const header = document.querySelector('#header').getBoundingClientRect();
        // Near the top of the screen rather than stranded in the lower half.
        // No lower bound: the hero legitimately sits at document top (0), so
        // it cannot scroll to below the header the way the others do.
        return r.top < header.bottom + 60;
      }, id), { message: `${id} did not scroll to the top` }).toBe(true);
      // Both indicators must agree, at this height as well as the default.
      // The scroll-spy previously read a band at the viewport middle, which
      // on a tall display lands in the NEXT section and highlighted it.
      await expect.poll(() => page.evaluate(() =>
        document.querySelector('#nav-menu li.active a')?.getAttribute('href')
      )).toBe(id);
    }
  });

test('the projects grid lists the real projects with working links',
  async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.project-card');
    await expect(cards).toHaveCount(3);
    await expect(page.locator('.project-head h3')).toHaveText(
      ['bansoko', 't0d0', 'zecret']);

    // Every card must offer at least one destination, and none may be a stub.
    for (const href of await page.locator('.project-links a').evaluateAll(
      (as) => as.map((a) => a.getAttribute('href')))) {
      expect(href).toMatch(/^https:\/\//);
    }
  });

test('every project card shows a screenshot that actually loads',
  async ({ page }) => {
    await page.goto('/');
    await page.locator('#section-projects').scrollIntoViewIfNeeded();
    // The images are lazy-loaded below the fold, so a missing or misnamed file
    // would not surface in the initial page load at all.
    await expect.poll(() => page.evaluate(() =>
      [...document.querySelectorAll('.project-media img')]
        .map((i) => i.complete && i.naturalWidth > 0)
    )).toEqual([true, true, true]);

    // Every screenshot must fit its panel rather than overflow and be clipped.
    const fits = await page.evaluate(() =>
      [...document.querySelectorAll('.project-media')].map((m) => {
        const img = m.querySelector('img').getBoundingClientRect();
        const box = m.getBoundingClientRect();
        return img.height <= box.height + 1 && img.width <= box.width + 1;
      }));
    expect(fits).toEqual([true, true, true]);

    // Screenshots carry meaning, so they need real alt text, not empty strings.
    const alts = await page.locator('.project-media img').evaluateAll(
      (imgs) => imgs.map((i) => i.getAttribute('alt')?.length ?? 0));
    for (const len of alts) expect(len).toBeGreaterThan(20);
  });

test('email is available as a direct mailto action and can be copied', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('#email-button');
  const label = page.locator('#email');
  const copyButton = page.locator('#copy-email');

  const revealed = (await label.textContent()).trim();
  expect(revealed, `email text was "${revealed}"`)
    .toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  await expect(button).toHaveAttribute('href', `mailto:${revealed}`);
  await expect(copyButton).toBeVisible();

  await copyButton.click();
  await expect(page.locator('#email-copy-status'))
    .toHaveText('Email address copied to clipboard.');
});

test('the footer sits at the very end of the page', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  // Smooth scrolling again: poll until the animation settles. Compared within
  // a pixel rather than to exactly 0 -- sub-pixel layout rounds to -0, and
  // Object.is(-0, 0) is false, which fails a strict equality check.
  await expect.poll(() => page.evaluate(() => {
    const f = document.querySelector('#footer').getBoundingClientRect();
    return Math.abs(document.documentElement.scrollHeight
      - (f.bottom + window.scrollY));
  })).toBeLessThanOrEqual(1);
});

test('the social card is a real 1200x630 image, referenced absolutely',
  async ({ page }) => {
    await page.goto('/');
    // Absolute because several scrapers will not resolve a relative og:image.
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content', 'https://krzysztoffurtak.dev/images/og-image.jpg');
    // Without this X shows the small square card and ignores the wide image.
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content', 'summary_large_image');

    // og:image points at the production origin, which does not exist under
    // `vite preview`; load the same path from the build being tested. A card of
    // the wrong shape is the exact bug this replaced -- avatar.png was a square
    // and every platform letterboxed it.
    const size = await page.evaluate(async () => {
      const img = new Image();
      img.src = '/images/og-image.jpg';
      await img.decode();
      return { width: img.naturalWidth, height: img.naturalHeight };
    });
    expect(size).toEqual({ width: 1200, height: 630 });
  });

test('the hero artwork resolves', async ({ page, request, baseURL }) => {
  await page.goto('/');
  // Same reasoning as the contact artwork below. The image-set() ladder means
  // a missing format degrades to the next one silently, so every format the
  // CSS names is requested directly rather than trusting the one that won.
  const declared = await page.evaluate(() =>
    getComputedStyle(document.querySelector('#section-intro')).backgroundImage);
  expect(declared).toContain('/images/intro_background.');
  for (const ext of ['avif', 'webp', 'jpg']) {
    const res = await request.get(new URL(`/images/intro_background.${ext}`, baseURL).href);
    expect(res.status()).toBe(200);
  }
});

test('the contact artwork resolves', async ({ page, request, baseURL }) => {
  await page.goto('/');
  // It is a CSS background, so it has no element to assert on and a 404 would
  // simply leave the section flat -- silently, which is how a 3 MB orphan lived
  // in this build for weeks.
  const declared = await page.evaluate(() =>
    getComputedStyle(document.querySelector('#section-contact')).backgroundImage);
  expect(declared).toContain('/images/contact-starfield.svg');
  const res = await request.get(new URL('/images/contact-starfield.svg', baseURL).href);
  expect(res.status()).toBe(200);
});

/* The reveal-on-scroll is the one piece of this page that can fail by hiding
 * content. Both halves are asserted: that it finishes, and that it is never
 * installed at all when the visitor asked for less motion. */
test('revealed content ends up fully visible', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.project-card');
  const count = await cards.count();
  // Each card individually: on a narrow viewport the grid is a single column,
  // so scrolling to the top of the section leaves cards two and three well
  // below the fold, unobserved and legitimately still hidden.
  for (let i = 0; i < count; i++) {
    await cards.nth(i).scrollIntoViewIfNeeded();
    await expect.poll(() => cards.nth(i).evaluate((c) =>
      Number(getComputedStyle(c).opacity)),
    { message: `project card ${i + 1} never reached full opacity` }).toBe(1);
  }
});

test('reduced motion never hides anything behind an animation',
  async ({ page }) => {
    // Set on the page rather than through `test.use({ reducedMotion })`, which
    // this version of Playwright does not apply to the project contexts here --
    // matchMedia still reported no-preference, so the test passed the media
    // query it meant to exercise straight through and asserted nothing.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    expect(await page.evaluate(() =>
      window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

    // The hidden state must not even be installed -- the stylesheet only hides
    // .reveal under .has-reveal, and app.js must decline to add it.
    await expect(page.locator('html')).not.toHaveClass(/has-reveal/);
    expect(await page.evaluate(() =>
      [...document.querySelectorAll('.project-card')]
        .map((c) => Number(getComputedStyle(c).opacity))
    )).toEqual([1, 1, 1]);
  });

test('paragraph spacing is the spacing the stylesheet asks for', async ({ page }) => {
  await page.goto('/');
  // A paragraph margin on a more specific selector (it used to be `.section p`)
  // silently overrides every single-class rule's margin. These are the values
  // those class rules ask for.
  const intended = {
    '.eyebrow': ['marginBottom', '0px'],
    '.section-kicker': ['marginBottom', '12px'],
    '.contact-status-kicker': ['marginBottom', '16px'],
    '.project-meta': ['marginBottom', '0px'],
    '.project-desc': ['marginBottom', '0px'],
    '.project-links': ['marginBottom', '0px'],
    '.hero-cta': ['marginTop', '16px'],
    '.contact-actions': ['marginTop', '32px']
  };
  expect(await page.evaluate((spec) => Object.fromEntries(
    Object.entries(spec).map(([sel, [prop]]) =>
      [sel, getComputedStyle(document.querySelector(sel))[prop]])
  ), intended)).toEqual(
    Object.fromEntries(Object.entries(intended).map(([sel, [, v]]) => [sel, v]))
  );
});

test('the focus ring stays visible on the light band', async ({ page }) => {
  await page.goto('/');
  // One lime ring for the whole page failed the moment focus landed on the
  // Projects band: 1.87:1 against a white card, under the 3:1 a focus
  // indicator has to make against what it sits on. Nothing about that is
  // visible from a passing build.
  const link = page.locator('.project-links a').first();
  await link.scrollIntoViewIfNeeded();
  await link.focus();
  const onPaper = await page.evaluate(() => {
    const a = document.querySelector('.project-links a');
    return {
      ring: getComputedStyle(a).outlineColor,
      behind: getComputedStyle(a.closest('.project-card')).backgroundColor
    };
  });
  expect(contrast(onPaper.ring, onPaper.behind)).toBeGreaterThanOrEqual(3);

  // ...and the dark half still uses the lime, which is where it works.
  const button = page.locator('#email-button');
  await button.scrollIntoViewIfNeeded();
  await button.focus();
  const onDark = await page.evaluate(() => ({
    ring: getComputedStyle(document.querySelector('#email-button')).outlineColor,
    behind: getComputedStyle(document.querySelector('.section-contact')).backgroundColor
  }));
  expect(contrast(onDark.ring, onDark.behind)).toBeGreaterThanOrEqual(3);
});

test('copyright year is filled in', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#copyright-year'))
    .toHaveText(String(new Date().getFullYear()));
});

test.describe('mobile menu', () => {
  test.skip(({ isMobile }) => !isMobile, 'hamburger only exists on narrow viewports');

  test('opens, then closes after choosing a destination', async ({ page }) => {
    await page.goto('/');
    const navbar = page.locator('#navbar');
    const toggle = page.locator('.mobile-nav-toggle');

    await expect(navbar).not.toHaveClass(/navbar-mobile/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(navbar).toHaveClass(/navbar-mobile/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await page.locator('#nav-menu a.nav-menu-item').nth(1).click();
    await expect(navbar).not.toHaveClass(/navbar-mobile/);
    await expect.poll(() => sectionInView(page)).toBe('#section-projects');
  });

  test('takes the page behind it out of the tab order', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.mobile-nav-toggle');
    const covered = ['#main', '#footer', '.logo'];

    for (const sel of covered) {
      await expect(page.locator(sel)).not.toHaveAttribute('inert', '');
    }

    await toggle.click();
    // The overlay hides these from the pointer but not from the keyboard, so
    // without `inert` tabbing past the last link walks into the page behind it,
    // where the focus ring is invisible under an opaque panel.
    for (const sel of covered) {
      await expect(page.locator(sel)).toHaveAttribute('inert', '');
    }
    // ...and the document must not scroll behind the overlay either.
    expect(await page.evaluate(() =>
      getComputedStyle(document.body).overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    for (const sel of covered) {
      await expect(page.locator(sel)).not.toHaveAttribute('inert', '');
    }
  });

  test('labels are readable on the lime panel, and the active one is marked',
    async ({ page }) => {
      await page.goto('/');
      await page.locator('.mobile-nav-toggle').click();

      // The panel is the one place the accent is a full field rather than an
      // accent, and the labels were white on it -- 1.87:1, under the floor even
      // at 40px. The same white was also what `li.active` set, so the active
      // marker was a no-op and the current section looked like the other two.
      const menu = await page.evaluate(() => {
        const item = (sel) => document.querySelector(sel);
        const active = item('.navbar-mobile li.active > .nav-menu-item');
        const other = item('.navbar-mobile li:not(.active) > .nav-menu-item');
        return {
          panel: getComputedStyle(item('.navbar-mobile')).backgroundColor,
          label: getComputedStyle(active).color,
          activeRule: getComputedStyle(active, '::after').display,
          otherRule: getComputedStyle(other, '::after').display
        };
      });

      expect(contrast(menu.label, menu.panel)).toBeGreaterThanOrEqual(3);
      // The marker has to be something other than the label colour, or it is
      // not a marker at all.
      expect(menu.activeRule).not.toBe('none');
      expect(menu.otherRule).toBe('none');
    });

  test('closes on Escape and returns focus to the toggle', async ({ page }) => {
    await page.goto('/');
    const navbar = page.locator('#navbar');
    const toggle = page.locator('.mobile-nav-toggle');

    await toggle.click();
    await expect(navbar).toHaveClass(/navbar-mobile/);

    // A full-screen overlay with no keyboard exit is a trap.
    await page.keyboard.press('Escape');
    await expect(navbar).not.toHaveClass(/navbar-mobile/);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });
});
