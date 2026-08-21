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
  'rec-3': ['enum-bruteforce', 'cve-2025-32433-erlang-otp-ssh', 'cve-2025-64446-fortiweb-authbypass'],
  'rec-4': ['net-postgres-weak', 'ad-password-spraying-domain'],
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
  'web-5': ['web-ssrf-fetch', 'web-ssrf-metadata', 'web-ssrf-image-proxy', 'log4shell-jndi-rce', 'shellshock-cgi-rce', 'cve-2025-53770-sharepoint-toolshell', 'cve-2025-3248-langflow-rce', 'web-dns-rebinding-ssrf-allowlist-bypass'],

  // Red Teaming & Active Directory
  'rt-1': ['ad-credential-reuse-lateral', 'ad-worm-lateral-spread'],
  'rt-2': ['ad-smb-anon-domain-creds', 'eternalblue-smb-rce', 'ad-printnightmare-cve-2021-34527', 'scattered-spider-helpdesk-to-domain-admin'],
  'rt-3': ['ad-kerberoast-crack', 'ad-dcsync-attack'],
  'rt-4': ['ad-asrep-roast', 'ad-workstation-to-dc', 'ad-zerologon-cve-2020-1472', 'ad-golden-ticket-persistence', 'ad-unconstrained-delegation-abuse', 'ad-adcs-esc1-misconfigured-template', 'ad-rbcd-abuse-domain-admin'],
  // rt-5 had no embedded labs at all until now.
  'rt-5': ['ad-silver-ticket-service-persistence', 'ad-shadow-credentials-passwordless-takeover'],

  // Bug Bounty Methodology
  'bb-1': ['bb-forgotten-staging', 'bb-subdomain-takeover'],
  'bb-2': ['bb-exposed-git', 'bb-graphql-introspection-idor'],
  'bb-3': ['bb-api-idor', 'bb-oauth-redirect-bypass'],
  'bb-4': ['bb-ssrf-webhook-scope', 'bb-race-condition-coupon', 'bb-blind-ssrf-report'],
  // bb-mass-assignment-privesc existed but had never been embedded anywhere — bb-5's own lesson
  // content is specifically about chaining unexpected-field/low-severity bugs into real impact,
  // its most natural home.
  'bb-5': ['bb-mass-assignment-privesc'],

  // API Security
  'api-1': ['api-versioning-legacy-v1-idor', 'api-rate-limit-bypass-xff-spoofing'],
  'api-2': ['bb-api-idor', 'api-bfla-internal-support-endpoint', 'api-excessive-data-exposure-team-list'],
  // web-jwt-alg-none-bypass and web-jwt-weak-secret-crack existed but had never been embedded
  // anywhere — this lesson is their natural home.
  'api-3': ['web-jwt-alg-none-bypass', 'web-jwt-weak-secret-crack', 'api-jwt-kid-injection', 'api-webauthn-downgrade-sms-otp-fallback'],
  // bb-graphql-alias-batching-otp-bypass existed but had never been embedded anywhere.
  'api-4': ['bb-graphql-introspection-idor', 'bb-graphql-alias-batching-otp-bypass'],

  // Applied Cryptography Attacks
  'crypto-2': ['secengineering-padding-oracle'],
  'crypto-3': ['crypto-ecb-block-shuffle-privesc', 'crypto-hash-length-extension-signed-url'],

  // SOC & Threat Hunting
  'soc-1': ['soc-ssh-bruteforce-investigation', 'soc-phishing-header-analysis', 'soc-insider-threat-bulk-access', 'soc-bec-mailbox-rule-fraud', 'soc-credential-stuffing-detection'],
  'soc-2': ['soc-web-log-sqli-detection', 'soc-cobalt-strike-beacon', 'soc-dns-tunneling-exfil', 'soc-lolbin-certutil-abuse', 'soc-supply-chain-compromise-indicator', 'ai-orchestrated-ransomware-investigation', 'soc-automated-spearphishing-campaign-analysis', 'soc-deepfake-vishing-ceo-fraud'],
  'soc-ir-4': ['soc-target-2013-alert-fatigue', 'soc-bangladesh-bank-swift-heist'],
  'soc-detection-1': ['soc-kerberoasting-detection'],

  // Digital Forensics
  'for-1': ['forensics-timeline-analysis', 'forensics-deleted-file-recovery', 'forensics-ransomware-note-analysis', 'forensics-usb-exfiltration-history', 'forensics-browser-history-insider', 'forensics-webshell-discovery'],
  'for-2': ['forensics-memory-strings', 'forensics-pass-the-hash-eventlogs', 'forensics-memory-process-injection', 'forensics-prefetch-execution-proof'],

  // Cloud Security
  'cloud-1': ['cloud-public-s3-bucket', 'cloud-metadata-ssrf', 'cloud-exposed-kubernetes-dashboard', 'cloud-exposed-docker-api', 'cloud-public-write-bucket'],
  'cloud-2': ['cloud-exposed-terraform-state', 'cloud-waf-ssrf-breach-chain', 'cloud-lambda-overpermissioned-role', 'cloud-iam-passrole-privesc', 'cloud-disabled-logging-coverup', 'saas-oauth-token-theft-chain', 'cloud-github-leaked-iam-keys', 'cloud-imdsv2-bypass-method-controllable-ssrf'],
  // cloud-3 had no embedded labs at all until now.
  'cloud-3': ['cloud-docker-socket-container-escape'],

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
  'mal-1': ['malware-static-triage-sample', 'malware-yara-family-classification', 'malware-hash-threat-intel-lookup', 'shai-hulud-npm-supply-chain-worm'],
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

  // ============ MISSING LABS: GROUP 1 — CODE PORTAL PYTHON (9 labs) ============
  // Maps existing Python tasks to Code Portal lessons
  'cpy-1': ['py-fund-01', 'py-fund-02', 'py-fund-03', 'py-fund-04', 'py-fund-05', 'py-fund-06', 'py-fund-07', 'py-fund-08'],
  'cpy-2': ['py-fund-09', 'py-fund-10', 'py-fund-11', 'py-fund-12', 'py-fund-13', 'py-fund-14', 'py-fund-15'],
  'cpy-3': ['py-fund-16', 'py-fund-17', 'py-fund-18', 'py-fund-19', 'py-fund-20', 'py-fund-21', 'py-crypto-01', 'py-crypto-02', 'py-crypto-03', 'py-crypto-04', 'py-crypto-05', 'py-crypto-06', 'py-crypto-07', 'py-crypto-08'],
  'cpy-4': ['py-oop-01', 'py-oop-02', 'py-oop-03', 'py-oop-04', 'py-oop-05'],
  'cpy-5': ['py-oop-06', 'py-oop-07', 'py-oop-08', 'py-oop-09', 'py-oop-10'],
  'cpy-6': ['py-oop-11', 'py-oop-12', 'py-oop-13', 'py-oop-14', 'py-oop-15'],
  'cpy-7': ['py-adv-01', 'py-adv-02', 'py-adv-03', 'py-adv-04', 'py-adv-05'],
  'cpy-8': ['py-adv-06', 'py-adv-07', 'py-adv-08', 'py-adv-09', 'py-adv-10'],
  'cpy-9': ['py-adv-11', 'py-adv-12', 'py-adv-13', 'py-adv-14', 'py-adv-15', 'py-crypto-09', 'py-crypto-10', 'py-crypto-11', 'py-crypto-12', 'py-crypto-13', 'py-crypto-14', 'py-crypto-15', 'py-crypto-16', 'py-crypto-17'],

  // ============ MISSING LABS: GROUP 2 — SOC/SIEM/DETECTION/IR (10 labs) ============
  'soc-siem-1': ['soc-siem-log-normalization-basics', 'soc-siem-parsing-multiformat'],
  'soc-siem-2': ['soc-siem-correlation-rule-eventchain', 'soc-siem-brute-force-detection'],
  'soc-siem-3': ['soc-siem-vendor-comparison-alert-format', 'soc-siem-splunk-vs-sentinel'],
  'soc-siem-4': ['soc-siem-data-volume-ingestion', 'soc-siem-log-source-onboarding'],
  'soc-detection-2': ['soc-ueba-user-behavior-anomaly', 'soc-ueba-peer-group-analysis'],
  'soc-detection-3': ['soc-threat-intel-ioc-matching', 'soc-ti-feed-correlation'],
  'soc-detection-4': ['soc-sigma-rule-basics', 'soc-sigma-cross-platform'],
  'soc-ir-1': ['soc-ir-timeline-reconstruction', 'soc-ir-initial-access-investigation'],
  'soc-ir-2': ['soc-ir-soar-playbook-execution', 'soc-ir-soar-automation-workflow'],
  'soc-ir-3': ['soc-ir-compliance-pci-reporting', 'soc-ir-evidence-handling-chain-of-custody'],

  // ============ MISSING LABS: GROUP 3 — FORENSICS COMPLETION (4 labs) ============
  'for-3': ['for-windows-event-logs-browser-history', 'for-eventlog-lateral-movement'],
  'for-4': ['for-disk-forensics-filesystem-analysis', 'for-deleted-file-recovery-carving'],
  'for-5': ['for-memory-volatility-process-analysis', 'for-memory-code-injection-detection'],
  'for-6': ['for-case-closure-report-writing', 'for-legal-evidence-integrity-verification'],

  // ============ MISSING LABS: GROUP 4 — MOBILE SECURITY (8 labs) ============
  'mob-1': ['mob-apk-architecture-analysis', 'mob-attack-surface-components'],
  'mob-2': ['mob-static-analysis-apk-decompile', 'mob-jadx-code-review'],
  'mob-3': ['mob-dynamic-analysis-frida', 'mob-instrumentation-method-hooking'],
  'mob-4': ['mob-insecure-data-storage-sqlite', 'mob-insecure-communication-mitm'],
  'mob-5': ['mob-ios-keychain-security', 'mob-api-backend-oauth-flaws'],
  'mob-6': ['mob-malware-analysis-banking-trojan', 'mob-malware-capabilities-exfiltration'],
  'mob-7': ['mob-mdm-device-management-bypass', 'mob-mdm-enterprise-policy-enforcement'],
  'mob-8': ['mob-pentest-methodology-reconnaissance', 'mob-pentest-reporting-capstone'],

  // ============ MISSING LABS: GROUP 5 — WIRELESS SECURITY (8 labs) ============
  'wl-1': ['wl-80211-fundamentals-attack-surface', 'wl-passive-scanning-networks'],
  'wl-2': ['wl-wpa2-encryption-handshake-capture', 'wl-four-way-handshake-analysis'],
  'wl-3': ['wl-handshake-cracking-hashcat', 'wl-wpa3-sae-security'],
  'wl-4': ['wl-rogue-ap-evil-twin-ssid-clone', 'wl-deauth-attack-client-disconnect'],
  'wl-5': ['wl-bluetooth-ble-security-pairing', 'wl-bluetooth-sniffer-gattacker'],
  'wl-6': ['wl-enterprise-8021x-eap-security', 'wl-radius-server-compromise'],
  'wl-7': ['wl-wireless-ids-airids-detection', 'wl-rogue-ap-detection-tools'],
  'wl-8': ['wl-5g-cellular-security-fundamentals', 'wl-5g-network-slicing-attacks'],

  // ============ MISSING LABS: GROUP 6 — IOT/EMBEDDED SECURITY (8 labs) ============
  'iot-1': ['iot-embedded-architecture-attack-surface', 'iot-iot-protocols-mqtt-zigbee'],
  'iot-2': ['iot-firmware-extraction-methods', 'iot-firmware-analysis-binwalk'],
  'iot-3': ['iot-uart-serial-interface-access', 'iot-jtag-hardware-debugging'],
  'iot-4': ['iot-embedded-web-interface-default-creds', 'iot-embedded-webserver-vulns'],
  'iot-5': ['iot-botnet-analysis-mirai-dyn', 'iot-iot-ecosystem-propagation'],
  'iot-6': ['iot-mqtt-protocol-analysis-injection', 'iot-zigbee-security-replay-attack'],
  'iot-7': ['iot-scada-plc-exploitation-commands', 'iot-industrial-control-system-safety'],
  'iot-8': ['iot-pentest-methodology-enumeration', 'iot-iot-compliance-security-testing'],

  // ============ MISSING LABS: GROUP 7 — AI/LLM SECURITY (8 labs) ============
  'ai-sec-1': ['ai-sec-owasp-top-10-for-llms', 'ai-sec-model-misuse-prevention'],
  'ai-sec-2': ['ai-sec-prompt-injection-basics', 'ai-sec-prompt-jailbreak-techniques'],
  'ai-sec-3': ['ai-sec-insecure-output-handling', 'ai-sec-rag-injection-attacks'],
  'ai-sec-4': ['ai-sec-training-data-poisoning', 'ai-sec-model-theft-extraction'],
  'ai-sec-5': ['ai-sec-model-inversion-pii-leakage', 'ai-sec-sensitive-data-disclosure'],
  'ai-sec-6': ['ai-sec-adversarial-examples-evasion', 'ai-sec-backdoor-trojan-models'],
  'ai-sec-7': ['ai-sec-ai-governance-red-teaming', 'ai-sec-model-auditing-bias'],
  'ai-sec-8': ['ai-sec-agent-safety-constraints', 'ai-sec-multi-agent-security-coordination'],

  // ============ MISSING LABS: GROUP 8 — CLOUD SECURITY COMPLETION (3 labs) ============
  'cloud-4': ['cloud-multi-account-cross-account-iam', 'cloud-cross-account-role-assumption'],
  'cloud-5': ['cloud-native-detection-container-logs', 'cloud-logging-compliance-audit'],
  'cloud-6': ['cloud-posture-management-misconfig-audit', 'cloud-cspm-remediation-automation'],

  // ============ MISSING LABS: GROUP 9 — NETWORK/RECON/CRYPTO/LINUX GAPS (8 labs) ============
  'net-6': ['net-ipv6-transition-mechanisms', 'net-ipv6-address-scanning'],
  'net-7': ['net-vlan-segmentation-security', 'net-firewall-rule-bypass'],
  'net-8': ['net-routing-protocols-bgp-hijack', 'net-routing-attacks-prefix-injection'],
  'rec-6': ['rec-web-reconnaissance-subdomain-enum', 'rec-domain-takeover-dangling-domains'],
  'rec-7': ['rec-cloud-asset-discovery-s3-buckets', 'rec-cloud-attack-surface-mapping'],
  'rec-8': ['rec-recon-automation-osint-workflow', 'rec-reporting-findings-documentation'],
  'crypto-1': ['crypto-fundamentals-cipher-types', 'crypto-symmetric-vs-asymmetric-attacks'],
  'crypto-4': ['crypto-hash-type-identification', 'crypto-hashcat-wordlist-strategy'],
  'lin-6': ['lin-logging-auditd-syslog-analysis', 'lin-linux-event-log-correlation'],
  'lin-7': ['lin-kernel-exploit-privilege-escalation', 'lin-kernel-vulnerability-assessment'],
  'lin-8': ['lin-hardening-security-baselines', 'lin-defense-in-depth-layered-security'],
};

export function labsForLesson(lessonId: string): string[] {
  return LESSON_LABS[lessonId] ?? [];
}
