import type { LabEntry } from './labs';

/** Ordered keyword → icon-key rules, checked against `id title` (lowercased). First match wins. */
const RULES: [RegExp, string][] = [
  [/wifi|wpa2|wireless|handshake/, 'wifi'],
  [/sqli|sql injection|sql-injection|stacked.query/, 'database'],
  [/privesc|suid|sudo|gtfobins/, 'key'],
  [/ransomware|worm|backdoor|trojan|malware|typosquat/, 'skull'],
  [/phish|bec|mfa|push.bombing|mailbox/, 'mail'],
  [/kerberoast|golden.ticket|dcsync|domain.admin|zerologon|printnightmare|nopac|asrep|ad-|active directory/, 'crown'],
  [/exploit|rce|toolshell|log4shell|shellshock|eternalblue|pwnkit|erlang|fortiweb|langflow|sharepoint/, 'crosshair'],
  [/forensic|prefetch|timeline|memory|deleted.file|browser.history/, 'forensics'],
  [/ssrf|xxe|idor|auth.bypass|jwt|xss|mass.assignment|race.condition|ssti|coupon/, 'web'],
  [/cloud|s3|iam|terraform|kubernetes|docker|lambda|github/, 'cloud'],
  [/crackme|binary|objdump|gdb|checksec|rop|overflow|packed|entropy/, 'binary'],
  [/bb-|bounty|subdomain|graphql/, 'bounty'],
  [/soc-|threat.hunt|beacon|c2 |cobalt.strike/, 'soc'],
  [/secengineering|threat.model|crypto|padding.oracle|deserialization|side.channel/, 'engineering'],
  [/secplus|security\+|compliance|cvss|pii|dlp|bcp|rto|rpo/, 'lock'],
  [/nmap|recon|enum|scan/, 'radar'],
];

const CATEGORY_FALLBACK: Record<string, string> = {
  Linux: 'terminal',
  Network: 'radar',
  Web: 'web',
  'Active Directory': 'crown',
  'Bug Bounty': 'bounty',
  Cloud: 'cloud',
  SOC: 'soc',
  Forensics: 'forensics',
  'Security+': 'lock',
  'Binary Analysis': 'binary',
  Malware: 'skull',
  'Security Engineering': 'engineering',
};

/** Picks a small representative icon key for a lab based on its id/title, falling back to its category. */
export function getLabIconKey(lab: LabEntry): string {
  const haystack = `${lab.scenario.id} ${lab.scenario.title}`.toLowerCase();
  for (const [re, key] of RULES) {
    if (re.test(haystack)) return key;
  }
  return CATEGORY_FALLBACK[lab.scenario.category] ?? 'terminal';
}
