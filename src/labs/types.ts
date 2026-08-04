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
  | 'excessive-agency';

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

export interface HostDef {
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
  objectives: (string | ObjectiveStep)[];
  hints: string[];
  attacker: AttackerBox;
  network: HostDef[];
  totalFlags: number;
}
