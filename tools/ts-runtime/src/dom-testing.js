// A Testing Library-compatible subset (@testing-library/react + @testing-library/user-event +
// jest-dom matchers) for the sandboxed grading iframe. Queries find elements the way a user or a
// screen reader does — by role and accessible name, by label, by visible text — so a component that
// passes these tests is genuinely usable, not just structurally present.
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { expect, registerGlobalAfterEach, __dw_internal } from './testkit.js';

const { realSetTimeout, format, clip } = __dw_internal;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const act = React.act;

// ---------------------------------------------------------------- accessibility helpers

function isHidden(el) {
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    if (node.hidden || node.getAttribute('aria-hidden') === 'true') return true;
    const style = node.ownerDocument.defaultView.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
  }
  return false;
}

function implicitRole(el) {
  const tag = el.tagName.toLowerCase();
  const type = (el.getAttribute('type') || '').toLowerCase();
  switch (tag) {
    case 'button': return 'button';
    case 'a': case 'area': return el.hasAttribute('href') ? 'link' : null;
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return 'heading';
    case 'input':
      if (['button', 'submit', 'reset', 'image'].includes(type)) return 'button';
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'range') return 'slider';
      if (type === 'number') return 'spinbutton';
      if (type === 'search') return el.hasAttribute('list') ? 'combobox' : 'searchbox';
      if (type === 'hidden' || type === 'password' || type === 'file' || type === 'color' || type === 'date' || type === 'datetime-local' || type === 'time') return null;
      return el.hasAttribute('list') ? 'combobox' : 'textbox';
    case 'textarea': return 'textbox';
    case 'select': return el.multiple || el.size > 1 ? 'listbox' : 'combobox';
    case 'option': return 'option';
    case 'ul': case 'ol': case 'menu': return 'list';
    case 'li': return 'listitem';
    case 'nav': return 'navigation';
    case 'main': return 'main';
    case 'aside': return 'complementary';
    case 'header': return el.closest('article, aside, main, nav, section') ? null : 'banner';
    case 'footer': return el.closest('article, aside, main, nav, section') ? null : 'contentinfo';
    case 'form': return accessibleName(el) ? 'form' : null;
    case 'section': return accessibleName(el) ? 'region' : null;
    case 'article': return 'article';
    case 'dialog': return 'dialog';
    case 'img': return el.getAttribute('alt') === '' ? 'presentation' : 'img';
    case 'table': return 'table';
    case 'tr': return 'row';
    case 'td': return 'cell';
    case 'th': return el.closest('thead') || el.getAttribute('scope') === 'col' ? 'columnheader' : 'rowheader';
    case 'thead': case 'tbody': case 'tfoot': return 'rowgroup';
    case 'progress': return 'progressbar';
    case 'output': return 'status';
    case 'hr': return 'separator';
    case 'fieldset': return 'group';
    case 'dl': return 'list';
    default: return null;
  }
}

export function roleOf(el) {
  const explicit = (el.getAttribute('role') || '').trim().split(/\s+/)[0];
  return explicit || implicitRole(el);
}

const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();

function textAlternative(node, visited) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1 || visited.has(node)) return '';
  visited.add(node);
  const el = node;
  if (el.getAttribute('aria-hidden') === 'true' || el.hidden) return '';
  const label = el.getAttribute('aria-label');
  if (label && label.trim()) return label;
  const tag = el.tagName.toLowerCase();
  if (tag === 'img') return el.getAttribute('alt') || '';
  if (tag === 'input' || tag === 'textarea') return el.value || '';
  if (tag === 'select') return el.selectedOptions && el.selectedOptions[0] ? el.selectedOptions[0].textContent : '';
  return Array.from(el.childNodes).map((c) => textAlternative(c, visited)).join(tag === 'br' ? ' ' : '');
}

const NAME_FROM_CONTENT = new Set(['button', 'link', 'heading', 'cell', 'columnheader', 'rowheader', 'option', 'tab', 'menuitem', 'checkbox', 'radio', 'switch', 'listitem', 'row', 'tooltip', 'status', 'alert']);

