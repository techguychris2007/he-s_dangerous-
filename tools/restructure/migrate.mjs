// One-off codemod that applies layout.mjs: moves every file with `git mv` and rewrites every relative
// import, worker URL, CSS url() and repository path string so the code behaves exactly as before.
// usage: node tools/restructure/migrate.mjs [layout module, default ./layout.mjs] [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const { RULES, TOOLING } = await import(process.argv.find(a => a.endsWith('.mjs') && a !== process.argv[1]) ?? './layout.mjs');
const ts = createRequire(import.meta.url)('typescript');

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const dry = process.argv.includes('--dry');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const tracked = git('ls-files').split('\n').filter(Boolean);

// ── 1. old path → new path for every tracked file ─────────────────────────────────────────────────
const moves = new Map();
const unmapped = [];
for (const file of tracked.filter(f => f.startsWith('src/'))) {
  const rule = RULES.find(([from]) => (from.endsWith('/') ? file.startsWith(from) : file === from));
  if (!rule) { unmapped.push(file); continue; }
  const [from, to] = rule;
  if (to === null) continue;
  moves.set(file, from.endsWith('/') ? to + file.slice(from.length) : to);
}
for (const file of tracked) {
  const test = file.match(TOOLING.testPattern);
  if (test && !TOOLING.keepInScripts.includes(file)) moves.set(file, `${TOOLING.testDir}/${test[1]}`);
  if (TOOLING.sqlChecks[file]) moves.set(file, TOOLING.sqlChecks[file]);
}
if (unmapped.length) { console.error('Unmapped files:\n  ' + unmapped.join('\n  ')); process.exit(1); }
const targets = new Map();
for (const [from, to] of moves) {
  if (targets.has(to)) throw new Error(`Two files map to ${to}: ${targets.get(to)} and ${from}`);
  targets.set(to, from);
}
const moved = [...moves].filter(([a, b]) => a !== b);
console.log(`${moves.size} files mapped, ${moved.length} move`);

// ── 2. resolution helpers (all paths repository-relative, posix) ──────────────────────────────────
const exists = new Set(tracked);
const EXTENSIONS = ['', '.ts', '.tsx', '.d.ts', '.js', '.cjs', '.mjs', '.css', '/index.ts', '/index.tsx'];
const resolveOld = (fromFile, spec) => {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), spec));
  for (const ext of EXTENSIONS) if (exists.has(base + ext)) return { file: base + ext, ext };
  return null;
};
const relative = (fromFile, toFile) => {
  let rel = path.posix.relative(path.posix.dirname(fromFile), toFile);
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
};
const newPath = file => moves.get(file) ?? file;
const SPEC = /^\.\.?\//;

// Rewrites one relative specifier written in `file` (old location) for the file's new location.
const rewriteSpec = (file, raw) => {
  const [spec, query = ''] = raw.split(/(?=\?)/);
  if (!SPEC.test(spec)) return raw;
  const hit = resolveOld(file, spec);
  if (!hit) {
    // Paths outside the repository's tracked files (node_modules, generated assets): keep the target.
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
    if (target.startsWith('node_modules/') || target.startsWith('public/') || target.startsWith('dist/')) return relative(newPath(file), target) + query;
    unresolved.push(`${file}: ${raw}`);
    return raw;
  }
  let target = newPath(hit.file);
  if (hit.ext.startsWith('/index')) target = target.slice(0, -hit.ext.length);
  else if (hit.ext) target = target.slice(0, -hit.ext.length);
  return relative(newPath(file), target) + query;
};
const unresolved = [];

// Repository path strings such as 'src/data/labs.ts' or 'src/content/depth' (files or whole folders).
const dirMap = (oldDir) => {
  const inside = [...moves].filter(([from]) => from.startsWith(oldDir + '/'));
  if (!inside.length) return null;
  const mapped = new Set(inside.map(([from, to]) => to.endsWith(from.slice(oldDir.length)) ? to.slice(0, to.length - (from.length - oldDir.length)) : '?'));
  return mapped.size === 1 && !mapped.has('?') ? [...mapped][0] : null;
};
const REPO_PATH = /(?<![\w@-])((?:src|scripts)\/[\w.@/-]*[\w])/g;
const COINCIDENT = new Set(['src/App.tsx', 'src/main.tsx', 'src/index.css', 'src/types.ts']);
const rewriteRepoPaths = (text, where) => text.replace(REPO_PATH, (whole, p) => {
  if (COINCIDENT.has(p) || COINCIDENT.has(p + '.tsx') || COINCIDENT.has(p + '.ts')) {
    // In src these names describe a learner's project (React task templates), never this repository.
    if (where.startsWith('src/')) return whole;
    review.push(`${where}: ${p}`);
  }
  if (moves.has(p)) return moves.get(p);
  for (const ext of ['.ts', '.tsx']) if (moves.has(p + ext)) return moves.get(p + ext).slice(0, -ext.length);
  if (exists.has(p) || targets.has(p) || [...targets.keys()].some(t => t.startsWith(p + '/') || t.startsWith(p + '.'))) return whole;
  const dir = dirMap(p);
  if (dir) return dir;
  if (!exists.has(p) && !p.includes('*')) stale.push(`${where}: ${p}`);
  return whole;
});
const stale = [];
const review = [];

