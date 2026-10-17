import type { LabScenario, EngagementDef } from './types';
import { dir, file } from './vfs';

export const OFFENSIVE_CATEGORIES = new Set<LabScenario['category']>([
  'Linux', 'Network', 'Web', 'Active Directory', 'Bug Bounty', 'Cloud', 'API',
  'Cryptography', 'Binary Analysis', 'Mobile', 'Wireless', 'IoT', 'AI Security',
]);

export function collectFlags(value: unknown): string[] {
  const flags = new Set<string>();
  function visit(item: unknown) {
    if (typeof item === 'string') for (const match of item.matchAll(/flag\{[^}]+\}/gi)) flags.add(match[0]);
    else if (Array.isArray(item)) item.forEach(visit);
    else if (item && typeof item === 'object') Object.values(item).forEach(visit);
  }
  visit(value);
  return [...flags];
}

const CONTEXT: Partial<Record<LabScenario['category'], [string, string]>> = {
  Web: ['server-side trust in caller-controlled input', 'enforce authorization and validate input at the server trust boundary'],
  API: ['resource access is not bound to the authenticated principal', 'bind actor, action, resource and tenant in server-side authorization'],
  Cloud: ['permissions and secrets extend beyond the workload purpose', 'reduce effective permissions, rotate exposed secrets and audit identity use'],
  'Active Directory': ['identity delegation creates an unintended access path', 'remove the unnecessary delegation edge and rotate affected service credentials'],
  Network: ['an exposed service grants unnecessary access', 'restrict service reachability and require authenticated, least-privilege access'],
  Linux: ['local permissions permit crossing a privilege boundary', 'remove broad privileged execution and use an immutable, narrowly scoped helper'],
  'Bug Bounty': ['a reproducible application trust boundary failure', 'enforce the missing server-side control and add negative regression tests'],
  Cryptography: ['a cryptographic construction or secret lifecycle assumption fails', 'use a reviewed authenticated construction and rotate compromised key material'],
  'Binary Analysis': ['program input reaches an unsafe operation', 'repair the underlying bounds or lifetime defect and add a regression case'],
  Mobile: ['client-side state is treated as trusted authorization', 'authorize in the backend and protect local sensitive material independently'],
  Wireless: ['radio access or enrollment grants excessive downstream trust', 'validate network identities and segment enrolled clients from privileged services'],
  IoT: ['device access exposes broader organizational authority', 'separate device identities and isolate management services from enterprise workloads'],
  'AI Security': ['untrusted content can influence a privileged downstream action', 'authorize each tool action outside the model and isolate tenant data'],
};

export interface ExtensionOptions {
  origin?: EngagementDef['origin'];
  index?: number;
  initialWalkthrough?: string[];
  reachableFrom?: string[];
  followupIp?: string;
}

