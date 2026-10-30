import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const routes = [
  '/', '/projects/', '/projects/cloud-native-devops-platform/', '/projects/producthub/',
  '/projects/terraform-aws-infrastructure/', '/projects/linux-server-administration/',
  '/projects/aws-cloud-quest/', '/resume/', '/journey/', '/notes/', '/contact/',
  '/terminal/', '/infrastructure/',
];

test('rendered pages contain no mojibake and start their head with UTF-8 metadata', async ({ page }) => {
  const mojibakePattern = /\u00e2\u20ac|\u00e2\u2020|\u00c3[\u0080-\u00bf]|\u00c2[\u00a0-\u00bf]/u;
  for (const route of [...routes, '/404.html']) {
    const response = await page.goto(route);
    expect(response.status(), route).toBe(200);
    const firstHeadElement = await page.locator('head').evaluate(head => head.firstElementChild?.outerHTML ?? '');
    expect(firstHeadElement, route).toMatch(/^<meta charset="utf-8">$/i);
    expect(await page.locator('body').innerText(), route).not.toMatch(mojibakePattern);
  }
});

test('every clean route returns one h1, a unique title, canonical URL, and current nav item', async ({ page }) => {
  const titles = new Set();
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response.status(), route).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    const title = await page.title();
    expect(titles.has(title), route).toBe(false);
    titles.add(title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://shashwat-aryal.com.np${route}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://shashwat-aryal.com.np${route}`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://shashwat-aryal.com.np/assets/og-image.png');
    const current = page.locator('.site-header .nav-menu a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('href', route.startsWith('/projects/') && route !== '/projects/' ? '/projects/' : route);
  }
});

test('new-tab links isolate the opener and referrer and use no javascript URLs', async ({ page }) => {
  for (const route of [...routes, '/404.html']) {
    await page.goto(route);
    const unsafeLinks = await page.locator('a').evaluateAll(anchors => anchors.filter(anchor => {
      const href = anchor.getAttribute('href') || '';
      const rel = new Set((anchor.getAttribute('rel') || '').toLowerCase().split(/\s+/));
      return href.toLowerCase().startsWith('javascript:') || (anchor.target === '_blank' && (!rel.has('noopener') || !rel.has('noreferrer')));
    }).map(anchor => anchor.getAttribute('href')));
    expect(unsafeLinks, route).toEqual([]);
  }
});

test('each page has one primary page navigation list in the top bar', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    const pageNavs = page.locator('nav[aria-label="Primary"] ul.nav-menu');
    await expect(pageNavs, route).toHaveCount(1);
    await expect(pageNavs.locator('a')).toHaveCount(8);
    await expect(page.locator('.profile-rail nav')).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/404.html');
  await expect(page.locator('.site-header .nav-menu a')).toHaveCount(8);
  await expect(page.locator('.site-header .nav-toggle')).toBeVisible();
  await page.locator('.site-header .nav-toggle').click();
  await expect(page.locator('#nav-menu .nav-menu a[href="/projects/"]')).toBeVisible();
});

test('page navigation uses clean URLs without hashes', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav-menu a[href="/projects/"]').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/projects/');
  expect(new URL(page.url()).hash).toBe('');
  await page.locator('.nav-menu a[href="/resume/"]').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/resume/');
  expect(new URL(page.url()).hash).toBe('');
});

test('rail Now items come from content, copy email announces success, and rail fits at 1366x768', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/');
  await expect(page.locator('.rail-now li')).toHaveCount(2);
  await expect(page.locator('.rail-now')).toContainText('Container orchestration');
  await expect(page.locator('.rail-now')).toContainText('Metrics & dashboards');
  await expect(page.locator('.rail-now')).toContainText('Learning');
  await expect(page.locator('.rail-now')).toContainText('Planned');
  await page.getByRole('button', { name: 'Copy email' }).click();
  await expect(page.locator('.copy-status')).toHaveText('Email address copied.');
  const sizing = await page.locator('.profile-rail').evaluate(el => ({ scroll: el.scrollHeight, client: el.clientHeight, overflow: getComputedStyle(el).overflowY }));
  expect(sizing.scroll).toBeLessThanOrEqual(sizing.client + 1);
  expect(sizing.overflow).not.toBe('auto');
});

for (const [fragment, route] of Object.entries({ projects: '/projects/', journey: '/journey/', lab: '/notes/', contact: '/contact/', about: '/', skills: '/resume/' })) {
  test('legacy hash ' + fragment + ' maps to ' + route, async ({ page }) => {
    await page.goto('/#' + fragment);
    await expect.poll(() => new URL(page.url()).pathname).toBe(route);
  });
}

