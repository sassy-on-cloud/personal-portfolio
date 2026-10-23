import { CONTACT, SKILLS, FILTERS, PROJECTS, JOURNEY, LAB_NOTES } from './content.js';
import { el } from './dom.js';
import { initTerminal } from './terminal.js';

const $ = (s, r = document) => r.querySelector(s);
const root = document.documentElement;
let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
root.classList.add('js');

function initNav() {
  const toggle = $('.nav-toggle');
  const menu = $('#nav-menu');
  const setOpen = (open) => { toggle.setAttribute('aria-expanded', String(open)); menu.classList.toggle('open', open); };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
  });
  if ('IntersectionObserver' in window) {
    const links = new Map([...menu.querySelectorAll('a')].map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) {
        links.forEach(a => a.removeAttribute('aria-current'));
        links.get(en.target.id)?.setAttribute('aria-current', 'location');
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }
}

function renderSkills() {
  const mount = $('#skills-root');
  mount.replaceChildren(...SKILLS.map(g => el('div', { class: 'skill-group reveal' }, [
    el('h3', { text: g.group }),
    el('ul', { class: 'tags' }, g.items.map(([name, status]) =>
      el('li', { class: `tag ${status}` }, [name, el('small', { text: status === 'learning' ? 'learning' : 'used in project' })]))),
  ])));
}

function section(title, content) { return content ? [el('h4', { text: title }), content] : []; }
const list = (items) => items && items.length ? el('ul', {}, items.map(t => el('li', { text: t }))) : null;

function projectCard(p, index) {
  const links = el('div', { class: 'card-links' }, [
    p.repo ? el('a', { class: 'btn small', href: p.repo, rel: 'noopener', 'aria-label': `${p.title} repository on GitHub`, text: 'Repository' }) : null,
    p.demo ? el('a', { class: 'btn small', href: p.demo, rel: 'noopener', text: 'Live demo' }) : null,
  ]);
  const flow = p.flow?.length
    ? el('ul', { class: 'flow', 'aria-label': 'Architecture flow' }, p.flow.map(([label, planned]) =>
        el('li', { class: planned ? 'planned' : '', text: planned ? `${label} (planned)` : label })))
    : null;
  const architecture = flow ? el('div', { class: 'project-flow' }, [
    el('p', { class: 'project-flow-label', text: 'Architecture path' }),
    flow,
  ]) : null;
  const detail = el('details', { class: 'case' }, [
    el('summary', { text: 'Case study' }),
    ...section('Problem', el('p', { text: p.problem })),
    ...section('Solution', el('p', { text: p.solution })),
    ...section('Implemented', list(p.implemented)),
    ...section('In progress or planned', list(p.planned)),
    ...section('Security', p.security ? el('p', { text: p.security }) : null),
    ...section('Evidence', el('p', { text: p.evidence })),
    ...section('Lessons', el('p', { text: p.lessons })),
  ]);
  const featured = p.id === 'cloud-native-devops-platform';
  const card = el('article', { class: `card case-file reveal${featured ? ' featured' : ''}`, 'data-cats': p.categories.join('|') }, [
    el('p', { class: 'case-index', text: `CASE FILE / ${String(index + 1).padStart(2, '0')}` }),
    el('header', {}, [el('h3', { text: p.title }), el('span', { class: 'badge', text: p.status })]),
    el('p', { text: p.summary }),
    architecture,
    el('ul', { class: 'tags', 'aria-label': 'Technology stack' }, p.stack.map(s => el('li', { class: 'tag', text: s }))),
    links, detail,
  ]);
  return card;
}

function initProjects() {
  const grid = $('#projects-root');
  const bar = $('#filters');
  const status = $('#filter-status');
  const cards = PROJECTS.map(projectCard);
  grid.replaceChildren(...cards);
  const apply = (filter) => {
    let shown = 0;
    cards.forEach(c => {
      const match = filter === 'All' || c.dataset.cats.split('|').includes(filter);
      c.hidden = !match; if (match) shown++;
    });
    bar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === filter)));
    status.textContent = `Showing ${shown} of ${cards.length} projects${filter === 'All' ? '' : ` in ${filter}`}.`;
  };
  FILTERS.forEach(f => bar.append(el('button', { class: 'btn', type: 'button', 'data-f': f, 'aria-pressed': 'false', text: f })));
  bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) apply(b.dataset.f); });
  apply('All');
}

