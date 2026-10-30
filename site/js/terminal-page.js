import { CONTACT, SKILLS, PROJECTS, JOURNEY } from './content.js?v=2';
import { PAGES } from './page-data.js?v=2';

const form = document.querySelector('#terminal-form');
if (form) {
  const input = document.querySelector('#terminal-input');
  const output = document.querySelector('#terminal-output');
  const leave = document.querySelector('#terminal-leave');
  const commandNames = ['help', 'about', 'projects', 'project', 'skills', 'journey', 'contact', 'resume', 'theme', 'clear', 'whoami', 'ls', 'open'];
  const history = [];
  let historyIndex = 0;
  let draft = '';

  function print(text, className = '') {
    const line = document.createElement('div');
    if (className) line.className = className;
    line.textContent = text;
    output.append(line);
    output.scrollTop = output.scrollHeight;
  }

  function projectInfo(rawSlug) {
    const project = PROJECTS.find(item => item.id === rawSlug || item.title.toLocaleLowerCase() === rawSlug.toLocaleLowerCase());
    if (!project) return 'No project matches that slug. Use "projects" to see the list.';
    return [
      project.title + ' [' + project.status + ']',
      project.summary,
      'Technologies: ' + project.stack.join(', '),
      project.repo,
      project.evidence ? 'Evidence: ' + project.evidence : '',
    ].filter(Boolean).join('\n');
  }

  function pageFor(argument) {
    const query = argument.trim().toLocaleLowerCase().replace(/^\/+|\/+$/g, '');
    if (!query) return null;
    return PAGES.find(page => page.path.replace(/^\/+|\/+$/g, '').toLocaleLowerCase() === query)
      ?? PAGES.find(page => page.label.toLocaleLowerCase() === query)
      ?? PAGES.find(page => page.path.toLocaleLowerCase().endsWith('/' + query + '/'));
  }

  function run(raw) {
    const value = raw.trim();
    if (!value) return;
    const [command, ...args] = value.split(/\s+/);
    const argument = args.join(' ');
    const normalized = command.toLocaleLowerCase();
    if (normalized !== 'clear') print('$ ' + value, 'terminal-command');
    if (normalized === 'clear') { output.replaceChildren(); return; }
    if (normalized === 'help') print('Commands: help, about, projects, project <slug>, skills, journey, contact, resume, theme, clear, whoami, ls, open <page>');
    else if (normalized === 'about') print('Shashwat Aryal, a BSc CSIT student in Kathmandu building practical Cloud and DevOps skills through hands-on projects.');
    else if (normalized === 'projects') print(PROJECTS.map(project => project.id + ' — ' + project.title + ' [' + project.status + ']').join('\n'));
    else if (normalized === 'project') print(argument ? projectInfo(argument) : 'Usage: project <slug>');
    else if (normalized === 'skills') print(SKILLS.map(group => group.group + ': ' + group.items.map(([name, state]) => name + ' (' + (state === 'used' ? 'Used in projects' : 'Learning') + ')').join(', ')).join('\n'));
    else if (normalized === 'journey') print(JOURNEY.map(([title, description, ongoing]) => title + (ongoing ? ' (ongoing)' : '') + '\n  ' + description).join('\n'));
    else if (normalized === 'contact') print('Email: ' + CONTACT.email + '\nPhone: ' + CONTACT.phone + '\nGitHub: ' + CONTACT.github + '\nLinkedIn: ' + CONTACT.linkedin);
    else if (normalized === 'resume') print('Resume PDF: /assets/Shashwat-Aryal-Resume.pdf\nHTML resume: /resume/');
    else if (normalized === 'theme') print('Current theme: ' + document.documentElement.dataset.theme);
    else if (normalized === 'whoami') print('Shashwat Aryal — Aspiring Cloud & DevOps Engineer — Kathmandu, Nepal.');
    else if (normalized === 'ls') print(PAGES.map(page => page.path).join('\n'));
    else if (normalized === 'open') {
      const page = pageFor(argument);
      if (page) location.assign(page.path);
      else print('Unknown page. Use "ls" to see known internal pages.');
    } else print('Unknown command. Type "help" for available commands.');
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value.trim();
    if (value) { history.push(value); historyIndex = history.length; draft = ''; run(value); }
    input.value = '';
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); leave.focus(); }
    else if (event.key === 'ArrowUp') {
      if (!history.length) return;
      event.preventDefault();
      if (historyIndex === history.length) draft = input.value;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex];
    } else if (event.key === 'ArrowDown' && historyIndex < history.length) {
      event.preventDefault();
      historyIndex += 1;
      input.value = historyIndex === history.length ? draft : history[historyIndex];
    } else if (event.key === 'Tab') {
      const prefix = input.value.trim().toLocaleLowerCase();
      const matches = commandNames.filter(name => name.startsWith(prefix));
      if (matches.length === 1) { event.preventDefault(); input.value = matches[0] + ' '; }
    }
  });
  print('Type "help" to see the fixed command list. No shell commands are executed.');
  input.focus();
}