test('shared theme preference persists across page navigation', async ({ page }) => {
  await page.goto('/');
  await page.locator('.theme-toggle').first().click();
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.goto('/projects/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
});

test('command palette opens by shortcut, filters projects, and restores focus on Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('.nav-controls .palette-trigger');
  await page.keyboard.press('Control+k');
  await expect(page.locator('#command-palette')).toHaveJSProperty('open', true);
  await expect(page.locator('#palette-query')).toBeFocused();
  await page.locator('#palette-query').fill('terraform');
  await expect(page.getByRole('option', { name: /Terraform AWS Infrastructure/ }).first()).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Escape');
  await expect(page.locator('#command-palette')).toHaveJSProperty('open', false);
  await expect(trigger).toBeFocused();
});

test('command palette Enter opens the Terraform project and palette roles are accessible', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav-controls .palette-trigger').click();
  await page.locator('#palette-query').fill('terraform');
  const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(report.violations.map(item => item.id)).toEqual([]);
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).pathname).toBe('/projects/terraform-aws-infrastructure/');
});

test('command palette searches all indexed categories and provides useful empty-state suggestions', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav-controls .palette-trigger').click();
  const query = page.locator('#palette-query');
  const results = page.locator('#palette-results');
  for (const [term, expected] of [['skills', /Skills/], ['skill', /Skills/], ['terraform', /Terraform/], ['tf', /Terraform/], ['docker', /Docker/], ['cv', /Resume|Download resume/], ['email', /email/i], ['learning', /Learning/], ['terminal', /Terminal/i]]) {
    await query.fill(term);
    await expect(results.getByRole('option').filter({ hasText: expected }).first(), term).toBeVisible();
  }
  await query.fill('aws project');
  await expect(results.getByRole('option').filter({ hasText: /AWS/ }).first()).toBeVisible();
  await query.fill('skills');
  await expect(results.locator('[aria-label="Skills"] .palette-show-all')).toContainText(/Show all/);
  await results.locator('[aria-label="Skills"] .palette-show-all').click();
  await expect(results.locator('[aria-label="Skills"] [role="option"]')).toHaveCount(36);
  await query.fill('zzqv nonsense');
  await expect(page.locator('#palette-empty')).toContainText('No matches for');
  await expect(page.locator('#palette-empty')).toContainText('Examples:');
  await expect(results.locator('[aria-label="Pages"] [role="option"]')).toHaveCount(8);
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(report.violations.map(item => item.id), theme).toEqual([]);
  }
  await page.keyboard.press('Escape');
});

test('terminal runs fixed commands, keeps history, autocompletes, and escapes input', async ({ page }) => {
  await page.goto('/terminal/');
  const input = page.locator('#terminal-input');
  const output = page.locator('#terminal-output');
  await input.fill('help');
  await input.press('Enter');
  await expect(output).toContainText('project <slug>');
  await input.fill('projects');
  await input.press('Enter');
  await expect(output).toContainText('terraform-aws-infrastructure');
  await input.fill('nonsense');
  await input.press('Enter');
  await expect(output).toContainText('Unknown command. Type "help"');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('nonsense');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('');
  await input.fill('hel');
  await input.press('Tab');
  await expect(input).toHaveValue('help ');
  await input.fill('<img src=x onerror=alert(1)>');
  await input.press('Enter');
  await expect(output.locator('img')).toHaveCount(0);
  await expect(output).toContainText('Unknown command');
  await input.press('Escape');
  await expect(page.locator('#terminal-leave')).toBeFocused();
});

test('terminal no-JavaScript view keeps reading and internal navigation available', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/terminal/');
  await expect(page.locator('.terminal-command-list')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Prefer to read? Go to Projects.' })).toHaveAttribute('href', '/projects/');
  await context.close();
});

