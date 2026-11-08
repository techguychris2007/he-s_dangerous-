// `dw:project` — what the grader of a configuration task (Dockerfile, Compose, Container Apps YAML,
// Terraform, GitHub Actions, shell scripts) needs: the project's files, and parsers that turn them into
// data the tests can assert on. Learners never import this; only graders do. Real tools are stricter
// than these parsers in places — they check structure, not every corner of each syntax.
import { parseDocument, LineCounter } from 'yaml';

function files() {
  return globalThis.__dw_project_files__ || {};
}

export function listFiles() {
  return Object.keys(files()).sort();
}

export function fileExists(path) {
  return Object.prototype.hasOwnProperty.call(files(), path);
}

export function readFile(path) {
  const all = files();
  if (!Object.prototype.hasOwnProperty.call(all, path)) throw new Error('No file named ' + path + ' in the project.');
  return all[path];
}

// ------------------------------------------------------------------ YAML

/** { ok: true, value } or { ok: false, error: "line 3: …" }. Duplicate keys are errors, as in Compose. */
export function parseYaml(text) {
  const lineCounter = new LineCounter();
  const doc = parseDocument(text, { lineCounter, uniqueKeys: true, prettyErrors: false });
  if (doc.errors.length) {
    const e = doc.errors[0];
    const pos = e.pos ? lineCounter.linePos(e.pos[0]) : null;
    return { ok: false, error: (pos ? 'line ' + pos.line + ': ' : '') + e.message.split('\n')[0] };
  }
  return { ok: true, value: doc.toJS({ maxAliasCount: 50 }) };
}

// ------------------------------------------------------------------ Dockerfile

const FLAG_INSTRUCTIONS = new Set(['FROM', 'COPY', 'ADD', 'RUN', 'HEALTHCHECK']);

/** Instructions with line numbers, flags (--from=build), exec-form arrays, and build stages. */
export function parseDockerfile(text) {
  const instructions = [];
  const errors = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let buffer = '';
  let startLine = 0;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (buffer === '' && (trimmed === '' || trimmed.startsWith('#'))) continue;
    if (buffer !== '' && trimmed.startsWith('#')) continue; // comments inside a continuation are ignored
    if (buffer === '') startLine = i + 1;
    if (/\\\s*$/.test(raw)) { buffer += raw.replace(/\\\s*$/, ' '); continue; }
    buffer += raw;
    const m = /^\s*([A-Za-z]+)\s*(.*)$/s.exec(buffer);
    buffer = '';
    if (!m) { errors.push('line ' + startLine + ': cannot read this instruction'); continue; }
    const instruction = m[1].toUpperCase();
    let args = m[2].trim().replace(/\s+/g, ' ');
    const flags = {};
    if (FLAG_INSTRUCTIONS.has(instruction)) {
      let fm;
      while ((fm = /^--([a-z-]+)(?:=(\S*))?\s*/i.exec(args))) {
        flags[fm[1].toLowerCase()] = fm[2] === undefined ? true : fm[2];
        args = args.slice(fm[0].length);
      }
    }
    let json = null;
    if (args.startsWith('[')) {
      try { const parsed = JSON.parse(args); if (Array.isArray(parsed)) json = parsed.map(String); } catch { /* shell form after all */ }
    }
    instructions.push({ instruction, args, flags, json, line: startLine, stage: -1 });
  }
  if (buffer) errors.push('line ' + startLine + ': the file ends in the middle of a continued line');

  const stages = [];
  for (const ins of instructions) {
    if (ins.instruction === 'FROM') {
      const parts = ins.args.split(' ');
      const asIndex = parts.findIndex((p) => p.toLowerCase() === 'as');
      stages.push({ index: stages.length, image: parseImage(parts[0] || ''), name: asIndex >= 0 ? parts[asIndex + 1] || null : null, line: ins.line, instructions: [] });
    }
    if (stages.length === 0) { if (ins.instruction !== 'ARG') errors.push('line ' + ins.line + ': ' + ins.instruction + ' before the first FROM'); continue; }
    ins.stage = stages.length - 1;
    stages[stages.length - 1].instructions.push(ins);
  }
  if (!stages.length) errors.push('no FROM instruction');
  return { instructions, stages, errors };
}

/** "mcr.microsoft.com/dotnet/aspnet:10.0@sha256:…" → { name, tag, digest, ref } */
export function parseImage(ref) {
  let rest = ref;
  let digest = null;
  const at = rest.indexOf('@');
  if (at >= 0) { digest = rest.slice(at + 1); rest = rest.slice(0, at); }
  const colon = rest.lastIndexOf(':');
  const slash = rest.lastIndexOf('/');
  let tag = null;
  if (colon > slash) { tag = rest.slice(colon + 1); rest = rest.slice(0, colon); }
  return { name: rest, tag, digest, ref };
}

