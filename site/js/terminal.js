import { CONTACT, SKILLS, PROJECTS } from './content.js';
import { el } from './dom.js';

// A fixed lookup table. User input is only ever compared to these keys and echoed as text.
const COMMANDS = {
  help: () => 'Commands: help, about, skills, projects, contact, clear',
  about: () => 'Shashwat Aryal, BSc CSIT student in Kathmandu, building Cloud and DevOps skills through hands-on projects.',
  skills: () => SKILLS.map(g => `${g.group}: ${g.items.map(i => i[0]).join(', ')}`).join('\n'),
  projects: () => PROJECTS.map(p => `${p.title} [${p.status}]\n  ${p.repo}`).join('\n'),
  contact: () => `Email: ${CONTACT.email}\nGitHub: ${CONTACT.github}\nLinkedIn: ${CONTACT.linkedin}`,
};

export function initTerminal() {
  const out = document.getElementById('term-out');
  const form = document.getElementById('term-form');
  const input = document.getElementById('term-in');
  const quick = document.getElementById('term-quick');
  if (!out || !form || !input || !quick) return;

  const print = (text, cls) => out.append(el('div', { class: cls, text }));

  function run(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === 'clear') { out.replaceChildren(); return; }
    print(`$ ${raw.trim()}`, 'cmd');
    const handler = Object.hasOwn(COMMANDS, cmd) ? COMMANDS[cmd] : null;
    print(handler ? handler() : `Unknown command. Type "help" for the list.`);
    out.scrollTop = out.scrollHeight;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); run(input.value); input.value = ''; input.focus(); });
  for (const name of ['help', 'about', 'skills', 'projects', 'contact', 'clear']) {
    quick.append(el('button', { class: 'btn small', type: 'button', text: name }));
  }
  quick.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') run(e.target.textContent); });
  print('Type "help" or use the buttons below.');
}
