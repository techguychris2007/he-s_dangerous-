import type { ModuleMeta, RoadmapStage } from '../types';

import OsiTcpIp from '../content/networking/01-osi-tcpip';
import IpSubnetting from '../content/networking/02-ip-subnetting';
import TcpUdpHandshake from '../content/networking/03-tcp-udp-handshake';
import PortsServices from '../content/networking/04-ports-services';
import DnsHttpTraffic from '../content/networking/05-dns-http-traffic';

import FilesystemNavigation from '../content/linux/01-filesystem-navigation';
import UsersPermissions from '../content/linux/02-users-permissions';
import ProcessesNetworkingCli from '../content/linux/03-processes-networking-cli';
import BashScripting from '../content/linux/04-bash-scripting';
import AttackOpsManagement from '../content/linux/05-attack-ops-management';

import PassiveReconOsint from '../content/recon/01-passive-recon-osint';
import ActiveScanningNmap from '../content/recon/02-active-scanning-nmap';
import ServiceEnumeration from '../content/recon/03-service-enumeration';
import CredentialAttacks from '../content/recon/04-credential-attacks';
import EnumerationMethodology from '../content/recon/05-enumeration-methodology';

import PythonRefresher from '../content/python/01-python-refresher';
import PortScanner from '../content/python/02-port-scanner';
import ReconAutomation from '../content/python/03-recon-automation';
import BruteforcersExploits from '../content/python/04-bruteforcers-exploits';

import OwaspTop10 from '../content/webapp/01-owasp-top-10';
import SqlInjection from '../content/webapp/02-sql-injection';
import XssSessionAttacks from '../content/webapp/03-xss-session-attacks';
import IdorBusinessLogic from '../content/webapp/04-idor-business-logic';
import SsrfXxeDeserialization from '../content/webapp/05-ssrf-xxe-deserialization';

import RedteamVsPentest from '../content/redteam/01-redteam-vs-pentest';
import InternalNetworkAttacks from '../content/redteam/02-internal-network-attacks';
import ActiveDirectoryFundamentals from '../content/redteam/03-active-directory-fundamentals';
import KerberosAdPrivesc from '../content/redteam/04-kerberos-ad-privesc';

import HowBugBountyWorks from '../content/bugbounty/01-how-bug-bounty-works';
import ReconAtScale from '../content/bugbounty/02-recon-at-scale';
import WritingReports from '../content/bugbounty/03-writing-reports';
import SkillsAndRoadmap from '../content/bugbounty/04-skills-and-roadmap';

import SocFundamentals from '../content/soc/01-soc-fundamentals';
import ThreatHuntingDetection from '../content/soc/02-threat-hunting-detection';
import AttackCoverageMapping from '../content/soc/03-attack-coverage-mapping';

import WhatIsASiem from '../content/soc-siem/01-what-is-a-siem';
import CorrelationRules from '../content/soc-siem/02-correlation-rules';
import RealSiemPlatformsCompared from '../content/soc-siem/03-real-siem-platforms-compared';

import WritingTuningDetectionRules from '../content/soc-detection/01-writing-tuning-detection-rules';
import Ueba from '../content/soc-detection/02-ueba';
import ThreatIntelIntegration from '../content/soc-detection/03-threat-intel-integration';

import IncidentInvestigationMethodology from '../content/soc-ir/01-incident-investigation-methodology';
import SoarAutomation from '../content/soc-ir/02-soar-automation';
import ComplianceReporting from '../content/soc-ir/03-compliance-reporting';

import ForensicsFundamentals from '../content/forensics/01-forensics-fundamentals';
import MemoryArtifactAnalysis from '../content/forensics/02-memory-artifact-analysis';

import CloudSecurityFundamentals from '../content/cloud/01-cloud-security-fundamentals';
import IamAndMisconfiguration from '../content/cloud/02-iam-and-misconfiguration';

import GrcFundamentals from '../content/securityplus/01-grc-fundamentals';
import CryptographyFundamentals from '../content/securityplus/02-cryptography-fundamentals';
import IamDeepDive from '../content/securityplus/03-iam-deep-dive';
import SecurityArchitecture from '../content/securityplus/04-security-architecture';
import IncidentResponseBcdr from '../content/securityplus/05-incident-response-bcdr';

import BinaryFormatsStaticAnalysis from '../content/binaryanalysis/01-binary-formats-static-analysis';
import AssemblyStackCrashCourse from '../content/binaryanalysis/02-assembly-stack-crash-course';
import DebuggingWithGdb from '../content/binaryanalysis/03-debugging-with-gdb';
import BufferOverflowFundamentals from '../content/binaryanalysis/04-buffer-overflow-fundamentals';
import IntroExploitDevelopment from '../content/binaryanalysis/05-intro-exploit-development';

import StaticMalwareAnalysis from '../content/malware/01-static-malware-analysis';
import DynamicAnalysisSandboxing from '../content/malware/02-dynamic-analysis-sandboxing';
import PersistenceMechanisms from '../content/malware/03-persistence-mechanisms';
import NetworkIndicatorsC2 from '../content/malware/04-network-indicators-c2';
import AntiAnalysisEvasion from '../content/malware/05-anti-analysis-evasion';

import SyntaxAndDataStructures from '../content/code-python-fundamentals/01-syntax-and-data-structures';
import FunctionsAndErrorHandling from '../content/code-python-fundamentals/02-functions-and-error-handling';
import StringsAndTextProcessing from '../content/code-python-fundamentals/03-strings-and-text-processing';

import OopBasics from '../content/code-python-oop/01-oop-basics';
import InheritanceAndPolymorphism from '../content/code-python-oop/02-inheritance-and-polymorphism';
import AdvancedOop from '../content/code-python-oop/03-advanced-oop';

import DecoratorsAndClosures from '../content/code-python-advanced/01-decorators-and-closures';
import GeneratorsAndContextManagers from '../content/code-python-advanced/02-generators-and-context-managers';
import RegexConcurrencyAndCaching from '../content/code-python-advanced/03-regex-concurrency-and-caching';

import SecurityEconomics from '../content/secengineering/01-security-economics';
import SecureDesignPrinciples from '../content/secengineering/02-secure-design-principles';
import ThreatModeling from '../content/secengineering/03-threat-modeling';
import CryptographicEngineeringPitfalls from '../content/secengineering/04-cryptographic-engineering-pitfalls';
import WhySystemsFailCaseStudies from '../content/secengineering/05-why-systems-fail-case-studies';