// ------------------------------------------------------------------ shell scripts

/** Splits a script into commands (on newlines, ; and &&), honouring quotes and \ continuations.
 *  Each command: { argv, line, text }. Variables are left as written ($RG). */
export function parseShell(text) {
  const commands = [];
  const src = text.replace(/\r\n/g, '\n').replace(/\\\n/g, ' ');
  // Line numbers: map each character index back to its original line.
  const original = text.replace(/\r\n/g, '\n');
  const lineAt = (() => {
    const map = [];
    let line = 1;
    for (let i = 0; i < original.length; i++) {
      if (original[i] === '\\' && original[i + 1] === '\n') { map.push(line, line); i++; line++; continue; }
      map.push(line);
      if (original[i] === '\n') line++;
    }
    return (i) => map[i] || line;
  })();
  let argv = [];
  let word = null;
  let start = -1;
  let quote = null;
  const endWord = () => { if (word !== null) { argv.push(word); word = null; } };
  const endCommand = (i) => {
    endWord();
    if (argv.length) commands.push({ argv, line: lineAt(start), text: src.slice(start, i).trim() });
    argv = [];
    start = -1;
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && i + 1 < src.length) word += src[++i];
      else word += c;
      continue;
    }
    if (c === '#' && word === null) { while (i < src.length && src[i] !== '\n') i++; endCommand(i); continue; }
    if (c === '\n' || c === ';') { endCommand(i); continue; }
    if (c === '&' && src[i + 1] === '&') { endCommand(i); i++; continue; }
    if (c === ' ' || c === '\t') { endWord(); continue; }
    if (start < 0) start = i;
    if (c === '"' || c === "'") { quote = c; if (word === null) word = ''; continue; }
    if (c === '\\' && i + 1 < src.length) { word = (word ?? '') + src[++i]; continue; }
    word = (word ?? '') + c;
  }
  endCommand(src.length);
  return commands;
}

/** The value of a --flag in an argv, accepting "--flag value" and "--flag=value"; true for a bare flag. */
export function flagValue(argv, flag) {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === flag) return i + 1 < argv.length && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
    if (argv[i].startsWith(flag + '=')) return argv[i].slice(flag.length + 1);
  }
  return undefined;
}

/** Every value of a repeatable or multi-value flag: "--env-vars A=1 B=2 --x" → ['A=1', 'B=2'];
 *  "--flag=v" forms are included. */
export function flagValues(argv, flag) {
  const values = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith(flag + '=')) { values.push(argv[i].slice(flag.length + 1)); continue; }
    if (argv[i] !== flag) continue;
    for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j++) values.push(argv[j]);
  }
  return values;
}

/** Top-level variable assignments, in order: NAME=value with the value's source text (quotes kept),
 *  e.g. { name: 'ACR_ID', value: '$(az acr show … -o tsv)', line: 3 }. */
export function shellAssignments(text) {
  const out = [];
  for (const c of parseShell(text)) {
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/s.exec(c.text);
    if (m) out.push({ name: m[1], value: m[2].trim(), line: c.line });
  }
  return out;
}

/** Every Azure CLI call in a script, including those inside command substitution:
 *  ACR_ID=$(az acr show -n "$ACR" --query id -o tsv) → { args: ['acr', 'show', '-n', '$ACR', …], assignTo: 'ACR_ID', line }.
 *  args start after "az"; quotes are removed, variables are left as written. */
export function azCalls(text) {
  const calls = [];
  for (const c of parseShell(text)) {
    if (c.argv[0] === 'az') { calls.push({ args: c.argv.slice(1), assignTo: null, line: c.line }); continue; }
    const assigned = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=/.exec(c.text);
    let k = c.text.indexOf('$(az ');
    while (k >= 0) {
      let depth = 1;
      let j = k + 2;
      while (j < c.text.length && depth > 0) {
        if (c.text[j] === '(') depth++;
        else if (c.text[j] === ')') depth--;
        j++;
      }
      const inner = parseShell(c.text.slice(k + 2, depth === 0 ? j - 1 : j))[0];
      if (inner && inner.argv[0] === 'az') calls.push({ args: inner.argv.slice(1), assignTo: assigned ? assigned[1] : null, line: c.line });
      k = c.text.indexOf('$(az ', j);
    }
  }
  return calls;
}