test('navigation and page content work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('.no-js-nav .nav-menu')).toBeVisible();
  await expect(page.locator('.mobile-profile a[download]')).toBeVisible();
  await page.locator('.no-js-nav a[href="/projects/"]').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/projects/');
  await expect(page.locator('.project-card')).toHaveCount(5);
  await page.goto('/404.html');
  await expect(page.locator('.no-js-nav a[href="/projects/"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
  await context.close();
});

test('mobile header controls fit without overlap or horizontal overflow', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 360, 390, 430, 600, 768, 900, 1024, 1180, 1200, 1366, 1440, 1920]) {
    await page.setViewportSize({ width, height: 844 });
    const layout = await page.evaluate(() => {
      const selectors = ['.brand', '.nav-controls .palette-trigger', '.nav-controls .theme-toggle', '.nav-controls .nav-toggle'];
      const boxes = selectors.map(selector => {
        const element = document.querySelector(selector);
        const rect = element.getBoundingClientRect();
        return { selector, visible: getComputedStyle(element).display !== 'none', x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
      });
      const links = [...document.querySelectorAll('#nav-menu .nav-menu a')].map((element, index) => {
        const rect = element.getBoundingClientRect();
        return { selector: `nav-link-${index}`, x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height, visible: element.checkVisibility() };
      });
      const visible = [...boxes, ...links].filter(box => box.visible);
      const intersections = [];
      for (let first = 0; first < visible.length; first += 1) {
        for (let second = first + 1; second < visible.length; second += 1) {
          if (visible[first].x < visible[second].right && visible[first].right > visible[second].x && visible[first].y < visible[second].bottom && visible[first].bottom > visible[second].y) intersections.push([visible[first].selector, visible[second].selector]);
        }
      }
      return { boxes, intersections, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth };
    });
    expect(layout.intersections, `${width}px header intersections`).toEqual([]);
    expect(layout.scrollWidth, `${width}px horizontal overflow`).toBeLessThanOrEqual(layout.clientWidth);
    for (const box of layout.boxes.filter(item => item.selector !== '.brand' && item.visible)) {
      expect(box.width, `${width}px ${box.selector} width`).toBeGreaterThanOrEqual(44);
      expect(box.height, `${width}px ${box.selector} height`).toBeGreaterThanOrEqual(44);
    }
  }
});

test('all pages avoid horizontal overflow across mobile, tablet and desktop in both themes', async ({ page }) => {
  test.setTimeout(120000);
  for (const theme of ['dark', 'light']) {
    for (const route of [...routes, '/404.html']) {
      for (const width of [320, 390, 768, 1024, 1366, 1440, 1920]) {
        await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
        await page.goto(route);
        await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
        const dimensions = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          document: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
        }));
        expect(dimensions.document, `${route} ${width}px ${theme} document overflow`).toBeLessThanOrEqual(dimensions.viewport);
        expect(dimensions.body, `${route} ${width}px ${theme} body overflow`).toBeLessThanOrEqual(dimensions.viewport);
      }
    }
  }
});

test('menu sheet supports keyboard, scrim, link navigation, focus, and inert background', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/projects/');
  const toggle = page.locator('.nav-toggle');
  const menu = page.locator('#nav-menu');
  const links = menu.locator('.nav-menu a');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveAttribute('aria-label', 'Close menu');
  await expect(menu).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('main')).toHaveJSProperty('inert', true);
  await expect(page.locator('main')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');
  await expect(menu.getByRole('button', { name: 'Search' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(menu.locator('.rail-social a').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('button', { name: 'Search' })).toBeFocused();
  await expect(links).toHaveCount(8);
  for (const [label, href] of [
    ['Home', '/'], ['Projects', '/projects/'], ['Resume', '/resume/'], ['Journey', '/journey/'],
    ['Lab Notes', '/notes/'], ['Contact', '/contact/'], ['Terminal', '/terminal/'], ['Infrastructure', '/infrastructure/'],
  ]) {
    const link = links.filter({ hasText: label });
    await expect(link).toHaveAttribute('href', href);
    await expect.poll(() => link.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);
  }
  await expect(links.filter({ hasText: 'Projects' })).toHaveAttribute('aria-current', 'page');
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(report.violations.map(item => item.id), `open menu in ${theme}`).toEqual([]);
  }
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toHaveAttribute('aria-label', 'Open menu');
  await expect(toggle).toBeFocused();
  await expect(page.locator('main')).toHaveJSProperty('inert', false);
  await expect(page.locator('main')).not.toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');

  await toggle.click();
  const panelBox = await menu.boundingBox();
  await page.locator('.menu-scrim').click({ position: { x: 8, y: 820 } });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(panelBox).not.toBeNull();

  await toggle.click();
  await links.filter({ hasText: 'Resume' }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/resume/');
  await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.nav-toggle').click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.nav-toggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('main')).toHaveJSProperty('inert', false);
});

test('search hint follows pointer capability and mobile palette remains touch-sized', async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.search-shortcut')).toBeVisible();
  await expect(page.locator('.search-shortcut')).toContainText(/(?:Ctrl|Cmd)\+K/);

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touchPage = await context.newPage();
  await touchPage.goto('/');
  await expect(touchPage.locator('.search-shortcut')).toBeHidden();
  await touchPage.locator('.nav-controls .palette-trigger').click();
  await expect(touchPage.locator('#command-palette')).toHaveJSProperty('open', true);
  await expect(touchPage.locator('.palette-close')).toBeVisible();
  const inputSize = await touchPage.locator('#palette-query').evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(inputSize).toBeGreaterThanOrEqual(16);
  await touchPage.keyboard.press('Escape');
  await context.close();
});

test('mobile identity appears only on home with a compact resume action row', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.mobile-profile')).toBeVisible();
  await expect(page.locator('.mobile-profile .resume-actions')).toContainText('Download resume (PDF)');
  await expect(page.locator('.mobile-profile .resume-actions')).toContainText('View (PDF)');
  await expect(page.locator('.mobile-profile').getByText('·', { exact: true })).toHaveCount(0);
  await page.goto('/projects/cloud-native-devops-platform/');
  await expect(page.locator('.mobile-profile')).toHaveCount(0);
});

