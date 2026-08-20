import { test, expect } from '@playwright/test';

const SECTIONS = ['#section-intro', '#section-projects', '#section-contact'];

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
      await expect.poll(() => page.evaluate(() =>
        document.querySelector('.section-nav li.active a')?.getAttribute('href')
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

test('email button reveals a real address and a mailto link', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('#email-button');
  const label = page.locator('#email');

  await expect(label).toHaveText('Show email');
  await expect(button).toHaveAttribute('href', '/');

  await button.click();

  const revealed = (await label.textContent()).trim();
  expect(revealed, `revealed text was "${revealed}"`)
    .toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  await expect(button).toHaveAttribute('href', `mailto:${revealed}`);
  await expect(button).toHaveClass(/email-visible/);
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

test.describe('desktop section dots', () => {
  test.skip(({ isMobile }) => isMobile, 'dots are hidden on narrow viewports');

  test('use fullPage-style sizing and invert over the light section',
    async ({ page }) => {
      await page.goto('/');
      const sizes = () => page.evaluate(() =>
        [...document.querySelectorAll('.section-nav li')].map((li) => {
          const s = getComputedStyle(li.querySelector('.section-nav-dot'));
          return { active: li.classList.contains('active'),
                   w: s.width, bg: s.backgroundColor };
        }));

      // 4px dots, 12px when active -- fullPage.js's own geometry. Polled
      // because the dot animates its width over .1s, so a single reading
      // straight after load can land mid-transition.
      await expect.poll(async () =>
        (await sizes()).map((d) => (d.active ? 'A' : '.') + d.w).join(' ')
      ).toBe('A12px .4px .4px');

      // The hit target must stay usable despite the 14px visual cell. Width is
      // free, but height is capped by the 27px gap between dots -- a taller box
      // overlaps its neighbour and steals its clicks. So: 44px wide, and at
      // least the 24px WCAG 2.5.8 minimum tall (not the 44px AAA figure).
      const hit = await page.evaluate(() => {
        const s = getComputedStyle(document.querySelector('.section-nav a'), '::before');
        return { w: parseInt(s.width, 10), h: parseInt(s.height, 10) };
      });
      expect(hit.w).toBeGreaterThanOrEqual(44);
      expect(hit.h).toBeGreaterThanOrEqual(24);
      expect(hit.h).toBeLessThan(27);

      // White dots would be invisible on the light Projects background.
      await page.locator('#nav-menu a[href="#section-projects"]').click();
      await expect.poll(async () => (await sizes())[0].bg).toBe('rgb(0, 0, 0)');
      await page.locator('#nav-menu a[href="#section-contact"]').click();
      await expect.poll(async () => (await sizes())[0].bg).toBe('rgb(255, 255, 255)');
    });

  test('each dot navigates to its own section', async ({ page }) => {
    await page.goto('/');
    // The dots sit 27px apart, so an over-large hit area overlaps its
    // neighbours -- and because the later element wins the hit test, one dot
    // silently activates another. Clicking every dot is the only way to catch
    // that, and nothing exercised these before.
    for (const id of SECTIONS) {
      await page.locator(`.section-nav a[href="${id}"]`).click();
      await expect.poll(() => page.evaluate(() =>
        document.querySelector('#nav-menu li.active a')?.getAttribute('href')
      ), { message: `dot ${id} activated the wrong section` }).toBe(id);
    }
  });

  test('track the section in view', async ({ page }) => {
    await page.goto('/');
    const dots = page.locator('.section-nav li');
    await expect(dots).toHaveCount(3);
    await expect(dots.nth(0)).toHaveClass(/active/);

    await page.locator('#section-contact').scrollIntoViewIfNeeded();
    await expect(dots.nth(2)).toHaveClass(/active/);
  });
});