export function accessibleName(el) {
  const doc = el.ownerDocument;
  const labelledby = el.getAttribute('aria-labelledby');
  if (labelledby) {
    return normalize(labelledby.split(/\s+/).map((id) => { const ref = doc.getElementById(id); return ref ? textAlternative(ref, new Set()) : ''; }).join(' '));
  }
  const aria = el.getAttribute('aria-label');
  if (aria && aria.trim()) return normalize(aria);
  const tag = el.tagName.toLowerCase();
  if (['input', 'select', 'textarea', 'meter', 'progress', 'output'].includes(tag)) {
    const type = (el.getAttribute('type') || '').toLowerCase();
    if (tag === 'input' && ['submit', 'reset', 'button'].includes(type)) return normalize(el.value || (type === 'submit' ? 'Submit' : type === 'reset' ? 'Reset' : ''));
    if (tag === 'input' && type === 'image') return normalize(el.getAttribute('alt') || '');
    const labels = el.labels ? Array.from(el.labels) : [];
    if (labels.length) {
      return normalize(labels.map((l) => Array.from(l.childNodes).map((c) => (c === el || (c.nodeType === 1 && c.contains(el)) ? labelTextExcluding(c, el) : textAlternative(c, new Set([el])))).join('')).join(' '));
    }
    return normalize(el.getAttribute('title') || '');
  }
  if (tag === 'img') return normalize(el.getAttribute('alt') || el.getAttribute('title') || '');
  if (tag === 'fieldset') {
    const legend = el.querySelector(':scope > legend');
    if (legend) return normalize(textAlternative(legend, new Set()));
  }
  if (tag === 'table') {
    const caption = el.querySelector(':scope > caption');
    if (caption) return normalize(textAlternative(caption, new Set()));
  }
  // form and section only have a role when named, so asking for their role here would recurse;
  // neither takes its name from content anyway.
  const role = tag === 'form' || tag === 'section' ? (el.getAttribute('role') || '').trim().split(/\s+/)[0] : roleOf(el);
  if (role && NAME_FROM_CONTENT.has(role)) return normalize(textAlternative(el, new Set()));
  return normalize(el.getAttribute('title') || '');
}

function labelTextExcluding(node, control) {
  if (node === control) return '';
  if (node.nodeType === 3) return node.textContent;
  return Array.from(node.childNodes).map((c) => labelTextExcluding(c, control)).join('');
}

export function accessibleDescription(el) {
  const ids = el.getAttribute('aria-describedby');
  if (!ids) return normalize(el.getAttribute('aria-description') || '');
  return normalize(ids.split(/\s+/).map((id) => { const ref = el.ownerDocument.getElementById(id); return ref ? ref.textContent : ''; }).join(' '));
}

// ---------------------------------------------------------------- queries

function matches(text, matcher, exact = true) {
  if (text == null) return false;
  if (matcher instanceof RegExp) return matcher.test(text);
  if (typeof matcher === 'function') return !!matcher(text);
  const t = normalize(text);
  const m = normalize(String(matcher));
  return exact ? t === m : t.toLowerCase().includes(m.toLowerCase());
}

function ownText(el) {
  return Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
}

function allElements(container) {
  return Array.from(container.querySelectorAll('*'));
}

