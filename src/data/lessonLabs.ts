/** Maps each lesson id to the lab(s) embedded inline at the bottom of that lesson. */
export const LESSON_LABS: Record<string, string[]> = {
  // Networking Fundamentals
  'net-1': ['net-redis-unauth', 'net-elasticsearch-open'],
  'net-2': ['net-mongodb-open', 'net-rsync-anon'],
  'net-3': ['net-smb-null-session', 'net-telnet-default'],
  'net-4': ['net-snmp-public', 'net-ftp-backdoor'],
  'net-5': ['net-jenkins-default'],

  // Linux Basics for Hackers
  'lin-1': ['linux-fundamentals', 'privesc-find'],
  'lin-2': ['privesc-less', 'privesc-awk', 'privesc-suid-bash', 'privesc-suid-cp', 'pwnkit-polkit-privesc'],
  'lin-3': ['privesc-python3', 'privesc-nmap-sudo', 'privesc-suid-nmap'],
  'lin-4': ['privesc-man', 'privesc-more', 'privesc-tar'],
  'lin-5': ['privesc-perl', 'privesc-node', 'privesc-git', 'privesc-suid-find'],

  // Reconnaissance & Enumeration
  'rec-1': ['bb-forgotten-staging', 'bb-js-secret-leak'],
  'rec-2': ['network-recon'],
  'rec-3': ['enum-bruteforce'],
  'rec-4': ['net-postgres-weak'],
  'rec-5': ['capstone-box'],

  // Python & Black Hat Python
  'py-1': ['privesc-suid-nmap'],
  'py-2': ['network-recon'],
  'py-3': ['bb-js-secret-leak'],
  'py-4': ['net-telnet-default'],

  // Web Application Hacking
  'web-1': ['web-idor-invoice'],
  'web-2': ['web-sqli-product', 'web-sqli-login-bypass', 'web-sqli-search-filter'],
  'web-3': ['web-xss-search', 'web-xss-feedback'],
  'web-4': ['web-idor-profile-api', 'web-idor-coupon', 'web-auth-bypass-admin'],
  'web-5': ['web-ssrf-fetch', 'web-ssrf-metadata', 'web-ssrf-image-proxy', 'log4shell-jndi-rce', 'shellshock-cgi-rce'],

  // Red Teaming & Active Directory
  'rt-1': ['ad-credential-reuse-lateral', 'ad-worm-lateral-spread'],
  'rt-2': ['ad-smb-anon-domain-creds', 'eternalblue-smb-rce', 'ad-printnightmare-cve-2021-34527'],
  'rt-3': ['ad-kerberoast-crack', 'ad-dcsync-attack'],
  'rt-4': ['ad-asrep-roast', 'ad-workstation-to-dc', 'ad-zerologon-cve-2020-1472', 'ad-golden-ticket-persistence'],

  // Bug Bounty Methodology
  'bb-1': ['bb-forgotten-staging', 'bb-subdomain-takeover'],
  'bb-2': ['bb-exposed-git', 'bb-graphql-introspection-idor'],
  'bb-3': ['bb-api-idor', 'bb-oauth-redirect-bypass'],
  'bb-4': ['bb-ssrf-webhook-scope', 'bb-race-condition-coupon', 'bb-blind-ssrf-report'],

  // SOC & Threat Hunting
  'soc-1': ['soc-ssh-bruteforce-investigation', 'soc-phishing-header-analysis', 'soc-insider-threat-bulk-access', 'soc-bec-mailbox-rule-fraud', 'soc-credential-stuffing-detection'],
  'soc-2': ['soc-web-log-sqli-detection', 'soc-cobalt-strike-beacon', 'soc-dns-tunneling-exfil', 'soc-lolbin-certutil-abuse', 'soc-supply-chain-compromise-indicator'],

  // Digital Forensics
  'for-1': ['forensics-timeline-analysis', 'forensics-deleted-file-recovery', 'forensics-ransomware-note-analysis', 'forensics-usb-exfiltration-history', 'forensics-browser-history-insider', 'forensics-webshell-discovery'],
  'for-2': ['forensics-memory-strings', 'forensics-pass-the-hash-eventlogs', 'forensics-memory-process-injection', 'forensics-prefetch-execution-proof'],

  // Cloud Security
  'cloud-1': ['cloud-public-s3-bucket', 'cloud-metadata-ssrf', 'cloud-exposed-kubernetes-dashboard', 'cloud-exposed-docker-api', 'cloud-public-write-bucket'],
  'cloud-2': ['cloud-exposed-terraform-state', 'cloud-waf-ssrf-breach-chain', 'cloud-lambda-overpermissioned-role', 'cloud-iam-passrole-privesc', 'cloud-disabled-logging-coverup'],

  // Security+ Deep Dive
  'secplus-1': ['secplus-breach-notification-timeline', 'secplus-firewall-rule-audit', 'secplus-cvss-triage'],
  'secplus-2': ['secplus-weak-tls-identification', 'secplus-pki-chain-misconfiguration', 'secplus-password-policy-audit'],
  'secplus-3': ['secplus-orphaned-account-audit', 'secplus-mfa-sms-bypass-analysis'],
  'secplus-4': ['secplus-bcp-rto-rpo-calculation'],
  'secplus-5': ['secplus-pii-dlp-scan'],

  // Binary Analysis & Reverse Engineering
  'bin-1': ['binary-static-strings-crackme', 'binary-packed-entropy-detection', 'binary-checksec-mitigation-audit'],
  'bin-2': ['binary-objdump-disassembly-crackme'],
  'bin-3': ['binary-gdb-register-inspection-crackme', 'binary-format-string-vulnerability'],
  'bin-4': ['binary-buffer-overflow-crash', 'binary-integer-overflow-bypass'],
  'bin-5': ['binary-encoded-password-crackme', 'binary-rop-gadget-chain'],

  // Practical Malware Analysis
  'mal-1': ['malware-static-triage-sample', 'malware-yara-family-classification', 'malware-hash-threat-intel-lookup'],
  'mal-2': ['malware-anti-vm-detection-strings'],
  'mal-3': ['malware-persistence-hunt'],
  'mal-4': ['malware-c2-config-decode', 'malware-powershell-deobfuscation', 'malware-worm-propagation-analysis'],
  'mal-5': ['malware-ransomware-encryption-routine'],

  // Security Engineering
  'se-1': ['secengineering-insecure-defaults-sweep', 'secengineering-dependency-confusion'],
  'se-2': ['secengineering-single-point-of-failure'],
  'se-3': ['secengineering-stride-threat-model-audit', 'secengineering-payment-api-threat-model'],
  'se-4': ['secengineering-crypto-code-review', 'secengineering-padding-oracle'],
  'se-5': ['secengineering-security-debt-rootcause', 'secengineering-insecure-deserialization', 'secengineering-timing-side-channel'],
};

export function labsForLesson(lessonId: string): string[] {
  return LESSON_LABS[lessonId] ?? [];
}
