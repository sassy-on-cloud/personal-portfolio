import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from '@playwright/test';
import { createSiteServer } from './static-server.mjs';

const root = path.resolve('site');
const reportDir = path.resolve('.lighthouseci');
const reportBase = path.join(reportDir, 'lighthouse');
const server = createSiteServer(root);

await mkdir(reportDir, { recursive: true });
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});

const { port } = server.address();
const cli = path.resolve('node_modules/lighthouse/cli/index.js');
if (!existsSync(cli)) throw new Error('Lighthouse CLI is missing. Run npm ci first.');

try {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [
      cli,
      `http://127.0.0.1:${port}/`,
      '--quiet',
      '--chrome-flags=--headless=new --no-sandbox',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=json',
      '--output=html',
      `--output-path=${reportBase}`,
    ], {
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Lighthouse exited with ${signal ?? `code ${code}`}`));
    });
  });
  const report = JSON.parse(await readFile(`${reportBase}.report.json`, 'utf8'));
  let failed = false;
  for (const category of ['accessibility', 'best-practices', 'seo', 'performance']) {
    const score = report.categories[category].score;
    const percent = Math.round(score * 100);
    const label = `${category}: ${percent}`;
    console.log(label);
    if (category === 'performance' && score < 0.9) console.warn(`${label} (baseline warning; runner variance is expected)`);
    else if (score < 0.9) failed = true;
  }
  console.log(`Reports: ${reportBase}.report.html and ${reportBase}.report.json`);
  if (failed) process.exitCode = 1;
} finally {
  await new Promise(resolve => server.close(resolve));
}
