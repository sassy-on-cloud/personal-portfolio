import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const readProjectFile = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

test('Cloudflare headers keep scripts local and disable risky embedding and object content', async () => {
  const headers = await readProjectFile('../site/_headers');
  expect(headers).toContain("script-src 'self'");
  expect(headers).toContain("object-src 'none'");
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
});
