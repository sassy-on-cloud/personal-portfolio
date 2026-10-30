import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CONTACT, SKILLS, PROJECTS, JOURNEY, LAB_NOTES } from '../site/js/content.js';

// Set SITE_ORIGIN only after a production origin has been confirmed.
const siteOrigin = new URL(process.env.SITE_ORIGIN ?? 'https://shashwat-aryal.com.np');
if (siteOrigin.protocol !== 'https:' || siteOrigin.username || siteOrigin.password || siteOrigin.pathname !== '/' || siteOrigin.search || siteOrigin.hash) {
  throw new Error('SITE_ORIGIN must be an HTTPS origin without a path or credentials.');
}
const SITE_ORIGIN = siteOrigin.origin;
const CHECK_ONLY = process.argv.includes('--check');
const siteRoot = path.resolve('site');
const partialRoot = path.resolve('site-src/partials');
const readPartial = name => readFile(path.join(partialRoot, name), 'utf8');
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const projectPath = p => '/projects/' + p.id + '/';
const pages = [
  { path: '/', label: 'Home', title: 'Shashwat Aryal | Cloud & DevOps Portfolio', description: 'Cloud and DevOps projects, skills, and learning notes from Shashwat Aryal.' },
  { path: '/projects/', label: 'Projects', title: 'Projects | Shashwat Aryal', description: 'Project case studies, implementation notes, technologies, and repository evidence.' },
  ...PROJECTS.map(project => ({ path: projectPath(project), label: project.title, title: project.title + ' | Shashwat Aryal', description: project.summary, project })),
  { path: '/resume/', label: 'Resume', title: 'Resume | Shashwat Aryal', description: 'Education, projects, skills, and current learning areas.' },
  { path: '/journey/', label: 'Journey', title: 'Learning Journey | Shashwat Aryal', description: 'A documented sequence of Cloud and DevOps learning areas.' },
  { path: '/notes/', label: 'Lab Notes', title: 'Lab Notes | Shashwat Aryal', description: 'Current learning areas and clearly marked next platform steps.' },
  { path: '/contact/', label: 'Contact', title: 'Contact | Shashwat Aryal', description: 'Contact details for internships, junior roles, and mentorship.' },
  { path: '/terminal/', label: 'Terminal', title: 'Terminal | Shashwat Aryal', description: 'A safe, fixed-command portfolio terminal.' },
  { path: '/infrastructure/', label: 'Infrastructure', title: 'Site Infrastructure | Shashwat Aryal', description: 'How this static portfolio is checked, secured, and published.' },
];
const navPages = pages.filter(p => !p.project);
const url = route => SITE_ORIGIN + route;
const [headTpl, railTpl, headerTpl, footer] = await Promise.all(['head.html', 'rail.html', 'header.html'].map(readPartial).concat([readPartial('footer.html')]));
const fill = (tpl, values) => Object.entries(values).reduce((s, [k, v]) => s.replaceAll('{{' + k + '}}', v), tpl);
async function writeGenerated(file, data) {
  if (CHECK_ONLY) {
    const actual = await readFile(file, 'utf8').catch(() => null);
    if (actual !== data) throw new Error('Generated page is stale: ' + path.relative(process.cwd(), file));
  } else {
    await writeFile(file, data);
  }
}
const list = items => items?.length ? '<ul>' + items.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '';
const card = (p, i) => '<article class="card project-card"><p class="eyebrow">PROJECT / ' + String(i + 1).padStart(2, '0') + '</p><h2><a href="' + projectPath(p) + '">' + esc(p.title) + '</a></h2><p class="status-chip' + (p.status.toLowerCase().includes('progress') ? ' status-in-progress' : '') + '">' + esc(p.status) + '</p><p>' + esc(p.summary) + '</p><ul class="tag-list">' + p.stack.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><p class="link-row"><a href="' + projectPath(p) + '">Case study</a> <a href="' + esc(p.repo) + '" rel="noopener">Repository</a></p></article>';

