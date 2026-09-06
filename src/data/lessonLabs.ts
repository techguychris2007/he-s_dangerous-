/** Maps each lesson id to the lab(s) embedded inline at the bottom of that lesson. */
export const LESSON_LABS: Record<string, string[]> = {
  // Networking Fundamentals
  'net-1': ['net-redis-unauth', 'net-elasticsearch-open'],
  'net-2': ['net-mongodb-open', 'net-rsync-anon'],
  'net-3': ['net-smb-null-session', 'net-telnet-default'],
  'net-4': ['net-snmp-public', 'net-ftp-backdoor'],
  'net-5': ['net-jenkins-default'],
  'net-6': ['net-ipv6-transition-mechanisms', 'batch20-ipv6-slaac-ra-spoofing'],
  'net-7': ['batch19-vlan-double-tagging-hopping', 'batch20-firewall-stateless-rst-bypass'],
  'net-8': ['batch19-bgp-prefix-hijacking-route-leak', 'network-capstone-anonymous-ftp-to-internal-database'],

  // Linux Basics for Hackers
  'lin-1': ['linux-fundamentals', 'privesc-find'],
  'lin-2': ['privesc-less', 'privesc-awk', 'privesc-suid-bash', 'privesc-suid-cp', 'pwnkit-polkit-privesc'],
  'lin-3': ['privesc-python3', 'privesc-nmap-sudo', 'privesc-suid-nmap'],
  'lin-4': ['privesc-man', 'privesc-more', 'privesc-tar'],
  'lin-5': ['privesc-perl', 'privesc-node', 'privesc-git', 'privesc-suid-find'],
  'lin-6': ['lin-logging-auditd-syslog-analysis'],
  'lin-7': ['lin-kernel-exploit-privilege-escalation'],
  'lin-8': ['linux-capstone-ci-leak-to-database-compromise'],

  // Reconnaissance & Enumeration
  'rec-1': ['bb-forgotten-staging', 'bb-js-secret-leak'],
  'rec-2': ['network-recon'],
  'rec-3': ['enum-bruteforce', 'cve-2025-32433-erlang-otp-ssh', 'cve-2025-64446-fortiweb-authbypass'],
  'rec-4': ['net-postgres-weak', 'ad-password-spraying-domain'],
  'rec-5': ['capstone-box'],
  'rec-6': ['rec-web-reconnaissance-subdomain-enum'],
  'rec-7': ['cloud-public-s3-bucket', 'cloud-public-write-bucket'],
  'rec-8': ['network-capstone-anonymous-ftp-to-internal-database'],

  // Python & Black Hat Python
  'py-1': ['privesc-suid-nmap'],
  'py-2': ['network-recon'],
  'py-3': ['bb-js-secret-leak'],
  'py-4': ['net-telnet-default'],
  'py-5': ['py-packet-sniffer-scapy-credential-parser'],

  // Web Application Hacking
  'web-1': ['web-idor-invoice'],
  'web-2': ['web-sqli-product', 'web-sqli-login-bypass', 'web-sqli-search-filter'],
  'web-3': ['web-xss-search', 'web-xss-feedback'],
  'web-4': ['web-idor-profile-api', 'web-idor-coupon', 'web-auth-bypass-admin'],
  'web-5': [
    'web-ssrf-fetch',
    'web-ssrf-metadata',
    'web-ssrf-image-proxy',
    'log4shell-jndi-rce',
    'shellshock-cgi-rce',
    'cve-2025-53770-sharepoint-toolshell',
    'cve-2025-3248-langflow-rce',
    'web-dns-rebinding-ssrf-allowlist-bypass',
  ],

  // Red Teaming & Active Directory
  'rt-1': ['ad-credential-reuse-lateral', 'ad-worm-lateral-spread'],
  'rt-2': [
    'ad-smb-anon-domain-creds',
    'eternalblue-smb-rce',
    'ad-printnightmare-cve-2021-34527',
    'scattered-spider-helpdesk-to-domain-admin',
  ],
  'rt-3': ['ad-kerberoast-crack', 'ad-dcsync-attack'],
  'rt-4': [
    'ad-asrep-roast',
    'ad-workstation-to-dc',
    'ad-zerologon-cve-2020-1472',
    'ad-golden-ticket-persistence',
    'ad-unconstrained-delegation-abuse',
    'ad-adcs-esc1-misconfigured-template',
    'ad-rbcd-abuse-domain-admin',
  ],
  'rt-5': ['ad-silver-ticket-service-persistence', 'ad-shadow-credentials-passwordless-takeover'],

  // Bug Bounty Methodology
  'bb-1': ['bb-forgotten-staging', 'bb-subdomain-takeover'],
  'bb-2': ['bb-exposed-git', 'bb-graphql-introspection-idor'],
  'bb-3': ['bb-api-idor', 'bb-oauth-redirect-bypass'],
  'bb-4': ['bb-ssrf-webhook-scope', 'bb-race-condition-coupon', 'bb-blind-ssrf-report'],
  'bb-5': ['bb-mass-assignment-privesc'],

  // API Security
  'api-1': ['api-versioning-legacy-v1-idor', 'api-rate-limit-bypass-xff-spoofing'],
  'api-2': ['bb-api-idor', 'api-bfla-internal-support-endpoint', 'api-excessive-data-exposure-team-list'],
  'api-3': [
    'web-jwt-alg-none-bypass',
    'web-jwt-weak-secret-crack',
    'api-jwt-kid-injection',
    'api-webauthn-downgrade-sms-otp-fallback',
  ],
  'api-4': ['bb-graphql-introspection-idor', 'bb-graphql-alias-batching-otp-bypass'],

  // Applied Cryptography Attacks
  'crypto-1': ['crypto-fundamentals-cipher-types'],
  'crypto-2': ['secengineering-padding-oracle'],
  'crypto-3': ['crypto-ecb-block-shuffle-privesc', 'crypto-hash-length-extension-signed-url'],
  'crypto-4': ['crypto-capstone-jwt-crack-to-rsa-factorization-vault-decrypt'],

  // SOC Fundamentals & Threat Hunting
  'soc-1': [
    'soc-ssh-bruteforce-investigation',
    'soc-phishing-header-analysis',
    'soc-insider-threat-bulk-access',
    'soc-bec-mailbox-rule-fraud',
    'soc-credential-stuffing-detection',
  ],
  'soc-2': [
    'soc-web-log-sqli-detection',
    'soc-supply-chain-compromise-indicator',
    'ai-orchestrated-ransomware-investigation',
    'soc-automated-spearphishing-campaign-analysis',
    'soc-deepfake-vishing-ceo-fraud',
  ],
  'soc-3': ['soc-mitre-attack-coverage-mapping-audit'],
  'soc-4': ['soc-cobalt-strike-beacon', 'soc-dns-tunneling-exfil', 'soc-lolbin-certutil-abuse'],

  // SIEM Platforms & Log Management
  'soc-siem-1': ['soc-siem-log-normalization-basics'],
  'soc-siem-2': ['soc-siem-correlation-rule-eventchain'],
  'soc-siem-3': ['soc-siem-vendor-comparison-alert-format'],
  'soc-siem-4': ['soc-siem-data-volume-ingestion'],

  // Detection Engineering & UEBA
  'soc-detection-1': ['soc-kerberoasting-detection'],
  'soc-detection-2': ['soc-ueba-user-behavior-anomaly'],
  'soc-detection-3': ['soc-threat-intel-ioc-matching'],
  'soc-detection-4': ['soc-sigma-rule-basics'],

  // Incident Response, SOAR & Compliance
  'soc-ir-1': ['soc-ir-timeline-reconstruction'],
  'soc-ir-2': ['soc-ir-soar-playbook-execution'],
  'soc-ir-3': ['soc-ir-compliance-pci-reporting'],
  'soc-ir-4': ['soc-target-2013-alert-fatigue', 'soc-bangladesh-bank-swift-heist'],

  // Digital Forensics
  'for-1': [
    'forensics-timeline-analysis',
    'forensics-deleted-file-recovery',
    'forensics-ransomware-note-analysis',
    'forensics-usb-exfiltration-history',
    'forensics-browser-history-insider',
    'forensics-webshell-discovery',
  ],
  'for-2': [
    'forensics-memory-strings',
    'forensics-pass-the-hash-eventlogs',
    'forensics-memory-process-injection',
    'forensics-prefetch-execution-proof',
  ],
  'for-3': ['for-windows-event-logs-browser-history'],
  'for-4': ['for-disk-forensics-filesystem-analysis'],
  'for-5': ['for-memory-volatility-process-analysis'],
  'for-6': ['for-case-closure-report-writing'],

  // Cloud Security
  'cloud-1': [
    'cloud-public-s3-bucket',
    'cloud-metadata-ssrf',
    'cloud-exposed-kubernetes-dashboard',
    'cloud-exposed-docker-api',
    'cloud-public-write-bucket',
  ],
  'cloud-2': [
    'cloud-exposed-terraform-state',
    'cloud-waf-ssrf-breach-chain',
    'cloud-lambda-overpermissioned-role',
    'cloud-iam-passrole-privesc',
    'cloud-disabled-logging-coverup',
    'saas-oauth-token-theft-chain',
    'cloud-github-leaked-iam-keys',
    'cloud-imdsv2-bypass-method-controllable-ssrf',
  ],
  'cloud-3': ['cloud-docker-socket-container-escape'],
  'cloud-4': ['cloud-multi-account-cross-account-iam'],
  'cloud-5': ['cloud-native-detection-container-logs'],
  'cloud-6': ['cloud-capstone-ssrf-metadata-to-passrole-account-takeover'],

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
  'mal-1': [
    'malware-static-triage-sample',
    'malware-yara-family-classification',
    'malware-hash-threat-intel-lookup',
    'shai-hulud-npm-supply-chain-worm',
  ],
  'mal-2': ['malware-anti-vm-detection-strings'],
  'mal-3': ['malware-persistence-hunt'],
  'mal-4': ['malware-c2-config-decode', 'malware-powershell-deobfuscation', 'malware-worm-propagation-analysis'],
  'mal-5': ['malware-ransomware-encryption-routine'],

  // Security Engineering
  'se-1': ['secengineering-insecure-defaults-sweep', 'secengineering-dependency-confusion'],
  'se-2': ['secengineering-single-point-of-failure'],
  'se-3': ['secengineering-stride-threat-model-audit', 'secengineering-payment-api-threat-model'],
  'se-4': ['secengineering-crypto-code-review', 'secengineering-padding-oracle'],
  'se-5': [
    'secengineering-security-debt-rootcause',
    'secengineering-insecure-deserialization',
    'secengineering-timing-side-channel',
  ],

  // Code Portal: Python Fundamentals
  'cpy-1': ['py-fund-01', 'py-fund-02', 'py-fund-03', 'py-fund-04', 'py-fund-05', 'py-fund-06', 'py-fund-07', 'py-fund-08'],
  'cpy-2': ['py-fund-09', 'py-fund-10', 'py-fund-11', 'py-fund-12', 'py-fund-13', 'py-fund-14', 'py-fund-15'],
  'cpy-3': [
    'py-fund-16',
    'py-fund-17',
    'py-fund-18',
    'py-fund-19',
    'py-fund-20',
    'py-fund-21',
    'py-crypto-01',
    'py-crypto-02',
    'py-crypto-03',
    'py-crypto-04',
    'py-crypto-05',
    'py-crypto-06',
    'py-crypto-07',
    'py-crypto-08',
  ],

  // Code Portal: Python OOP
  'cpy-4': ['py-oop-01', 'py-oop-02', 'py-oop-03', 'py-oop-04', 'py-oop-05'],
  'cpy-5': ['py-oop-06', 'py-oop-07', 'py-oop-08', 'py-oop-09', 'py-oop-10'],
  'cpy-6': ['py-oop-11', 'py-oop-12', 'py-oop-13', 'py-oop-14', 'py-oop-15'],

  // Code Portal: Advanced Python
  'cpy-7': ['py-adv-01', 'py-adv-02', 'py-adv-03', 'py-adv-04', 'py-adv-05'],
  'cpy-8': ['py-adv-06', 'py-adv-07', 'py-adv-08', 'py-adv-09', 'py-adv-10'],
  'cpy-9': [
    'py-adv-11',
    'py-adv-12',
    'py-adv-13',
    'py-adv-14',
    'py-adv-15',
    'py-crypto-09',
    'py-crypto-10',
    'py-crypto-11',
    'py-crypto-12',
    'py-crypto-13',
    'py-crypto-14',
    'py-crypto-15',
    'py-crypto-16',
    'py-crypto-17',
  ],

  // Mobile Security
  'mob-1': ['mob-apk-architecture-analysis', 'mobile-exported-activity-admin-bypass'],
  'mob-2': ['mob-static-analysis-apk-decompile', 'mobile-hardcoded-api-key-decompiled-source'],
  'mob-3': ['mobile-trust-all-certificate-mitm-proof', 'mobile-root-detection-ssl-pinning-static-bypass'],
  'mob-4': [
    'mob-insecure-data-storage-sqlite',
    'mobile-plaintext-shared-prefs-password',
    'mobile-cleartext-traffic-missing-network-security-config',
    'mobile-allowbackup-adb-backup-extraction',
  ],
  'mob-5': [
    'mobile-bola-intercepted-api-replay',
    'mobile-ios-keychain-overly-permissive-accessibility',
    'mobile-custom-url-scheme-oauth-code-hijacking',
  ],
  'mob-6': ['mob-malware-analysis-banking-trojan', 'mobile-accessibility-service-overlay-fraud-chain'],
  'mob-7': ['mobile-frida-root-detection-bypass-mdm-compliance', 'mobile-android-keystore-no-user-authentication-required'],
  'mob-8': ['mobile-masvs-audit-missing-resilience-control', 'mobile-capstone-hardcoded-key-to-backend-compromise'],

  // Wireless & Wi-Fi Hacking
  'wl-1': ['wl-80211-fundamentals-attack-surface'],
  'wl-2': ['wl-wpa2-encryption-handshake-capture', 'wireless-wpa2-live-handshake-capture-crack'],
  'wl-3': ['wireless-wpa2-live-handshake-capture-crack'],
  'wl-4': ['wl-rogue-ap-evil-twin-ssid-clone'],
  'wl-5': ['wireless-password-reuse-scenario'],
  'wl-6': ['wireless-wpa2-live-handshake-capture-crack'],
  'wl-7': ['wl-rogue-ap-evil-twin-ssid-clone'],
  'wl-8': ['wireless-capstone-wpa2-crack-to-wired-network-pivot'],

  // IoT & Embedded Security
  'iot-1': ['iot-embedded-architecture-attack-surface'],
  'iot-2': ['iot-firmware-extraction-methods'],
  'iot-3': ['iot-capstone-firmware-to-corporate-network-compromise'],
  'iot-4': ['iot-capstone-firmware-to-corporate-network-compromise'],
  'iot-5': ['iot-embedded-architecture-attack-surface'],
  'iot-6': ['iot-mqtt-protocol-analysis-injection'],
  'iot-7': ['iot-capstone-firmware-to-corporate-network-compromise'],
  'iot-8': ['iot-capstone-firmware-to-corporate-network-compromise'],

  // AI & LLM Security (Standard and aliased keys)
  'ai-1': ['ai-sec-owasp-top-10-for-llms'],
  'ai-2': ['ai-sec-prompt-injection-basics'],
  'ai-3': ['ai-capstone-prompt-injection-to-confused-deputy-export'],
  'ai-4': ['ai-sec-training-data-poisoning', 'ai-sec-model-extraction-theft'],
  'ai-5': ['ai-capstone-prompt-injection-to-confused-deputy-export'],
  'ai-6': ['ai-sec-prompt-injection-basics'],
  'ai-7': ['ai-sec-owasp-top-10-for-llms'],
  'ai-8': ['ai-capstone-prompt-injection-to-confused-deputy-export'],

  // Aliases for ai-sec-*
  'ai-sec-1': ['ai-sec-owasp-top-10-for-llms'],
  'ai-sec-2': ['ai-sec-prompt-injection-basics'],
  'ai-sec-3': ['ai-capstone-prompt-injection-to-confused-deputy-export'],
  'ai-sec-4': ['ai-sec-training-data-poisoning', 'ai-sec-model-extraction-theft'],
  'ai-sec-5': ['ai-capstone-prompt-injection-to-confused-deputy-export'],
  'ai-sec-6': ['ai-sec-prompt-injection-basics'],
  'ai-sec-7': ['ai-sec-owasp-top-10-for-llms'],
  'ai-sec-8': ['ai-capstone-prompt-injection-to-confused-deputy-export'],
};

export function labsForLesson(lessonId: string): string[] {
  return LESSON_LABS[lessonId] ?? [];
}