// ------------------------------------------------------------------ HCL (Terraform)

function tokenizeHcl(text) {
  const tokens = [];
  let i = 0;
  let line = 1;
  let iterStart = 0;
  let pending = null;
  // Every token records its source span, so raw expressions can be quoted exactly as written.
  const record = (token) => { token.start = iterStart; pending = token; tokens.push(token); };
  const push = (type, value) => record({ type, value, line });
  while (i < text.length) {
    if (pending) { pending.end = i; pending = null; }
    iterStart = i;
    const c = text[i];
    if (c === '\n') { push('nl', '\n'); line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
    if (c === '#' || (c === '/' && text[i + 1] === '/')) { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      const chunk = text.slice(i, end < 0 ? text.length : end + 2);
      line += (chunk.match(/\n/g) || []).length;
      i += chunk.length;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      let value = '';
      let depth = 0;
      while (j < text.length) {
        const d = text[j];
        if (d === '\\' && j + 1 < text.length) {
          const n = text[j + 1];
          value += n === 'n' ? '\n' : n === 't' ? '\t' : n;
          j += 2;
          continue;
        }
        if (d === '$' && text[j + 1] === '{') { depth++; value += '${'; j += 2; continue; }
        if (d === '}' && depth > 0) { depth--; value += '}'; j++; continue; }
        if (d === '"' && depth === 0) break;
        if (d === '\n') line++;
        value += d;
        j++;
      }
      record({ type: 'string', value, raw: text.slice(i, j + 1), line });
      i = j + 1;
      continue;
    }
    if (c === '<' && text[i + 1] === '<') {
      const m = /^<<-?([A-Za-z_][A-Za-z0-9_]*)\n/.exec(text.slice(i));
      if (m) {
        const bodyStart = i + m[0].length;
        const endRe = new RegExp('^\\s*' + m[1] + '\\s*$', 'm');
        const rest = text.slice(bodyStart);
        const em = endRe.exec(rest);
        const body = em ? rest.slice(0, em.index) : rest;
        const consumed = em ? em.index + em[0].length : rest.length;
        record({ type: 'string', value: body, raw: text.slice(i, bodyStart + consumed), line });
        line += (text.slice(i, bodyStart + consumed).match(/\n/g) || []).length;
        i = bodyStart + consumed;
        continue;
      }
    }
    const num = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (num && !/[A-Za-z_]/.test(text[i + num[0].length] || '')) { push('number', Number(num[0])); i += num[0].length; continue; }
    const id = /^[A-Za-z_][A-Za-z0-9_-]*/.exec(text.slice(i));
    if (id) { push('ident', id[0]); i += id[0].length; continue; }
    if (text.startsWith('...', i)) { push('punct', '...'); i += 3; continue; }
    const two = text.slice(i, i + 2);
    if (['==', '!=', '>=', '<=', '&&', '||', '=>'].includes(two)) { push('punct', two); i += 2; continue; }
    push('punct', c);
    i++;
  }
  if (pending) pending.end = i;
  iterStart = i;
  push('eof', '');
  pending.end = i;
  return tokens;
}

const tokenText = (t) => (t.type === 'string' ? t.raw : String(t.value));

class HclParser {
  constructor(text) { this.text = text; this.tokens = tokenizeHcl(text); this.pos = 0; }
  peek(o = 0) { return this.tokens[this.pos + o]; }
  next() { return this.tokens[this.pos++]; }
  skipNewlines() { while (this.peek().type === 'nl') this.pos++; }
  fail(msg, t = this.peek()) { throw new Error('line ' + t.line + ': ' + msg); }

  body(closer) {
    const attributes = {};
    const blocks = [];
    for (;;) {
      this.skipNewlines();
      const t = this.peek();
      if (t.type === 'eof') { if (closer) this.fail('missing "}"'); break; }
      if (closer && t.type === 'punct' && t.value === '}') { this.next(); break; }
      if (t.type !== 'ident') this.fail('expected an attribute or block name, found "' + tokenText(t) + '"');
      this.next();
      const after = this.peek();
      if (after.type === 'punct' && after.value === '=') {
        this.next();
        if (Object.prototype.hasOwnProperty.call(attributes, t.value)) this.fail('attribute "' + t.value + '" is set twice', t);
        attributes[t.value] = this.expression(['nl', 'eof', '}']);
        continue;
      }
      const labels = [];
      while (this.peek().type === 'string' || this.peek().type === 'ident') labels.push(this.next().value);
      if (!(this.peek().type === 'punct' && this.peek().value === '{')) this.fail('expected "{" to open the ' + t.value + ' block');
      this.next();
      const inner = this.body(true);
      blocks.push({ type: t.value, labels, attributes: inner.attributes, blocks: inner.blocks, line: t.line });
    }
    return { attributes, blocks };
  }

  /** Reads one expression up to a terminator at depth 0. Simple literals, lists and objects become
   *  structured values; anything else ({ type: 'expr', text }) keeps its source text. */
  expression(terminators) {
    const start = this.pos;
    const value = this.primary();
    const t = this.peek();
    const atEnd = (t.type === 'nl' && terminators.includes('nl')) || t.type === 'eof'
      || (t.type === 'punct' && terminators.includes(t.value));
    if (value && atEnd) return value;
    this.pos = start;
    let first = null;
    let last = null;
    let depth = 0;
    for (;;) {
      const u = this.peek();
      if (u.type === 'eof') break;
      if (depth === 0 && ((u.type === 'nl' && terminators.includes('nl')) || (u.type === 'punct' && terminators.includes(u.value)))) break;
      if (u.type === 'punct' && ['(', '[', '{'].includes(u.value)) depth++;
      if (u.type === 'punct' && [')', ']', '}'].includes(u.value)) depth--;
      if (u.type !== 'nl') { first ??= u; last = u; }
      this.next();
    }
    if (!first) this.fail('expected a value');
    return { type: 'expr', text: this.text.slice(first.start, last.end).replace(/\s+/g, ' ').trim() };
  }

  primary() {
    const t = this.peek();
    if (t.type === 'string') { this.next(); return { type: 'string', value: t.value, template: t.value.includes('${') }; }
    if (t.type === 'number') { this.next(); return { type: 'number', value: t.value }; }
    if (t.type === 'ident' && (t.value === 'true' || t.value === 'false')) { this.next(); return { type: 'bool', value: t.value === 'true' }; }
    if (t.type === 'ident' && t.value === 'null') { this.next(); return { type: 'null' }; }
    if (t.type === 'punct' && t.value === '[') {
      this.next();
      const items = [];
      for (;;) {
        this.skipNewlines();
        if (this.peek().type === 'punct' && this.peek().value === ']') { this.next(); break; }
        items.push(this.expression([',', ']', 'nl']));
        this.skipNewlines();
        if (this.peek().type === 'punct' && this.peek().value === ',') this.next();
        else if (!(this.peek().type === 'punct' && this.peek().value === ']')) return null;
      }
      return { type: 'list', items };
    }
    if (t.type === 'punct' && t.value === '{') {
      this.next();
      const entries = {};
      for (;;) {
        this.skipNewlines();
        const k = this.peek();
        if (k.type === 'punct' && k.value === '}') { this.next(); break; }
        if (k.type !== 'ident' && k.type !== 'string') return null;
        this.next();
        const sep = this.next();
        if (!(sep.type === 'punct' && (sep.value === '=' || sep.value === ':'))) return null;
        entries[k.value] = this.expression([',', '}', 'nl']);
        if (this.peek().type === 'punct' && this.peek().value === ',') this.next();
      }
      return { type: 'object', entries };
    }
    return null;
  }
}

/** { ok: true, value: { attributes, blocks } } or { ok: false, error }. Several files can be parsed
 *  and merged with mergeHcl, as Terraform reads every .tf file in a directory as one configuration. */
export function parseHcl(text) {
  try {
    return { ok: true, value: new HclParser(text.replace(/\r\n/g, '\n')).body(false) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function mergeHcl(...docs) {
  return { attributes: Object.assign({}, ...docs.map((d) => d.attributes)), blocks: docs.flatMap((d) => d.blocks) };
}

/** Blocks of a type whose leading labels match: findBlocks(doc, 'resource', 'azurerm_container_app'). */
export function findBlocks(body, type, ...labels) {
  return body.blocks.filter((b) => b.type === type && labels.every((l, i) => b.labels[i] === l));
}

/** Source-like text of any parsed value, for assertions such as text(attr).includes('var.location'). */
export function hclText(value) {
  if (!value) return '';
  switch (value.type) {
    case 'string': return JSON.stringify(value.value);
    case 'number': case 'bool': return String(value.value);
    case 'null': return 'null';
    case 'list': return '[' + value.items.map(hclText).join(', ') + ']';
    case 'object': return '{ ' + Object.entries(value.entries).map(([k, v]) => k + ' = ' + hclText(v)).join(', ') + ' }';
    default: return value.text;
  }
}