export const MODULES: ModuleMeta[] = [
  {
    id: 'networking',
    slug: 'networking',
    title: 'Networking Fundamentals',
    subtitle: 'OSI, TCP/IP, subnetting, ports & protocols',
    description:
      'The mental model every other module builds on: how packets move, how addressing works, and what protocols you must know cold before you ever touch nmap.',
    status: 'available',
    sourceBooks: ['CompTIA Security+ Get Certified Get Ahead', 'Cybersecurity Essentials'],
    icon: 'network',
    lessons: [
      { id: 'net-1', slug: 'osi-tcpip', title: 'How Networks Actually Work: OSI & TCP/IP', summary: 'Layers, encapsulation, and where every attack category lives.', minutes: 12, Content: OsiTcpIp },
      { id: 'net-2', slug: 'ip-subnetting', title: 'IP Addressing & Subnetting', summary: 'CIDR notation, fast subnet math, and RFC1918 ranges.', minutes: 14, Content: IpSubnetting },
      { id: 'net-3', slug: 'tcp-udp-handshake', title: 'TCP, UDP, and the Three-Way Handshake', summary: 'Why nmap scan types behave the way they do.', minutes: 10, Content: TcpUdpHandshake },
      { id: 'net-4', slug: 'ports-services', title: 'Ports, Services & Protocols You Must Know', summary: 'The port list every pentester has memorized.', minutes: 13, Content: PortsServices },
      {
        id: 'net-5', slug: 'dns-http-traffic', title: 'DNS, HTTP/HTTPS & Traffic Basics', summary: 'Zone transfers, HTTP methods/status codes, and TLS in brief.', minutes: 12, Content: DnsHttpTraffic,
        quiz: [
          { id: 'q1', prompt: 'Which layer of the OSI model do TCP and UDP operate at?', choices: ['Layer 3 (Network)', 'Layer 4 (Transport)', 'Layer 7 (Application)', 'Layer 2 (Data Link)'], correctIndex: 1, explanation: 'TCP and UDP are transport-layer protocols — ports live here.' },
          { id: 'q2', prompt: 'A /27 subnet provides how many usable host addresses?', choices: ['14', '30', '62', '126'], correctIndex: 1, explanation: '/27 = 255.255.255.224, giving 2^5 - 2 = 30 usable hosts.' },
          { id: 'q3', prompt: 'Which nmap scan type completes the full TCP three-way handshake?', choices: ['-sS (SYN scan)', '-sT (connect scan)', '-sU (UDP scan)', '-sA (ACK scan)'], correctIndex: 1, explanation: '-sT uses the OS connect() call, completing the full handshake — noisier but doesn\'t need raw socket privileges.' },
          { id: 'q4', prompt: 'A misconfigured DNS server allowing AXFR to anyone exposes what?', choices: ['Only the MX record', 'The entire zone file (all records)', 'Nothing, AXFR is always safe', 'Only NS records'], correctIndex: 1, explanation: 'AXFR transfers the whole zone — every record type for every host in that zone.' },
        ],
      },
    ],
  },
  {
    id: 'linux',
    slug: 'linux',
    title: 'Linux Basics for Hackers',
    subtitle: 'Filesystem, permissions, processes, bash, and attack ops',
    description:
      'Practical Linux fluency for offensive work: navigation, permissions and SUID/sudo misconfigurations, process/network commands, and bash automation.',
    status: 'available',
    sourceBooks: ['Linux Basics for Hackers'],
    icon: 'terminal',
    lessons: [
      { id: 'lin-1', slug: 'filesystem-navigation', title: 'Getting Comfortable: Filesystem & Navigation', summary: 'The directory hierarchy and commands you\'ll type hundreds of times a day.', minutes: 11, Content: FilesystemNavigation },
      { id: 'lin-2', slug: 'users-permissions', title: 'Users, Groups & Permissions', summary: 'chmod, SUID/SGID/sticky bits, and reading sudoers correctly.', minutes: 15, Content: UsersPermissions },
      { id: 'lin-3', slug: 'processes-networking-cli', title: 'Package Mgmt, Processes & Networking Commands', summary: 'ps, netstat/ss, netcat, and the redirection glue that ties it together.', minutes: 13, Content: ProcessesNetworkingCli },
      { id: 'lin-4', slug: 'bash-scripting', title: 'Bash Scripting for Automation', summary: 'Loops, functions, and parsing tool output at scale.', minutes: 14, Content: BashScripting },
      {
        id: 'lin-5', slug: 'attack-ops-management', title: 'Managing Users & Services for Attack Ops', summary: 'systemd, cron privesc paths, listeners, and log awareness.', minutes: 13, Content: AttackOpsManagement,
        quiz: [
          { id: 'q1', prompt: 'A SUID binary owned by root is dangerous because:', choices: ['It always deletes files', 'It runs with the file owner\'s (root) privileges regardless of who executes it', 'It disables logging', 'It only affects the /tmp directory'], correctIndex: 1, explanation: 'SUID makes the binary execute with the owner\'s privileges — if that owner is root, careless binaries become privesc paths.' },
          { id: 'q2', prompt: 'chmod 754 on a file grants which permission set?', choices: ['rwxr-xr--', 'rwxrwxrwx', 'rw-r--r--', 'rwxr--r--'], correctIndex: 0, explanation: '7=rwx (owner), 5=r-x (group), 4=r-- (other) => rwxr-xr--.' },
          { id: 'q3', prompt: 'A root-owned cron job that executes a world-writable script is risky because:', choices: ['Cron jobs cannot be edited', 'An attacker can overwrite the script and have it run as root on the next schedule', 'It slows down the system', 'It only affects non-root users'], correctIndex: 1, explanation: 'Overwriting the writable script content means it executes attacker-controlled code with root\'s privileges next run.' },
        ],
      },
    ],
  },
  {
    id: 'recon',
    slug: 'recon',
    title: 'Reconnaissance & Enumeration',
    subtitle: 'OSINT, nmap, service enumeration, and credential attacks',
    description:
      'The methodology used on every real engagement: passive recon, active scanning, per-service enumeration, and credential attacks — assembled into one repeatable loop.',
    status: 'available',
    sourceBooks: ['The Web Application Hacker\'s Handbook', 'Red Team Field Manual (RTFM)', 'The Hacker Playbook 3'],
    icon: 'radar',
    lessons: [
      { id: 'rec-1', slug: 'passive-recon-osint', title: 'Passive Recon & OSINT Fundamentals', summary: 'WHOIS, certificate transparency, dorking — before you send a single packet.', minutes: 12, Content: PassiveReconOsint },
      { id: 'rec-2', slug: 'active-scanning-nmap', title: 'Active Scanning with Nmap', summary: 'The scan workflow and flags you\'ll use on every engagement.', minutes: 15, Content: ActiveScanningNmap },
      { id: 'rec-3', slug: 'service-enumeration', title: 'Service Enumeration: HTTP, FTP, SSH, SMB', summary: 'Turning open ports into footholds.', minutes: 16, Content: ServiceEnumeration },
      { id: 'rec-4', slug: 'credential-attacks', title: 'Credential Attacks: Wordlists & Brute Forcing', summary: 'rockyou, hydra, spraying, and knowing when to stop.', minutes: 13, Content: CredentialAttacks },
      {
        id: 'rec-5', slug: 'enumeration-methodology', title: 'Putting It Together: The Enumeration Methodology', summary: 'Recon -> foothold -> privesc -> report, as one repeatable loop.', minutes: 10, Content: EnumerationMethodology,
        quiz: [
          { id: 'q1', prompt: 'Why check robots.txt during web enumeration?', choices: ['It always contains the admin password', 'It lists paths admins didn\'t want search engines indexing — often sensitive', 'It is required for HTTPS to work', 'It lists open ports'], correctIndex: 1, explanation: 'robots.txt is a voluntary disclosure of paths considered worth hiding from crawlers — frequently useful recon.' },
          { id: 'q2', prompt: 'Password spraying is preferred over per-account brute force when:', choices: ['You want to trigger account lockouts on purpose', 'You have many usernames and want to avoid lockout thresholds', 'The target has no lockout policy at all', 'You only have one username'], correctIndex: 1, explanation: 'Spraying tries one password across many accounts, staying under per-account lockout thresholds.' },
          { id: 'q3', prompt: 'In the standard methodology, what comes immediately after gaining initial access?', choices: ['Passive recon', 'Privilege escalation', 'WHOIS lookup', 'DNS zone transfer'], correctIndex: 1, explanation: 'After a foothold, the next phase is escalating privileges toward root/SYSTEM.' },
        ],
      },
    ],
  },
  {
    id: 'python',
    slug: 'python',
    title: 'Python & Black Hat Python',
    subtitle: 'Scanners, recon automation, and exploit tooling',
    description:
      'The Python skillset behind almost every custom offensive tool: sockets and scanning, HTTP automation with threading, and writing brute-forcers and exploit PoCs.',
    status: 'available',
    sourceBooks: ['Black Hat Python (2nd Edition)'],
    icon: 'python',
    lessons: [
      { id: 'py-1', slug: 'python-refresher', title: 'Python Fundamentals for Security Work', summary: 'The subset of Python you need fluent to write tools fast.', minutes: 11, Content: PythonRefresher },
      { id: 'py-2', slug: 'port-scanner', title: 'Building a TCP Port Scanner from Scratch', summary: 'Sockets, connect_ex, and multithreading with ThreadPoolExecutor.', minutes: 14, Content: PortScanner },
      { id: 'py-3', slug: 'recon-automation', title: 'Automating Recon with Requests & Threading', summary: 'Directory brute-forcing and HTML parsing at scale.', minutes: 13, Content: ReconAutomation },
      {
        id: 'py-4', slug: 'bruteforcers-exploits', title: 'Writing Brute-Forcers & Simple Exploit PoCs', summary: 'HTTP/SSH brute-forcers and the shape of a real exploit script.', minutes: 13, Content: BruteforcersExploits,
        quiz: [
          { id: 'q1', prompt: 'Why use connect_ex() instead of connect() in a port scanner?', choices: ['It is faster over UDP', 'It returns an error code instead of raising an exception, simplifying loops', 'It bypasses firewalls', 'It only works with IPv6'], correctIndex: 1, explanation: 'connect_ex returns an error code (0 = success) rather than throwing, making scan loops much simpler to write.' },
          { id: 'q2', prompt: 'What does ThreadPoolExecutor primarily solve in a scanner?', choices: ['Memory usage', 'The slowness of sequential, one-port-at-a-time scanning', 'DNS resolution', 'Encryption'], correctIndex: 1, explanation: 'Running many socket checks concurrently turns a minutes-long sequential scan into a few seconds.' },
          { id: 'q3', prompt: 'In a Python HTTP brute-forcer, how do you typically detect a failed login attempt?', choices: ['By checking if the process crashes', 'By checking for a known failure string/pattern in the response', 'By counting response headers', 'It cannot be automated'], correctIndex: 1, explanation: 'Checking for the presence/absence of a known failure string (e.g. "Invalid credentials") is the standard technique.' },
        ],
      },
    ],
  },
  {
    id: 'webapp',
    slug: 'webapp',
    title: 'Web Application Hacking',
    subtitle: 'OWASP Top 10, SQLi, XSS, IDOR, SSRF & business logic',
    description:
      'The classic Web Application Hacker\'s Handbook curriculum, brought current with the OWASP Top 10: injection, XSS/session attacks, access control flaws, and SSRF/XXE — every technique practiced hands-on with curl.',
    status: 'available',
    sourceBooks: ['The Web Application Hacker\'s Handbook', 'PortSwigger Web Security Academy'],
    icon: 'web',
    lessons: [
      { id: 'web-1', slug: 'owasp-top-10', title: 'The OWASP Top 10: A Working Map', summary: 'The category system that structures every web app test.', minutes: 11, Content: OwaspTop10 },
      { id: 'web-2', slug: 'sql-injection', title: 'Injection Deep Dive: SQL Injection', summary: 'Detection, UNION-based extraction, and blind SQLi.', minutes: 15, Content: SqlInjection },
      { id: 'web-3', slug: 'xss-session-attacks', title: 'XSS & Session Attacks', summary: 'Reflected/stored/DOM XSS, cookies, and CSRF.', minutes: 14, Content: XssSessionAttacks },
      { id: 'web-4', slug: 'idor-business-logic', title: 'Authentication, IDOR & Business Logic Flaws', summary: 'The highest effort-to-payout category in bug bounty.', minutes: 13, Content: IdorBusinessLogic },
      {
        id: 'web-5', slug: 'ssrf-xxe-deserialization', title: 'SSRF, XXE & Insecure Deserialization', summary: 'Advanced categories: the server acting on your behalf.', minutes: 13, Content: SsrfXxeDeserialization,
        quiz: [
          { id: 'q1', prompt: 'Which technique confirms SQL injection most reliably?', choices: ['Checking the page loads at all', 'Comparing responses to AND 1=1 vs AND 1=2', 'Checking the HTTP status code is 200', 'Checking cookies are set'], correctIndex: 1, explanation: 'A different response between an always-true and always-false condition strongly confirms the parameter reaches a SQL query.' },
          { id: 'q2', prompt: 'What distinguishes IDOR from injection-based vulnerabilities?', choices: ['IDOR requires a special payload', 'IDOR requires no payload — just changing an ID the server fails to authorize', 'IDOR only affects admins', 'IDOR cannot be tested with curl'], correctIndex: 1, explanation: 'IDOR is purely an authorization failure — no injection or special encoding needed, just a different valid ID.' },
          { id: 'q3', prompt: 'Why is SSRF especially dangerous on cloud-hosted applications?', choices: ['It always crashes the server', 'The server can often reach the cloud metadata endpoint, leaking credentials', 'It only affects on-premise servers', 'It requires physical access'], correctIndex: 1, explanation: 'Cloud metadata endpoints (like 169.254.169.254) can leak IAM credentials when reached via a vulnerable server-side request.' },
        ],
      },
    ],
  },
  {
    id: 'redteam',
    slug: 'redteam',
    title: 'Red Teaming & Active Directory',
    subtitle: 'Internal attacks, lateral movement, and AD privilege escalation',
    description:
      'The Hacker Playbook 3\'s core territory: red team methodology and OPSEC, internal network attacks, Active Directory enumeration, and Kerberos-based privilege escalation to Domain Admin.',
    status: 'available',
    sourceBooks: ['The Hacker Playbook 3'],
    icon: 'shield',
    lessons: [
      { id: 'rt-1', slug: 'redteam-vs-pentest', title: 'Red Team vs. Pentest: Methodology & OPSEC', summary: 'Objective-driven engagements and operational security discipline.', minutes: 11, Content: RedteamVsPentest },
      { id: 'rt-2', slug: 'internal-network-attacks', title: 'Internal Network Attacks & Lateral Movement', summary: 'Credential reuse, pass-the-hash, and pivoting.', minutes: 13, Content: InternalNetworkAttacks },
      { id: 'rt-3', slug: 'active-directory-fundamentals', title: 'Active Directory Fundamentals & Enumeration', summary: 'Domains, OUs, groups, and BloodHound attack-path mapping.', minutes: 14, Content: ActiveDirectoryFundamentals },
      {
        id: 'rt-4', slug: 'kerberos-ad-privesc', title: 'Kerberos Attacks & AD Privilege Escalation', summary: 'Kerberoasting, AS-REP Roasting, and the path to Domain Admin.', minutes: 14, Content: KerberosAdPrivesc,
        quiz: [
          { id: 'q1', prompt: 'What makes Kerberoasting attractive to attackers?', choices: ['It requires Domain Admin rights already', 'Any authenticated domain user can request the ticket, with no elevated privileges needed', 'It only works over Telnet', 'It requires physical access to the DC'], correctIndex: 1, explanation: 'Any domain user can request service tickets for SPN accounts — no special privileges required to begin the attack.' },
          { id: 'q2', prompt: 'What is the primary difference between a pentest and a red team engagement?', choices: ['Red team engagements are always shorter', 'Red team focuses on a specific objective and evading detection; pentest focuses on finding all vulnerabilities', 'Pentests are illegal, red teaming is not', 'There is no real difference'], correctIndex: 1, explanation: 'Pentests aim for breadth of findings; red team engagements aim for a specific objective while testing detection/response.' },
          { id: 'q3', prompt: 'Why does compromising the KRBTGT account matter so much?', choices: ['It has no special significance', 'It lets an attacker forge valid-looking Kerberos tickets for any user (a Golden Ticket)', 'It only affects printer access', 'It is used exclusively for DNS'], correctIndex: 1, explanation: 'KRBTGT encrypts all Kerberos tickets domain-wide — compromising it enables forging tickets for any account.' },
        ],
      },
    ],
  },
  {
    id: 'bugbounty',
    slug: 'bugbounty',
    title: 'Bug Bounty Methodology',
    subtitle: 'Recon at scale, report writing, and where the payouts are',
    description:
      'The mindset and workflow from Real-World Bug Hunting and Bug Bounty Bootcamp: how programs work, recon automation at scale, writing reports that get triaged fast, and a prioritized 6-month roadmap.',
    status: 'available',
    sourceBooks: ['Real-World Bug Hunting', 'Bug Bounty Bootcamp'],
    icon: 'bounty',
    lessons: [
      { id: 'bb-1', slug: 'how-bug-bounty-works', title: 'How Bug Bounty Hunting Actually Works', summary: 'Platforms, public vs. private programs, and researcher economics.', minutes: 10, Content: HowBugBountyWorks },
      { id: 'bb-2', slug: 'recon-at-scale', title: 'Recon at Scale: Subdomains, Assets & Automation', summary: 'Subdomain enumeration, JS analysis, and prioritizing targets.', minutes: 13, Content: ReconAtScale },
      { id: 'bb-3', slug: 'writing-reports', title: 'Reading & Writing High-Quality Reports', summary: 'The report structure that gets fast, well-paid triage.', minutes: 12, Content: WritingReports },
      {
        id: 'bb-4', slug: 'skills-and-roadmap', title: 'Prioritization: Where the Real Bounties Are', summary: 'A ranked skill list and a realistic 6-month plan.', minutes: 10, Content: SkillsAndRoadmap,
        quiz: [
          { id: 'q1', prompt: 'Why do forgotten/staging subdomains tend to be more valuable targets?', choices: ['They pay less so there\'s no competition', 'They\'re tested less by other hunters and often less hardened', 'They are always out of scope', 'They never contain vulnerabilities'], correctIndex: 1, explanation: 'High-traffic main domains are tested constantly; forgotten subdomains are under-tested and often misconfigured.' },
          { id: 'q2', prompt: 'What is the most important section of a bug bounty report?', choices: ['The title', 'Steps to reproduce, written for someone with zero context', 'The researcher\'s bio', 'The submission timestamp'], correctIndex: 1, explanation: 'Clear reproduction steps are what let a triager confirm the issue quickly without back-and-forth questions.' },
          { id: 'q3', prompt: 'According to the suggested 6-month roadmap, when should you start submitting live reports?', choices: ['Day one', 'Only after building fundamentals — around month 6', 'Never, only practice on labs', 'Immediately after reading the OWASP Top 10'], correctIndex: 1, explanation: 'The roadmap front-loads fundamentals and guided practice, only moving to live submissions once that foundation is solid.' },
        ],
      },
    ],
  },
  {
    id: 'soc',
    slug: 'soc',
    title: 'SOC Fundamentals & Threat Hunting',
    subtitle: 'Alert triage, log correlation, proactive threat hunting, and ATT&CK coverage mapping',
    description:
      'The defensive counterpart to everything else in this course: how a Security Operations Center triages alerts, correlates logs into a timeline, proactively hunts for compromise that never triggered a rule, and systematically maps detection coverage against MITRE ATT&CK.',
    status: 'available',
    sourceBooks: ['Blue Team Handbook', 'The Practice of Network Security Monitoring'],
    icon: 'soc',
    lessons: [
      { id: 'soc-1', slug: 'soc-fundamentals', title: 'SOC Fundamentals: Alerts, Triage & the Analyst Workflow', summary: 'The alert lifecycle from telemetry to documented incident.', minutes: 12, Content: SocFundamentals },
      {
        id: 'soc-2', slug: 'threat-hunting-detection', title: 'Threat Hunting: Proactive Detection Beyond Alerts', summary: 'Hunting hypotheses, IOC sweeping, and closing the loop with new detections.', minutes: 13, Content: ThreatHuntingDetection,
        quiz: [
          { id: 'q1', prompt: 'What distinguishes threat hunting from standard alert-driven SOC work?', choices: ['Hunting only happens after a breach is confirmed', 'Hunting proactively searches for compromise that never triggered any alert', 'Hunting requires no log access', 'There is no real difference'], correctIndex: 1, explanation: 'Threat hunting works from a hypothesis, searching data that alerts never flagged, rather than waiting for a rule to fire.' },
          { id: 'q2', prompt: 'Why is a raw IP address (instead of a domain) in a C2 beacon URL a notable indicator?', choices: ['IPs are always malicious', 'Attackers often skip DNS specifically to avoid domain-based blocklists', 'It means the traffic is encrypted', 'It has no significance'], correctIndex: 1, explanation: 'Using a raw IP avoids domain reputation/blocklist checks that many defenses rely on.' },
        ],
      },
      {
        id: 'soc-3', slug: 'attack-coverage-mapping', title: 'MITRE ATT&CK Coverage Mapping in Practice', summary: 'Turning ATT&CK from an alert-labeling vocabulary into a systematic detection-coverage audit.', minutes: 12, Content: AttackCoverageMapping,
        quiz: [
          { id: 'q1', prompt: 'What is the main purpose of an ATT&CK coverage map?', choices: ['To label individual alerts with a technique ID', 'To identify which attack stages currently have no working detection at all', 'To replace correlation rules entirely', 'To score individual employees on security awareness'], correctIndex: 1, explanation: 'A coverage map surfaces systemic detection gaps across the full attack lifecycle, not just labels for single alerts.' },
        ],
      },
    ],
  },
  {
    id: 'soc-siem',
    slug: 'soc-siem-platforms',
    title: 'SIEM Platforms & Log Management',
    subtitle: 'Log collection, normalization, correlation rules, and real SIEM platforms compared',
    description:
      'How a SIEM actually works under the hood — collecting and normalizing logs from every source into one schema, writing and tuning the correlation rules that turn raw events into alerts, and how Splunk, Microsoft Sentinel, IBM QRadar, Elastic Security, and Chronicle each implement these same fundamentals.',
    status: 'available',
    sourceBooks: ['Blue Team Handbook', 'The Practice of Network Security Monitoring'],
    icon: 'soc',
    lessons: [
      { id: 'soc-siem-1', slug: 'what-is-a-siem', title: 'What Is a SIEM? Log Collection, Normalization & Centralization', summary: 'The three foundational SIEM capabilities everything else in this module builds on.', minutes: 11, Content: WhatIsASiem },
      { id: 'soc-siem-2', slug: 'correlation-rules', title: 'Correlation Rules: From Raw Events to Actionable Alerts', summary: 'Writing threshold and multi-stage rules, then tuning them against real false positives.', minutes: 13, Content: CorrelationRules },
      {
        id: 'soc-siem-3', slug: 'real-siem-platforms-compared', title: 'Real SIEM Platforms Compared: Splunk, Sentinel, QRadar, Elastic & Chronicle', summary: 'The query languages and interface conventions of five widely-deployed SIEM platforms.', minutes: 14, Content: RealSiemPlatformsCompared,
        quiz: [
          { id: 'q1', prompt: 'What does IBM QRadar call a correlated finding, scored by a Magnitude value?', choices: ['An Incident', 'An Offense', 'A Case', 'A Ticket'], correctIndex: 1, explanation: 'QRadar organizes correlated findings as Offenses, each carrying a Magnitude score for at-a-glance prioritization.' },
        ],
      },
    ],
  },
  {
    id: 'soc-detection',
    slug: 'soc-detection-engineering',
    title: 'Detection Engineering & UEBA',
    subtitle: 'Writing and tuning detection rules, behavioral baselining, and threat intelligence integration',
    description:
      'Three complementary approaches to generating real findings: hand-written rules mapped to specific ATT&CK techniques, User & Entity Behavior Analytics that catches deviation from a learned baseline with no rule required, and external threat intelligence feeds that flag infrastructure someone else already confirmed is malicious.',
    status: 'available',
    sourceBooks: ['Blue Team Handbook', 'The Practice of Network Security Monitoring'],
    icon: 'soc',
    lessons: [
      { id: 'soc-detection-1', slug: 'writing-tuning-detection-rules', title: 'Writing and Tuning Detection Rules', summary: 'The detection lifecycle from hypothesis through backtesting to production tuning.', minutes: 13, Content: WritingTuningDetectionRules },
      { id: 'soc-detection-2', slug: 'ueba', title: 'User & Entity Behavior Analytics (UEBA)', summary: 'Baselining normal behavior to catch novel attacker activity no rule was ever written for.', minutes: 12, Content: Ueba },
      {
        id: 'soc-detection-3', slug: 'threat-intel-integration', title: 'Threat Intelligence Integration & IOC Matching', summary: 'Consuming external IOC feeds (IPs, domains, hashes) and matching them against your own environment.', minutes: 12, Content: ThreatIntelIntegration,
        quiz: [
          { id: 'q1', prompt: 'Why can UEBA catch attacker behavior that a written detection rule misses?', choices: ['UEBA only works on cloud platforms', 'UEBA flags deviation from a learned baseline, requiring no pre-written rule for a specific technique', 'UEBA replaces the need for any log collection', 'UEBA only analyzes network traffic'], correctIndex: 1, explanation: 'UEBA learns what normal looks like for a specific user/entity and flags deviation directly, catching genuinely novel behavior no rule was written for.' },
        ],
      },
    ],
  },
  {
    id: 'soc-ir',
    slug: 'soc-incident-response',
    title: 'Incident Response, SOAR & Compliance',
    subtitle: 'Investigation methodology, automated response playbooks, and compliance reporting',
    description:
      'What happens after a detection is confirmed real: building a timeline and scoping the true blast radius, automating response with SOAR playbooks so containment happens in seconds instead of waiting on a human, and generating the compliance reports PCI-DSS, HIPAA, and SOC 2 all require.',
    status: 'available',
    sourceBooks: ['Blue Team Handbook', 'The Practice of Network Security Monitoring'],
    icon: 'soc',
    lessons: [
      { id: 'soc-ir-1', slug: 'incident-investigation-methodology', title: 'Incident Investigation Methodology', summary: 'Building a timeline, scoping the full blast radius, and root-cause analysis.', minutes: 13, Content: IncidentInvestigationMethodology },
      { id: 'soc-ir-2', slug: 'soar-automation', title: 'SOAR: Security Orchestration, Automation & Response', summary: 'Automated playbooks that respond in seconds instead of the ~22-minute manual average.', minutes: 12, Content: SoarAutomation },
      {
        id: 'soc-ir-3', slug: 'compliance-reporting', title: 'Compliance Reporting (PCI-DSS, HIPAA, SOC 2, ISO 27001)', summary: 'Generating audit-ready evidence that log review is actually happening, not just theoretically enabled.', minutes: 11, Content: ComplianceReporting,
        quiz: [
          { id: 'q1', prompt: 'What does PCI-DSS Requirement 10.6 specifically mandate?', choices: ['Annual password changes', 'Daily log review for systems in the cardholder data environment', 'Encryption of all data at rest', 'A minimum SOC team size'], correctIndex: 1, explanation: 'Requirement 10.6 mandates daily review of logs for systems handling cardholder data, with evidence retained for audit.' },
        ],
      },
    ],
  },
  {
    id: 'forensics',
    slug: 'forensics',
    title: 'Digital Forensics',
    subtitle: 'Timeline analysis, memory artifacts, and evidence recovery',
    description:
      'Reconstructing what happened on a compromised system after the fact: filesystem timeline analysis, memory strings analysis for C2 indicators, and recovering deleted-file artifacts — the DFIR skillset.',
    status: 'available',
    sourceBooks: ['The Art of Memory Forensics', 'Practical Malware Analysis'],
    icon: 'forensics',
    lessons: [
      { id: 'for-1', slug: 'forensics-fundamentals', title: 'Digital Forensics Fundamentals', summary: 'Chain of custody, the three artifact categories, and timeline analysis.', minutes: 12, Content: ForensicsFundamentals },
      {
        id: 'for-2', slug: 'memory-artifact-analysis', title: 'Memory & Artifact Analysis', summary: 'Strings extraction, C2 beacon indicators, and deleted-file recovery.', minutes: 13, Content: MemoryArtifactAnalysis,
        quiz: [
          { id: 'q1', prompt: 'Why should a forensic examiner always work from a copy, never the original evidence?', choices: ['Copies are faster to analyze', 'Analysis can inadvertently modify timestamps/data, contaminating the original evidence', 'Originals cannot be hashed', 'There is no real reason'], correctIndex: 1, explanation: 'Preserving the untouched original (verified by hash) is essential so findings remain defensible and reproducible.' },
          { id: 'q2', prompt: 'When a file is deleted on most filesystems, what actually happens?', choices: ['The data is immediately and permanently erased', 'Only the directory pointer is removed; the data often remains until overwritten', 'The file is encrypted automatically', 'Nothing — deletion is purely cosmetic'], correctIndex: 1, explanation: 'This is exactly why deleted-file recovery from trash metadata or unallocated space is often possible.' },
        ],
      },
    ],
  },
  {
    id: 'cloud',
    slug: 'cloud',
    title: 'Cloud Security',
    subtitle: 'S3 misconfigurations, IAM, and metadata-service SSRF',
    description:
      'The misconfiguration patterns responsible for most real-world cloud breaches: public object storage, overly permissive IAM, and SSRF-to-instance-metadata credential theft.',
    status: 'available',
    sourceBooks: ['Cloud security fundamentals (AWS/Azure/GCP shared responsibility model)'],
    icon: 'cloud',
    lessons: [
      { id: 'cloud-1', slug: 'cloud-security-fundamentals', title: 'Cloud Security Fundamentals', summary: 'Shared responsibility, public buckets, and the instance metadata service.', minutes: 12, Content: CloudSecurityFundamentals },
      {
        id: 'cloud-2', slug: 'iam-and-misconfiguration', title: 'IAM & Common Cloud Misconfigurations', summary: 'Least privilege, instance roles, and the cloud misconfiguration checklist.', minutes: 12, Content: IamAndMisconfiguration,
        quiz: [
          { id: 'q1', prompt: 'Under the shared responsibility model, who is responsible for IAM configuration?', choices: ['The cloud provider, always', 'The customer', 'Neither party', 'It varies with no clear standard'], correctIndex: 1, explanation: 'IAM configuration is squarely "security IN the cloud" — the customer\'s responsibility.' },
          { id: 'q2', prompt: 'Why is an SSRF vulnerability especially dangerous on a cloud-hosted app with an attached instance role?', choices: ['It never matters', 'The vulnerable server can be tricked into requesting the metadata endpoint, leaking that role\'s credentials', 'SSRF cannot reach internal endpoints', 'Instance roles prevent all SSRF impact'], correctIndex: 1, explanation: 'SSRF-to-metadata is one of the highest-impact real-world cloud attack chains.' },
        ],
      },
    ],
  },
  {
    id: 'securityplus',
    slug: 'securityplus',
    title: 'Security+ Deep Dive',
    subtitle: 'Governance, risk, cryptography, IAM, architecture & incident response',
    description:
      'The CompTIA Security+ domain knowledge sitting above every technical module in this course: risk math, cryptographic foundations, IAM models, resilient architecture, and the formal incident response process.',
    status: 'available',
    sourceBooks: ['CompTIA Security+ Get Certified Get Ahead'],
    icon: 'lock',
    lessons: [
      { id: 'secplus-1', slug: 'grc-fundamentals', title: 'Governance, Risk & Compliance Fundamentals', summary: 'Policy hierarchy, risk math (SLE/ARO/ALE), and the major compliance frameworks.', minutes: 13, Content: GrcFundamentals },
      { id: 'secplus-2', slug: 'cryptography-fundamentals', title: 'Cryptography Fundamentals', summary: 'Symmetric vs. asymmetric, hashing, PKI, and common cryptographic attacks.', minutes: 13, Content: CryptographyFundamentals },
      { id: 'secplus-3', slug: 'iam-deep-dive', title: 'Identity & Access Management Deep Dive', summary: 'MFA factors, DAC/MAC/RBAC/ABAC, federation protocols, and PAM.', minutes: 13, Content: IamDeepDive },
      { id: 'secplus-4', slug: 'security-architecture', title: 'Security Architecture & Resilience', summary: 'Defense in depth, zero trust, HA/redundancy, and backup strategy.', minutes: 12, Content: SecurityArchitecture },
      {
        id: 'secplus-5', slug: 'incident-response-bcdr', title: 'Incident Response & Business Continuity', summary: 'The six-phase IR lifecycle, evidence handling, and BCP/DRP.', minutes: 13, Content: IncidentResponseBcdr,
        quiz: [
          { id: 'q1', prompt: 'ALE (Annualized Loss Expectancy) is calculated as:', choices: ['Asset Value x Exposure Factor', 'SLE x ARO', 'RTO x RPO', 'Asset Value / ARO'], correctIndex: 1, explanation: 'ALE = Single Loss Expectancy x Annualized Rate of Occurrence.' },
          { id: 'q2', prompt: 'Which access control model ties permissions to a job role rather than an individual?', choices: ['DAC', 'MAC', 'RBAC', 'ABAC'], correctIndex: 2, explanation: 'RBAC (Role-Based Access Control) assigns access based on job role.' },
          { id: 'q3', prompt: 'In the order of volatility, which should be collected FIRST?', choices: ['Disk', 'Archival backups', 'RAM/running processes', 'Physical topology documentation'], correctIndex: 2, explanation: 'RAM contents are far more volatile (lost on power-off) than disk or backups.' },
        ],
      },
    ],
  },
  {
    id: 'binaryanalysis',
    slug: 'binaryanalysis',
    title: 'Binary Analysis & Reverse Engineering',
    subtitle: 'Static/dynamic analysis, assembly, GDB, and exploit development',
    description:
      'From "what is this file" to a working understanding of the exploit development process: binary formats, x86 assembly and the stack, debugging with GDB, buffer overflow mechanics, and a minimal exploit skeleton.',
    status: 'available',
    sourceBooks: ['Practical Binary Analysis', 'Hacking: The Art of Exploitation'],
    icon: 'binary',
    lessons: [
      { id: 'bin-1', slug: 'binary-formats-static-analysis', title: 'Binary Formats & Static Analysis Fundamentals', summary: 'ELF/PE structure, file/strings/objdump, and entropy analysis.', minutes: 12, Content: BinaryFormatsStaticAnalysis },
      { id: 'bin-2', slug: 'assembly-stack-crash-course', title: 'x86 Assembly & the Stack: A Crash Course', summary: 'Registers, stack frames, and reading disassembly patterns.', minutes: 14, Content: AssemblyStackCrashCourse },
      { id: 'bin-3', slug: 'debugging-with-gdb', title: 'Dynamic Analysis: Debugging with GDB', summary: 'Breakpoints, watchpoints, and live memory inspection.', minutes: 13, Content: DebuggingWithGdb },
      { id: 'bin-4', slug: 'buffer-overflow-fundamentals', title: 'Buffer Overflow Fundamentals', summary: 'The classic stack-smashing vulnerability, and the mitigations built against it.', minutes: 14, Content: BufferOverflowFundamentals },
      {
        id: 'bin-5', slug: 'intro-exploit-development', title: 'Introduction to Exploit Development', summary: 'The full workflow, shellcode, bad characters, and a minimal Python exploit.', minutes: 13, Content: IntroExploitDevelopment,
        quiz: [
          { id: 'q1', prompt: 'What does the "file" command tell you about an unknown binary?', choices: ['Nothing useful', 'Format, architecture, and linking type — without ever executing it', 'Only the file size', 'The exact vulnerability present'], correctIndex: 1, explanation: 'file identifies format/architecture/linking safely via static inspection.' },
          { id: 'q2', prompt: 'A stack canary defends against buffer overflows by:', choices: ['Encrypting the stack', 'Placing a random value before the return address that is checked before returning', 'Making the stack executable', 'Randomizing memory addresses'], correctIndex: 1, explanation: 'If an overflow corrupts the canary, the mismatch is detected before the corrupted return address is used.' },
          { id: 'q3', prompt: 'Why does a NOP sled improve exploit reliability?', choices: ['It encrypts the payload', 'Execution landing anywhere in the sled slides forward into the real shellcode', 'It disables ASLR', 'It is required by the CPU'], correctIndex: 1, explanation: 'A NOP sled forgives small addressing inaccuracy by letting execution "slide" into the payload.' },
        ],
      },
    ],
  },
  {
    id: 'malware',
    slug: 'malware',
    title: 'Practical Malware Analysis',
    subtitle: 'Static/dynamic malware triage, persistence, C2, and evasion',
    description:
      'The malware analyst workflow: static triage and import-table analysis, safe dynamic detonation in a sandbox, persistence mechanism hunting, C2 traffic analysis, and the anti-analysis techniques built against all of it.',
    status: 'available',
    sourceBooks: ['Practical Malware Analysis'],
    icon: 'bug',
    lessons: [
      { id: 'mal-1', slug: 'static-malware-analysis', title: 'Static Malware Analysis Fundamentals', summary: 'Triage order, PE header red flags, entropy, imports, and YARA rules.', minutes: 13, Content: StaticMalwareAnalysis },
      { id: 'mal-2', slug: 'dynamic-analysis-sandboxing', title: 'Dynamic Analysis & Sandboxing', summary: 'Safe detonation, process/file/registry/network monitoring, decoding PowerShell.', minutes: 13, Content: DynamicAnalysisSandboxing },
      { id: 'mal-3', slug: 'persistence-mechanisms', title: 'Persistence Mechanisms', summary: 'Windows and Linux persistence, the investigator\'s systematic checklist.', minutes: 12, Content: PersistenceMechanisms },
      { id: 'mal-4', slug: 'network-indicators-c2', title: 'Network Indicators & C2 Communication Analysis', summary: 'C2 architectures, reading beacons, encoding layers, and IOC extraction.', minutes: 13, Content: NetworkIndicatorsC2 },
      {
        id: 'mal-5', slug: 'anti-analysis-evasion', title: 'Anti-Analysis & Evasion Techniques', summary: 'Packing, anti-debugging, anti-VM checks, and string encryption.', minutes: 13, Content: AntiAnalysisEvasion,
        quiz: [
          { id: 'q1', prompt: 'Seeing WriteProcessMemory + CreateRemoteThread in a sample\'s imports suggests:', choices: ['It is a text editor', 'Process injection capability', 'It only reads files', 'It is definitely benign'], correctIndex: 1, explanation: 'That specific API combination is a hallmark of process injection.' },
          { id: 'q2', prompt: 'Why do malware sandboxes try to look "lived-in" (fake documents, browser history)?', choices: ['For fun', 'To defeat anti-sandbox checks that look for signs of a real user', 'To speed up analysis', 'It is required by law'], correctIndex: 1, explanation: 'Malware often checks for realistic user activity before revealing its real behavior — sandboxes fake this to defeat the check.' },
          { id: 'q3', prompt: 'A registry Run key and a disguised Scheduled Task both serve what purpose?', choices: ['Encryption', 'Persistence across reboots', 'Network communication', 'Process injection'], correctIndex: 1, explanation: 'Both are classic Windows persistence mechanisms ensuring code runs again after a restart.' },
        ],
      },
    ],
  },
  {
    id: 'secengineering',
    slug: 'secengineering',
    title: 'Security Engineering',
    subtitle: 'Economics, design principles, threat modeling & why systems fail',
    description:
      'A systems-level view tying the entire course together: why misaligned incentives cause insecure systems, the design principles that hold up under real-world pressure, structured threat modeling, cryptographic engineering pitfalls, and the recurring root-cause patterns behind real breaches.',
    status: 'available',
    sourceBooks: ['Security Engineering — Ross Anderson'],
    icon: 'engineering',
    lessons: [
      { id: 'se-1', slug: 'security-economics', title: 'Security Economics: Why Systems Actually Fail', summary: 'Misaligned incentives, the lemons market problem, and externalities.', minutes: 12, Content: SecurityEconomics },
      { id: 'se-2', slug: 'secure-design-principles', title: 'Secure Design Principles', summary: 'Least privilege, fail-secure vs. fail-open, complete mediation, secure defaults.', minutes: 13, Content: SecureDesignPrinciples },
      { id: 'se-3', slug: 'threat-modeling', title: 'Threat Modeling', summary: 'STRIDE, data flow diagrams, DREAD scoring, and attack trees.', minutes: 13, Content: ThreatModeling },
      { id: 'se-4', slug: 'cryptographic-engineering-pitfalls', title: 'Cryptographic Engineering Pitfalls', summary: 'Key management, IV/nonce reuse, padding oracles, and side channels.', minutes: 13, Content: CryptographicEngineeringPitfalls },
      {
        id: 'se-5', slug: 'why-systems-fail-case-studies', title: 'Why Security Systems Actually Fail: Recurring Patterns', summary: 'The five patterns synthesizing this entire course\'s incidents and labs.', minutes: 12, Content: WhySystemsFailCaseStudies,
        quiz: [
          { id: 'q1', prompt: 'STRIDE\'s "Repudiation" category is primarily addressed by:', choices: ['Encryption', 'Audit logging that can prove who did what', 'Firewalls', 'Least privilege'], correctIndex: 1, explanation: 'Repudiation is about the inability to prove an action occurred — audit logs are the direct countermeasure.' },
          { id: 'q2', prompt: 'Why is nonce reuse catastrophic in AES-GCM specifically?', choices: ['It slows down encryption', 'It can let an attacker recover plaintext XOR and forge the authentication tag', 'It only affects RSA', 'It has no real impact'], correctIndex: 1, explanation: 'AES-GCM security depends entirely on never reusing a nonce with the same key.' },
          { id: 'q3', prompt: 'According to security economics, insecure systems are usually shipped because:', choices: ['Engineers do not understand security', 'Whoever controls the ship decision often does not bear the cost of a failure', 'Security is impossible to achieve', 'Regulations forbid secure design'], correctIndex: 1, explanation: 'Misaligned incentives — not lack of care — is the recurring root cause security economics studies.' },
        ],
      },
    ],
  },
  {
    id: 'code-python-fundamentals',
    slug: 'code-python-fundamentals',
    title: 'Code Portal: Python Fundamentals',
    subtitle: 'Syntax, data structures, functions, errors, and text processing — from zero',
    description:
      'The Code Portal\'s general-purpose programming track, starting from scratch: variables and core data ' +
      'structures, functions and defensive error handling, and the string/regex processing every security ' +
      'script eventually needs. Every lesson links straight into runnable practice tasks in the Code Portal.',
    status: 'available',
    sourceBooks: ['Python Crash Course'],
    icon: 'code',
    lessons: [
      { id: 'cpy-1', slug: 'syntax-and-data-structures', title: 'Python Syntax & Data Structures, From Zero', summary: 'Variables, lists, dicts, sets, and control flow.', minutes: 14, Content: SyntaxAndDataStructures },
      { id: 'cpy-2', slug: 'functions-and-error-handling', title: 'Functions, Exceptions & Defensive Scripting', summary: 'Writing functions and handling bad input without crashing.', minutes: 12, Content: FunctionsAndErrorHandling },
      { id: 'cpy-3', slug: 'strings-and-text-processing', title: 'Strings, Text Processing & the re Module', summary: 'String methods, slicing, and regular expressions.', minutes: 13, Content: StringsAndTextProcessing },
    ],
  },
  {
    id: 'code-python-oop',
    slug: 'code-python-oop',
    title: 'Code Portal: Python OOP',
    subtitle: 'Classes, inheritance, polymorphism, dunder methods, and dataclasses',
    description:
      'Object-oriented Python from first principles through the advanced features real security tooling ' +
      'actually uses: encapsulation, inheritance vs. composition, polymorphism, dunder methods, abstract base ' +
      'classes, and dataclasses.',
    status: 'available',
    sourceBooks: ['Fluent Python'],
    icon: 'code',
    lessons: [
      { id: 'cpy-4', slug: 'oop-basics', title: 'OOP Basics: Classes, Objects & Encapsulation', summary: 'Your first classes, and controlling access to internal state.', minutes: 13, Content: OopBasics },
      { id: 'cpy-5', slug: 'inheritance-and-polymorphism', title: 'Inheritance, Polymorphism & Composition', summary: 'Sharing behavior across classes, and when not to.', minutes: 13, Content: InheritanceAndPolymorphism },
      { id: 'cpy-6', slug: 'advanced-oop', title: 'Advanced OOP: Dunder Methods, Dataclasses & Abstract Classes', summary: 'Making your classes behave like real Python objects.', minutes: 14, Content: AdvancedOop },
    ],
  },
  {
    id: 'code-python-advanced',
    slug: 'code-python-advanced',
    title: 'Code Portal: Advanced Python',
    subtitle: 'Decorators, generators, context managers, regex, and concurrency',
    description:
      'The features that separate working Python from genuinely efficient, expressive Python: closures and ' +
      'decorators, generators and iterators, custom context managers, advanced regex, asyncio concurrency, ' +
      'and caching.',
    status: 'available',
    sourceBooks: ['Fluent Python'],
    icon: 'code',
    lessons: [
      { id: 'cpy-7', slug: 'decorators-and-closures', title: 'Closures & Decorators', summary: 'Wrapping functions with extra behavior, cleanly.', minutes: 14, Content: DecoratorsAndClosures },
      { id: 'cpy-8', slug: 'generators-and-context-managers', title: 'Generators, Iterators & Context Managers', summary: 'Lazy evaluation and guaranteed cleanup.', minutes: 13, Content: GeneratorsAndContextManagers },
      { id: 'cpy-9', slug: 'regex-concurrency-and-caching', title: 'Advanced Regex, Concurrency & Caching', summary: 'Lookaheads, asyncio.gather, and lru_cache.', minutes: 14, Content: RegexConcurrencyAndCaching },
    ],
  },
];

