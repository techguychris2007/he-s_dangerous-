import type { SiemEntry, SiemTool } from './siemTypes';
import { packetFilter } from './packetFilter';

type Cell = string | number | boolean | null;
export type EventRow = Record<string, Cell>;
export interface QueryExecution { rows: EventRow[]; columns: string[]; entries: SiemEntry[]; scanned: number; aggregated: boolean; error?: string }
export function parseEventTimestamp(value: string): number {
  const utc = /^\d{4}-\d\d-\d\d[ T]\d\d:\d\d(?::\d\d(?:\.\d+)?)?$/.test(value) ? value.replace(' ', 'T') + 'Z' : value;
  return Date.parse(utc);
}
const aliases: Record<string, string[]> = {
  account: ['user', 'username', 'UserPrincipalName', 'TargetUserName'], user: ['Account', 'username', 'UserPrincipalName'],
  userprincipalname: ['user', 'Account', 'username'], eventid: ['event_id', 'EventCode', 'event.code'], eventcode: ['EventID', 'event_id', 'event.code'],
  ipaddress: ['src_ip', 'src', 'source.ip', 'ClientIP', 'ip'], 'source.ip': ['src_ip', 'src', 'IPAddress'],
  computer: ['host', 'hostname', 'device'], 'event.category': ['category'], 'metadata.event_type': ['EventType'], 'target.event_type': ['EventType'],
  host: ['Computer', 'hostname', 'device'], src_ip: ['IPAddress', 'source.ip', 'source_ip', 'client_ip', 'ip'],
  operation: ['OperationName', 'event'], operationname: ['Operation', 'event'],
};
export function field(row: EventRow, name: string): Cell {
  for (const key of [name, ...(aliases[name.toLowerCase()] ?? [])]) {
    const found = Object.keys(row).find(candidate => candidate.toLowerCase() === key.toLowerCase());
    if (found) return row[found];
  }
  return null;
}
export function eventRow(entry: SiemEntry): EventRow {
  const time = parseEventTimestamp(entry.timestamp ?? '');
  const timestamp = Number.isFinite(time) ? new Date(time).toISOString() : entry.timestamp ?? '';
  const row: EventRow = { _raw: entry.line, _time: timestamp, TimeGenerated: timestamp, EventType: entry.eventType ?? 'Event', index: 'main' };
  function flatten(value: unknown, prefix = '') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    for (const [key, item] of Object.entries(value)) {
      const path = prefix ? prefix + '.' + key : key;
      if (item !== null && typeof item === 'object') flatten(item, path);
      else if (['string', 'number', 'boolean'].includes(typeof item) || item === null) row[path] = item as Cell;
    }
  }
  try { flatten(JSON.parse(entry.line)); } catch { /* Text logs are extracted below. */ }
  for (const match of entry.line.matchAll(/([\w.]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s&]+))/g)) row[match[1]] = match[2] ?? match[3] ?? match[4];
  Object.assign(row, entry.fields);
  const kind = String(field(row, 'source') ?? '') + ' ' + String(field(row, 'EventType'));
  row.Table = row.Table ?? (/signin|sign_in/i.test(kind) ? 'SigninLogs' : /office|mail/i.test(kind) ? 'OfficeActivity' : /audit/i.test(kind) ? 'AuditLogs' : /process|device/i.test(kind) ? 'DeviceEvents' : /note/i.test(kind) ? 'CaseNotes' : 'SecurityEvent');
  if (!row.sourcetype) row.sourcetype = /auth|login|signin/i.test(kind) ? 'auth' : kind;
  return row;
}
function splitOutside(text: string, separator: string): string[] {
  const parts: string[] = []; let start = 0; let quote = ''; let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) { if (c === quote && text[i - 1] !== '\\') quote = ''; continue; }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') { if (--depth < 0) throw new Error('Unexpected closing parenthesis.'); }
    else if (c === separator && depth === 0) { parts.push(text.slice(start, i).trim()); start = i + 1; }
  }
  if (quote || depth) throw new Error('Close the quoted string or parentheses before running the query.');
  return [...parts, text.slice(start).trim()];
}
const wildcard = (value: string) => new RegExp('^' + value.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i');
function predicate(expression: string, now: number, regexEquality = false, bindings = new Map<string, EventRow[]>()): (row: EventRow) => boolean {
  const tokens = expression.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|!in\b|!=|!~|==|=~|>=|<=|[=><:(),]|[^\s=><:(),!]+/g) ?? [];
  let position = 0;
  const peek = () => tokens[position]?.toLowerCase();
  const pop = () => { const token = tokens[position++]; if (token === undefined) throw new Error('The filter is incomplete.'); return token; };
  function literal(): Cell {
    const token = pop();
    if (/^['"]/.test(token)) return token.slice(1, -1).replace(/\\(['"\\])/g, '$1');
    if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);
    if (/^(true|false)$/i.test(token)) return token.toLowerCase() === 'true';
    if (/^(ago|datetime)$/i.test(token) && peek() === '(') {
      pop(); const argument = pop(); if (pop() !== ')') throw new Error('Invalid time expression.');
      if (token.toLowerCase() === 'datetime') { const time = Date.parse(String(argument).replace(/^['"]|['"]$/g, '')); if (!Number.isFinite(time)) throw new Error('Invalid datetime.'); return time; }
      const duration = argument.match(/^(\d+)(s|m|h|d)$/i); if (!duration) throw new Error('Use ago(15m), ago(1h) or ago(1d).');
      return now - Number(duration[1]) * ({ s: 1000, m: 60000, h: 3600000, d: 86400000 }[duration[2].toLowerCase()] ?? 0);
    }
    return token;
  }
  function atom(): (row: EventRow) => boolean {
    if (peek() === '(') { pop(); const nested = or(); if (pop() !== ')') throw new Error('Close the filter group.'); return nested; }
    if (peek() === 'not') { pop(); const child = atom(); return row => !child(row); }
    const name = pop(); const operator = peek();
    if (operator && ['=', '==', '=~', '!=', '!~', ':', '>', '<', '>=', '<=', 'contains', 'contains_cs', 'has', 'has_any', 'startswith', 'endswith', 'in', '!in', 'between', 'matches'].includes(operator)) {
      pop();
      if (operator === 'between') {
        if (pop() !== '(') throw new Error('Use between (datetime(...) .. datetime(...)).');
        const lower = literal(); if (pop() !== '..') throw new Error('Separate between bounds with ..');
        const upper = literal(); if (pop() !== ')') throw new Error('Close the between range.');
        return row => { const raw = field(row, name); if (raw === null) return false; const value = /time|date/i.test(name) ? parseEventTimestamp(String(raw)) : Number(raw); return Number.isFinite(value) && value >= Number(lower) && value <= Number(upper); };
      }
      if (operator === 'in' || operator === '!in' || operator === 'has_any') {
        if (pop() !== '(') throw new Error('Use in ("value1", "value2").');
        const values: Cell[] = [];
        const binding = bindings.get(tokens[position]);
        if (binding) { pop(); for (const row of binding) values.push(Object.values(row)[0] ?? null); }
        else while (peek() !== ')') { values.push(literal()); if (peek() !== ',') break; pop(); }
        if (pop() !== ')') throw new Error('Close the value list.');
        if (operator === 'has_any') return row => { const terms = String(field(row, name) ?? '').toLowerCase().split(/\W+/); return values.some(value => terms.includes(String(value).toLowerCase())); };
        return row => values.some(value => String(field(row, name)) === String(value)) === (operator === 'in');
      }
      if (operator === 'matches' && pop().toLowerCase() !== 'regex') throw new Error('Use matches regex "pattern".');
      const expected = literal();
      let regex: RegExp | undefined;
      if (operator === 'matches' || (regexEquality && operator === '=~')) { if (String(expected).length > 256 || /\([^)]*[+*][^)]*\)[+*{]/.test(String(expected))) throw new Error('Use a short regex without nested repetition.'); regex = new RegExp(String(expected), 'i'); }
      return row => {
        const actual = field(row, name);
        if (actual === null) return false;
        const a = String(actual), b = String(expected);
        if (operator === 'contains' || operator === 'contains_cs') return operator === 'contains_cs' ? a.includes(b) : a.toLowerCase().includes(b.toLowerCase());
        if (operator === 'has') return a.toLowerCase().split(/\W+/).includes(b.toLowerCase());
        if (operator === 'startswith') return a.toLowerCase().startsWith(b.toLowerCase());
        if (operator === 'endswith') return a.toLowerCase().endsWith(b.toLowerCase());
        if (regex) return regex.test(a);
        if (['>', '<', '>=', '<='].includes(operator)) {
          const numeric = typeof expected === 'number';
          const left = numeric ? (/time/i.test(name) ? Date.parse(a) : Number(a)) : a;
          const right = numeric ? Number(expected) : b;
          if (typeof left === 'number' && !Number.isFinite(left)) return false;
          return operator === '>' ? left > right : operator === '<' ? left < right : operator === '>=' ? left >= right : left <= right;
        }
        const equal = typeof expected === 'number' && /time/i.test(name) ? Date.parse(a) === expected : operator === '=' || operator === ':' ? wildcard(b).test(a) : operator === '=~' || operator === '!~' ? a.toLowerCase() === b.toLowerCase() : a === b;
        return operator === '!=' || operator === '!~' ? !equal : equal;
      };
    }
    const term = name.replace(/^['"]|['"]$/g, '').toLowerCase();
    if (term === '*') return () => true;
    return row => String(row._raw ?? Object.values(row).join(' ')).toLowerCase().includes(term);
  }
  function and(): (row: EventRow) => boolean {
    let left = atom();
    while (position < tokens.length && !['or', ')', ','].includes(peek()!)) { if (peek() === 'and') pop(); const right = atom(), previous = left; left = row => previous(row) && right(row); }
    return left;
  }
  function or(): (row: EventRow) => boolean {
    let left = and(); while (peek() === 'or') { pop(); const right = and(), previous = left; left = row => previous(row) || right(row); } return left;
  }
  if (!tokens.length) throw new Error('Enter a filter after where.');
  const result = or(); if (position !== tokens.length) throw new Error('Unexpected filter token: ' + tokens[position]); return result;
}
function aggregate(rows: EventRow[], expression: string, kusto = false): EventRow[] {
  const [calculations, grouping = ''] = expression.split(/\s+by\s+/i);
  const groups = grouping ? splitOutside(grouping, ',').flatMap(value => /\(/.test(value) ? [value] : value.split(/\s+/)).filter(Boolean) : [];
  const groupSpecs = groups.map(group => {
    const bin = group.match(/^(?:(\w+)\s*=\s*)?bin\(\s*([\w.]+)\s*,\s*(\d+(?:\.\d+)?)([smhd]?)\s*\)$/i);
    if (bin) {
      const size = Number(bin[3]) * (bin[4] ? { s: 1000, m: 60000, h: 3600000, d: 86400000 }[bin[4].toLowerCase()]! : 1);
      if (!(size > 0)) throw new Error('bin() requires a positive size.');
      return { name: bin[1] ?? bin[2], get: (row: EventRow): Cell => {
        const raw = field(row, bin[2]); if (raw === null) return null;
        const value = bin[4] ? parseEventTimestamp(String(raw)) : Number(raw);
        if (!Number.isFinite(value)) return null;
        return bin[4] ? new Date(Math.floor(value / size) * size).toISOString() : Math.floor(value / size) * size;
      } };
    }
    if (!/^[\w.]+$/.test(group)) throw new Error('Group by a field or bin(TimeGenerated, 1h).');
    return { name: group, get: (row: EventRow) => field(row, group) };
  });
  const calculationsList = splitOutside(calculations, ',').flatMap(part => {
    if (kusto) return [part];
    const matches = [...part.matchAll(/(?:(\w+)\s*=\s*)?(?:count|sum|avg|min|max|dc|dcount|values)\s*(?:\(\s*[\w.*]*\s*\))?(?:\s+as\s+\w+)?/gi)];
    let cursor = 0;
    for (const match of matches) { if (part.slice(cursor, match.index).trim()) throw new Error('Invalid aggregation expression.'); cursor = match.index! + match[0].length; }
    if (!matches.length || part.slice(cursor).trim()) throw new Error('Invalid aggregation expression.');
    return matches.map(match => match[0].trim());
  });
  const specs = calculationsList.map(spec => {
    const match = spec.match(/^(?:(\w+)\s*=\s*)?(count|sum|avg|min|max|dc|dcount|values)\s*(?:\(\s*([\w.*]*)\s*\))?(?:\s+as\s+(\w+))?$/i);
    if (!match) throw new Error('Supported aggregations: count(), sum(field), avg(field), min(field), max(field), dc(field), dcount(field), values(field).');
    const fn = match[2].toLowerCase(), key = match[3];
    if (fn !== 'count' && !key) throw new Error(fn + ' needs a field name.');
    return { fn, key, name: match[1] ?? match[4] ?? (kusto ? fn + '_' + (key && key !== '*' ? key : '') : fn === 'count' ? 'count' : fn + '(' + key + ')') };
  });
  const buckets = new Map<string, EventRow[]>();
  for (const row of rows) { const key = JSON.stringify(groupSpecs.map(group => group.get(row))); const bucket = buckets.get(key); if (bucket) bucket.push(row); else buckets.set(key, [row]); }
  if (!groups.length && !rows.length) buckets.set('[]', []);
  return [...buckets.values()].map(bucket => {
    const result: EventRow = Object.fromEntries(groupSpecs.map(group => [group.name, bucket[0] ? group.get(bucket[0]) : null]));
    for (const spec of specs) {
      const values = bucket.map(row => field(row, spec.key ?? '')).filter(value => value !== null);
      const numbers = values.map(Number).filter(Number.isFinite);
      if (spec.fn === 'min' || spec.fn === 'max') {
        const numeric = values.length > 0 && numbers.length === values.length;
        result[spec.name] = values.reduce<Cell>((best, value) => {
          if (best === null) return value;
          const comparison = numeric ? Number(value) - Number(best) : String(value).localeCompare(String(best));
          return (spec.fn === 'min' ? comparison < 0 : comparison > 0) ? value : best;
        }, null);
      } else result[spec.name] = spec.fn === 'count' ? (spec.key && spec.key !== '*' ? values.length : bucket.length) : ['dc', 'dcount'].includes(spec.fn) ? new Set(values).size : spec.fn === 'values' ? [...new Set(values)].join(', ') : spec.fn === 'sum' ? numbers.reduce((a, b) => a + b, 0) : !numbers.length ? null : numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }
    return result;
  });
}
export function executeSiemQuery(entries: SiemEntry[], query: string, tool: SiemTool, parentBindings = new Map<string, EventRow[]>(), depth = 0): QueryExecution {
  const empty: QueryExecution = { rows: [], columns: [], entries: [], scanned: entries.length, aggregated: false };
  try {
    if (query.length > 4000) throw new Error('Keep the query below 4,000 characters.');
    if (depth > 8) throw new Error('The query contains too many nested table definitions.');
    const bindings = new Map(parentBindings);
    query = query.replace(/^\s*\/\/[^\n]*(?:\n|$)/gm, '').trim();
    const statements = splitOutside(query, ';').filter(Boolean);
    if (statements.length > 1 || /^let\s/i.test(query)) {
      if (tool !== 'sentinel') throw new Error('let table definitions are supported in Kusto mode only.');
      const last = statements.pop();
      for (const statement of statements) {
        const definition = statement.match(/^let\s+([A-Za-z_]\w*)\s*=\s*([\s\S]+)$/i);
        if (!definition) throw new Error('Use let name = Table | ...; followed by a result query.');
        const evaluated = executeSiemQuery(entries, definition[2], tool, bindings, depth + 1);
        if (evaluated.error) throw new Error(evaluated.error);
        bindings.set(definition[1], evaluated.rows.map(row => Object.fromEntries(Object.entries(row).filter(([key]) => !['_raw', '_time', 'Table', 'index'].includes(key)))));
      }
      if (!last || /^let\s/i.test(last)) throw new Error('Add a result query after the let definitions.');
      query = last;
    }
    let parts = splitOutside(query.trim(), '|');
    let source = entries.map(entry => ({ entry, row: eventRow(entry) }));
    const now = Math.max(...source.map(item => Date.parse(String(item.row.TimeGenerated))).filter(Number.isFinite), 0);
    if (tool === 'qradar' && /^select\b/i.test(parts[0])) {
      const sql = parts[0].match(/^select\s+(.+?)\s+from\s+events(?:\s+where\s+(.+?))?(?:\s+group\s+by\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?(?:\s+last\s+(\d+)\s+(minutes?|hours?|days?))?$/i);
      if (!sql) throw new Error('Use SELECT fields FROM events WHERE condition [GROUP BY field] [ORDER BY field DESC] [LIMIT n].');
      parts = [sql[2] ?? '*', ...(sql[6] ? ['where TimeGenerated >= ago(' + sql[6] + sql[7][0] + ')'] : []), ...( /\b(count|sum|avg|min|max)\s*\(/i.test(sql[1]) ? ['stats ' + splitOutside(sql[1], ',').filter(item => /\(/.test(item)).join(', ') + (sql[3] ? ' by ' + sql[3] : '')] : sql[1] === '*' ? [] : ['project ' + sql[1]]), ...(sql[4] ? ['sort by ' + sql[4]] : []), ...(sql[5] ? ['take ' + sql[5]] : []), ...parts.slice(1)];
    }
    let first = parts.shift() ?? '*';
    if (!first) throw new Error('Enter a query, or * to inspect the dataset.');
    if (tool === 'tcpdump' && /^(?:\(?\s*)*(?:tcp\b|udp\b|icmp\b|ip\b|src\b|dst\b|host\b|port\b|not\b)/i.test(first)) { const test = packetFilter(first); source = source.filter(item => test(item.entry)); }
    else if (tool === 'sentinel' && bindings.has(first)) source = bindings.get(first)!.map(row => ({ entry: { line: JSON.stringify(row), fields: row }, row }));
    else if (tool === 'sentinel' && /^[A-Za-z][\w]*$/.test(first) && (source.some(item => item.row.Table === first) || /^(SecurityEvent|SigninLogs|OfficeActivity|AuditLogs|DeviceEvents|CaseNotes)$/.test(first))) source = source.filter(item => item.row.Table === first);
    else {
      first = first.replace(/^search\s+/i, '');
      const test = predicate(first, now, tool === 'suricata', bindings); source = source.filter(item => test(item.row));
    }
    let rows = source.map(item => item.row); let aggregated = false;
    for (const stage of parts) {
      const command = stage.match(/^(\S+)\s*(.*)$/s); if (!command) throw new Error('Empty query pipeline stage.');
      const op = command[1].toLowerCase(), args = command[2];
      if (op === 'where' || op === 'search') rows = rows.filter(predicate(args, now, tool === 'suricata', bindings));
      else if (op === 'stats' || op === 'summarize') { rows = aggregate(rows, args, op === 'summarize'); aggregated = true; }
      else if (op === 'count') { if (args) throw new Error('Use | count without arguments.'); rows = [{ Count: rows.length }]; aggregated = true; }
      else if (['head', 'take', 'limit'].includes(op)) { const n = Number(args); if (!Number.isInteger(n) || n < 0) throw new Error('Provide a non-negative row limit.'); rows = rows.slice(0, n); }
      else if (['table', 'fields', 'project', 'distinct', 'dedup'].includes(op)) {
        const keys = args.split(/[\s,]+/).filter(Boolean); if (!keys.length) throw new Error(op + ' needs field names.');
        if (op === 'dedup') { const seen = new Set<string>(); rows = rows.filter(row => { const key = JSON.stringify(keys.map(key => field(row, key))); if (seen.has(key)) return false; seen.add(key); return true; }); }
        else { rows = rows.map(row => Object.fromEntries(keys.map(key => [key, field(row, key)]))); if (op === 'distinct') rows = [...new Map(rows.map(row => [JSON.stringify(row), row])).values()]; }
      }
      else if (op === 'sort' || op === 'order') {
        const keys = splitOutside(args.replace(/^by\s+/i, ''), ',');
        const sorts = keys.map(key => { const match = key.match(/^(-?)([\w.()]+)(?:\s+(asc|desc))?$/i); if (!match) throw new Error('Sort with: sort by field desc, otherfield asc'); return { key: match[2], direction: match[1] || match[3]?.toLowerCase() === 'desc' ? -1 : 1 }; });
        rows = [...rows].sort((a, b) => { for (const sort of sorts) { const av = field(a, sort.key), bv = field(b, sort.key); if (av === null || bv === null) { if (av !== bv) return av === null ? 1 : -1; continue; } const result = av === bv ? 0 : Number.isFinite(Number(av)) && Number.isFinite(Number(bv)) ? Number(av) - Number(bv) : String(av).localeCompare(String(bv)); if (result) return result * sort.direction; } return 0; });
      }
      else throw new Error('Unsupported operator "' + op + '". Open Query reference for the supported syntax; this query has not been partially executed.');
    }
    const columns = [...new Set(rows.flatMap(row => Object.keys(row)))];
    const origins = new Map(source.map(item => [item.row, item.entry]));
    return { rows, columns, entries: aggregated ? [] : rows.flatMap(row => origins.get(row) ?? []), scanned: entries.length, aggregated };
  } catch (error) { return { ...empty, error: error instanceof Error ? error.message : 'Invalid query.' }; }
}
