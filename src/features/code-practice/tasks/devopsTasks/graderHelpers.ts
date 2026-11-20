/** Grader preamble for Month 5 Build Portal projects, which check several configuration files at
 *  once. It is TypeScript source text (prepended to each project's TESTS), so it avoids backslashes
 *  and template strings and survives being embedded in a template literal unchanged. */
export const PROJECT_GRADER_HELPERS = `import { describe, it, expect } from 'vitest';
import { readFile, fileExists, parseDockerfile, parseYaml, parseHcl, mergeHcl, findBlocks, hclText, parseShell, flagValue, flagValues, azCalls, shellAssignments, type AzCall, type DockerInstruction, type DockerStage, type HclBody, type HclBlock, type HclValue } from 'dw:project';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = any;

function need<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) throw new Error(message);
  return value;
}
const read = (path: string): string => (fileExists(path) ? readFile(path) : '');

// ---- Dockerfiles
const dockerfile = (path: string) => parseDockerfile(read(path));
type Docker = ReturnType<typeof dockerfile>;
const lastStage = (d: Docker, path: string): DockerStage => need(d.stages[d.stages.length - 1], path + ' has no FROM instruction.');
const words = (i: DockerInstruction): string[] => i.json ?? i.args.split(' ');
function option(ws: string[], names: string[]): string | undefined {
  for (let k = 0; k < ws.length; k++) {
    for (const n of names) {
      if (ws[k] === n) return ws[k + 1];
      if (ws[k].startsWith(n + '=')) return ws[k].slice(n.length + 1);
    }
  }
  return undefined;
}
const trimSlash = (p: string): string => (p.length > 1 && p.endsWith('/') ? trimSlash(p.slice(0, -1)) : p);
const ofType = (s: DockerStage, name: string) => s.instructions.filter((i) => i.instruction === name);
const indexWhere = (s: DockerStage, test: (i: DockerInstruction) => boolean) => s.instructions.findIndex(test);
function lastIndexWhere(s: DockerStage, test: (i: DockerInstruction) => boolean): number {
  let at = -1;
  s.instructions.forEach((i, k) => { if (test(i)) at = k; });
  return at;
}
const pinned = (s: DockerStage) => !!s.image.digest || (s.image.tag !== null && s.image.tag !== 'latest');
const SECRET_WORDS = ['PASSWORD', 'PASSWD', 'SECRET', 'TOKEN', 'API_KEY', 'APIKEY', 'PRIVATE_KEY', 'CLIENT_SECRET'];
const envKey = (i: DockerInstruction) => i.args.split('=')[0].split(' ')[0].toUpperCase();
const secretLeaks = (d: Docker) => d.instructions
  .filter((i) => (i.instruction === 'ENV' || i.instruction === 'ARG') && SECRET_WORDS.some((w) => envKey(i).includes(w)))
  .map((i) => 'line ' + i.line + ': ' + i.instruction + ' ' + envKey(i));

// ---- ignore files (.dockerignore, .gitignore): does a pattern exclude this top-level name?
function ignores(path: string, name: string): boolean {
  const norm = (l: string): string => {
    let p = l.trim();
    for (const prefix of ['**/', '/']) if (p.startsWith(prefix)) p = p.slice(prefix.length);
    for (const suffix of ['/**', '/']) if (p.endsWith(suffix)) p = p.slice(0, -suffix.length);
    return p;
  };
  return read(path).split(String.fromCharCode(10)).map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith('!')).some((l) => norm(l) === name);
}

// ---- YAML (Compose, Container Apps, GitHub Actions)
function yamlFile(path: string): { ok: boolean; error: string; value: Data } {
  const r = parseYaml(read(path));
  return r.ok ? { ok: true, error: '', value: r.value && typeof r.value === 'object' ? r.value : {} } : { ok: false, error: r.error, value: {} };
}
function envOf(s: Data): Record<string, string> {
  const e = s?.environment;
  if (!e) return {};
  if (Array.isArray(e)) {
    return Object.fromEntries(e.map((x: unknown) => {
      const t = String(x);
      const k = t.indexOf('=');
      return k < 0 ? [t, ''] : [t.slice(0, k), t.slice(k + 1)];
    }));
  }
  return Object.fromEntries(Object.entries(e).map(([k, v]) => [k, v === null || v === undefined ? '' : String(v)]));
}
const namesOf = (v: Data): string[] => (Array.isArray(v) ? v.map((x: Data) => (typeof x === 'string' ? x : String(x?.source ?? x?.target ?? x?.name ?? ''))) : v && typeof v === 'object' ? Object.keys(v) : []);
function dependsOn(s: Data): Record<string, string> {
  const d = s?.depends_on;
  if (Array.isArray(d)) return Object.fromEntries(d.map((n: unknown) => [String(n), 'service_started']));
  if (d && typeof d === 'object') return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, String((v as Data)?.condition ?? 'service_started')]));
  return {};
}
const portsOf = (s: Data): string[] => (Array.isArray(s?.ports) ? s.ports.map((p: Data) => (typeof p === 'object' && p ? String(p.published ?? '') + ':' + String(p.target ?? '') : String(p))) : []);
const hasKey = (o: Data, key: string): boolean => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, key);
const healthTest = (s: Data): string => { const t = s?.healthcheck?.test; return Array.isArray(t) ? t.join(' ') : String(t ?? ''); };

// ---- shell scripts and the Azure CLI
const azOf = (path: string): AzCall[] => azCalls(read(path));
const assignsOf = (path: string) => shellAssignments(read(path));
const isAz = (c: AzCall, ...p: string[]) => p.every((x, i) => c.args[i] === x);
function azFlag(c: AzCall, ...names: string[]): string {
  for (const n of names) {
    const v = flagValue(c.args, n);
    if (typeof v === 'string') return v;
    if (v === true) return 'true';
  }
  return '';
}
const strictShell = (path: string) => parseShell(read(path)).find((c) => c.argv[0] === 'set' && c.argv.join(' ').includes('-e') && c.argv.join(' ').includes('u') && c.argv.join(' ').includes('pipefail'));
const varOf = (value: string): string => (value.startsWith('$') ? value.slice(1).split('{').join('').split('}').join('') : '');

// ---- Terraform (HCL)
const EMPTY_BODY: HclBody = { attributes: {}, blocks: [] };
function hclFile(path: string): { error: string; body: HclBody } {
  if (!fileExists(path)) return { error: path + ' is missing', body: EMPTY_BODY };
  const r = parseHcl(read(path));
  return r.ok ? { error: '', body: r.value } : { error: path + ': ' + r.error, body: EMPTY_BODY };
}
const tfText = (b: { attributes: Record<string, HclValue> }, attr: string): string => hclText(b.attributes[attr]);
function tfValue(b: { attributes: Record<string, HclValue> }, attr: string): unknown {
  const v = b.attributes[attr];
  return v && (v.type === 'string' || v.type === 'number' || v.type === 'bool') ? v.value : undefined;
}
const tfBlock = (where: string, body: HclBody, type: string, ...labels: string[]): HclBlock =>
  need(findBlocks(body, type, ...labels)[0], where + ': add ' + [type, ...labels.map((l) => '"' + l + '"')].join(' ') + ' { … }');
const tfChild = (b: HclBlock, type: string): HclBlock =>
  need(b.blocks.find((x) => x.type === type), 'Add ' + ('aeiou'.includes(type[0]) ? 'an ' : 'a ') + type + ' { … } block inside ' + [b.type, ...b.labels].join(' '));
const tfEntry = (v: HclValue | undefined, key: string): HclValue | undefined => (v && v.type === 'object' ? v.entries[key] : undefined);
`;
