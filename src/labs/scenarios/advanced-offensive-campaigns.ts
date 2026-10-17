import type { LabScenario, VulnRoute } from '../types';
import { dir, file } from '../vfs';

interface Campaign {
  id: string;
  title: string;
  category: LabScenario['category'];
  vector: 'ftp' | 'sqli' | 'idor' | 'ssrf' | 'header' | 'foothold' | 'suid';
  story: string;
  lesson: string;
  pivot?: boolean;
}

const CAMPAIGNS: Campaign[] = [
  { id: 'campaign-scope-to-impact', title: 'Atlas: Scope to Verified Impact', category: 'Network', vector: 'ftp',
    story: 'Atlas Logistics authorizes a test of its release gateway. A public download service shares a directory with an internal deployment manifest. Establish the exposure, explain its limits, and avoid claiming more access than the evidence proves.',
    lesson: 'Public service reachability is an observation; reading an internal manifest establishes a confidentiality failure. Neither observation alone establishes remote code execution.' },
  { id: 'campaign-hypothesis-and-retest', title: 'Beacon: Hypothesis and Query Boundary', category: 'Web', vector: 'sqli',
    story: 'Beacon Books wants a hypothesis-driven assessment of its catalog search. Compare a normal request with a synthetic injection probe, then distinguish the broken query boundary from hypothetical downstream access.',
    lesson: 'Use a normal result as a baseline and a minimal injection as evidence. The simulated route models a query-boundary failure, not a real SQL parser.' },
  { id: 'campaign-tenant-boundary', title: 'Meridian: Tenant Isolation Assessment', category: 'API', vector: 'idor',
    story: 'Meridian provides two synthetic tenant invoice records. Your test principal belongs to tenant A. Verify its own record, test the supplied tenant B record, and record which server-side ownership check is missing.',
    lesson: 'Knowing a resource identifier is not authorization. Compare the same operation under the same principal across controlled ownership boundaries.', pivot: true },
  { id: 'campaign-trusted-proxy', title: 'Relay: Identity at the Proxy Boundary', category: 'Web', vector: 'header',
    story: 'Relay Support places an administration service behind a trusted proxy but accepts a client-supplied identity header at its origin. Establish a denied baseline, reproduce the mistaken identity trust using synthetic records, and state why the origin must not trust caller-controlled headers.',
    lesson: 'A header is a claim. The security property depends on which component authenticates its source and whether the origin is reachable outside that path.' },
  { id: 'campaign-build-artifact', title: 'Forge: Build Artifact to Deployment Authority', category: 'Cloud', vector: 'ftp',
    story: 'Forge Engineering publishes build artifacts from a delivery gateway. Its internal deployment manifest was packaged with public releases. Verify the exposure of a synthetic deployment authority record and treat delivery identity and artifact content as distinct trust boundaries.',
    lesson: 'The manifest is a simulated artifact. This campaign tests exposure and local privilege; it does not emulate a cloud provider API or a real CI runner.' },
  { id: 'campaign-fetch-worker', title: 'Courier: Fetch Worker as a Confused Deputy', category: 'Web', vector: 'ssrf',
    story: 'Courier Preview lets customers request page previews. An application worker can reach an internal synthetic configuration service that customers cannot normally read. Compare a public preview with the provided internal URL and demonstrate the authority mismatch.',
    lesson: 'The defect is that user-selected destinations inherit the worker authority. A single blocked hostname is not a complete defense against parsing, redirects or DNS changes.' },
  { id: 'campaign-postex-sudo', title: 'Harbor: Foothold to Privilege Assessment', category: 'Linux', vector: 'foothold',
    story: 'Harbor supplies an ordinary support account for a post-exploitation concept lab. Determine identity and local authority, prove a denied administrator-file baseline, inspect an overbroad interpreter grant, and record minimal impact.',
    lesson: 'A post-access assessment starts with measured permissions. A permitted interpreter can delegate root authority to arbitrary program behavior even when the executable itself is legitimate.' },
  { id: 'campaign-postex-suid', title: 'Foundry: Local Execution Boundary Review', category: 'Linux', vector: 'suid',
    story: 'Foundry authorizes a local privilege review using a supplied maintenance account. A set-user-ID shell was included in a maintenance image. Compare real and effective authority in the simulator, prove restricted-file access, and document why image provenance and file ownership matter.',
    lesson: 'Set-user-ID behavior depends on the program, mount options and operating system. The browser engine explicitly models the configured shell path; it does not prove that any SUID binary is exploitable.' },
  { id: 'campaign-lateral-trust', title: 'Northstar: Gateway to Review Segment', category: 'Network', vector: 'idor',
    story: 'Northstar requests an assessment of service identity boundaries. A synthetic tenant ownership flaw is the initial finding. The client then provisions a gateway account and a reviewer account on a separate network segment. Compare reachability from the workstation and gateway before validating the review host privilege boundary.',
    lesson: 'The gateway uses SSH in this simulation. The campaign demonstrates reachability plus authentication, not Kerberos, SMB tunneling or Active Directory protocol exploitation.', pivot: true },
  { id: 'campaign-handback', title: 'Continuity: Evidence and Local Authority Boundary', category: 'Linux', vector: 'foothold',
    story: 'Continuity focuses on post-access evidence quality: establish a baseline, prove the privilege boundary, capture only minimal synthetic impact, and explain which claims the lab evidence does and does not support.',
    lesson: 'Good post-access notes separate observed authority from assumptions. Human review is still needed to judge whether the learner explained the evidence and its limits clearly.' },
];