test('capture menu screenshots at mobile and desktop widths in both themes', async ({ page }) => {
  const shots = path.resolve('artifacts/mobile-header');
  await mkdir(shots, { recursive: true });
  for (const theme of ['light', 'dark']) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto('/');
      await page.evaluate(value => { localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }, theme);
      await page.waitForTimeout(250);
      for (const state of ['closed', 'open']) {
        if (width === 390 && state === 'open') {
          await page.locator('.nav-toggle').click();
          await expect(page.locator('#nav-menu')).toHaveCSS('opacity', '1');
        }
        const target = path.join(shots, `menu-${state}-${theme}-${width}.png`);
        await page.screenshot({ path: target, fullPage: false });
        console.log(`Header screenshot: ${target}`);
      }
    }
  }
});

test('axe reports no WCAG A/AA issues on every route in both themes', async ({ page }) => {
  test.setTimeout(120000);
  for (const theme of ['dark', 'light']) {
    await page.goto('/');
    await page.evaluate(value => localStorage.setItem('theme', value), theme);
    for (const route of [...routes, '/404.html']) {
      await page.goto(route);
      const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(report.violations.map(item => item.id), route + ' in ' + theme).toEqual([]);
    }
  }
});

test('computed body, muted, link and primary button colors meet contrast thresholds in both themes', async ({ page }) => {
  const luminance = color => {
    const rgb = color.match(/[\d.]+/g).slice(0, 3).map(value => Number(value) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  };
  const ratio = (foreground, background) => {
    const a = luminance(foreground);
    const b = luminance(background);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  };
  await page.goto('/');
  for (const theme of ['dark', 'light']) {
    await page.evaluate(value => localStorage.setItem('theme', value), theme);
    await page.reload();
    const colors = await page.evaluate(() => {
      const button = document.createElement('a');
      button.href = '#';
      button.className = 'btn primary';
      button.textContent = 'Contrast sample';
      document.body.append(button);
      const styles = selector => getComputedStyle(document.querySelector(selector));
      const body = styles('body').color;
      const background = styles('body').backgroundColor;
      const muted = styles('.page-body .lede').color;
      const link = styles('.page-body a').color;
      const primary = getComputedStyle(button);
      const values = { body, background, muted, link, buttonText: primary.color, buttonBackground: primary.backgroundColor };
      button.remove();
      return values;
    });
    expect(ratio(colors.body, colors.background), theme + ' body').toBeGreaterThanOrEqual(7);
    expect(ratio(colors.muted, colors.background), theme + ' muted').toBeGreaterThanOrEqual(4.5);
    expect(ratio(colors.link, colors.background), theme + ' links').toBeGreaterThanOrEqual(4.5);
    expect(ratio(colors.buttonText, colors.buttonBackground), theme + ' primary button').toBeGreaterThanOrEqual(4.5);
  }
});

test('capture requested page, palette and theme screenshots', async ({ page }) => {
  const shots = path.resolve('artifacts/theme-comfort');
  await mkdir(shots, { recursive: true });
  const examples = [
    ['home', '/', false], ['projects', '/projects/', false], ['project', '/projects/producthub/', false],
    ['resume', '/resume/', false], ['terminal', '/terminal/', false], ['infrastructure', '/infrastructure/', false], ['palette', '/', true],
  ];
  for (const theme of ['light', 'dark']) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      for (const [name, route, palette] of examples) {
        await page.goto(route);
        await page.evaluate(value => { localStorage.setItem('theme', value); document.documentElement.dataset.theme = value; }, theme);
        if (palette) await page.locator('.nav-controls .palette-trigger').click();
        const target = path.join(shots, name + '-' + theme + '-' + width + '.png');
        await page.screenshot({ path: target, fullPage: !palette });
        if (palette) await page.keyboard.press('Escape');
      }
    }
  }
});
