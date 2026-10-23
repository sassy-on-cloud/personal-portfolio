import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  page.errors = [];
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('pageerror', e => page.errors.push(String(e)));
  page.on('response', r => { if (new URL(r.url()).origin === 'http://127.0.0.1:4173' && r.status() >= 400) page.errors.push(`${r.status()} ${r.url()}`); });
});

test('home loads with headline and no console or asset errors', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Cloud systems, built with care.');
  await expect(page.getByText('Aspiring Cloud & DevOps Engineer')).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(page.errors).toEqual([]);
});

test('every in-page nav link targets an existing section', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.nav-toggle')).toBeHidden();
  const hrefs = await page.locator('#nav-menu a').evaluateAll(as => as.map(a => a.getAttribute('href')));
  expect(hrefs).toHaveLength(7);
  for (const h of hrefs) await expect(page.locator(h)).toHaveCount(1);
});

test('reloading from a section returns to the top while direct section links still work', async ({ page }) => {
  await page.goto('/#projects');
  await expect(page).toHaveURL(/#projects$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('all in-page links resolve and IDs are unique', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const brokenTargets = [...document.querySelectorAll('a[href^="#"]')]
      .map(link => link.getAttribute('href').slice(1))
      .filter(id => id && !document.getElementById(id));
    return { duplicateIds, brokenTargets };
  });
  expect(result.duplicateIds).toEqual([]);
  expect(result.brokenTargets).toEqual([]);
});

test('navigation and project links remain available when JavaScript is disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#nav-menu')).toBeVisible();
  await expect(page.locator('.nav-toggle')).toBeHidden();
  await expect(page.locator('noscript a[href="https://github.com/sassy-on-cloud/cloud-native-devops-platform"]')).toHaveCount(1);
  await expect(page.locator('#skills-root')).not.toContainText('Loading');
  await expect(page.locator('#projects-root')).not.toContainText('Loading');
  await context.close();
});

test('mobile menu opens, closes on Escape and on link click', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/');
  const toggle = page.locator('.nav-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.locator('#nav-menu a[href="#skills"]').click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('theme toggle switches and persists', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.locator('.theme-toggle').click();
  const after = await html.getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after);
});

test('hero keeps a single accessible heading while the word reveal plays', async ({ page }) => {
  await page.goto('/');
  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toHaveAccessibleName('Cloud systems, built with care.');
  await expect(title.locator('.hero-word').first()).toHaveCSS('animation-name', 'hero-word-in');
});

test('workflow replay is explicitly illustrative and responds to reduced motion', async ({ page }) => {
  await page.goto('/');
  const diagram = page.locator('.pipeline-wrap');
  const bounds = await diagram.boundingBox();
  await page.mouse.move(bounds.x + bounds.width * .35, bounds.y + bounds.height * .4);
  await expect(diagram).toHaveCSS('--glow-x', '35%');
  const replay = page.getByRole('button', { name: 'Replay path' });
  await replay.click();
  await expect(page.locator('.pipeline-wrap')).toHaveClass(/is-replaying/);
  await expect(page.locator('#pipeline-feedback')).toContainText('not connected to live infrastructure');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await replay.click();
  await expect(page.locator('.pipeline-wrap')).not.toHaveClass(/is-replaying/);
  await expect(page.locator('#pipeline-feedback')).toContainText('Motion is minimized');
});

test('project section headings reveal as they enter view', async ({ page }) => {
  await page.goto('/');
  const heading = page.locator('#projects h2');
  await expect(heading).not.toHaveClass(/in/);
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toHaveClass(/in/);
});

test('project filtering updates visible cards and announces count', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#projects-root .card:visible');
  await expect(cards).toHaveCount(5);
  await page.getByRole('button', { name: 'Security' }).click();
  await expect(cards).toHaveCount(1);
  await expect(page.locator('#filter-status')).toContainText('Showing 1 of 5');
  await expect(page.getByRole('button', { name: 'Security' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'All' }).click();
  await expect(cards).toHaveCount(5);
});

test('lab notes separate current learning from planned platform work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#lab-root .lab-note')).toHaveCount(3);
  await expect(page.locator('#lab-root')).toContainText('Learning');
  await expect(page.locator('#lab-root')).toContainText('Planned');
  await expect(page.getByRole('link', { name: 'Start a conversation' })).toHaveAttribute('href', 'mailto:shashwataryal2026@gmail.com');
});

test('every project repo link points at the sassy-on-cloud GitHub account', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.locator('#projects-root a').evaluateAll(as => as.map(a => a.href));
  expect(hrefs.length).toBe(5);
  for (const h of hrefs) expect(h).toMatch(/^https:\/\/github\.com\/sassy-on-cloud\//);
  expect(hrefs).toContain('https://github.com/sassy-on-cloud/producthub-aws-deployment');
});

test('terminal runs known commands and rejects unknown ones as plain text', async ({ page }) => {
  await page.goto('/');
  await page.locator('#term-title').click();
  await page.locator('#term-in').fill('contact');
  await page.keyboard.press('Enter');
  await expect(page.locator('#term-out')).toContainText('shashwataryal2026@gmail.com');
  await page.locator('#term-in').fill('<img src=x onerror=alert(1)>');
  await page.keyboard.press('Enter');
  await expect(page.locator('#term-out')).toContainText('Unknown command');
  await expect(page.locator('#term-out img')).toHaveCount(0);
  await page.locator('#term-quick').getByRole('button', { name: 'clear' }).click();
  await expect(page.locator('#term-out > div')).toHaveCount(0);
});

test('contact links are correct and copy gives feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await expect(page.locator('#email-link')).toHaveAttribute('href', 'mailto:shashwataryal2026@gmail.com');
  await expect(page.locator('a[href^="tel:"]')).toHaveAttribute('href', 'tel:+9779765340161');
  await page.locator('#copy-email').click();
  await expect(page.locator('#copy-status')).toContainText(/copied|address is/i);
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('custom 404 page exists', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText("doesn't exist");
});

test('404 page theme control follows the saved preference across routes', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('theme', 'dark'));
  await page.goto('/404.html');
  const toggle = page.locator('.theme-toggle');
  await expect(toggle).toHaveAccessibleName('Switch to light mode');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAccessibleName('Switch to dark mode');
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

for (const theme of ['dark', 'light']) {
  test(`axe finds no WCAG A/AA violations in ${theme} theme`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(t => localStorage.setItem('theme', t), theme);
    await page.goto('/');
    await page.locator('#term-title').click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(results.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}


test('reduced-motion preference disables the pipeline animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const animationName = await page.locator('.pipeline li').first().evaluate(el => getComputedStyle(el).animationName);
  expect(animationName).toBe('none');
  await expect(page.locator('.hero-word').first()).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.project-grid .card').first()).toHaveCSS('opacity', '1');
});
