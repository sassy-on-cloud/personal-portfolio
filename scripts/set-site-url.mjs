import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const value = process.argv[2];
let origin;
try {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error();
  }
  origin = parsed.origin;
} catch {
  console.error('Pass an HTTPS origin like https://example.com (no path or credentials).');
  process.exit(1);
}

const builder = fileURLToPath(new URL('./build-pages.mjs', import.meta.url));
const result = spawnSync(process.execPath, [builder], {
  stdio: 'inherit',
  env: { ...process.env, SITE_ORIGIN: origin },
});
if (result.error) throw result.error;
if (result.status !== 0) process.exitCode = result.status ?? 1;
