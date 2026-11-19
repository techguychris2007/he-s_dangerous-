// Publishes Pro and Max content to the private `paid-content` Supabase Storage bucket. The public
// build does not contain it (scripts/vite-paid-content.mjs); src/lib/paidContent.ts downloads it for
// accounts whose plan includes it (supabase/migrations/0014_paid_content.sql).
//
//   node scripts/publish-paid-content.cjs --dry-run            build the files only
//   node scripts/publish-paid-content.cjs --project-ref <ref>  build and upload with the Supabase CLI
//   add --yes to skip the CLI's confirmation for uploads to a hosted project
//
// Run it whenever a paid lab or lesson changes, and before deploying a build that changed plans.
// Uploading uses the Supabase CLI you are logged into (`supabase login`), never a key in the app.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');
const { load, labPayload, lessonPayload } = require('./paid-content.cjs');

const args = process.argv.slice(2);
const flag = name => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const dryRun = args.includes('--dry-run');
const root = path.join(__dirname, '..');

(async () => {
  const { paidLabs, paidLessons } = load();
  const out = flag('--out') ?? fs.mkdtempSync(path.join(os.tmpdir(), 'paid-content-'));
  for (const plan of ['pro', 'max']) {
    fs.rmSync(path.join(out, plan), { recursive: true, force: true });
    fs.mkdirSync(path.join(out, plan, 'labs'), { recursive: true });
    fs.mkdirSync(path.join(out, plan, 'lessons'), { recursive: true });
  }
  const hash = crypto.createHash('sha256');
  let bytes = 0;
  // Gzipped: smaller, and the lab files are full of attack strings (SQL injection, script tags,
  // /etc/passwd) that the storage gateway's firewall otherwise rejects. The app unzips them.
  const write = (file, value) => { const text = JSON.stringify(value); hash.update(file).update(text); const zipped = zlib.gzipSync(text, { level: 9 }); bytes += zipped.length; fs.writeFileSync(path.join(out, file + '.gz'), zipped); };
  for (const [slug, plan] of [...paidLabs].sort()) write(`${plan}/labs/${slug}.json`, labPayload(slug));
  for (const [id, { plan }] of [...paidLessons].sort()) write(`${plan}/lessons/${id}.json`, await lessonPayload(id));
  const version = hash.digest('hex').slice(0, 16);
  fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ version, publishedAt: new Date().toISOString() }));
  console.log(`Paid content ${version}: ${paidLabs.size} labs and ${paidLessons.size} lessons (${(bytes / 1024 / 1024).toFixed(2)} MB gzipped).`);
  console.log(`Files: ${out}`);
  if (dryRun) return;

  const linked = [path.join(root, 'supabase/.temp/project-ref'), path.join(os.homedir(), 'supabase/.temp/project-ref')].find(file => fs.existsSync(file));
  const ref = flag('--project-ref') ?? process.env.SUPABASE_PROJECT_REF ?? (linked && fs.readFileSync(linked, 'utf8').trim());
  if (!ref) throw new Error('Pass --project-ref <ref>, set SUPABASE_PROJECT_REF, or run `supabase link` first.');
  const cli = process.env.SUPABASE_CLI ?? (fs.existsSync(path.join(os.homedir(), '.local/bin/supabase')) ? path.join(os.homedir(), '.local/bin/supabase') : 'supabase');
  const upload = (source, target, type, extra = []) => {
    // The storage gateway sometimes drops a request on a slow link; retry before giving up.
    for (let attempt = 1; ; attempt++) {
      try { return execFileSync(cli, ['storage', 'cp', ...extra, source, `ss:///paid-content/${target}`, '--experimental', `--remote=${ref}`, '--content-type', type, '--cache-control', 'no-cache', ...(args.includes('--yes') ? ['--yes'] : [])], { stdio: ['ignore', 'pipe', 'pipe'] }); }
      catch (error) { if (attempt >= 3) throw new Error(`Upload of ${source} failed: ${String(error.stderr || error.stdout || error.message).slice(0, 300)}`); }
    }
  };

  // Content first, manifest last: the app only switches versions once every file is in place.
  for (const plan of ['pro', 'max']) { console.log(`Uploading ${plan}…`); upload(path.join(out, plan), '', 'application/gzip', ['-r', '-j', '1']); }
  upload(path.join(out, 'manifest.json'), 'manifest.json', 'application/json');
  console.log(`Published paid content ${version} to project ${ref}.`);
})().catch(error => { console.error(error); process.exit(1); });
