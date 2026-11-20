// Guards the source layout described in docs/architecture/README.md:
//   src/app       the shell: routes, layout, guards. May import anything.
//   src/features  one folder per product area. May import shared/ and other features; never app/
//                 (except the two documented shell pieces below).
//   src/shared    building blocks used by several features. Imports nothing from features/ or app/.
//   src/assets    static files.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { cwd: root, encoding: 'utf8' })
  .split('\n').filter(Boolean).filter(file => fs.existsSync(path.join(root, file)));
const known = new Set(files);

// Shell pieces a feature may render: the portal tab bar and the computer-only switch.
const FEATURE_MAY_IMPORT_FROM_APP = new Set(['src/app/layout/PortalNavigation.tsx', 'src/app/guards/ComputerAccessGate.tsx']);
const LAYERS = /^src\/(app|shared|assets)\/|^src\/features\/[a-z0-9-]+\/|^src\/vite-env\.d\.ts$/;

const layer = file => file.match(/^src\/(app|shared|assets)\//)?.[1] ?? (file.startsWith('src/features/') ? 'features' : 'root');
const feature = file => file.match(/^src\/features\/([^/]+)\//)?.[1] ?? null;
const resolve = (from, spec) => {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec.split('?')[0]));
  for (const ext of ['', '.ts', '.tsx', '.d.ts', '.css', '/index.ts', '/index.tsx']) if (known.has(base + ext)) return base + ext;
  return null;
};

const misplaced = files.filter(file => !LAYERS.test(file));
assert.deepEqual(misplaced, [], 'Every source file belongs to app/, features/<area>/, shared/ or assets/');

const violations = [];
let edges = 0;
for (const file of files.filter(f => /\.(ts|tsx)$/.test(f))) {
  const { importedFiles } = ts.preProcessFile(fs.readFileSync(path.join(root, file), 'utf8'), true, true);
  for (const { fileName } of importedFiles) {
    if (!fileName.startsWith('.')) continue;
    const outside = path.posix.normalize(path.posix.join(path.posix.dirname(file), fileName));
    if (!outside.startsWith('src/')) continue; // node_modules assets and supabase/functions/_shared (billing prices)
    const target = resolve(file, fileName);
    if (!target) { violations.push(`${file}: cannot resolve ${fileName}`); continue; }
    edges++;
    const from = layer(file), to = layer(target);
    if (from === 'shared' && (to === 'features' || to === 'app')) violations.push(`${file} → ${target} (shared must not depend on ${to})`);
    if (from === 'features' && to === 'app' && !FEATURE_MAY_IMPORT_FROM_APP.has(target)) violations.push(`${file} → ${target} (features must not depend on the app shell)`);
    if (from === 'assets') violations.push(`${file} imports code`);
  }
}
assert.deepEqual(violations, [], 'Import direction is app → features → shared');

const features = new Set(files.map(feature).filter(Boolean));
console.log(`Architecture passed: ${files.length} source files across app/, ${features.size} features, shared/ and assets/; ${edges} relative imports follow app → features → shared.`);