const queryDefs = {
  Role: {
    all(container, role, options = {}) {
      return allElements(container).filter((el) => {
        if (options.hidden !== true && isHidden(el)) return false;
        if (roleOf(el) !== role) return false;
        if (options.name !== undefined && !matches(accessibleName(el), options.name)) return false;
        if (options.level !== undefined && role === 'heading') {
          const level = el.getAttribute('aria-level') ? Number(el.getAttribute('aria-level')) : Number(el.tagName.slice(1));
          if (level !== options.level) return false;
        }
        if (options.checked !== undefined) {
          const checked = el.getAttribute('aria-checked') !== null ? el.getAttribute('aria-checked') === 'true' : !!el.checked;
          if (checked !== options.checked) return false;
        }
        if (options.pressed !== undefined && (el.getAttribute('aria-pressed') === 'true') !== options.pressed) return false;
        if (options.expanded !== undefined && (el.getAttribute('aria-expanded') === 'true') !== options.expanded) return false;
        if (options.selected !== undefined && (el.getAttribute('aria-selected') === 'true' || !!el.selected) !== options.selected) return false;
        if (options.current !== undefined) {
          const cur = el.getAttribute('aria-current');
          if (typeof options.current === 'boolean' ? (!!cur && cur !== 'false') !== options.current : cur !== options.current) return false;
        }
        return true;
      });
    },
    describe: (role, options = {}) => `role "${role}"${options.name !== undefined ? ` and name ${format(options.name)}` : ''}`,
  },
  Text: {
    all: (container, text, options = {}) => allElements(container).filter((el) => !['SCRIPT', 'STYLE'].includes(el.tagName) && matches(ownText(el), text, options.exact !== false) && (options.hidden === true || !isHidden(el))),
    describe: (text) => `text ${format(text)}`,
  },
  LabelText: {
    all(container, text, options = {}) {
      return allElements(container).filter((el) => {
        const tag = el.tagName.toLowerCase();
        const labelable = ['input', 'select', 'textarea', 'button', 'meter', 'output', 'progress'].includes(tag) || el.hasAttribute('aria-labelledby') || el.hasAttribute('aria-label');
        if (!labelable) return false;
        if (el.getAttribute('aria-label') && matches(el.getAttribute('aria-label'), text, options.exact !== false)) return true;
        if (el.hasAttribute('aria-labelledby')) return matches(accessibleName(el), text, options.exact !== false);
        const labels = el.labels ? Array.from(el.labels) : [];
        return labels.some((l) => matches(labelTextExcluding(l, el), text, options.exact !== false));
      });
    },
    describe: (text) => `label ${format(text)}`,
  },
  PlaceholderText: {
    all: (container, text, options = {}) => allElements(container).filter((el) => el.hasAttribute('placeholder') && matches(el.getAttribute('placeholder'), text, options.exact !== false)),
    describe: (text) => `placeholder ${format(text)}`,
  },
  DisplayValue: {
    all: (container, value, options = {}) => allElements(container).filter((el) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) && matches(el.tagName === 'SELECT' ? (el.selectedOptions[0] ? el.selectedOptions[0].textContent : '') : el.value, value, options.exact !== false)),
    describe: (value) => `display value ${format(value)}`,
  },
  AltText: {
    all: (container, text, options = {}) => allElements(container).filter((el) => el.hasAttribute('alt') && matches(el.getAttribute('alt'), text, options.exact !== false)),
    describe: (text) => `alt text ${format(text)}`,
  },
  Title: {
    all: (container, text, options = {}) => allElements(container).filter((el) => el.hasAttribute('title') && matches(el.getAttribute('title'), text, options.exact !== false)),
    describe: (text) => `title ${format(text)}`,
  },
  TestId: {
    all: (container, id) => allElements(container).filter((el) => matches(el.getAttribute('data-testid'), id)),
    describe: (id) => `data-testid ${format(id)}`,
  },
};

function snapshotOf(container) {
  // Only what was rendered: skip the page's inlined scripts and the empty preview root.
  const root = container.body || container;
  const parts = Array.from(root.children)
    .filter((el) => !['SCRIPT', 'STYLE'].includes(el.tagName) && !(el.id === 'root' && el.childNodes.length === 0) && el.id !== '__dw_result')
    .map((el) => el.outerHTML);
  return clip(parts.join('').replace(/\s+/g, ' '), 600);
}

function roleHint(container) {
  const roles = new Map();
  for (const el of allElements(container)) {
    if (isHidden(el)) continue;
    const r = roleOf(el);
    if (!r || r === 'presentation' || r === 'generic') continue;
    const name = accessibleName(el);
    if (!roles.has(r)) roles.set(r, []);
    if (roles.get(r).length < 4) roles.get(r).push(name ? JSON.stringify(name) : '(no name)');
  }
  if (!roles.size) return '';
  return ` Accessible roles present: ${Array.from(roles).map(([r, names]) => `${r} [${names.join(', ')}]`).join('; ')}.`;
}

