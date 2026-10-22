// Usage: npm run set-site-url -- https://example.com
// Adds canonical, og:url, og:image (if site/assets/og-image.png exists), sitemap.xml and the robots.txt Sitemap line.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const arg = process.argv[2];
if (!arg || !/^https:\/\/[^/\s]+$/.test(arg)) { console.error('Pass an origin like https://example.com (no trailing slash).'); process.exit(1); }
const url = arg;
let html = readFileSync('site/index.html', 'utf8').replace(/\n<link rel="canonical"[^\n]*|\n<meta property="og:(url|image)"[^\n]*/g, '');
let tags = `\n<link rel="canonical" href="${url}/">\n<meta property="og:url" content="${url}/">`;
if (existsSync('site/assets/og-image.png')) tags += `\n<meta property="og:image" content="${url}/assets/og-image.png">\n<meta name="twitter:image" content="${url}/assets/og-image.png">`;
html = html.replace('<meta name="twitter:card"', `${tags.slice(1)}\n<meta name="twitter:card"`);
writeFileSync('site/index.html', html);
writeFileSync('site/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url}/</loc></url></urlset>\n`);
const robots = readFileSync('site/robots.txt', 'utf8').replace(/\nSitemap:.*\n?/g, '\n').trimEnd();
writeFileSync('site/robots.txt', `${robots}\nSitemap: ${url}/sitemap.xml\n`);
console.log(`Site URL set to ${url}`);
