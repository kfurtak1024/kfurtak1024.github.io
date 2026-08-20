import { test, expect } from '@playwright/test';

const SECTIONS = ['#section-intro', '#section-projects', '#section-contact'];

// A build without a real licence key uses a dev placeholder, and fullpage.js
// rightly complains on the console about it. Tolerate that one message only on
// runs that are not expected to carry production secrets.
//
// EXPECT_REAL_SECRETS is set by CI from the *event* (a push to main), never
// from whether the secret happens to be present: keying it off the secret
// would let a deleted or renamed secret silently relax this assertion instead
// of failing it -- which is the exact scenario worth catching, because that
// build is the one about to deploy with the nag visible to visitors.
const licenseNoiseAllowed = process.env.EXPECT_REAL_SECRETS !== 'true';
const isLicenseNoise = (m) => licenseNoiseAllowed &&
  (m.includes('licenseKey') || m.includes('alvarotrigo.com/fullPage/pricing'));

/** Collects same-origin failures. External hosts (Google Fonts) are ignored on
 *  purpose -- this suite verifies our build, not a third party's uptime. */
function watchForErrors(page) {
  const errors = [];
  const sameOrigin = (url) => {
    try {
      return new URL(url).hostname === 'localhost';
    } catch {
      return false;
    }
  };

  page.on('console', (m) => {
    if (m.type() === 'error' && !isLicenseNoise(m.text())) {
      errors.push(`console: ${m.text()}`);
    }
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

test('loads without page or same-origin request errors', async ({ page }) => {
  const errors = watchForErrors(page);
  await page.goto('/');
  await expect(page.locator('#fullpage')).toBeVisible();
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test('all three sections are present and fullpage initialises', async ({ page }) => {
  await page.goto('/');
  for (const s of SECTIONS) await expect(page.locator(s)).toHaveCount(1);
  // fullpage adds .fp-section once it has taken over the markup.
  await expect(page.locator('#section-intro')).toHaveClass(/fp-section/);
  await expect(page.locator('#section-intro')).toHaveClass(/active/);
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
      await expect(page.locator(SECTIONS[i])).toHaveClass(/active/);
      await expect(navItems.nth(i).locator('..')).toHaveClass(/active/);
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
    await toggle.click();
    await expect(navbar).toHaveClass(/navbar-mobile/);

    await page.locator('#nav-menu a.nav-menu-item').nth(1).click();
    await expect(navbar).not.toHaveClass(/navbar-mobile/);
    await expect(page.locator('#section-projects')).toHaveClass(/active/);
  });
});