function body(page) {
  const p = page.project;
  if (page.path === '/') return '<p class="eyebrow">PROFILE / KATHMANDU, NEPAL</p><h1>Cloud systems, built with care.</h1><p class="lede">I\'m a BSc CSIT student building practical Cloud and DevOps skills through real projects, and writing down what works, what broke and what I changed.</p><section><h2>About</h2><p>I\'m in the sixth semester of a BSc CSIT degree in Nepal. I learn by building small, complete things and documenting them.</p><p><a href="/resume/">Read the resume</a> · <a href="/projects/">Explore the projects</a></p></section><section><h2>Areas of work</h2><ul>' + SKILLS.slice(0, 4).map(g => '<li><strong>' + esc(g.group) + '</strong> — ' + esc(g.items.slice(0, 3).map(x => x[0]).join(', ')) + '</li>').join('') + '</ul></section><section><h2>Latest projects</h2><div class="card-grid">' + PROJECTS.slice(0, 3).map(card).join('') + '</div><p><a href="/projects/">All projects</a></p></section><section class="terminal-teaser"><h2>Try the fixed-command terminal</h2><p>A small simulated interface for looking up portfolio information.</p><a href="/terminal/">Open terminal</a></section><section><h2>Contact</h2><p>I\'m looking for internships, junior roles and mentors in Cloud and DevOps.</p><p><a class="btn primary" href="/contact/">Contact me</a></p></section>';
  if (page.path === '/projects/') return '<p class="eyebrow">SELECTED WORK</p><h1>Projects</h1><p class="lede">Project work, learning labs, and repository evidence.</p><div class="card-grid">' + PROJECTS.map(card).join('') + '</div>';
  if (p) {
    const i = PROJECTS.indexOf(p);
    return '<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/projects/">Projects</a> / ' + esc(p.title) + '</nav><p class="eyebrow">CASE STUDY</p><h1>' + esc(p.title) + '</h1><p class="status-chip' + (p.status.toLowerCase().includes('progress') ? ' status-in-progress' : '') + '">' + esc(p.status) + '</p><p class="lede">' + esc(p.summary) + '</p><section><h2>Problem</h2><p>' + esc(p.problem) + '</p></section><section><h2>Approach</h2><p>' + esc(p.solution) + '</p></section>' + (p.flow?.length ? '<section><h2>Architecture</h2><ol>' + p.flow.map(x => '<li>' + esc(x[0]) + '</li>').join('') + '</ol></section>' : '') + (p.security ? '<section><h2>Security</h2><p>' + esc(p.security) + '</p></section>' : '') + (p.implemented?.length ? '<section><h2>Implemented</h2>' + list(p.implemented) + '</section>' : '') + (p.planned?.length ? '<section><h2>Planned</h2>' + list(p.planned) + '</section>' : '') + (p.evidence ? '<section><h2>Evidence</h2><p>' + esc(p.evidence) + '</p></section>' : '') + (p.lessons ? '<section><h2>Lessons</h2><p>' + esc(p.lessons) + '</p></section>' : '') + '<section><h2>Technologies</h2><ul class="tag-list">' + p.stack.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><p><a href="' + esc(p.repo) + '" rel="noopener">View public repository</a></p></section><nav class="pager" aria-label="Project navigation">' + (PROJECTS[i - 1] ? '<a href="' + projectPath(PROJECTS[i - 1]) + '">Previous: ' + esc(PROJECTS[i - 1].title) + '</a>' : '<span></span>') + (PROJECTS[i + 1] ? '<a href="' + projectPath(PROJECTS[i + 1]) + '">Next: ' + esc(PROJECTS[i + 1].title) + '</a>' : '') + '</nav>';
  }
  if (page.path === '/resume/') return '<p class="eyebrow">PROFILE DOCUMENT</p><h1>Resume</h1><p class="lede">BSc CSIT student in Nepal, building Cloud and DevOps skills through practical projects.</p><p class="link-row"><a class="btn primary" href="/assets/Shashwat-Aryal-Resume.pdf" download>Download PDF</a> <button class="btn print-button" type="button">Print</button></p><nav class="jump-links" aria-label="Resume sections"><a href="#education">Education</a><a href="#resume-projects">Projects</a><a href="#skills">Skills</a><a href="#learning">Learning</a></nav><section id="education"><h2>Education</h2><p>BSc CSIT, sixth semester, Nepal.</p></section><section id="resume-projects"><h2>Projects</h2>' + PROJECTS.map(x => '<details><summary>' + esc(x.title) + ' — ' + esc(x.status) + '</summary><p>' + esc(x.summary) + '</p><p><a href="' + esc(x.repo) + '" rel="noopener">Repository</a></p></details>').join('') + '</section><section id="skills"><h2>Skills</h2>' + SKILLS.map(g => '<details><summary>' + esc(g.group) + '</summary><ul>' + g.items.map(([n, s]) => '<li>' + esc(n) + ' — ' + (s === 'used' ? 'Used in projects' : 'Learning') + '</li>').join('') + '</ul></details>').join('') + '</section><section id="learning"><h2>Learning</h2><ol>' + JOURNEY.map(([t, d]) => '<li><strong>' + esc(t) + '</strong> — ' + esc(d) + '</li>').join('') + '</ol></section>';
  if (page.path === '/journey/') return '<p class="eyebrow">CONTINUOUS LEARNING</p><h1>Journey</h1><p class="lede">The order I learned things in. I\'ve left out dates I can\'t back up with repository history.</p><ol class="timeline">' + JOURNEY.map(([t, d, ongoing]) => '<li class="' + (ongoing ? 'ongoing' : '') + '"><h2>' + esc(t) + (ongoing ? ' (ongoing)' : '') + '</h2><p>' + esc(d) + '</p></li>').join('') + '</ol>';
  if (page.path === '/notes/') return '<p class="eyebrow">OPEN NOTEBOOK</p><h1>Lab notes</h1><p class="lede">Current learning areas and clearly marked next steps.</p><div class="card-grid">' + LAB_NOTES.map(x => '<article class="card"><p class="eyebrow">' + esc(x.label) + '</p><h2>' + esc(x.title) + '</h2><p>' + esc(x.text) + '</p><p class="status-chip">' + esc(x.status) + '</p></article>').join('') + '</div>';
  if (page.path === '/contact/') return '<p class="eyebrow">DIRECT CHANNEL</p><h1>Contact</h1><p class="lede">I\'m looking for internships, junior roles and mentors in Cloud and DevOps. Email is the best way to reach me.</p><dl class="contact-details"><dt>Email</dt><dd><a href="mailto:' + esc(CONTACT.email) + '">' + esc(CONTACT.email) + '</a></dd><dt>Phone</dt><dd><a href="tel:' + esc(CONTACT.phone.replaceAll(' ', '')) + '">' + esc(CONTACT.phone) + '</a></dd><dt>GitHub</dt><dd><a href="' + esc(CONTACT.github) + '" rel="noopener">GitHub profile</a></dd><dt>LinkedIn</dt><dd><a href="' + esc(CONTACT.linkedin) + '" rel="noopener">LinkedIn profile</a></dd><dt>Resume</dt><dd><a href="/assets/Shashwat-Aryal-Resume.pdf" target="_blank" rel="noopener noreferrer">View resume (PDF)</a></dd></dl>';
  if (page.path === '/terminal/') return '<p class="eyebrow">FIXED COMMAND DEMO</p><h1>Terminal</h1><p class="lede">A simulated terminal with a fixed list of commands. It cannot execute shell commands, run programs, or make network requests.</p><p><a href="/projects/">Prefer to read? Go to Projects.</a></p><section id="terminal-app" class="terminal-app" aria-label="Portfolio terminal"><div id="terminal-output" class="terminal-output" role="log" aria-live="polite" aria-relevant="additions text"></div><form id="terminal-form" class="terminal-form" autocomplete="off"><label for="terminal-input">visitor@portfolio:~$</label><input id="terminal-input" type="text" maxlength="120" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="go"><button class="btn" type="submit">Run</button></form><p><a id="terminal-leave" href="/projects/">Leave terminal and read projects</a></p><noscript><p>The interactive command prompt needs JavaScript. The rest of the portfolio and its project pages remain readable without it.</p></noscript><ul class="terminal-command-list"><li>help</li><li>about</li><li>projects</li><li>project &lt;slug&gt;</li><li>skills</li><li>journey</li><li>contact</li><li>resume</li><li>theme</li><li>clear</li><li>whoami</li><li>ls</li><li>open &lt;page&gt;</li></ul></section>';
  if (page.path === '/infrastructure/') return '<p class="eyebrow">SITE NOTES</p><h1>Infrastructure</h1><p class="lede">How this static portfolio is built, checked, and published.</p><ol><li>GitHub repository contains source and static output in <code>site/</code>.</li><li>GitHub Actions runs Playwright, axe, and Lighthouse quality checks.</li><li>Cloudflare Pages serves the static site and applies <code>site/_headers</code>.</li><li>The visitor\'s browser reads the static files.</li></ol><p>This repository has no application backend.</p>';
  return '';
}

