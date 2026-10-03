import type { SiemLabScenario } from '../siemTypes';

/** The CloutHaus Breach — Afomiya Storm phishing investigation.
 *  A gamified Splunk narrative lab where the learner traces a business-email-compromise
 *  attack from the first phishing click through mailbox manipulation and credential theft. */
export const CLOUTHAUS_BREACH: SiemLabScenario = {
  id: 'siem-narrative-clouthaus-breach',
  title: 'Operation CloutHaus: Trace the Phishing Attack',
  difficulty: 'Medium',
  tool: 'splunk',
  datasetLabel: 'clouthaus-mail-audit.log — 22 events, last 72 hours',

  briefing:
    'Afomiya Storm (@afomiya.eth) just landed a brand-deal coordinator role at CloutHaus — a fast-growing ' +
    'creator agency. Within 48 hours of her start, IT flagged anomalous mail-forwarding rules and an ' +
    'external login from Lagos. Your job is to trace the attack from the first phishing click, identify ' +
    'exactly how the intruder got in, and find everything they touched before you lock them out.',

  narrative: {
    hook: 'One click. One inbox. One way in.',
    victim: 'Afomiya Storm',
    emoji: '🎤',
    scene:
      'Afomiya Storm is a rising social media influencer who just landed a new role at CloutHaus — ' +
      'a creator agency representing 300+ talent clients. On her second day, a "collaboration proposal" ' +
      'arrives from what looks like a verified partner. One click on the PDF attachment redirects her ' +
      'through a cloned Microsoft 365 login page. The attacker now has her credentials.',
    mission:
      'Trace the phishing attack through Splunk. Uncover how the intruder got in, what mail rules ' +
      'they planted, what data they touched, and stop it before a single client contract leaks.',
    chapters: ['📧 Phishing Click', '🔑 Credential Theft', '📮 Mail Hijack', '📁 Data Access', '🚨 Containment'],
  },

  objectives: [
    {
      text: 'Find the phishing email and the exact timestamp Afomiya clicked the malicious link',
      why: 'Every investigation starts with a precise T0 — the moment the attack began. Without it you cannot establish a meaningful timeline.',
    },
    {
      text: 'Identify the attacker\'s external IP address and location used during initial access',
      why: 'Geo-anomaly detection is one of the first indicators an analyst checks — a login from Lagos on an account normally used in Accra is an immediate red flag.',
    },
    {
      text: 'Find the mail-forwarding rule the attacker created to silently copy outbound emails',
      why: 'BEC attackers almost always plant a forwarding rule within minutes of access — this lets them monitor conversations long after a password reset without triggering another login alert.',
    },
    {
      text: 'Identify which client contract folder was accessed and the file the attacker downloaded',
      why: 'Determining the blast radius — what data was exposed — is required before any client notification or legal disclosure can be made.',
    },
    {
      text: 'Locate the flag hidden in the forensic analyst note and complete the investigation',
      why: 'Completing the chain of custody: confirm the attacker\'s session token, the exact exfiltration path, and the indicator of compromise that confirms scope.',
    },
  ],

  hints: [
    'afomiya.storm',
    'sourcetype=mail_audit action=link_click',
    'source_ip=41.204',
    'action=rule_created',
    'action=file_download',
  ],

  totalFlags: 3,

  entries: [
    // ── Chapter 1: Phishing Email Arrives ──────────────────────────────────────────
    {
      timestamp: '2024-03-14 09:01:22',
      line: 'sourcetype=mail_audit user=afomiya.storm@clouthaus.io action=email_received ' +
        'from="noreply@collab-partnership.net" subject="[URGENT] CloutHaus x Stellar Brands — Collaboration Proposal" ' +
        'attachment="stellar-brief-q1-2024.pdf" size=2.1MB',
    },
    {
      timestamp: '2024-03-14 09:07:45',
      line: 'sourcetype=mail_audit user=afomiya.storm@clouthaus.io action=link_click ' +
        'url="https://collab-partnership.net/track?r=aHR0cHM6Ly9sb2dpbi1taWNyb3NvZnQtc2VjdXJlLm5ldA==" ' +
        'redirects_to="https://login-microsoft-secure.net/oauth2/authorize" client_ip=154.160.1.33 ' +
        'user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"',
    },

    // ── Chapter 2: Credential Harvesting & Successful Login ───────────────────────
    {
      timestamp: '2024-03-14 09:08:03',
      line: 'sourcetype=auth_audit action=login_page_submitted user=afomiya.storm@clouthaus.io ' +
        'page="https://login-microsoft-secure.net/oauth2/authorize" ' +
        'note="Credential entered on phishing page — captured by attacker\'s reverse-proxy (Evilginx2)"',
    },
    {
      timestamp: '2024-03-14 09:08:31',
      line: 'sourcetype=auth_audit action=login_success user=afomiya.storm@clouthaus.io ' +
        'source_ip=41.204.190.12 location="Lagos, NG" device="Unknown — Windows 10, Chrome 121" ' +
        'session_token=eyJhbGciOiJSUzI1NiJ9.afo_storm.clouthaus_session_hijack ' +
        'mfa_bypassed=true mfa_method="session_token_replay" ' +
        'note="T+0m46s after phishing click — attacker replayed harvested session token, bypassing MFA"',
    },
    {
      timestamp: '2024-03-14 09:08:55',
      line: 'sourcetype=auth_audit action=login_success user=afomiya.storm@clouthaus.io ' +
        'source_ip=154.160.1.33 location="Accra, GH" device="iPhone 15 Pro — Safari 17" ' +
        'session_token=eyJhbGciOiJSUzI1NiJ9.afo_storm.legitimate_mobile ' +
        'note="Legitimate simultaneous login — Afomiya herself, unaware anything happened"',
    },

    // ── Chapter 3: Mailbox Manipulation ───────────────────────────────────────────
    {
      timestamp: '2024-03-14 09:11:04',
      line: 'sourcetype=mail_audit user=afomiya.storm@clouthaus.io action=rule_created ' +
        'source_ip=41.204.190.12 rule_name="Newsletter Filter" ' +
        'rule_condition="From contains @clouthaus.io" ' +
        'rule_action="ForwardTo: afomiya.storm.backup@proton.me AND MarkAsRead AND MoveToFolder:Deleted Items" ' +
        'note="Attacker planted silent forward rule — all internal CloutHaus mail now copies to external Protonmail inbox"',
    },
    {
      timestamp: '2024-03-14 09:11:30',
      line: 'sourcetype=mail_audit user=afomiya.storm@clouthaus.io action=rule_created ' +
        'source_ip=41.204.190.12 rule_name="IT Alerts" ' +
        'rule_condition="Subject contains password OR Subject contains security alert OR Subject contains suspicious" ' +
        'rule_action="MoveToFolder:Deleted Items AND MarkAsRead" ' +
        'note="Second rule suppresses security alerts from reaching Afomiya — she will never see a password-reset warning"',
    },
    {
      timestamp: '2024-03-14 09:14:22',
      line: 'sourcetype=mail_audit user=afomiya.storm@clouthaus.io action=email_received ' +
        'from="it-security@clouthaus.io" subject="[SECURITY ALERT] Unusual login detected from Lagos, NG" ' +
        'delivered=false moved_to="Deleted Items" matched_rule="IT Alerts" ' +
        'note="Security alert auto-deleted by attacker\'s rule before Afomiya could read it"',
    },

    // ── Chapter 4: Reconnaissance & Data Access ───────────────────────────────────
    {
      timestamp: '2024-03-14 09:16:08',
      line: 'sourcetype=sharepoint_audit user=afomiya.storm@clouthaus.io action=folder_browse ' +
        'source_ip=41.204.190.12 site=clouthaus.sharepoint.com path="/sites/TalentContracts/2024" ' +
        'items_listed=47 note="Attacker browsing talent contract repository — first recon pass"',
    },
    {
      timestamp: '2024-03-14 09:17:33',
      line: 'sourcetype=sharepoint_audit user=afomiya.storm@clouthaus.io action=file_download ' +
        'source_ip=41.204.190.12 site=clouthaus.sharepoint.com ' +
        'path="/sites/TalentContracts/2024/Q1/StellarBrands-MasterAgreement-CONFIDENTIAL.pdf" ' +
        'size=4.7MB note="Confidential master agreement downloaded — contains all 2024 brand deal rates and exclusivity clauses"',
    },
    {
      timestamp: '2024-03-14 09:18:01',
      line: 'sourcetype=sharepoint_audit user=afomiya.storm@clouthaus.io action=file_download ' +
        'source_ip=41.204.190.12 site=clouthaus.sharepoint.com ' +
        'path="/sites/TalentContracts/2024/Q1/ClientRoster-AllTalent-2024.xlsx" ' +
        'size=1.2MB note="Full talent roster with contact info, fees, and agent commission rates"',
    },
    {
      timestamp: '2024-03-14 09:19:45',
      line: 'sourcetype=mail_audit user=afomiya.storm@clouthaus.io action=email_sent ' +
        'source_ip=41.204.190.12 to="deals@competitor-talent.io" ' +
        'subject="Fwd: CloutHaus Q1 contracts — internal reference" ' +
        'attachment="StellarBrands-MasterAgreement-CONFIDENTIAL.pdf" ' +
        'note="Attacker emailed stolen contract to external competitor inbox via Afomiya\'s account"',
    },

    // ── Chapter 5: DLP Alert & SIEM Correlation ───────────────────────────────────
    {
      timestamp: '2024-03-14 09:20:12',
      line: 'sourcetype=dlp_alert severity=Critical user=afomiya.storm@clouthaus.io ' +
        'policy="Sensitive Contract Exfiltration" action=email_sent ' +
        'dest_domain="competitor-talent.io" classification="Confidential — NDA Required" ' +
        'dlp_score=98 blocked=false note="DLP flagged but did NOT block — policy set to alert-only"',
    },
    {
      timestamp: '2024-03-14 09:21:00',
      line: 'sourcetype=siem_correlation rule="BEC: Concurrent Geo-Anomalous Logins" severity=High ' +
        'user=afomiya.storm@clouthaus.io ' +
        'event1="login_success from Accra, GH (154.160.1.33)" ' +
        'event2="login_success from Lagos, NG (41.204.190.12) +29s later" ' +
        'correlation="Same account, 2 countries, 29-second window — impossible travel" ' +
        'note="Correlation rule fired but was queued behind 847 other medium-priority alerts — not actioned for 4 hours"',
    },

    // ── Chapter 6: Legitimate User Activity (noise) ───────────────────────────────
    {
      timestamp: '2024-03-14 09:22:15',
      line: 'sourcetype=mail_audit user=afomiya.storm@clouthaus.io action=email_sent ' +
        'source_ip=154.160.1.33 to="hr@clouthaus.io" subject="Re: New hire onboarding checklist" ' +
        'note="Legitimate email from Afomiya — completely unaware of the parallel attacker session"',
    },
    {
      timestamp: '2024-03-14 10:03:44',
      line: 'sourcetype=mail_audit user=afomiya.storm@clouthaus.io action=email_received ' +
        'from="linkedin@linkedin.com" subject="You have 3 new connection requests" ' +
        'note="Routine notification — benign"',
    },
    {
      timestamp: '2024-03-14 11:55:03',
      line: 'sourcetype=auth_audit action=login_success user=kwame.asante@clouthaus.io ' +
        'source_ip=154.160.22.8 location="Accra, GH" note="Different user — benign login"',
    },

    // ── Chapter 7: Incident Discovery & Containment ───────────────────────────────
    {
      timestamp: '2024-03-14 13:14:57',
      line: 'sourcetype=helpdesk_ticket priority=P1 reporter=afomiya.storm@clouthaus.io ' +
        'subject="Someone deleted all my emails and I\'m seeing emails I never sent" ' +
        'note="Afomiya noticed missing emails and an outbox entry she didn\'t write — first human detection"',
    },
    {
      timestamp: '2024-03-14 13:22:10',
      line: 'sourcetype=siem_analyst action=session_revoked user=afomiya.storm@clouthaus.io ' +
        'analyst=soc-tier2 session_revoked="eyJhbGciOiJSUzI1NiJ9.afo_storm.clouthaus_session_hijack" ' +
        'note="SOC revoked the attacker\'s stolen session token — 4h14m after initial compromise"',
    },
    {
      timestamp: '2024-03-14 13:22:45',
      line: 'sourcetype=mail_audit user=afomiya.storm@clouthaus.io action=rule_deleted ' +
        'analyst=soc-tier2 rules_removed=["Newsletter Filter","IT Alerts"] ' +
        'note="Attacker\'s forwarding and suppression rules removed — external forward shut down"',
    },
    {
      timestamp: '2024-03-14 13:23:00',
      line: 'sourcetype=auth_audit action=password_reset_forced user=afomiya.storm@clouthaus.io ' +
        'analyst=soc-tier2 mfa_devices_revoked=true mfa_re_enrollment_required=true ' +
        'note="Forced password reset and full MFA device wipe — attacker completely locked out"',
    },

    // ── Chapter 8: Analyst Flag Note (forensic summary) ──────────────────────────
    {
      timestamp: '2024-03-14 14:05:00',
      line: 'sourcetype=analyst_notes case=INC-2024-0314-001 analyst=soc-tier2 ' +
        'victim=afomiya.storm@clouthaus.io attacker_ip=41.204.190.12 location="Lagos, NG" ' +
        'attack_vector="Evilginx2 reverse-proxy phishing — session token replay, MFA bypassed" ' +
        'dwell_time="4h14m" data_exfiltrated="StellarBrands-MasterAgreement-CONFIDENTIAL.pdf (4.7MB)" ' +
        'exfil_destination="deals@competitor-talent.io" ioc="collab-partnership.net" ' +
        'root_cause="DLP set to alert-only; BEC correlation rule queued behind 847 lower-priority alerts; no geo-block policy" ' +
        'recommendations="Enable geo-block for impossible-travel logins; set DLP to block+quarantine for contract classifications; tune alert priority to auto-page SOC on BEC correlation hits" ' +
        'flag{clouthaus_breach_evilginx_session_replay_mfa_bypass_4h14m_dwell} ' +
        'flag{afomiya_storm_rule_planted_newsletter_filter_forwarded_to_protonmail} ' +
        'flag{stellar_brands_contract_exfiltrated_competitor_talent_io}',
    },
  ],
};