export const ROADMAP: RoadmapStage[] = [
  { title: 'Networking Fundamentals', status: 'available', moduleSlug: 'networking', sourceBooks: ['Cybersecurity Essentials', 'Security+ Get Certified Get Ahead'], track: 'security' },
  { title: 'Linux Basics for Hackers', status: 'available', moduleSlug: 'linux', sourceBooks: ['Linux Basics for Hackers'], track: 'security' },
  { title: 'Reconnaissance & Enumeration', status: 'available', moduleSlug: 'recon', sourceBooks: ['RTFM', 'The Hacker Playbook 3'], track: 'security' },
  { title: 'Python & Black Hat Python', status: 'available', moduleSlug: 'python', sourceBooks: ['Black Hat Python'], track: 'security' },
  { title: 'Web Application Hacking', status: 'available', moduleSlug: 'webapp', sourceBooks: ['The Web Application Hacker\'s Handbook', 'PortSwigger Web Security Academy'], track: 'security' },
  { title: 'Red Teaming & Active Directory', status: 'available', moduleSlug: 'redteam', sourceBooks: ['The Hacker Playbook 3'], track: 'security' },
  { title: 'Bug Bounty Methodology', status: 'available', moduleSlug: 'bugbounty', sourceBooks: ['Real-World Bug Hunting', 'Bug Bounty Bootcamp'], track: 'security' },
  { title: 'SOC Fundamentals & Threat Hunting', status: 'available', moduleSlug: 'soc', sourceBooks: ['Blue Team Handbook', 'The Practice of Network Security Monitoring'], track: 'security' },
  { title: 'SIEM Platforms & Log Management', status: 'available', moduleSlug: 'soc-siem-platforms', sourceBooks: ['Blue Team Handbook', 'The Practice of Network Security Monitoring'], track: 'security' },
  { title: 'Detection Engineering & UEBA', status: 'available', moduleSlug: 'soc-detection-engineering', sourceBooks: ['Blue Team Handbook', 'The Practice of Network Security Monitoring'], track: 'security' },
  { title: 'Incident Response, SOAR & Compliance', status: 'available', moduleSlug: 'soc-incident-response', sourceBooks: ['Blue Team Handbook', 'The Practice of Network Security Monitoring'], track: 'security' },
  { title: 'Digital Forensics', status: 'available', moduleSlug: 'forensics', sourceBooks: ['The Art of Memory Forensics', 'Practical Malware Analysis'], track: 'security' },
  { title: 'Cloud Security', status: 'available', moduleSlug: 'cloud', sourceBooks: ['Cloud security fundamentals'], track: 'security' },
  { title: 'Security+ Deep Dive', status: 'available', moduleSlug: 'securityplus', sourceBooks: ['CompTIA Security+ Get Certified Get Ahead'], track: 'security' },
  { title: 'Binary Analysis & Reverse Engineering', status: 'available', moduleSlug: 'binaryanalysis', sourceBooks: ['Practical Binary Analysis', 'Hacking: The Art of Exploitation'], track: 'security' },
  { title: 'Practical Malware Analysis', status: 'available', moduleSlug: 'malware', sourceBooks: ['Practical Malware Analysis'], track: 'security' },
  { title: 'Security Engineering', status: 'available', moduleSlug: 'secengineering', sourceBooks: ['Security Engineering — Ross Anderson'], track: 'security' },
  { title: 'Guided Hands-On Labs (142 labs)', status: 'available', href: '/labs', sourceBooks: ['Applied practice across every module above'], track: 'security' },

  { title: 'Code Portal: Python Fundamentals', status: 'available', moduleSlug: 'code-python-fundamentals', sourceBooks: ['Python Crash Course'], track: 'programming' },
  { title: 'Code Portal: Python OOP', status: 'available', moduleSlug: 'code-python-oop', sourceBooks: ['Fluent Python'], track: 'programming' },
  { title: 'Code Portal: Advanced Python', status: 'available', moduleSlug: 'code-python-advanced', sourceBooks: ['Fluent Python'], track: 'programming' },
  { title: 'Code Portal: C++ & JavaScript Practice', status: 'available', href: '/code-portal', sourceBooks: ['Code Portal practice tasks'], track: 'programming' },

  { title: 'Foundations: Python, NumPy, Pandas & Math', status: 'available', href: '/ml-lesson/python-basics', sourceBooks: ['GCI World Pre-Lecture & Sessions 2-4'], track: 'ml' },
  { title: 'Data Handling & Feature Engineering', status: 'available', href: '/ml-lesson/missing-data', sourceBooks: ['GCI World Session 8'], track: 'ml' },
  { title: 'Regression', status: 'available', href: '/ml-lesson/supervised-learning', sourceBooks: ['GCI World Session 5'], track: 'ml' },
  { title: 'Classification', status: 'available', href: '/ml-lesson/knn', sourceBooks: ['GCI World Session 5 & 8'], track: 'ml' },
  { title: 'Model Evaluation', status: 'available', href: '/ml-lesson/model-evaluation', sourceBooks: ['GCI World Session 6'], track: 'ml' },
  { title: 'Unsupervised Learning', status: 'available', href: '/ml-lesson/unsupervised-learning', sourceBooks: ['GCI World Session 11'], track: 'ml' },
  { title: 'Neural Networks & Deep Learning', status: 'available', href: '/ml-lesson/perceptron', sourceBooks: ['Extension curriculum'], track: 'ml' },
  { title: 'Natural Language Processing', status: 'available', href: '/ml-lesson/text-preprocessing', sourceBooks: ['Extension curriculum'], track: 'ml' },
  { title: 'Time Series', status: 'available', href: '/ml-lesson/time-series', sourceBooks: ['GCI World Session 12'], track: 'ml' },
  { title: 'Data Engineering & MLOps', status: 'available', href: '/ml-lesson/sql-databases', sourceBooks: ['GCI World Session 10 & extension'], track: 'ml' },
];

export function findModule(slug?: string) {
  return MODULES.find((m) => m.slug === slug);
}

export function findLesson(moduleSlug?: string, lessonSlug?: string) {
  const mod = findModule(moduleSlug);
  if (!mod) return undefined;
  const lesson = mod.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return undefined;
  return { module: mod, lesson };
}
