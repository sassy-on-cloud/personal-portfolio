import { CONTACT } from './content.js?v=2';
import { SEARCH_INDEX } from './search-data.js?v=2';

const dialog = document.querySelector('#command-palette');
if (dialog) {
  const triggers = [...document.querySelectorAll('.palette-trigger')];
  const closeButton = dialog.querySelector('.palette-close');
  const input = dialog.querySelector('#palette-query');
  const results = dialog.querySelector('#palette-results');
  const emptyPane = dialog.querySelector('#palette-empty');
  const status = dialog.querySelector('#palette-status');
  const primaryTrigger = document.querySelector('.nav-controls .palette-trigger') || triggers[0];
  let returnFocus = primaryTrigger;
  let items = [];
  let selected = 0;
  let idCounter = 0;
  const expanded = new Set();
  const normalize = value => value.toLocaleLowerCase().trim().replace(/[^a-z0-9+#]+/g, ' ').replace(/\s+/g, ' ').trim();
  const singular = word => word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word;
  const groups = ['Pages', 'Projects', 'Skills', 'Journey', 'Notes', 'Actions'];

  function score(item, rawQuery) {
    const query = normalize(rawQuery);
    const tokens = query.split(' ').filter(Boolean).map(singular);
    const title = normalize(item.title);
    const keywords = normalize((item.keywords || []).join(' '));
    const body = normalize([item.detail, item.body].join(' '));
    const all = normalize([item.title, item.detail, ...(item.keywords || []), item.body].join(' '));
    const words = all.split(' ').map(singular);
    if (!tokens.length || !tokens.every(term => words.some(word => word === term || word.startsWith(term)))) return 0;
    if (title === query) return 500;
    if (title.startsWith(query)) return 400;
    if (tokens.every(term => keywords.split(' ').map(singular).some(word => word === term || word.startsWith(term)))) return 300;
    if (tokens.every(term => body.split(' ').map(singular).some(word => word === term || word.startsWith(term)))) return 100;
    return 200;
  }

  function activate(index) {
    const item = items[index];
    if (!item) return;
    dialog.close();
    if (item.kind === 'navigate') location.assign(item.target);
    else if (item.kind === 'theme') document.querySelector('.theme-toggle')?.click();
    else if (item.kind === 'download') {
      const link = document.createElement('a');
      link.href = '/assets/Shashwat-Aryal-Resume.pdf';
      link.download = '';
      link.click();
    } else if (item.kind === 'copy') {
      navigator.clipboard?.writeText(CONTACT.email).then(() => { status.textContent = 'Email address copied.'; }).catch(() => { status.textContent = 'Copy is unavailable. Email: ' + CONTACT.email; });
    } else if (item.kind === 'external') window.open(item.target, '_blank', 'noopener,noreferrer');
  }

  function updateActive() {
    const options = [...results.querySelectorAll('[role="option"]')];
    options.forEach((option, index) => option.setAttribute('aria-selected', String(index === selected)));
    const active = options[selected];
    if (active) results.setAttribute('aria-activedescendant', active.id);
    else results.removeAttribute('aria-activedescendant');
  }

  function render() {
    const raw = input.value;
    const query = normalize(raw);
    let ranked;
    const category = groups.find(group => singular(normalize(group)) === singular(query));
    if (category) ranked = SEARCH_INDEX.filter(item => item.group === category).map(item => ({ item, score: 1 }));
    else if (!query) ranked = SEARCH_INDEX.filter(item => item.group === 'Pages').map(item => ({ item, score: 1 }));
    else ranked = SEARCH_INDEX.map(item => ({ item, score: score(item, raw) })).filter(match => match.score > 0).sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title));

    const grouped = new Map();
    for (const { item, score: rank } of ranked) {
      if (!grouped.has(item.group)) grouped.set(item.group, []);
      grouped.get(item.group).push({ item, score: rank });
    }
    items = [];
    selected = 0;
    results.replaceChildren();
    idCounter += 1;
    for (const groupName of groups) {
      const groupItems = grouped.get(groupName);
      if (!groupItems?.length) continue;
      const section = document.createElement('section');
      section.setAttribute('role', 'group');
      section.setAttribute('aria-label', groupName);
      const heading = document.createElement('h3');
      heading.textContent = groupName;
      heading.setAttribute('aria-hidden', 'true');
      heading.setAttribute('role', 'presentation');
      section.append(heading);
      const shown = expanded.has(groupName) ? groupItems : groupItems.slice(0, 8);
      for (const { item } of shown) {
        const index = items.push(item) - 1;
        const option = document.createElement('button');
        option.type = 'button';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(index === selected));
        option.id = 'palette-option-' + idCounter + '-' + index;
        option.textContent = item.title + ' — ' + item.detail;
        option.addEventListener('click', () => activate(index));
        section.append(option);
      }
      if (groupItems.length > 8 && !expanded.has(groupName)) {
        const more = document.createElement('button');
        more.type = 'button';
        more.className = 'palette-show-all';
        more.textContent = 'Show all ' + groupItems.length + ' ' + groupName.toLowerCase();
        more.addEventListener('click', () => { expanded.add(groupName); render(); input.focus(); });
        section.append(more);
      }
      results.append(section);
    }
    if (!ranked.length) {
      emptyPane.hidden = false;
      const message = document.createElement('p');
      message.textContent = 'No matches for “' + raw.trim() + '”. Try one of these:';
      emptyPane.replaceChildren(message);
      const examples = [SEARCH_INDEX.find(item => item.group === 'Projects')?.title, SEARCH_INDEX.find(item => item.group === 'Skills' && item.title !== 'Skills')?.title, SEARCH_INDEX.find(item => item.group === 'Notes')?.title].filter(Boolean);
      const suggestions = document.createElement('p');
      suggestions.textContent = 'Examples: ' + examples.join(' · ');
      emptyPane.append(suggestions);
      const pageItems = SEARCH_INDEX.filter(item => item.group === 'Pages');
      const pageGroup = document.createElement('section');
      pageGroup.setAttribute('role', 'group');
      pageGroup.setAttribute('aria-label', 'Pages');
      const heading = document.createElement('h3');
      heading.textContent = 'Pages';
      heading.setAttribute('aria-hidden', 'true');
      heading.setAttribute('role', 'presentation');
      pageGroup.append(heading);
      for (const item of pageItems) {
        const index = items.push(item) - 1;
        const option = document.createElement('button');
        option.type = 'button';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(index === selected));
        option.id = 'palette-option-' + idCounter + '-' + index;
        option.textContent = item.title;
        option.addEventListener('click', () => activate(index));
        pageGroup.append(option);
      }
      results.append(pageGroup);
    } else emptyPane.hidden = true;
    status.textContent = query ? (ranked.length ? ranked.length + ' matching results.' : 'No matches for “' + raw.trim() + '”. Suggestions and all pages are shown.') : 'Start typing to search.';
    updateActive();
  }

  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    returnFocus = trigger.closest('#nav-menu') ? document.querySelector('.nav-toggle') : trigger;
    dialog.showModal();
    expanded.clear();
    input.value = '';
    render();
    input.focus();
  }));
  closeButton?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => returnFocus?.focus());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); dialog.close(); } });
  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' && items.length) { event.preventDefault(); selected = (selected + 1) % items.length; updateActive(); }
    else if (event.key === 'ArrowUp' && items.length) { event.preventDefault(); selected = (selected - 1 + items.length) % items.length; updateActive(); }
    else if (event.key === 'Enter' && items.length) { event.preventDefault(); activate(selected); }
  });
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (!dialog.open) primaryTrigger?.click();
      else input.focus();
    }
  });
  render();
}