function buildQueries(getContainer) {
  const q = {};
  for (const [kind, def] of Object.entries(queryDefs)) {
    const notFound = (args) => new Error(`Unable to find an element with ${def.describe(...args)}.${kind === 'Role' ? roleHint(getContainer()) : ''} Rendered DOM: ${snapshotOf(getContainer())}`);
    q[`queryAllBy${kind}`] = (...args) => def.all(getContainer(), ...args);
    q[`queryBy${kind}`] = (...args) => {
      const found = def.all(getContainer(), ...args);
      if (found.length > 1) throw new Error(`Found ${found.length} elements with ${def.describe(...args)} — use getAllBy${kind} or a more specific query.`);
      return found[0] || null;
    };
    q[`getAllBy${kind}`] = (...args) => {
      const found = def.all(getContainer(), ...args);
      if (!found.length) throw notFound(args);
      return found;
    };
    q[`getBy${kind}`] = (...args) => {
      const found = q[`getAllBy${kind}`](...args);
      if (found.length > 1) throw new Error(`Found ${found.length} elements with ${def.describe(...args)} — use getAllBy${kind} or a more specific query.`);
      return found[0];
    };
    q[`findAllBy${kind}`] = (...args) => waitFor(() => q[`getAllBy${kind}`](...args), lastOptions(args));
    q[`findBy${kind}`] = (...args) => waitFor(() => q[`getBy${kind}`](...args), lastOptions(args));
  }
  return q;
}

function lastOptions(args) {
  const opts = args[2];
  return opts && typeof opts === 'object' ? opts : undefined;
}

export const screen = buildQueries(() => document.body);
screen.debug = (el) => { console.log(clip((el || document.body).outerHTML, 2000)); };
export const within = (element) => buildQueries(() => element);

// ---------------------------------------------------------------- waitFor

export async function waitFor(callback, options = {}) {
  const timeout = options.timeout ?? 1000;
  const interval = options.interval ?? 20;
  const started = Date.now();
  const previous = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  let lastError;
  let elapsed = 0;
  try {
    for (;;) {
      try {
        const result = await callback();
        return result;
      } catch (e) {
        lastError = e;
      }
      if (elapsed >= timeout || Date.now() - started > timeout + 2000) break;
      if (__dw_internal.isFake() && globalThis.__dw_modules__ && globalThis.__dw_modules__.vitest) globalThis.__dw_modules__.vitest.vi.advanceTimersByTime(interval);
      await new Promise((r) => realSetTimeout(r, interval));
      elapsed += interval;
    }
  } finally {
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous;
  }
  throw lastError || new Error('waitFor timed out');
}

export async function waitForElementToBeRemoved(callback, options) {
  return waitFor(() => {
    const el = typeof callback === 'function' ? callback() : callback;
    const present = Array.isArray(el) ? el.length > 0 : !!el && el.isConnected;
    if (present) throw new Error('The element is still in the document.');
  }, options);
}

// ---------------------------------------------------------------- render

const mounted = new Set();

export function render(ui, options = {}) {
  const container = options.container || document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  const wrap = (node) => (options.wrapper ? React.createElement(options.wrapper, null, node) : node);
  act(() => { root.render(wrap(ui)); });
  const entry = { root, container };
  mounted.add(entry);
  return {
    container,
    baseElement: document.body,
    rerender: (next) => { act(() => { root.render(wrap(next)); }); },
    unmount: () => { act(() => { root.unmount(); }); mounted.delete(entry); },
    asFragment: () => { const t = document.createElement('template'); t.innerHTML = container.innerHTML; return t.content; },
    ...within(container),
  };
}

export function cleanup() {
  for (const entry of mounted) {
    try { act(() => { entry.root.unmount(); }); } catch { /* already unmounted */ }
    entry.container.remove();
  }
  mounted.clear();
  document.body.innerHTML = '';
}

registerGlobalAfterEach(cleanup);

export { act };

// ---------------------------------------------------------------- events

function fire(el, type, init = {}, Ctor) {
  const win = el.ownerDocument.defaultView;
  const EventCtor = Ctor || win.Event;
  const event = new EventCtor(type, { bubbles: true, cancelable: true, composed: true, ...init });
  return el.dispatchEvent(event);
}

export const fireEvent = {
  click: (el, init) => act(() => { fire(el, 'click', init, el.ownerDocument.defaultView.MouseEvent); }),
  change: (el, init = {}) => act(() => { if (init.target && 'value' in init.target) setNativeValue(el, init.target.value); fire(el, 'change'); fire(el, 'input'); }),
  input: (el, init = {}) => act(() => { if (init.target && 'value' in init.target) setNativeValue(el, init.target.value); fire(el, 'input'); }),
  submit: (el) => act(() => { fire(el, 'submit'); }),
  keyDown: (el, init) => act(() => { fire(el, 'keydown', init, el.ownerDocument.defaultView.KeyboardEvent); }),
  focus: (el) => act(() => { el.focus(); }),
  blur: (el) => act(() => { el.blur(); }),
};