function buildCampaign(c: Campaign, index: number): LabScenario {
  const ip = `10.77.${index + 1}.10`;
  const proof = `flag{${c.id}_initial_boundary}`;
  const password = `GatewayReview-${index + 1}!`;
  const rootProof = c.vector === 'foothold' || c.vector === 'suid';
  const baseline = `curl http://${ip}/`;
  const walkthrough: string[] = [`nmap -sV ${ip}`, baseline];
  const http: Record<string, string> = {
    '/': `HTTP/1.1 200 OK\n${c.title}\nAPI documentation: /docs\nOnly synthetic records are in scope.`,
    '/docs': `GET /catalog?q=books\nGET /invoice?tenant=A\nGET /preview?url=https://example.test/\nGET /admin\nSupplied lab account for local authority exercises: reviewer-gateway / ${password}.\n`,
  };
  const routes: VulnRoute[] = [];
  const root = dir({
    home: dir({ 'reviewer-gateway': dir({ 'notes.txt': file('Provided foothold. First establish id, sudo policy, SUID executables and a denied /root/proof.txt baseline.\n') }) }),
    root: dir({ 'proof.txt': file(rootProof ? `Minimal synthetic initial privilege proof.\n${proof}\n` : 'No initial root claim is established by this campaign.\n') }),
    srv: dir({ ftp: dir({ 'deployment-manifest.txt': file(`INTERNAL ONLY — synthetic deployment authority\nOwner: delivery operations\nBoundary: public distribution must exclude internal manifests\n${proof}\n`) }) }),
    bin: dir({ bash: file('ELF shell', c.vector === 'suid' ? '-rwsr-xr-x' : '-rwxr-xr-x') }),
    tmp: dir({}),
  });
  switch (c.vector) {
    case 'ftp': walkthrough.push(`ftp ${ip}`, `ftp-get ${ip} deployment-manifest.txt`); break;
    case 'sqli':
      routes.push({ kind: 'sqli', path: '/catalog', param: 'q', triggerSubstrings: ["' OR '1'='1"],
        normalResponse: 'HTTP/1.1 200 OK\nCatalog: approved public titles only.',
        vulnerableResponse: `HTTP/1.1 200 OK\nSynthetic restricted catalog entry returned outside the intended query predicate.\n${proof}` });
      walkthrough.push(`curl "http://${ip}/catalog?q=books"`, `curl "http://${ip}/catalog?q=' OR '1'='1"`); break;
    case 'idor':
      routes.push({ kind: 'idor', path: '/invoice', param: 'tenant', triggerSubstrings: ['B'],
        normalResponse: 'HTTP/1.1 200 OK\nPrincipal: synthetic-tenant-A\nInvoice: A-100, owned by tenant A.',
        vulnerableResponse: `HTTP/1.1 200 OK\nPrincipal: synthetic-tenant-A\nInvoice: B-100, owned by tenant B. Ownership enforcement is missing.\n${proof}` });
      walkthrough.push(`curl "http://${ip}/invoice?tenant=A"`, `curl "http://${ip}/invoice?tenant=B"`); break;
    case 'ssrf':
      routes.push({ kind: 'ssrf', path: '/preview', param: 'url', triggerSubstrings: ['http://127.0.0.1/internal/config'],
        normalResponse: 'HTTP/1.1 200 OK\nPublic synthetic preview: no internal configuration.',
        vulnerableResponse: `HTTP/1.1 200 OK\nInternal synthetic configuration read with worker authority, not caller authority.\n${proof}` });
      walkthrough.push(`curl "http://${ip}/preview?url=https://example.test/"`, `curl "http://${ip}/preview?url=http://127.0.0.1/internal/config"`); break;
    case 'header':
      routes.push({ kind: 'auth-bypass', path: '/admin', param: 'X-Trusted-Role', location: 'header', triggerSubstrings: ['operator'],
        normalResponse: 'HTTP/1.1 403 Forbidden\nCaller is not an operator.',
        vulnerableResponse: `HTTP/1.1 200 OK\nSynthetic operator record disclosed: origin trusted an unverified proxy identity claim.\n${proof}` });
      walkthrough.push(`curl http://${ip}/admin`, `curl -H "X-Trusted-Role: operator" http://${ip}/admin`); break;
    case 'foothold':
      walkthrough.push(`ssh reviewer-gateway@${ip}`, password, 'id', 'cat /root/proof.txt', 'sudo -l', 'sudo /usr/bin/python3 -c \'import os; os.system("/bin/sh")\'', 'id', 'cat /root/proof.txt'); break;
    case 'suid':
      walkthrough.push(`ssh reviewer-gateway@${ip}`, password, 'id', 'cat /root/proof.txt', 'find / -perm -4000', '/bin/bash -p', 'id', 'cat /root/proof.txt'); break;
  }
  if (c.pivot) walkthrough.push(`ssh reviewer-gateway@${ip}`, password, 'ip addr');
  const base: LabScenario = {
    id: c.id, title: c.title, category: c.category, difficulty: 'Hard', totalFlags: 1,
    briefing: `${c.story}\n\nLab target: ${ip}. Supplied lab username: reviewer-gateway; password: ${password}. ${c.lesson}`,
    objectives: [
      { text: 'Review the lab target, supplied account, synthetic data and stop conditions.', why: 'Write what is allowed before interpreting what is reachable.' },
      { text: `Scan ${ip}, read /docs and identify an initial hypothesis tied to a specific trust boundary.`, why: 'Discovery observations establish the test plan; they do not prove exploitability.' },
      { text: rootProof ? 'Log in with the supplied account; compare id with a denied /root/proof.txt read.' : 'Issue the normal request first and record the expected public or own-tenant response.', why: 'A control request makes unexpected access interpretable.' },
      { text: rootProof ? 'Enumerate the configured sudo or SUID path; use it to demonstrate minimal synthetic privilege impact.' : 'Change only the relevant input or identity claim and capture the initial synthetic boundary proof.', why: c.lesson },
      { text: 'Document the observed response, actor, resource, authority and which impacts remain untested.', why: 'Avoid turning a disclosure proof into an unsupported claim of full compromise.' },
      { text: c.pivot ? 'Confirm the review segment is unreachable from the attacker box; use the supplied gateway account only when the lab provides it.' : 'Summarize what the evidence proves and which claims remain unsupported.', why: 'Network reachability and granted identity are separate preconditions.' },
    ],
    hints: walkthrough,
    attacker: { hostname: 'assessment-workstation', user: 'root', root: dir({ root: dir({ 'scope.txt': file(`${c.story}\n${c.lesson}\n`) }) }) },
    network: [{ hostname: `${c.id}-gateway`, ip, os: 'Linux (deterministic training gateway)',
      services: [{ port: 22, name: 'ssh', version: 'OpenSSH (simulated)' },
        { port: 80, name: 'http', version: 'Synthetic application', http, vulnRoutes: routes },
        ...(c.vector === 'ftp' ? [{ port: 21, name: 'ftp', version: 'FTP artifact store', ftpAnonymous: true }] : [])],
      users: [{ username: 'reviewer-gateway', password, sudo: c.vector === 'foothold' ? { nopasswdCommands: ['/usr/bin/python3'] } : undefined }],
      suidBinary: c.vector === 'suid' ? '/bin/bash' : undefined, root,
    }],
  };
  return base;
}

export const advancedOffensiveCampaigns = CAMPAIGNS.map(buildCampaign);
