import type { FsNode } from './vfs';

export interface HttpRoutes {
  [path: string]: string;
}

export type VulnKind =
  | 'sqli'
  | 'idor'
  | 'ssrf'
  | 'xss'
  | 'auth-bypass'
  | 'xxe'
  | 'ssti'
  | 'mass-assignment'
  | 'race-condition'
  | 'command-injection'
  | 'path-traversal'
  | 'cors-misconfig'
  | 'cache-deception'
  | 'hpp'
  | 'prompt-injection'
  | 'excessive-agency'
  | 'lfi'
  | 'weak-auth'
  | 'deserialization';

export interface VulnRoute {
  kind: VulnKind;
  path: string;
  /** query/POST-body param name (default) or HTTP header name being tested */
  param: string;
  /** 'header' checks an HTTP request header (e.g. User-Agent) instead of a query/POST param */
  location?: 'param' | 'header';
  /** if the supplied value contains any of these (case-insensitive), the vuln triggers */
  triggerSubstrings: string[];
  vulnerableResponse: string;
  normalResponse: string;
}

export interface ServiceDef {
  port: number;
  name: string;
  version: string;
  banner?: string;
  http?: HttpRoutes;
  vulnRoutes?: VulnRoute[];
  /** ftp anonymous login allowed */
  ftpAnonymous?: boolean;
}

export interface SudoRule {
  /** 'ALL' = full root via sudo su; otherwise list of exact command strings allowed NOPASSWD */
  nopasswdAll?: boolean;
  nopasswdCommands?: string[];
}

export interface HostUser {
  username: string;
  password: string;
  sudo?: SudoRule;
  /** this account holds AD replication rights and can be DCSync'd via secretsdump */
  canDcsync?: boolean;
}

export interface AwsS3Object {
  key: string;
  content: string;
}

export interface AwsS3Bucket {
  name: string;
  /** true = readable by anyone with no credentials at all, the classic public-bucket misconfiguration */
  publicRead?: boolean;
  /** if not publicRead, the exact IAM role name (see AwsIamRole.name) required to read this bucket */
  requiredRole?: string;
  objects: AwsS3Object[];
}

export interface AwsIamRole {
  name: string;
  /** plain-text policy summary printed by `aws iam list-attached-role-policies` */
  policySummary: string;
  /** usernames/roles allowed to attach (PassRole) this role to a new EC2 instance without being able to assume it directly */
  passableBy?: string[];
}

export interface AwsCredential {
  accessKeyId: string;
  secretAccessKey: string;
  arn: string;
  role: string;
  accountId: string;
}

export interface AwsAccountDef {
  accountId: string;
  buckets: AwsS3Bucket[];
  roles: AwsIamRole[];
  /** every stealable/assumable credential that exists in this scenario — what `export AWS_ACCESS_KEY_ID=...`
   *  needs to match before `aws sts get-caller-identity` (and anything gated on that role) will work */
  credentials: AwsCredential[];
}

export interface WifiNetworkDef {
  ssid: string;
  bssid: string;
  channel: number;
  /** free-text encryption label as `airodump-ng`'s ENC column would show it, e.g. 'WPA2', 'WPA3-SAE', 'WEP', 'OPEN' */
  encryption: string;
  /** pre-formatted `#HASHCAT_HASH:`/`#HASHCAT_PLAINTEXT:`/`#HASHCAT_FLAG:` marker content (the exact same
   *  convention `hashcat`/`john` already read elsewhere in this engine) that `airodump-ng -w <prefix>`
   *  "writes" into a capture file once a handshake/PMKID has been captured against this network — so
   *  cracking it needs zero new engine code, just the existing `hashcat -m 22000` step. Omit for a network
   *  that's still just visible in a scan (no capture available yet). */
  captureFile?: string;
}

/** A real Metasploit module, keyed by its real `msfconsole` module path (e.g.
 *  `exploit/multi/samba/usermap_script` or `auxiliary/scanner/smb/smb_version`), read by the engine's
 *  `msfconsole` sub-shell simulation — distinct from `HostDef.exploitableAs`/the one-line `exploit <name>
 *  <ip>` shortcut, which stays untouched for the platform's existing CVE-RCE labs. */
