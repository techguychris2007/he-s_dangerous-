require('./register-typescript.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const originalLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
  if (!filename.endsWith('pdfGenerator.ts')) return originalLoader(module, filename);
  const source = fs.readFileSync(filename, 'utf8').replaceAll('import.meta.url', JSON.stringify(require('node:url').pathToFileURL(filename).href));
  module._compile(ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText, filename);
};
const {LABS} = require('../src/data/labs.ts');
const {createCertificatePdf, createWriteupPdf} = require('../src/lib/pdfGenerator.ts');
const {buildLabWriteup} = require('../src/lib/labWriteup.ts');
(async () => {
  const entry = LABS.find(l => l.slug === 'web-live-meridian-billing');
  const font = fs.readFileSync(path.join(__dirname,'../src/assets/fonts/DejaVuSans.ttf')).toString('base64');
  const options = {learnerName:'Alex Mensah — Sample Learner', capturedFlags:entry.scenario.totalFlags, completedAt:Date.UTC(2026,9,5), evidence:{
    executiveSummary:'Sample training report. The simulated billing service permitted cross-tenant reads and an unauthorized role change. The assessment demonstrated the modeled impact, applied the supplied repair and verified denied access alongside continuing legitimate use.',
    scope:'Only the synthetic Meridian Billing target and separately authorized review host were in scope. No external service was contacted. Results describe the deterministic training model.',
    methodology:'Established a normal account baseline, compared owned and foreign records, tested role changes and read the synthetic audit record. Repeated the same requests after remediation using the supplied member identity.',
    findings:[{id:'sample-1',title:'Missing ownership authorization on billing records',severity:'High',affectedAsset:'Meridian Billing /api/records/B200',evidence:'A member request for the other tenant’s record returned HTTP 200 and synthetic billing data. The owned-record request established the legitimate baseline.',impact:'The modeled member could read a foreign tenant record. Real-world exposure and production exploitability were not assessed.',remediation:'Authorize the authenticated principal against the requested object on the server. Reject caller-controlled privilege changes.',retest:'The foreign record returned HTTP 403 after repair; the owned record continued to return HTTP 200. The role change and administrator audit read were denied.'}],
    cleanup:'Completed the simulated review-host cleanup and handback checks. No external state was modified.',reflection:'The exercise separated authentication, object authorization and role authority. A real assessment would additionally verify deployment, concurrency, logs and session revocation.'}};
  await assert.rejects(createCertificatePdf(entry,'Learner',{capturedFlags:0},font), /Complete the lab/);
  assert.ok(!buildLabWriteup(entry,{capturedFlags:0}).linkedin.startsWith('Completed'));
  const certificate=await createCertificatePdf(entry,options.learnerName,options,font);
  assert.equal(certificate.getNumberOfPages(),1);
  const report=await createWriteupPdf(entry,options,font);
  fs.mkdirSync('output/pdf',{recursive:true});
  fs.writeFileSync('output/pdf/darkworld-sample-certificate.pdf',Buffer.from(certificate.output('arraybuffer')));
  fs.writeFileSync('output/pdf/darkworld-sample-report.pdf',Buffer.from(report.output('arraybuffer')));
  const stress=await createWriteupPdf(entry,{...options,evidence:{...options.evidence,methodology:options.evidence.methodology.repeat(100)}},font);
  assert.ok(stress.getNumberOfPages()>report.getNumberOfPages());
  console.log(`PDF validation passed: one-page certificate, ${report.getNumberOfPages()}-page report, ${stress.getNumberOfPages()}-page long-content pagination.`);
})().catch(error=>{console.error(error);process.exitCode=1});
