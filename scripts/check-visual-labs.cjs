require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const {visualPentestLabs} = require('../src/labs/scenarios/visual-pentest-labs.ts');
const {TerminalEngine} = require('../src/labs/engine.ts');
for(const scenario of visualPentestLabs){
 const engine = new TerminalEngine(scenario);
 const flags = new Set();
 const run = c => engine.run(c,f=>flags.add(f));
 if(scenario.webApplication){
  const app=scenario.webApplication;
  const auth=`-H "Authorization: Bearer ${app.token}"`;
  const url=`http://${app.ip}`;
  run(`curl ${url}/api/records/B-200`);
  assert.equal(engine.getSnapshot().webApplication.requests.at(-1).status,401);
  assert.equal(flags.size,0);
  run(`curl ${auth} -X DELETE ${url}/api/records/B-200`);
  assert.equal(engine.getSnapshot().webApplication.requests.at(-1).status,405);
  assert.equal(run('webapp remediate')[0].kind,'error');
  for(const command of scenario.hints){
    if(command==='webapp remediate'){run(command);break;}
    run(command);
  }
  assert.equal(engine.getSnapshot().webApplication.role,'admin');
  assert.equal(flags.size,scenario.totalFlags,'All advertised concept proofs must be earnable');
  const prior=flags.size;
  run(`curl ${url}/api/records/B-200`);
  run(`curl ${url}/api/admin/audit`);
  assert.equal(run('webapp retest')[0].kind,'error');
  assert.equal(flags.size,prior,'Unauthenticated failures must not establish repair');
  const copy=engine.getSnapshot();copy.webApplication.role='member';
  assert.equal(engine.getSnapshot().webApplication.role,'admin','UI snapshots must not mutate engine state');
 }else{
  const map=scenario.directoryMap;
  const dc=map.repairHostIp;
  if(scenario.id.includes('segmented')){
   run(`secretsdump svc_archive:ArchiveReview-Only!@${dc}`);
   assert.equal(engine.getSnapshot().events.filter(e=>e.kind==='replication').length,0,'Unreachable DC must not activate edge');
  }
  assert.equal(run('directory remediate')[0].kind,'error');
  for(const command of scenario.hints){
   if(command==='directory remediate'){run(command);break;}
   run(command);
  }
  run(`crackmapexec smb ${dc} -u ordinary -p OrdinaryReview!`);
  run(`secretsdump ordinary:OrdinaryReview!@${dc}`);
  assert.equal(run('directory retest')[0].kind,'error','Another identity cannot establish repaired principal controls');
  run(`crackmapexec smb ${dc} -u svc_archive -p wrong-password`);
  run(`secretsdump svc_archive:wrong-password@${dc}`);
  assert.equal(run('directory retest')[0].kind,'error','Bad credentials do not prove repaired authorization');
 }
 if (!scenario.webApplication) assert.equal(flags.size,scenario.totalFlags,'All directory proofs must be earnable');
 const fresh=new TerminalEngine(scenario).getSnapshot();
 assert.equal(fresh.flags.length,0);assert.equal(fresh.events.length,0);
 if(fresh.webApplication){assert.equal(fresh.webApplication.repaired,false);assert.equal(fresh.webApplication.role,'member');}
 console.log('PASS visual lab negative controls and reset:',scenario.id);
}
