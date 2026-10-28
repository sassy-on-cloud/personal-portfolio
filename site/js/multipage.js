import './command-palette.js';
import './terminal-page.js';
import { CONTACT } from './content.js';

document.querySelectorAll('.quick-copy').forEach(button => button.addEventListener('click', async () => {
  const status = document.querySelector('.copy-status');
  const email = button.dataset.email || CONTACT.email;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(email);
    else {
      const field = document.createElement('textarea');
      field.value = email;
      field.className = 'copy-fallback';
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) throw new Error('Copy failed');
    }
    if (status) status.textContent = 'Email address copied.';
  } catch {
    if (status) status.textContent = 'Copy unavailable. Email: ' + email;
  }
}));

const menuButton = document.querySelector('.nav-toggle');
const menu = document.querySelector('#nav-menu');
if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      menuButton.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      menuButton.focus();
    }
  });
}
document.querySelector('.print-button')?.addEventListener('click', () => window.print());
const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
const progress = document.querySelector('.scroll-progress');
if (progress) {
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--progress', max > 0 ? String(scrollY / max) : '0');
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const timeline = document.querySelector('.timeline');
  if (timeline) new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { timeline.classList.add('line-drawn'); }
  }), { threshold: 0.1 }).observe(timeline);
}
