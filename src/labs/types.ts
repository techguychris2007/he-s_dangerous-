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
  | 'cors-misconfig';

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
    | 'Security Engineering';
  briefing: string;
  objectives: (string | ObjectiveStep)[];
  hints: string[];
  attacker: AttackerBox;
  network: HostDef[];
  totalFlags: number;
}
