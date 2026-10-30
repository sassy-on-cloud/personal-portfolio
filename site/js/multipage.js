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
const header = document.querySelector('.site-header');
const scrim = document.querySelector('.menu-scrim');
const desktopNavigation = matchMedia('(min-width: 1200px)');
const searchShortcut = document.querySelector('.search-shortcut');
if (searchShortcut) {
  const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent;
  searchShortcut.textContent = /Mac|iPhone|iPad/i.test(platform) ? 'Cmd+K' : 'Ctrl+K';
}

if (menuButton && menu && header && scrim) {
  const background = [...document.body.children].filter(element => element !== header);
  const previousBackgroundState = new Map();
  const controls = [...document.querySelectorAll('.nav-controls > :not(.nav-toggle)')];
  const previousControlsState = new Map();
  let open = false;
  let previousRootOverflow = '';
  let previousBodyOverflow = '';
  let previousRootPadding = '';

  function setBlocked(elements, state) {
    elements.forEach(element => {
      if (state) {
        element.inert = true;
        element.setAttribute('aria-hidden', 'true');
      } else {
        const previous = state === false && elements === background
          ? previousBackgroundState.get(element)
          : previousControlsState.get(element);
        element.inert = previous?.inert ?? false;
        if (previous?.ariaHidden === null || previous?.ariaHidden === undefined) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', previous.ariaHidden);
      }
    });
  }

  function rememberState(elements, store) {
    store.clear();
    elements.forEach(element => store.set(element, {
      inert: element.inert,
      ariaHidden: element.getAttribute('aria-hidden'),
    }));
  }

  function setMenuOpen(next, restoreFocus = true) {
    if (open === next) return;
    open = next;
    header.classList.toggle('menu-open', open);
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open && !desktopNavigation.matches));
    menu.inert = !open && !desktopNavigation.matches;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

    if (open) {
      rememberState(background, previousBackgroundState);
      rememberState(controls, previousControlsState);
      setBlocked(background, true);
      setBlocked(controls, true);
      previousRootOverflow = document.documentElement.style.overflow;
      previousBodyOverflow = document.body.style.overflow;
      previousRootPadding = document.documentElement.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.paddingRight = scrollbarWidth ? `${scrollbarWidth}px` : previousRootPadding;
      document.body.style.overflow = 'hidden';
      menu.querySelector('.menu-search')?.focus();
    } else {
      setBlocked(background, false);
      setBlocked(controls, false);
      document.documentElement.style.overflow = previousRootOverflow;
      document.documentElement.style.paddingRight = previousRootPadding;
      document.body.style.overflow = previousBodyOverflow;
      if (restoreFocus && !desktopNavigation.matches) menuButton.focus();
    }
  }

  function syncNavigationMode() {
    if (desktopNavigation.matches) {
      if (open) setMenuOpen(false, false);
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'false');
      menu.inert = false;
    } else if (!open) {
      menu.setAttribute('aria-hidden', 'true');
      menu.inert = true;
    }
  }

  menuButton.addEventListener('click', () => setMenuOpen(!open));
  scrim.addEventListener('click', () => setMenuOpen(false));
  menu.addEventListener('click', event => {
    if (event.target.closest('.menu-search')) setMenuOpen(false, false);
  }, true);
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenuOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...menu.querySelectorAll('a[href], button:not([disabled])')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!menu.contains(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first)?.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  desktopNavigation.addEventListener('change', syncNavigationMode);
  window.addEventListener('popstate', () => setMenuOpen(false, false));
  window.addEventListener('pagehide', () => setMenuOpen(false, false));
  syncNavigationMode();
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