export interface MsfModuleDef {
  /** the exact string a learner must `use` in msfconsole, e.g. 'exploit/unix/ftp/vsftpd_234_backdoor' */
  path: string;
  /** option names (uppercase, e.g. 'RHOSTS') that must be `set` to a non-empty value before `run`/`exploit`
   *  succeeds — RHOSTS is implicit and always required, list only the module's OTHER required options here */
  requiredOptions: string[];
  /** pre-filled values shown by `show options` immediately after `use`, exactly like a real module's
   *  built-in defaults (e.g. a real default RPORT) — a learner can `set` over any of these */
  defaultOptions?: Record<string, string>;
  /** for an `auxiliary/...` module only (exploit modules ignore this and open a session instead, via
   *  `HostDef.metasploitModule` matching + the shared session-grant path): the lines printed on a
   *  successful `run`, scanned for an embedded `flag{...}` the same way every other command's output is */
  scanOutput?: string;
}

/** Fictional trust material used only by the isolated Golden Ticket terminal teaching model. */
export interface KerberosTicketLabDef {
  domain: string;
  domainSid: string;
  krbtgtAes256Key: string;
  privilegedUser: string;
}

export interface HostDef {
  /** Simulation gate: this scoped follow-on host is provisioned only after initial evidence. */
  requiresProof?: { flags: string[]; count: number };
  /** Network segments reachable only from the named hosts; omitted on legacy flat networks. */
  reachableFrom?: string[];
  hostname: string;
  ip: string;
  os: string;
  services: ServiceDef[];
  users: HostUser[];
  root: FsNode;
  /** absolute path to a SUID-root binary that can be exploited by directly executing it (GTFOBins-style) */
  suidBinary?: string;
  /** the exact `exploit <name>` module name that grants a root/SYSTEM session on this host (CVE-style RCE labs) */
  exploitableAs?: string;
  /** pre-formatted NTDS.dit-style hash dump text (with an embedded flag) returned by `secretsdump` when a canDcsync user's creds are supplied */
  ntdsHashes?: string;
  /** the AWS account this host represents/fronts — real `aws s3`/`aws sts`/`aws iam`/`aws ec2` commands operate against this */
  awsAccount?: AwsAccountDef;
  /** models this "host" as a wireless AP/network instead of (or alongside) an IP-reachable service —
   *  read by `airodump-ng`/`aireplay-ng`. The host's existing `ip` is still used for any wired-side
   *  services it also exposes (e.g. a captive portal or a rogue RADIUS endpoint over `curl`). */
  wifiNetwork?: WifiNetworkDef;
  /** the real Metasploit module this host is vulnerable to, read by the `msfconsole` sub-shell simulation
   *  (`use`/`set`/`run`) — a genuinely different, multi-step, realistic path to the same kind of outcome
   *  `exploitableAs` grants via its one-line shortcut. A host may define either, both, or neither. */
  metasploitModule?: MsfModuleDef;
  /** Fictional domain details for a contained Kerberos ticket exercise; never a live credential. */
  kerberosTicketLab?: KerberosTicketLabDef;
}

export interface AttackerBox {
  hostname: string;
  user: string;
  root: FsNode;
  /** env vars already set when the lab starts — e.g. a low-privilege AWS credential already
   *  configured on the attacker's own workstation, exactly like a real day-to-day dev account. */
  env?: Record<string, string>;
}

/** A guided step can be plain text, or text plus a rationale explaining why that command/action matters. */
export interface ObjectiveStep {
  text: string;
  why?: string;
  /** What has changed in the scenario when this stage begins. */
  scene?: string;
  /** The question the learner must answer from evidence before moving on. */
  question?: string;
  /** Concrete fields, patterns, or output differences worth inspecting. */
  observe?: string;
  /** The conclusion or next-step decision the evidence should support. */
  decision?: string;
}

