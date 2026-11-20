// Publishes the owner-only content (machine learning, C# & .NET, software engineering) to the private
// `owner-content` Supabase Storage bucket. None of it is in the app bundle; see src/features/account/lib/ownerContent.ts.
//
//   node scripts/publish-owner-content.cjs --dry-run            build the files only
//   node scripts/publish-owner-content.cjs --project-ref <ref>  build and upload with the Supabase CLI
//   add --yes to skip the CLI's confirmation for uploads to a hosted project
//
// Uploading uses the Supabase CLI you are logged into (`supabase login`), never a key in the app.
// The project ref defaults to SUPABASE_PROJECT_REF, then a `supabase link` in this repo or in ~.
require('./register-typescript.cjs');
for (const extension of ['.css', '.jpg', '.png', '.svg']) require.extensions[extension] = module => { module.exports = ''; };
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const args = process.argv.slice(2);
const flag = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const dryRun = args.includes('--dry-run');
const root = path.join(__dirname, '..');

function buildBundle() {
  const { SE_MODULE_SOURCES, SE_ROADMAP } = require('../src/features/curriculum/data/softwareEngineeringCurriculum.ts');
  const { DN_MODULE_SOURCES, DN_ROADMAP } = require('../src/features/curriculum/data/dotnetCurriculum.ts');
  const { CSHARP_TASKS } = require('../src/features/code-practice/tasks/csharpTasks/index.ts');
  const { ML_TASKS } = require('../src/features/code-practice/tasks/mlTasks/index.ts');
  const { SE_TASKS } = require('../src/features/code-practice/tasks/pythonTasks/softwareEngineering/index.ts');
  const { ML_LESSONS } = require('../src/features/curriculum/data/mlLessons/index.ts');
  return {
    curriculum: { modules: [...SE_MODULE_SOURCES, ...DN_MODULE_SOURCES], roadmap: [...SE_ROADMAP, ...DN_ROADMAP] },
    tasks: { csharp: CSHARP_TASKS, ml: ML_TASKS, sePython: SE_TASKS },
    mlLessons: ML_LESSONS,
  };
}

function buildProjects() {
  const { SE_TASK_INDEX } = require('../src/features/code-practice/tasks/seTasks/taskIndex.ts');
  const files = new Map();
  const walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) walk(full); else if (entry.name.endsWith('.ts')) files.set(entry.name.replace(/\.ts$/, ''), full); } };
  for (const language of ['python', 'javascript', 'cpp', 'csharp', 'typescript']) walk(path.join(root, 'src/features/code-practice/tasks/seTasks', language));
  const projects = {};
  for (const meta of SE_TASK_INDEX) {
    const file = files.get(meta.id);
    if (!file) throw new Error(`No project file for ${meta.id}`);
    const task = require(file).default;
    if (!task || task.id !== meta.id) throw new Error(`${file} must default-export the project ${meta.id}`);
    projects[meta.id] = task;
  }
  return projects;
}

/** JSON drops functions and undefined silently; refuse anything that would not survive the trip. */
function assertPlainData(value, where) {
  if (typeof value === 'function') throw new Error(`${where} is a function and cannot be published`);
  if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) assertPlainData(item, `${where}.${key}`);
}

const bundle = buildBundle();
const projects = buildProjects();
assertPlainData(bundle, 'bundle');
assertPlainData(projects, 'projects');

const out = flag('--out') ?? fs.mkdtempSync(path.join(os.tmpdir(), 'owner-content-'));
fs.rmSync(path.join(out, 'projects'), { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'projects'), { recursive: true });
const projectText = Object.fromEntries(Object.entries(projects).map(([id, task]) => [id, JSON.stringify(task)]));
const hash = crypto.createHash('sha256').update(JSON.stringify(bundle));
for (const [id, text] of Object.entries(projectText).sort()) hash.update(id).update(text);
const version = hash.digest('hex').slice(0, 16);
fs.writeFileSync(path.join(out, 'bundle.json'), JSON.stringify({ version, ...bundle }));
for (const [id, text] of Object.entries(projectText)) fs.writeFileSync(path.join(out, 'projects', id + '.json'), text);
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ version, publishedAt: new Date().toISOString() }));

const size = bytes => (bytes / 1024 / 1024).toFixed(2) + ' MB';
const bundleBytes = fs.statSync(path.join(out, 'bundle.json')).size;
const projectBytes = Object.values(projectText).reduce((total, text) => total + Buffer.byteLength(text), 0);
console.log(`Owner content ${version}: ${bundle.curriculum.modules.length} modules, ${bundle.mlLessons.length} ML lessons, ` +
  `${bundle.tasks.csharp.length + bundle.tasks.ml.length + bundle.tasks.sePython.length} coding tasks (${size(bundleBytes)}), ` +
  `${Object.keys(projects).length} Build projects (${size(projectBytes)}).`);
console.log(`Files: ${out}`);
if (dryRun) process.exit(0);

const linked = [path.join(root, 'supabase/.temp/project-ref'), path.join(os.homedir(), 'supabase/.temp/project-ref')].find(file => fs.existsSync(file));
const ref = flag('--project-ref') ?? process.env.SUPABASE_PROJECT_REF ?? (linked && fs.readFileSync(linked, 'utf8').trim());
if (!ref) throw new Error('Pass --project-ref <ref>, set SUPABASE_PROJECT_REF, or run `supabase link` first.');
const cli = process.env.SUPABASE_CLI ?? (fs.existsSync(path.join(os.homedir(), '.local/bin/supabase')) ? path.join(os.homedir(), '.local/bin/supabase') : 'supabase');
const upload = (source, target, extra = []) => execFileSync(cli, ['storage', 'cp', ...extra, source, `ss:///owner-content/${target}`, '--experimental', `--remote=${ref}`, '--content-type', 'application/json', '--cache-control', 'no-cache', ...(args.includes('--yes') ? ['--yes'] : [])], { stdio: ['ignore', 'ignore', 'inherit'] });

// Content first, manifest last: the app only switches versions once every file is in place.
console.log(`Uploading ${Object.keys(projectText).length} projects…`);
upload(path.join(out, 'projects'), '', ['-r', '-j', '8']);
upload(path.join(out, 'bundle.json'), 'bundle.json');
upload(path.join(out, 'manifest.json'), 'manifest.json');
console.log(`Published owner content ${version} to project ${ref}.`);
