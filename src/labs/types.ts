import type { FsNode } from './vfs';

export interface HttpRoutes {
  [path: string]: string;
}

export type VulnKind = 'sqli' | 'idor' | 'ssrf' | 'xss' | 'auth-bypass' | 'xxe' | 'ssti' | 'mass-assignment' | 'race-condition';

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
}

export interface AttackerBox {
  hostname: string;
  user: string;
  root: FsNode;
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
    | 'Security Engineering';
  briefing: string;
  objectives: (string | ObjectiveStep)[];
  hints: string[];
  attacker: AttackerBox;
  network: HostDef[];
  totalFlags: number;
}
