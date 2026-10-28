import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { createSiteServer } from '../scripts/static-server.mjs';

const readProjectFile = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.svg', '.txt', '.xml', '.yaml', '.yml']);
const mojibakePattern = /\u00e2\u20ac|\u00e2\u2020|\u00c3[\u0080-\u00bf]|\u00c2[\u00a0-\u00bf]/u;

async function collectTextFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTextFiles(file));
    else if (textExtensions.has(path.extname(entry.name).toLowerCase())) files.push(file);
  }
  return files;
}

test('Cloudflare headers keep scripts local and disable risky embedding and object content', async () => {
  const headers = await readProjectFile('../site/_headers');
  expect(headers).toContain("script-src 'self'");
  expect(headers).toContain("base-uri 'none'");
  expect(headers).toContain("object-src 'none'");
  expect(headers).toContain("form-action 'none'");
  expect(headers).toContain("frame-ancestors 'none'");
  expect(headers).toContain('X-Content-Type-Options: nosniff');
  expect(headers).toContain('/css/*');
  expect(headers).toContain('/favicon.svg');
  expect(headers).not.toContain("'unsafe-inline'");
});

test('repository ignores local dependencies, environment files, and generated reports', async () => {
  const gitignore = await readProjectFile('../.gitignore');
  expect(gitignore).toContain('node_modules/');
  expect(gitignore).toContain('.env');
  expect(gitignore).toContain('.env.*');
  expect(gitignore).toContain('.sixth/');
  expect(gitignore).toContain('*.pem');
  expect(gitignore).toContain('test-results/');
  expect(gitignore).toContain('.lighthouseci/');
  expect(gitignore).toContain('Thumbs.db');
  expect(gitignore).toContain('*.log');
  expect(gitignore).toContain('.vscode/settings.json');
});

test('site sources contain no mojibake and every page head starts with UTF-8 metadata', async () => {
  for (const rootName of ['site', 'site-src']) {
    const root = fileURLToPath(new URL('../' + rootName + '/', import.meta.url));
    for (const file of await collectTextFiles(root)) {
      const contents = await readFile(file, 'utf8');
      const relativePath = path.relative(root, file).replaceAll(path.sep, '/');
      expect(contents, rootName + '/' + relativePath).not.toMatch(mojibakePattern);

      if (rootName === 'site' && path.extname(file).toLowerCase() === '.html') {
        const head = contents.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
        expect(head, relativePath).not.toBeNull();
        expect(head[1], relativePath).toMatch(/^\s*<meta\s+charset=["']utf-8["']\s*\/?>/i);
      }

      if (rootName === 'site-src' && relativePath === 'partials/head.html') {
        expect(contents).toMatch(/^\s*<meta\s+charset=["']utf-8["']\s*\/?>/i);
      }
    }
  }
});

test('static server sends a UTF-8 content type for XML', async () => {
  const server = createSiteServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/sitemap.xml`);
    expect(response.ok).toBeTruthy();
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