function setNativeValue(el, value) {
  const win = el.ownerDocument.defaultView;
  const proto = el.tagName === 'TEXTAREA' ? win.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? win.HTMLSelectElement.prototype : win.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
  setter.call(el, value);
}

function isDisabled(el) {
  if (el.disabled) return true;
  const fieldset = el.closest('fieldset[disabled]');
  if (fieldset) {
    const legend = fieldset.querySelector(':scope > legend');
    return !(legend && legend.contains(el));
  }
  return false;
}

function assertInteractable(el, action) {
  if (!el || el.nodeType !== 1) throw new Error(`userEvent.${action} needs an element, got ${format(el)}`);
  if (!el.isConnected) throw new Error(`userEvent.${action}: the element is no longer in the document`);
  if (getComputedStyle(el).pointerEvents === 'none') throw new Error(`userEvent.${action}: the element has pointer-events: none`);
}

const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex], [contenteditable="true"], summary';

function focusableAncestor(el) {
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) if (n.matches(FOCUSABLE) && !isDisabled(n)) return n;
  return null;
}

function clickSync(el) {
  const win = el.ownerDocument.defaultView;
  fire(el, 'pointerdown', {}, win.PointerEvent || win.MouseEvent);
  if (isDisabled(el)) return;
  fire(el, 'mousedown', {}, win.MouseEvent);
  const target = focusableAncestor(el);
  if (target) target.focus();
  else if (el.ownerDocument.activeElement && el.ownerDocument.activeElement !== el.ownerDocument.body) el.ownerDocument.activeElement.blur();
  fire(el, 'pointerup', {}, win.PointerEvent || win.MouseEvent);
  fire(el, 'mouseup', {}, win.MouseEvent);
  el.click();
}

function parseKeys(text) {
  const keys = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{' && text[i + 1] !== '{') {
      const end = text.indexOf('}', i);
      keys.push({ key: text.slice(i + 1, end) });
      i = end;
    } else if (text[i] === '{' && text[i + 1] === '{') {
      keys.push({ char: '{' });
      i++;
    } else {
      keys.push({ char: text[i] });
    }
  }
  return keys;
}

function implicitSubmit(el) {
  const form = el.form;
  if (!form) return;
  const submitter = form.querySelector('button:not([type]), button[type="submit"], input[type="submit"]');
  if (submitter && !isDisabled(submitter)) { submitter.click(); return; }
  const fields = form.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="button"])');
  if (fields.length === 1) form.requestSubmit();
}

function pressKey(el, key) {
  const win = el.ownerDocument.defaultView;
  const proceed = fire(el, 'keydown', { key }, win.KeyboardEvent);
  if (proceed) {
    if (key === 'Enter') {
      if (el.tagName === 'INPUT') implicitSubmit(el);
      else if (el.tagName === 'BUTTON' || (el.tagName === 'A' && el.hasAttribute('href'))) el.click();
      else if (el.tagName === 'TEXTAREA') insertText(el, '\n');
    } else if (key === 'Backspace' && 'value' in el && el.tagName !== 'SELECT') {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next = start === end ? el.value.slice(0, Math.max(0, start - 1)) + el.value.slice(end) : el.value.slice(0, start) + el.value.slice(end);
      setNativeValue(el, next);
      fire(el, 'input', { inputType: 'deleteContentBackward' }, win.InputEvent);
    } else if (key === ' ' || key === 'Space') {
      if (el.tagName === 'BUTTON' || (el.tagName === 'INPUT' && ['checkbox', 'radio', 'button', 'submit'].includes(el.type))) el.click();
    }
  }
  fire(el, 'keyup', { key }, win.KeyboardEvent);
}