for (const page of pages) {
  const currentPath = page.project ? '/projects/' : page.path;
  const link = x => '<a href="' + x.path + '"' + (x.path === currentPath ? ' aria-current="page"' : '') + '>' + esc(x.label) + '</a>';
  const headerNav = navPages.map(x => '<li>' + link(x) + '</li>').join('');
  const head = fill(headTpl, { TITLE: esc(page.title), DESCRIPTION: esc(page.description), CANONICAL: esc(url(page.path)), OG_TITLE: esc(page.title), OG_DESCRIPTION: esc(page.description), OG_URL: esc(url(page.path)), OG_IMAGE: esc(url('/assets/og-image.png')) });
  const learningItems = LAB_NOTES.filter(item => item.status.toLowerCase() === 'learning').slice(0, 3);
  const plannedItem = LAB_NOTES.find(item => item.status.toLowerCase() === 'planned');
  const nowItems = learningItems.map(item => '<li><a href="/notes/">' + esc(item.title) + '</a><span class="now-label">Learning</span></li>').join('');
  const nextPlanned = plannedItem ? '<a href="/notes/">' + esc(plannedItem.title) + '</a> <span class="now-label planned">Planned</span>' : '';
  const rail = fill(railTpl, { NOW_ITEMS: nowItems, NEXT_PLANNED: nextPlanned, EMAIL: esc(CONTACT.email) });
  const header = fill(headerTpl, { NAV: headerNav });
  const mobileProfile = page.path === '/' ? '<section class="mobile-profile" aria-label="Profile"><picture class="mobile-photo"><source srcset="/assets/profile.webp" type="image/webp"><img src="/assets/profile.jpg" width="60" height="60" alt="Portrait of Shashwat Aryal"></picture><div class="mobile-profile-copy"><strong>Shashwat Aryal</strong><span class="mobile-role">Aspiring Cloud &amp; DevOps Engineer</span><span class="mobile-location">Kathmandu, Nepal</span></div><div class="resume-actions"><a class="btn primary" href="/assets/Shashwat-Aryal-Resume.pdf" download>Download resume (PDF)</a><a class="btn resume-view" href="/assets/Shashwat-Aryal-Resume.pdf" target="_blank" rel="noopener noreferrer">View (PDF)</a></div></section>' : '';
  const html = '<!doctype html>\n<html lang="en" data-theme="dark">\n<head>' + head + '</head>\n<body><a class="skip" href="#main">Skip to content</a><div class="scroll-progress" aria-hidden="true"></div>' + header + '<main id="main" class="page-layout">' + mobileProfile + '<aside class="profile-rail" aria-label="Profile and quick actions">' + rail + '</aside><div class="main-content"><article class="page-body">' + body(page) + '</article></div></main>' + footer + '<script type="module" src="/js/multipage.js?v=2"></script>' + (page.path === '/' ? '<script defer src="/js/legacy-hash.js?v=2"></script>' : '') + '</body></html>\n';
  const destination = path.join(siteRoot, page.path === '/' ? 'index.html' : page.path.slice(1), page.path === '/' ? '' : 'index.html');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeGenerated(destination, html);
}
const notFoundTitle = 'Page not found | Shashwat Aryal';
const notFoundDescription = 'The requested portfolio page could not be found.';
const notFoundHead = fill(headTpl, {
  TITLE: esc(notFoundTitle),
  DESCRIPTION: esc(notFoundDescription),
  CANONICAL: esc(url('/404.html')),
  OG_TITLE: esc(notFoundTitle),
  OG_DESCRIPTION: esc(notFoundDescription),
  OG_URL: esc(url('/404.html')),
  OG_IMAGE: esc(url('/assets/og-image.png')),
}).replace('<link rel="canonical"', '<meta name="robots" content="noindex">\n<link rel="canonical"');
const notFoundNav = navPages.map(page => '<li><a href="' + page.path + '">' + esc(page.label) + '</a></li>').join('');
const notFoundHeader = fill(headerTpl, { NAV: notFoundNav });
const notFoundHtml = '<!doctype html>\n<html lang="en" data-theme="dark">\n<head>' + notFoundHead + '</head>\n<body><a class="skip" href="#main">Skip to content</a><div class="scroll-progress" aria-hidden="true"></div>' + notFoundHeader + '<main id="main" class="section notfound"><p class="kicker">Error 404</p><h1>That page doesn\'t exist.</h1><p class="lede">The link may be mistyped or out of date. The portfolio lives on one page.</p><p><a class="btn primary" href="/">Go to the home page</a></p></main>' + footer + '<script type="module" src="/js/multipage.js?v=2"></script></body></html>\n';
await writeGenerated(path.join(siteRoot, '404.html'), notFoundHtml);
const locations = SITE_ORIGIN ? pages.map(x => '<url><loc>' + esc(url(x.path)) + '</loc></url>').join('') : '';
const pageData = 'export const PAGES = ' + JSON.stringify(pages.map(({ path, label, title }) => ({ path, label, title })), null, 2) + ';\n';
await writeGenerated(path.join(siteRoot, 'js/page-data.js'), pageData);
const pageAliases = {
  '/projects/': ['work', 'portfolio', 'case study'],
  '/resume/': ['cv', 'education', 'skills', 'tools'],
  '/notes/': ['lab', 'learning'],
  '/contact/': ['email', 'phone', 'hire'],
};
const searchIndex = [
  ...pages.filter(x => !x.project).map(x => ({ group: 'Pages', title: x.label, detail: x.title, keywords: pageAliases[x.path] ?? [], body: x.description, kind: 'navigate', target: x.path })),
  ...PROJECTS.map(x => ({ group: 'Projects', title: x.title, detail: x.status, keywords: [...x.categories, 'project', ...(x.stack.includes('Terraform') ? ['tf'] : [])], body: [x.summary, ...x.stack, ...x.categories].join(' '), kind: 'navigate', target: projectPath(x) })),
  { group: 'Skills', title: 'Skills', detail: 'Resume skills section', keywords: ['tools', 'technology'], body: '', kind: 'navigate', target: '/resume/#skills' },
  ...SKILLS.flatMap(group => group.items.map(([name, label]) => ({ group: 'Skills', title: name, detail: group.group + ' · ' + (label === 'used' ? 'Used in projects' : 'Learning'), keywords: [group.group, label === 'used' ? 'used in projects' : 'learning'], body: group.group, kind: 'navigate', target: '/resume/#skills' }))),
  ...JOURNEY.map(([title, text, ongoing]) => ({ group: 'Journey', title, detail: ongoing ? 'Ongoing' : 'Journey step', keywords: ['journey', ongoing ? 'learning' : 'completed'], body: text, kind: 'navigate', target: '/journey/' })),
  ...LAB_NOTES.map(x => ({ group: 'Notes', title: x.title, detail: x.status, keywords: [x.label, 'lab', 'notes'], body: x.text, kind: 'navigate', target: '/notes/' })),
  ...[
    { title: 'Toggle theme', detail: 'Switch dark or light theme', kind: 'theme' },
    { title: 'Download resume (PDF)', detail: 'Save the resume PDF', keywords: ['cv'], kind: 'download' },
    { title: 'Copy email', detail: CONTACT.email, kind: 'copy' },
    { title: 'Open GitHub', detail: CONTACT.github, kind: 'external', target: CONTACT.github },
    { title: 'Open LinkedIn', detail: CONTACT.linkedin, kind: 'external', target: CONTACT.linkedin },
    { title: 'Open terminal', detail: 'Visit the fixed-command terminal', kind: 'navigate', target: '/terminal/' },
  ].map(x => ({ group: 'Actions', keywords: [], body: '', ...x })),
];
await writeGenerated(path.join(siteRoot, 'js/search-data.js'), 'export const SEARCH_INDEX = ' + JSON.stringify(searchIndex, null, 2) + ';\n');
await writeGenerated(path.join(siteRoot, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + locations + '</urlset>\n');
await writeGenerated(path.join(siteRoot, 'robots.txt'), SITE_ORIGIN ? 'User-agent: *\nAllow: /\nSitemap: ' + SITE_ORIGIN + '/sitemap.xml\n' : 'User-agent: *\nAllow: /\n');
console.log((CHECK_ONLY ? 'Checked' : 'Generated') + ' ' + pages.length + ' clean-URL pages' + (SITE_ORIGIN ? ' for ' + SITE_ORIGIN : ' without an unconfirmed site origin') + '.');
