require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { LABS } = require('../src/data/labs.ts');
const { TerminalEngine } = require('../src/labs/engine.ts');
const { starterAccessFor } = require('../src/labs/starterAccess.ts');
const guided = LABS.filter(lab => lab.slug.startsWith('guided-pentest-'));
for (const { scenario } of guided) {
  const engine = new TerminalEngine(scenario);
  const flags = new Set();
  const capture = flag => flags.add(flag);
  for (const command of scenario.hints) {
    engine.run(command, capture);
    if (engine.isAwaitingPassword()) {
      const match = engine.getPrompt().match(/for (.+)@([^:]+):/);
      const user = scenario.network.find(host => host.ip === match?.[2])?.users.find(user => user.username === match?.[1]);
      assert.ok(user, `${scenario.id}: hinted SSH user must exist`);
      engine.run(user.password, capture);
      assert.equal(engine.isAwaitingPassword(), false, `${scenario.id}: valid credentials must log in`);
    }
  }
  assert.equal(flags.size, scenario.totalFlags, `${scenario.id}: guided commands must reach every proof`);
}
let supplied = 0;
for (const { scenario } of LABS) {
  const access = starterAccessFor(scenario);
  if (!access) continue;
  supplied++;
  const engine = new TerminalEngine(scenario);
  engine.run(access.command, () => {});
  assert.equal(engine.isAwaitingPassword(), true);
  assert.ok(engine.run('incorrect-training-password', () => {}).some(line => line.kind === 'error'));
  engine.run(access.password, () => {});
  assert.equal(engine.isAwaitingPassword(), false);
  assert.match(engine.getPrompt(), new RegExp(`^${access.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}@`));
}
assert.equal(starterAccessFor(LABS.find(lab => lab.slug === 'privesc-find').scenario), undefined, 'Discovered credentials must stay part of the exercise');
const firewall = new TerminalEngine(LABS.find(lab => lab.slug === 'guided-pentest-soc-ghcorp-firewall-triage').scenario);
const flags = [];
assert.equal(firewall.run('grep "203.0.113.44" firewall.log | grep -c "DENY"', flag => flags.push(flag)).map(line => line.text).join('\n'), '7');
assert.equal(flags.length, 0, 'Counting matching lines must not expose hidden proof annotations');
firewall.run('grep -A 1 "ALLOW" firewall.log', flag => flags.push(flag));
assert.equal(flags.length, 1, 'Context should expose the neighboring proof annotation');
const cicd = LABS.find(lab => lab.slug === 'guided-pentest-secengineering-cicd-script-permissions').scenario;
const engine = new TerminalEngine(cicd);
const access = starterAccessFor(cicd);
engine.run(access.command, () => {});
engine.run(access.password, () => {});
assert.match(engine.run('ls -l /opt/cicd/deploy.sh', () => {}).map(line => line.text).join('\n'), /^-rwxrwxrwx/);
console.log(`${guided.length} guided labs completed by replay; ${supplied} supplied SSH accounts verified; grep counting/context and file permissions passed.`);