/** KC7-style case scene for a lab: who the learner is, the story unfolding, what is at stake, and the
 *  real-world event or technique it reconstructs. Rendered as a cinematic briefing on the lab overview
 *  and in the workspace, so a lab reads as a realistic investigation rather than a checklist. */
export interface LabNarrative {
  /** Who the learner plays, e.g. "Tier-1 SOC analyst at Halcyon Freight". */
  role: string;
  /** 2–4 sentences setting the scene — what has happened and what the learner walks into. */
  scene: string;
  /** 1–2 sentences: what is at risk, why this matters now. */
  stakes: string;
  /** The real event, breach or technique this lab reconstructs (training reconstruction, not live). */
  realBasis: string;
  /** One-line mission statement shown as the call to action. */
  mission?: string;
}

export interface LabScenario {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category:
    | 'Linux'
    | 'Network'
    | 'Web'
    | 'Active Directory'
    | 'Bug Bounty'
    | 'Cloud'
    | 'SOC'
    | 'Forensics'
    | 'Security+'
    | 'Binary Analysis'
    | 'Malware'
    | 'Security Engineering'
    | 'API'
    | 'Cryptography'
    | 'Mobile'
    | 'Wireless'
    | 'IoT'
    | 'AI Security';
  briefing: string;
  /** Optional cinematic scene; when present it leads the overview and briefing instead of plain text. */
  narrative?: LabNarrative;
  objectives: (string | ObjectiveStep)[];
  hints: string[];
  attacker: AttackerBox;
  network: HostDef[];
  totalFlags: number;
  /** Exact-match canned output for real Windows-native commands (reg query, schtasks /query,
   *  wevtutil qe, dir /r, arp -a) that a DFIR/SOC lab's hints instruct the learner to run literally —
   *  keyed by the exact command line (case-insensitive, whitespace-collapsed; see engine.ts's
   *  winCommand()). Exists so labs can require the REAL command a Windows analyst would type instead
   *  of a stand-in `cat some-exported-file.txt` — the realistic evidence text is the same either way,
   *  only how the learner reaches it differs. A command whose verb has a matching entry here but no
   *  matching full-line key gets that verb's own realistic "not found"-style error (see WIN_COMMAND_ERRORS
   *  in engine.ts) rather than a generic one, since real `reg`/`wevtutil`/etc. errors look nothing alike. */
  winCommands?: Record<string, string>;
  engagement?: EngagementDef;
  /** Interactive target rendered from the same request state used by terminal curl commands. */
  webApplication?: WebApplicationDef;
  directoryMap?: DirectoryMapDef;
}

export interface WebApplicationDef {
  name: string;
  ip: string;
  kind: 'tenant-billing' | 'support-desk';
  tagline: string;
  token: string;
  principal: string;
  tenant: string;
  records: { id: string; tenant: string; title: string; amount: string }[];
  flags: { disclosure: string; escalation: string; impact: string; retest: string };
}

export interface LabEvent {
  sequence: number;
  kind: 'contact' | 'authentication' | 'privilege' | 'replication' | 'remediation' | 'cleanup';
  hostIp: string;
  actor: string;
  detail: string;
}

export interface DirectoryMapDef {
  domain: string;
  description: string;
  repairHostIp: string;
  retestFlag: string;
  nodes: { id: string; label: string; subtitle: string; kind: 'workstation' | 'account' | 'server' | 'controller'; hostIp?: string; actor?: string; x: number; y: number }[];
  edges: { from: string; to: string; label: string; event: LabEvent['kind']; hostIp: string; actor?: string }[];
}

export interface EngagementDef {
  version: 1;
  origin: 'new-campaign' | 'depth-upgrade';
  scope: string;
  initialFlags: string[];
  initialRequired: number;
  followupIp: string;
  followupUser: string;
  followupPassword: string;
  accessFlag: string;
  reportFlag: string;
  retestFlag: string;
  cleanupFlag: string;
  rootCause: string;
  remediation: string;
  privilegeCommand: string;
  /** A transparent simulator reference solution, consumed by engine integration tests. */
  walkthrough: string[];
}