function insertText(el, ch) {
  const win = el.ownerDocument.defaultView;
  if (!('value' in el) || el.readOnly || isDisabled(el)) return;
  const max = el.maxLength;
  let start = el.selectionStart;
  let end = el.selectionEnd;
  if (start == null || ['number', 'email'].includes(el.type)) { start = el.value.length; end = el.value.length; }
  const next = el.value.slice(0, start) + ch + el.value.slice(end);
  if (max > 0 && next.length > max) return;
  setNativeValue(el, next);
  try { el.setSelectionRange(start + ch.length, start + ch.length); } catch { /* inputs like type=number have no selection */ }
  fire(el, 'input', { data: ch, inputType: 'insertText' }, win.InputEvent);
}

function tabbables(doc) {
  return Array.from(doc.querySelectorAll(FOCUSABLE)).filter((el) => !isDisabled(el) && el.tabIndex >= 0 && !isHidden(el));
}

function createUser(options = {}) {
  const run = (fn) => act(async () => { await fn(); });
  const delay = options.delay ?? 0;
  const pause = () => (delay > 0 ? new Promise((r) => realSetTimeout(r, delay)) : Promise.resolve());
  const user = {
    async click(el) { assertInteractable(el, 'click'); await run(() => clickSync(el)); await pause(); },
    async dblClick(el) { await user.click(el); await user.click(el); await run(() => fire(el, 'dblclick', {}, el.ownerDocument.defaultView.MouseEvent)); },
    async type(el, text, opts = {}) {
      assertInteractable(el, 'type');
      if (!opts.skipClick) await run(() => clickSync(el));
      for (const k of parseKeys(text)) {
        const active = el.ownerDocument.activeElement || el;
        await run(() => {
          if (k.key) pressKey(active, k.key);
          else {
            const win = active.ownerDocument.defaultView;
            const ok = fire(active, 'keydown', { key: k.char }, win.KeyboardEvent);
            if (ok) { fire(active, 'keypress', { key: k.char }, win.KeyboardEvent); insertText(active, k.char); }
            fire(active, 'keyup', { key: k.char }, win.KeyboardEvent);
          }
        });
        await pause();
      }
    },
    async clear(el) {
      assertInteractable(el, 'clear');
      await run(() => {
        el.focus();
        if (el.readOnly || isDisabled(el)) return;
        setNativeValue(el, '');
        fire(el, 'input', { inputType: 'deleteContentBackward' }, el.ownerDocument.defaultView.InputEvent);
      });
    },
    async selectOptions(select, values) {
      assertInteractable(select, 'selectOptions');
      const wanted = Array.isArray(values) ? values : [values];
      await run(() => {
        select.focus();
        const options = Array.from(select.options);
        for (const w of wanted) {
          const opt = typeof w === 'string' ? options.find((o) => o.value === w || o.textContent.trim() === w) : w;
          if (!opt) throw new Error(`selectOptions: no option with value or label ${format(w)}`);
          if (opt.disabled) throw new Error(`selectOptions: option ${format(w)} is disabled`);
          if (select.multiple) opt.selected = true;
          else select.value = opt.value;
        }
        fire(select, 'input');
        fire(select, 'change');
      });
    },
    async keyboard(text) {
      for (const k of parseKeys(text)) {
        const el = document.activeElement || document.body;
        await run(() => {
          if (k.key) pressKey(el, k.key);
          else { pressKey(el, k.char); insertText(el, k.char); }
        });
      }
    },
    async tab(opts = {}) {
      await run(() => {
        const list = tabbables(document);
        if (!list.length) return;
        const i = list.indexOf(document.activeElement);
        const next = opts.shift ? list[i <= 0 ? list.length - 1 : i - 1] : list[(i + 1) % list.length];
        next.focus();
      });
    },
    async hover(el) { await run(() => { fire(el, 'pointerover'); fire(el, 'mouseover', {}, el.ownerDocument.defaultView.MouseEvent); fire(el, 'mouseenter', { bubbles: false }); }); },
  };
  return user;
}

export const userEvent = { setup: (options) => createUser(options), ...createUser() };

// Safety net: a form submitted without preventDefault would navigate the grading frame away and
// silently end the run. Record it as an error the learner can see instead.
window.addEventListener('submit', (e) => {
  if (!e.defaultPrevented) {
    e.preventDefault();
    console.log('[warning] A form was submitted without event.preventDefault() — in a real browser the page would reload and the app state would be lost.');
  }
});

// ---------------------------------------------------------------- jest-dom matchers