/** Preserve the original exercise as the first finding; append actual gated host mechanics and closeout. */
export function extendToEngagement(original: LabScenario, options: ExtensionOptions = {}): LabScenario {
  if (original.engagement) return original;
  const initialFlags = collectFlags({ attacker: original.attacker, network: original.network, winCommands: original.winCommands, webApplication: original.webApplication, directoryRetest: original.directoryMap?.retestFlag });
  const index = options.index ?? 0;
  const followupIp = options.followupIp ?? `172.24.${Math.floor(index / 250)}.${index % 250 + 1}`;
  if (original.network.some(host => host.ip === followupIp)) throw new Error(`Follow-up IP collision in ${original.id}`);
  const variant = index % 4;
  const tools = ['/usr/bin/python3', '/usr/bin/find', '/usr/bin/awk', '/bin/bash'];
  const escalation = [
    'sudo /usr/bin/python3 -c \'import os; os.system("/bin/sh")\'',
    "sudo /usr/bin/find . -exec /bin/sh ';' -quit",
    'sudo /usr/bin/awk \'BEGIN {system("/bin/sh")}\'',
    '/bin/bash -p',
  ][variant];
  const prefix = original.id.replace(/[^a-z0-9_-]/gi, '_');
  const accessFlag = `flag{${prefix}_validated_impact}`;
  const reportFlag = `flag{${prefix}_evidence_report}`;
  const retestFlag = `flag{${prefix}_negative_retest}`;
  const cleanupFlag = `flag{${prefix}_closed_engagement}`;
  const [rootCause, remediation] = CONTEXT[original.category] ?? ['a trust boundary failure', 'enforce least privilege at the violated boundary'];
  const followupUser = 'reviewer';
  const followupPassword = `ScopedReview-${index + 1}!`;
  const gateway = options.reachableFrom ? original.network.find(host => options.reachableFrom!.includes(host.ip)) : undefined;
  const gatewayReconnect = gateway?.users[0] ? [`ssh ${gateway.users[0].username}@${gateway.ip}`, gateway.users[0].password] : [];
  const walkthrough = [
    ...(options.initialWalkthrough ?? []),
    'engagement handoff', `nmap -sV ${followupIp}`, `ssh ${followupUser}@${followupIp}`, followupPassword,
    'cat /root/impact.txt', 'id', variant === 3 ? 'find / -perm -4000' : 'sudo -l', escalation,
    'id', 'cat /root/impact.txt', 'echo approved-review-marker > /tmp/assessment-marker',
    'engagement remediate', ...gatewayReconnect, `ssh ${followupUser}@${followupIp}`, followupPassword,
    'sudo -l', escalation, 'cat /root/impact.txt', 'engagement retest', 'exit', ...(gateway ? ['exit'] : []),
    'engagement cleanup',
  ];
  const engagement: EngagementDef = {
    version: 1, origin: options.origin ?? 'depth-upgrade',
    scope: `${original.network.map(host => `${host.hostname} (${host.ip})`).join(', ') || 'the supplied local evidence'}, plus review-host (${followupIp}). Synthetic records only; no destructive tests or external targets.`,
    initialFlags, initialRequired: original.totalFlags, followupIp, followupUser, followupPassword,
    accessFlag, reportFlag, retestFlag, cleanupFlag, rootCause, remediation, privilegeCommand: escalation, walkthrough,
  };
  return {
    ...original,
    briefing: `${original.briefing}\n\nComplete engagement: reproduce the original finding, then run engagement handoff for a client-provided follow-on account. Assess its privilege boundary, demonstrate minimal synthetic impact, apply the follow-on fix, run negative tests and close the engagement. The handoff is a scoped client provision, not an assertion that the original bug provides shell access. Use the evidence notebook when you want notes or exports. Type engagement scope for rules and simulator limits.`,
    totalFlags: original.totalFlags + 3,
    objectives: [
      { text: 'Read engagement scope and establish the asset, identity and data boundaries.', why: 'Permission for one service does not imply permission for the entire organization.' },
      ...original.objectives,
      { text: 'After the initial proof points, obtain the scoped follow-on account with engagement handoff and scan the review host.', why: 'The follow-on environment stays unavailable until the original finding is demonstrated.' },
      { text: 'Log in as reviewer; test /root/impact.txt before escalation and enumerate the allowed privilege path.', why: 'A denied baseline separates legitimate access from a privilege boundary failure.' },
      { text: 'Use the identified privileged execution path, verify identity, and read only /root/impact.txt.', why: 'A synthetic impact record proves administrator access without bulk data extraction.' },
      { text: 'Create /tmp/assessment-marker with approved-review-marker, then run engagement remediate.', why: 'The benign artifact supports verifiable cleanup; the simulator removes the broad privileged execution path and closes prior sessions.' },
      { text: 'Reconnect as reviewer, confirm sudo -l has no grant, repeat the formerly privileged command and confirm /root/impact.txt is denied; then run engagement retest.', why: 'Retesting requires a working low-privilege session, the failed privilege transition and denied protected access.' },
      { text: 'Run engagement cleanup to remove the marker, revoke the temporary review account and close all target sessions.', why: 'An engagement ends with a recorded handback, not the last successful exploit.' },
    ],
    hints: [...original.hints,
      'engagement handoff', `ssh reviewer@${followupIp} (use the password issued by handoff)`,
      variant === 3 ? 'find / -perm -4000' : 'sudo -l', escalation, 'cat /root/impact.txt',
      'echo approved-review-marker > /tmp/assessment-marker', 'engagement remediate',
      `ssh reviewer@${followupIp}; reconnect${gateway ? ' through the gateway first' : ''}, run sudo -l, repeat ${escalation}, then cat /root/impact.txt and engagement retest`,
      'engagement cleanup',
    ],
    engagement,
    network: [...original.network, {
      hostname: 'review-host', ip: followupIp, os: 'Linux — scoped follow-on assessment',
      requiresProof: { flags: initialFlags, count: original.totalFlags },
      reachableFrom: options.reachableFrom,
      services: [{ port: 22, name: 'ssh', version: 'OpenSSH (simulated)' }],
      users: [{ username: followupUser, password: followupPassword,
        sudo: variant === 3 ? undefined : { nopasswdCommands: [tools[variant]] } }],
      suidBinary: variant === 3 ? '/bin/bash' : undefined,
      root: dir({
        home: dir({ reviewer: dir({ 'readme.txt': file('Scoped client review account. Enumerate local authority and preserve synthetic evidence.\n') }) }),
        root: dir({ 'impact.txt': file(`Synthetic administrator-only record: no customer data.\n${accessFlag}\n`) }),
        tmp: dir({}),
        bin: dir({ bash: file('ELF shell', variant === 3 ? '-rwsr-xr-x' : '-rwxr-xr-x') }),
        etc: dir({ 'review-policy.txt': file(`Account: reviewer\nPrivileged executable: ${tools[variant]}\nOwner: platform operations\n`) }),
      }),
    }],
  };
}

export function needsDepthUpgrade(scenario: LabScenario): boolean {
  return !scenario.engagement && OFFENSIVE_CATEGORIES.has(scenario.category) && (scenario.totalFlags < 2 || scenario.objectives.length < 5);
}
