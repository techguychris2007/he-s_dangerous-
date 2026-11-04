// Builds the in-browser TypeScript/React runtime into public/ts-runtime/:
//   typescript.js  the real TypeScript compiler (minified), loaded once per session by src/lib/tsWorker.ts
//   types.json     a virtual file system of .d.ts files: the ES/DOM libs, React's types and the test kit's
//   testkit.js     the Vitest-compatible subset, for TypeScript targets run in a Worker (no DOM)
//   react-kit.js   React 19 (development build) + react-dom + test kit + Testing Library subset, for the
//                  sandboxed grading iframe
// Run: node tools/ts-runtime/build.cjs   (npm run build:ts-runtime)
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const out = path.join(root, 'public', 'ts-runtime');
const nm = path.join(root, 'node_modules');

/** Libraries every compilation gets; their `/// <reference lib>` closure is followed automatically. */
const ROOT_LIBS = ['es2023', 'dom', 'dom.iterable'];

function collectLibs() {
  const files = {};
  const pending = [...ROOT_LIBS];
  while (pending.length) {
    const name = pending.pop();
    const file = `lib.${name}.d.ts`;
    if (files[`/lib/${file}`]) continue;
    const text = fs.readFileSync(path.join(nm, 'typescript', 'lib', file), 'utf8');
    files[`/lib/${file}`] = text;
    for (const m of text.matchAll(/\/\/\/\s*<reference\s+lib="([^"]+)"\s*\/>/g)) pending.push(m[1].toLowerCase());
  }
  return files;
}

function typePackage(dir, virtualDir, names) {
  const files = { [`${virtualDir}/package.json`]: JSON.stringify({ name: virtualDir.replace('/node_modules/', ''), types: 'index.d.ts' }) };
  for (const n of names) files[`${virtualDir}/${n}`] = fs.readFileSync(path.join(dir, n), 'utf8');
  return files;
}

async function bundle(input, file, options = {}) {
  const { build } = await import('rolldown');
  await build({
    input,
    platform: 'browser',
    logLevel: 'warn',
    external: options.external,
    transform: options.define ? { define: options.define } : undefined,
    output: { file, format: 'iife', name: options.name, minify: true, globals: options.globals },
  });
}

async function main() {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  // 1. The compiler itself. Its node-only requires (fs, path, …) are guarded at run time, so they are
  //    left external and resolve to undefined in the browser.
  await bundle(path.join(nm, 'typescript', 'lib', 'typescript.js'), path.join(out, 'typescript.js'), {
    name: '__dw_ts',
    external: (id) => !id.includes('typescript'),
    globals: () => 'undefined',
  });

  // 2. Test kits.
  const src = path.join(__dirname, 'src');
  await bundle(path.join(src, 'entry-worker.js'), path.join(out, 'testkit.js'));
  await bundle(path.join(src, 'entry-dom.js'), path.join(out, 'react-kit.js'), {
    define: { 'process.env.NODE_ENV': '"development"' },
  });

  // 3. Virtual type file system.
  const types = {
    ...collectLibs(),
    ...typePackage(path.join(nm, '@types', 'react'), '/node_modules/@types/react', ['index.d.ts', 'global.d.ts', 'jsx-runtime.d.ts', 'jsx-dev-runtime.d.ts']),
    ...typePackage(path.join(nm, '@types', 'react-dom'), '/node_modules/@types/react-dom', ['index.d.ts', 'client.d.ts']),
    ...typePackage(path.join(nm, 'csstype'), '/node_modules/csstype', ['index.d.ts']),
    '/__dw__/testkit.d.ts': fs.readFileSync(path.join(src, 'testkit.d.ts'), 'utf8'),
  };
  const version = require(path.join(nm, 'typescript', 'package.json')).version;
  fs.writeFileSync(path.join(out, 'types.json'), JSON.stringify({ version, libs: ROOT_LIBS.map((l) => `lib.${l}.d.ts`), files: types }));

  for (const f of fs.readdirSync(out)) {
    console.log(`${f.padEnd(14)} ${(fs.statSync(path.join(out, f)).size / 1024).toFixed(0).padStart(6)} KB`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