function elementCheck(el, name) {
  if (!el || el.nodeType !== 1) throw new Error(`${name} needs an element, got ${format(el)}`);
}

expect.extend({
  toBeInTheDocument(el) {
    const pass = !!el && el.nodeType === 1 && el.ownerDocument.contains(el);
    return { pass, message: () => `expected ${format(el)} to be in the document` };
  },
  toBeVisible(el) {
    elementCheck(el, 'toBeVisible');
    return { pass: el.isConnected && !isHidden(el), message: () => `expected ${format(el)} to be visible` };
  },
  toHaveTextContent(el, text) {
    elementCheck(el, 'toHaveTextContent');
    const content = normalize(el.textContent);
    const pass = text instanceof RegExp ? text.test(content) : content.includes(normalize(String(text)));
    return { pass, message: () => `expected ${format(el)} to have text content ${format(text)}, but it is ${format(content)}` };
  },
  toBeDisabled(el) {
    elementCheck(el, 'toBeDisabled');
    return { pass: isDisabled(el) || el.getAttribute('aria-disabled') === 'true', message: () => `expected ${format(el)} to be disabled` };
  },
  toBeEnabled(el) {
    elementCheck(el, 'toBeEnabled');
    return { pass: !isDisabled(el) && el.getAttribute('aria-disabled') !== 'true', message: () => `expected ${format(el)} to be enabled` };
  },
  toHaveAttribute(el, name, value) {
    elementCheck(el, 'toHaveAttribute');
    const has = el.hasAttribute(name);
    const pass = value === undefined ? has : has && matches(el.getAttribute(name), value);
    return { pass, message: () => `expected ${format(el)} to have attribute ${name}${value !== undefined ? `=${format(value)} (got ${format(el.getAttribute(name))})` : ''}` };
  },
  toHaveValue(el, value) {
    elementCheck(el, 'toHaveValue');
    let actual = el.value;
    if (el.type === 'number') actual = el.value === '' ? null : Number(el.value);
    if (el.tagName === 'SELECT' && el.multiple) actual = Array.from(el.selectedOptions).map((o) => o.value);
    return { pass: JSON.stringify(actual) === JSON.stringify(value), message: () => `expected ${format(el)} to have value ${format(value)}, got ${format(actual)}` };
  },
  toBeChecked(el) {
    elementCheck(el, 'toBeChecked');
    const aria = el.getAttribute('aria-checked');
    return { pass: aria !== null ? aria === 'true' : !!el.checked, message: () => `expected ${format(el)} to be checked` };
  },
  toHaveFocus(el) {
    elementCheck(el, 'toHaveFocus');
    return { pass: el.ownerDocument.activeElement === el, message: () => `expected ${format(el)} to have focus; focus is on ${format(el.ownerDocument.activeElement)}` };
  },
  toBeRequired(el) {
    elementCheck(el, 'toBeRequired');
    return { pass: !!el.required || el.getAttribute('aria-required') === 'true', message: () => `expected ${format(el)} to be required` };
  },
  toBeInvalid(el) {
    elementCheck(el, 'toBeInvalid');
    const pass = el.getAttribute('aria-invalid') === 'true' || (typeof el.checkValidity === 'function' && !el.checkValidity());
    return { pass, message: () => `expected ${format(el)} to be invalid (aria-invalid="true")` };
  },
  toHaveAccessibleName(el, name) {
    elementCheck(el, 'toHaveAccessibleName');
    const actual = accessibleName(el);
    const pass = name === undefined ? actual !== '' : matches(actual, name);
    return { pass, message: () => `expected ${format(el)} to have accessible name ${format(name)}, got ${format(actual)}` };
  },
  toHaveAccessibleDescription(el, desc) {
    elementCheck(el, 'toHaveAccessibleDescription');
    const actual = accessibleDescription(el);
    const pass = desc === undefined ? actual !== '' : desc instanceof RegExp ? desc.test(actual) : actual.includes(normalize(String(desc)));
    return { pass, message: () => `expected ${format(el)} to have accessible description ${format(desc)}, got ${format(actual)}` };
  },
  toHaveClass(el, ...names) {
    elementCheck(el, 'toHaveClass');
    return { pass: names.every((n) => el.classList.contains(n)), message: () => `expected ${format(el)} to have class ${names.join(' ')}` };
  },
});
