import type { LabScenario } from './types';

// Deliberate allowlist: accounts discovered during an exercise must never be
// promoted to supplied access merely because they exist in the virtual host.
const STARTER_ACCOUNTS: Record<string, { ip: string; username: string }> = {
  'guided-pentest-linux-ghcorp-fileserver': { ip: '10.10.199.130', username: 'intern' },
  'guided-pentest-linux-ghcorp-shared-workstation': { ip: '10.10.199.131', username: 'employee' },
  'guided-pentest-linux-ghcorp-automation-server': { ip: '10.10.199.132', username: 'automation' },
  'guided-pentest-secengineering-prod-hardening': { ip: '10.10.199.150', username: 'devops' },
  'guided-pentest-secengineering-cicd-script-permissions': { ip: '10.10.199.152', username: 'engineer' },
  'ad-worm-lateral-spread': { ip: '10.10.107.5', username: 'jsmith' },
  'scattered-spider-helpdesk-to-domain-admin': { ip: '10.10.115.10', username: 'r.finley' },
};

export function starterAccessFor(scenario: LabScenario) {
  const account = STARTER_ACCOUNTS[scenario.id];
  if (!account) return undefined;
  const user = scenario.network.find(host => host.ip === account.ip)?.users.find(user => user.username === account.username);
  return user ? { ...account, password: user.password, command: `ssh ${account.username}@${account.ip}` } : undefined;
}