// ── 3. rewrite contents ────────────────────────────────────────────────────────────────────────────
const CODE = /\.(tsx?|mjs|cjs|js)$/;
// Only real module references are rewritten (found with the TypeScript parser), never text that merely
// looks like an import inside lesson or task content strings.
const rewriteModuleSpecifiers = (file, text) => {
  const kind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : file.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
  const spots = [];
  const take = node => { if (node && ts.isStringLiteralLike(node)) spots.push(node); };
  const visit = node => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) take(node.moduleSpecifier);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) take(node.argument.literal);
    else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (callee.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(callee) && callee.text === 'require')) take(node.arguments[0]);
      if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === 'require' && callee.name.text === 'resolve') take(node.arguments[0]);
    } else if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'URL'
      && node.arguments?.length === 2 && node.arguments[1].getText(source) === 'import.meta.url') take(node.arguments[0]);
    ts.forEachChild(node, visit);
  };
  visit(source);
  let out = text;
  for (const literal of spots.sort((a, b) => b.getStart(source) - a.getStart(source))) {
    const start = literal.getStart(source) + 1, end = literal.getEnd() - 1;
    const next = rewriteSpec(file, literal.text);
    if (next !== literal.text) out = out.slice(0, start) + next + out.slice(end);
  }
  return out;
};
const CSS_FORMS = [/(url\(\s*)(['"]?)(\.[^'")]+)\2/g, /(@import\s+)(['"])(\.[^'"]+)\2/g];
// Files outside src whose path strings describe source locations; historical release notes stay as written.
const TEXT_SCOPE = f => /^(src|scripts|tests|tools|supabase|\.github)\//.test(f) && !f.startsWith('tools/restructure/')
  || ['vite.config.ts', 'index.html', 'package.json', 'vercel.json', '.oxlintrc.json', 'docs/billing-setup.md', 'docs/launch-setup.md', 'docs/curriculum-release-flags.md', 'docs/vercel-public-access.md', 'docs/dig-offline-reader.md'].includes(f);

const edits = new Map();
for (const file of tracked) {
  if (!TEXT_SCOPE(file) || !/\.(tsx?|mjs|cjs|js|css|json|html|md|sql|py|yml|yaml|ps1)$/.test(file)) continue;
  let text = fs.readFileSync(path.join(root, file), 'utf8');
  const before = text;
  if (CODE.test(file)) text = rewriteModuleSpecifiers(file, text);
  if (file.endsWith('.css')) for (const form of CSS_FORMS) text = text.replace(form, (m, lead, q, spec) => lead + q + rewriteSpec(file, spec) + q);
  // Inside src, repository paths are only rewritten in comments: lesson and task content legitimately
  // contains strings like 'src/App.tsx' that describe the learner's own project, not this repository.
  text = file.startsWith('src/')
    ? text.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, comment => rewriteRepoPaths(comment, file))
    : rewriteRepoPaths(text, file);
  if (file === 'package.json') text = text.replace(/node scripts\/(check-[\w.-]+\.cjs)/g, (m, name) => (moves.get(`scripts/${name}`) ? `node ${moves.get(`scripts/${name}`)}` : m));
  if (text !== before) edits.set(file, text);
}
console.log(`${edits.size} files with rewritten references`);
if (unresolved.length) console.log('Unresolved relative specifiers (left as is):\n  ' + unresolved.join('\n  '));
if (stale.length) console.log('Path strings that name nothing tracked (left as is):\n  ' + [...new Set(stale)].join('\n  '));
if (review.length) console.log('Review (generic project file names):\n  ' + review.join('\n  '));
if (dry) process.exit(0);

// ── 4. apply: write edits at old locations, then git mv ───────────────────────────────────────────
for (const [file, text] of edits) fs.writeFileSync(path.join(root, file), text);
for (const [from, to] of moved) {
  fs.mkdirSync(path.join(root, path.dirname(to)), { recursive: true });
  git('mv', from, to);
}
// Remove folders the moves left empty.
const prune = dir => {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
  for (const entry of fs.readdirSync(dir)) prune(path.join(dir, entry));
  if (!fs.readdirSync(dir).length) fs.rmdirSync(dir);
};
prune(path.join(root, 'src'));
console.log('done');