function renderLabNotes() {
  $('#lab-root').replaceChildren(...LAB_NOTES.map(item => el('article', { class: 'lab-note reveal' }, [
    el('p', { class: 'case-index', text: item.label }),
    el('h3', { text: item.title }),
    el('p', { class: 'lab-description', text: item.text }),
    el('span', { class: `lab-status${item.status === 'Planned' ? ' planned' : ''}`, text: item.status }),
  ])));
}

function renderJourney() {
  $('#timeline').replaceChildren(...JOURNEY.map(([title, text, ongoing]) =>
    el('li', { class: `reveal${ongoing ? ' ongoing' : ''}` }, [
      el('h3', { text: ongoing ? `${title} (ongoing)` : title }), el('p', { text }),
    ])));
}

function initContact() {
  const btn = $('#copy-email');
  const status = $('#copy-status');
  btn.addEventListener('click', async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(CONTACT.email); ok = true; } catch (e) {
      const ta = el('textarea', { class: 'copy-fallback', 'aria-hidden': 'true', readonly: true, tabindex: '-1' });
      ta.value = CONTACT.email;
      document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
    }
    status.textContent = ok ? 'Email address copied.' : `Copy isn't supported here. The address is ${CONTACT.email}.`;
  });
}

function initReveal() {
  document.querySelectorAll('.section > .section-index, .section > h2').forEach(item => item.classList.add('reveal'));
  const items = document.querySelectorAll('.reveal');
  const staggerParents = document.querySelectorAll('.skill-groups, .project-grid, .lab-grid, .timeline');
  staggerParents.forEach(parent => [...parent.children].filter(child => child.matches('.reveal')).forEach((child, index) => {
    child.style.setProperty('--reveal-index', Math.min(index, 7));
  }));
  if (reduceMotion || !('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.1 });
  items.forEach(i => io.observe(i));
}

function initScrollProgress() {
  const bar = $('#scroll-progress-bar');
  let scheduled = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', () => {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

function initPipelineInteractions() {
  const figure = $('.pipeline-wrap');
  const replay = $('#pipeline-replay');
  const feedback = $('#pipeline-feedback');
  let replayTimer;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  motionPreference.addEventListener('change', event => {
    reduceMotion = event.matches;
    if (reduceMotion) {
      clearTimeout(replayTimer);
      figure.classList.remove('is-replaying');
      feedback.textContent = 'Motion is minimized by your device preference. Workflow states are shown as documented in the project README.';
    }
  });
  replay.addEventListener('click', () => {
    clearTimeout(replayTimer);
    figure.classList.remove('is-replaying');
    if (!reduceMotion) {
      void figure.offsetWidth;
      figure.classList.add('is-replaying');
      replayTimer = window.setTimeout(() => figure.classList.remove('is-replaying'), 1900);
      feedback.textContent = 'Illustrative workflow replay complete. This animation is not connected to live infrastructure.';
    } else {
      feedback.textContent = 'Motion is minimized by your device preference. Workflow states are shown as documented in the project README.';
    }
  });

  if (!reduceMotion && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    figure.addEventListener('pointermove', event => {
      const bounds = figure.getBoundingClientRect();
      figure.style.setProperty('--glow-x', `${Math.round((event.clientX - bounds.left) / bounds.width * 100)}%`);
      figure.style.setProperty('--glow-y', `${Math.round((event.clientY - bounds.top) / bounds.height * 100)}%`);
    }, { passive: true });
    figure.addEventListener('pointerleave', () => {
      figure.style.removeProperty('--glow-x');
      figure.style.removeProperty('--glow-y');
    }, { passive: true });
  }
}

$('#year').textContent = String(new Date().getFullYear());
initNav(); renderSkills(); initProjects(); renderJourney(); renderLabNotes(); initContact(); initTerminal(); initReveal(); initScrollProgress(); initPipelineInteractions();
