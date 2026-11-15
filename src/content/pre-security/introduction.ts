import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

/** Introduction to Cybersecurity — opening module of the pre-security path.
 *
 *  Four lessons take learners from "what is this field?" through the full threat landscape,
 *  both sides of the profession, and a structured way to choose a career direction.
 *  Content verified against primary sources (NIST, MITRE, Verizon DBIR, ISC2, CSA Ghana)
 *  as of November 2026. No technical tools are required; lessons are conceptual and
 *  use real-world case studies throughout.
 */

// ── Shared sources used across two or more lessons ──────────────────────────────────────────────
const introSources = {
  csaGhana:   { title: 'Ghana Cyber Security Authority — official site',               url: 'https://www.csa.gov.gh/' },
  act1038:    { title: 'Ghana Cybersecurity Act, 2020 (Act 1038) — CSA resource',       url: 'https://www.csa.gov.gh/resources/Cybersecurity-Act-2020.pdf' },
  act772:     { title: 'Ghana Electronic Transactions Act, 2008 (Act 772)',             url: 'https://csa.gov.gh/resources/Electronic%20Transactions%20Act.pdf' },
  dbir2025:   { title: 'Verizon 2025 Data Breach Investigations Report — infographic',  url: 'https://www.verizon.com/business/resources/infographics/2025-dbir-infographic.pdf' },
  isc2work:   { title: 'ISC2 2025 Cybersecurity Workforce Study',                       url: 'https://www.isc2.org/Insights/2025/12/2025-ISC2-Cybersecurity-Workforce-Study' },
  attackEnt:  { title: 'MITRE ATT&CK — Enterprise tactics (v20)',                       url: 'https://attack.mitre.org/tactics/enterprise/' },
  nist800_30: { title: 'NIST SP 800-30 Rev. 1 — Guide for Conducting Risk Assessments', url: 'https://csrc.nist.gov/pubs/sp/800/30/r1/final' },
  cvss:       { title: 'FIRST — Common Vulnerability Scoring System (CVSS)',            url: 'https://www.first.org/cvss/' },
  ptes:       { title: 'Penetration Testing Execution Standard (PTES)',                 url: 'https://pentest-standard.readthedocs.io/' },
  niceCisa:   { title: 'CISA NICCS — NICE Framework work role categories',              url: 'https://niccs.cisa.gov/workforce-development/nice-framework' },
  owasp:      { title: 'OWASP — Web Security Testing Guide',                            url: 'https://owasp.org/www-project-web-security-testing-guide/' },
  anderson:   { title: 'Ross Anderson — Security Engineering, 3rd ed. (free chapters)', url: 'https://www.cl.cam.ac.uk/~rja14/book.html' },
};

export const introductionLessons: CurriculumLesson[] = [

  // ── Lesson 1 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'pre-intro-1',
    slug: 'what-cybersecurity-is',
    title: 'What Is Cybersecurity?',
    summary:
      'Understand what the field protects, the three security goals every professional works toward, and why the most consequential incidents in history were stopped — or not stopped — by basics.',
    minutes: 22,
    prerequisite:
      'None. This is the very first lesson on the platform. You only need curiosity and the willingness to read carefully before acting.',
    outcomes: [
      'Define cybersecurity in one clear sentence',
      'Classify any incident as a confidentiality, integrity, or availability failure',
      'Explain authentication, authorisation, and accounting (AAA) with a concrete example each',
      'Use at least two real breach cases to explain why patching and MFA matter',
    ],
    introduction:
      'Cybersecurity is the practice of protecting systems, networks, data, and the people who rely on them from unauthorised access, misuse, and disruption. ' +
      'That definition sounds abstract until you notice how much of modern life runs on it. Mobile money transfers, hospital patient records, university examination results, national electricity grids, court evidence databases — every one of those is a system someone has to protect, and someone else may be trying to break. ' +
      'This lesson gives you the vocabulary and mental model that every professional in the field uses, every day, on both the offensive and defensive sides.',
    keyTerms: [
      { term: 'Asset',            meaning: 'Anything of value that needs protecting: data, a device, a service, a credential, or a reputation.' },
      { term: 'Confidentiality',  meaning: 'Only authorised people can read the information.' },
      { term: 'Integrity',        meaning: 'Information and systems are accurate and have not been changed without permission.' },
      { term: 'Availability',     meaning: 'The system or data is accessible and functional when the people who need it need it.' },
      { term: 'Authentication',   meaning: 'Proving who you are — a password, a fingerprint, a hardware token, or a one-time code.' },
      { term: 'Authorisation',    meaning: 'Deciding what an authenticated identity is permitted to do.' },
      { term: 'Non-repudiation',  meaning: 'The ability to prove an action occurred and that the named party cannot credibly deny it — a digitally signed transaction log, for example.' },
    ],
    sections: [
      {
        title: 'Why cybersecurity is not optional',
        paragraphs: [
          'Digital systems now carry decisions that used to be made in person: payments, medical diagnoses, grades, votes, contracts. When those systems fail — through attack, error, or neglect — real people are harmed. A fraudulent mobile money transfer drains a family\'s savings. A hospital locked out of its patient database delays surgery. A manipulated election result undermines a democracy. Cybersecurity is what keeps the digital world trustworthy enough to use.',
          'Ghana recorded financial losses of GHS 23.3 million through cyber fraud, blackmail, and unauthorised access in 2024, with a further GHS 14.9 million in the first half of 2025 alone, according to the Cyber Security Authority (CSA). Those figures cover only reported incidents in one country. Globally, ransomware alone appeared in 44% of all confirmed breaches analysed by Verizon in 2025, up from 32% the year before. The threat is not theoretical and is not slowing down.',
        ],
      },
      {
        title: 'The CIA Triad: three goals behind every control',
        paragraphs: [
          'Security professionals organise every goal under three headings, known as the CIA triad. ' +
          'Confidentiality means only the right people can read the information — a leaked student result, a stolen mobile money PIN, or a photographed exam paper before it is sat are all confidentiality failures. ' +
          'Integrity means data and systems are accurate and unchanged — an attacker quietly editing a grade, changing a payee bank account number on an invoice, or inserting malicious code into a software update are integrity failures. ' +
          'Availability means the service works when needed — ransomware locking a clinic\'s patient database, a flood of junk traffic taking a website offline, or a faulty update crashing thousands of machines are all availability failures.',
          'Two additional properties appear in many contexts. Authenticity means you can verify that a message, file, or certificate really came from who it claims. Non-repudiation means a party cannot credibly deny an action they took — essential in contracts, financial transactions, and legal proceedings. When you read a security news headline from now on, your first question should be: which goal failed?',
        ],
        code:
          'Incident                                                 Primary failure\n' +
          '-------------------------------------------------------  -------------------\n' +
          'Student records database posted on a public forum        Confidentiality\n' +
          'Attacker changes payee account on a supplier invoice     Integrity\n' +
          'Ransomware locks a clinic\'s patient records              Availability\n' +
          'Malicious code inserted into a legitimate software update Integrity\n' +
          'DDoS attack makes a university portal unreachable        Availability\n' +
          'Phishing steals a lecturer\'s email password              Confidentiality',
        label: 'Classify by which goal broke first — some incidents break more than one',
      },
      {
        title: 'AAA: who are you, what may you do, and what did you do?',
        paragraphs: [
          'Most access control systems follow three steps, often called AAA. ' +
          'Authentication proves identity. The classic factor is a password ("something you know"), but modern systems combine it with a device ("something you have") or biometrics ("something you are"). Each factor adds a layer a thief must also defeat. ' +
          'Authorisation decides permission. After the system knows who you are, it checks what you are allowed to do. A student can view their own result; a registrar can edit all results; a system administrator can reset any account. These are different authorisation levels, enforced separately from authentication. ' +
          'Accounting records what happened. Every read, write, login, and configuration change generates a log. Those logs are how investigators reconstruct an incident, how auditors verify compliance, and how the platform proves a flag was really captured.',
          'Multi-factor authentication (MFA) strengthens the authentication step by requiring two or more independent factors from different categories. ' +
          'Even if an attacker steals your password, they still need the second factor — the code on your phone, the hardware key in your pocket, or your fingerprint. ' +
          'That single change transforms a stolen password from a complete compromise into a failed attempt. The absence of MFA was a documented contributing factor in the Colonial Pipeline attack of 2021 and in dozens of major breaches every year.',
        ],
      },
      {
        title: 'Two real cases that illustrate the basics',
        paragraphs: [
          'WannaCry (May 2017) is the most instructive single event in the history of mass-scale cyber incidents. ' +
          'The ransomware spread across the world in a single day, crippling hospitals in the UK National Health Service, factories in Germany, rail networks in Russia, and telecoms companies in Spain. ' +
          'The underlying vulnerability — a flaw in Windows\' file-sharing protocol, tracked as CVE-2017-0144 — had been patched by Microsoft in March 2017, two months earlier. ' +
          'The exploit that weaponised it, EternalBlue, had been stolen from the US National Security Agency and leaked publicly in April. ' +
          'The organisations that were hit had not applied a freely available patch for a known, critically rated flaw. The lesson is unambiguous: availability can collapse at scale because of one missed software update.',
          'Colonial Pipeline (May 2021) shut down the largest petroleum pipeline on the US East Coast, causing fuel shortages across several states. ' +
          'Congressional testimony and reporting attribute the initial access to a single VPN account that was no longer in active use, whose password had been exposed in a prior breach, and which had no MFA enabled. ' +
          'The pipeline company paid a ransom of approximately $4.4 million USD, some of which was later recovered. ' +
          'The lesson is equally unambiguous: a single reused or exposed password, without a second authentication factor, can become a matter of national infrastructure.',
          'Neither of these incidents required sophisticated novel techniques. Both were stopped — or not stopped — by whether the organisation had applied the most basic controls. This pattern repeats in Verizon\'s 2025 Data Breach Investigations Report, which found that stolen or weak credentials and exploitation of unpatched vulnerabilities were together responsible for the majority of initial access in confirmed breaches that year.',
        ],
      },
      {
        title: 'Security is a trade-off, not a switch',
        paragraphs: [
          'A computer disconnected from every network and stored in a locked room is very secure and completely useless. ' +
          'Real security balances protection against usability and cost. ' +
          'A bank enforces MFA on every login because the data is high value and the users expect strong protection. ' +
          'A public news website does not ask readers for a fingerprint before showing an article because the asset is meant to be read by everyone. ' +
          'Security professionals do not say no to everything — they ask what is valuable, what could realistically go wrong, and what protection is proportionate to that specific risk. ' +
          'That question is what this module teaches you to answer.',
        ],
      },
    ],
    table: {
      headers: ['Goal', 'Failure example', 'Common control that addresses it'],
      rows: [
        ['Confidentiality', 'Leaked PIN, student records posted online, stolen credentials sold on underground forums', 'Encryption at rest and in transit, access control, MFA'],
        ['Integrity',       'Altered grade, changed payee account, malicious code in a software update',              'File permissions, audit logs, digital signatures, change management'],
        ['Availability',    'Ransomware locking a hospital, DDoS taking a website offline, power failure',            'Offline backups, patching, redundancy, incident response plans'],
        ['Authentication',  'Password alone bypassed by phishing or credential stuffing',                            'Multi-factor authentication, phishing-resistant tokens'],
        ['Authorisation',   'User accesses another account\'s records by changing an ID in the URL',                 'Server-side authorisation checks, least privilege principle'],
      ],
    },
    exercise: {
      scenario:
        'An attacker uses a phishing email to steal a university registrar\'s password. ' +
        'They log in, download the full student phone number database, quietly edit three exam results, and then delete the system\'s backup copies.',
      task:
        'Identify the CIA failure caused by each of the three actions. ' +
        'Then name one control that would have blocked the initial login, and one that would have detected the grade changes even if the login succeeded.',
      answer:
        'Downloading the phone database breaks confidentiality. ' +
        'Editing exam results breaks integrity. ' +
        'Deleting backups threatens availability by removing the recovery option. ' +
        'Multi-factor authentication on registrar logins would have made the stolen password insufficient to log in. ' +
        'An audit log that records every change to exam results, with a daily alert on out-of-hours modifications, would have detected the edits even if the attacker\'s login succeeded.',
      evidence:
        'Write a four-row table: the original phishing email, each of the three actions, the CIA goal broken, and one control per row.',
    },
    misconceptions: [
      'Cybersecurity is not only about sophisticated nation-state hackers; most real incidents begin with ordinary failures like reused passwords or skipped updates.',
      'Availability is a full security goal — an outage can be as damaging to an organisation as a data leak.',
      'A strong password is not the same as strong authentication; MFA adds an independent, second proof that a stolen password cannot satisfy on its own.',
      'Security that makes a system unusable has itself failed — just in a different direction.',
      'Logs (accounting) are as important as preventive controls; without them, you cannot know what happened or prove it.',
    ],
    sources: [
      primarySources.csf,
      introSources.dbir2025,
      introSources.csaGhana,
      { title: 'NIST SP 800-63B — Digital Identity Guidelines', url: 'https://pages.nist.gov/800-63-3/sp800-63b.html' },
      introSources.anderson,
    ],
    labs: [],
    questions: [
      { prompt: 'Which CIA goal is broken when ransomware stops a hospital from accessing patient records?', answer: 'availability' },
      { prompt: 'Which step of AAA decides what an authenticated user is permitted to do?', answer: 'authorisation', accept: ['authorization'] },
    ],
    quiz: [
      {
        question: 'An attacker silently changes the payee bank account on a supplier invoice. Which CIA goal is broken?',
        options: ['Integrity', 'Availability', 'Authentication', 'Confidentiality'],
        answer: 0,
        explanation: 'Unauthorised modification of data is an integrity failure.',
      },
      {
        question: 'What did WannaCry and Colonial Pipeline both show about how major incidents begin?',
        options: [
          'They began with failures of basic controls — an unpatched flaw and a credential with no MFA',
          'They required nation-state zero-day capabilities',
          'They only affected countries without cybersecurity laws',
          'They were caused by insider threats with physical access',
        ],
        answer: 0,
      },
      {
        question: 'MFA requires two or more factors. Which combination is a valid MFA pair?',
        options: [
          'A password (something you know) plus a code from your phone (something you have)',
          'A password plus a longer version of the same password',
          'Your username plus your password',
          'Two passwords from different accounts',
        ],
        answer: 0,
      },
    ],
  },

  // ── Lesson 2 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'pre-intro-2',
    slug: 'threats-vulnerabilities-risk-controls',
    title: 'Threats, Vulnerabilities, Risk, and Controls',
    summary:
      'Master the precise vocabulary every security conversation depends on — threat actors and their motivations, the difference between a vulnerability and a risk, and the layered control model that defends any organisation.',
    minutes: 24,
    prerequisite: 'Complete "What Is Cybersecurity?" or be able to define the CIA triad in a sentence.',
    outcomes: [
      'Use threat, vulnerability, exploit, and risk in a sentence without confusing them',
      'Describe the main threat actor categories and what motivates each one',
      'Read a CVE identifier and explain what a CVSS score does and does not tell you',
      'Classify a control as preventive, detective, or corrective, and as technical, administrative, or physical',
      'Explain defence in depth, least privilege, and zero trust in plain language',
    ],
    introduction:
      'Four words appear in every security conversation: threat, vulnerability, exploit, and risk. ' +
      'Using them loosely leads to bad decisions — patching the wrong thing, panicking over the wrong headline, or overlooking the actual exposure. ' +
      'This lesson defines them precisely and builds the control model that professionals use to respond to risk in any organisation, in any country.',
    keyTerms: [
      { term: 'Threat actor',    meaning: 'The person, group, or circumstance that could cause harm — a criminal gang, an insider, a nation-state group, or even a natural disaster.' },
      { term: 'Vulnerability',   meaning: 'A specific weakness a threat could exploit: a software bug, an unencrypted backup, a misconfigured server, or a password that never expires.' },
      { term: 'Exploit',         meaning: 'The method or code that takes advantage of a specific vulnerability.' },
      { term: 'Risk',            meaning: 'The combined likelihood that a threat will use a vulnerability, and the impact if it does.' },
      { term: 'Attack surface',  meaning: 'Every reachable point where an attacker could interact with a system: exposed ports, web forms, email inboxes, cloud APIs, staff.' },
      { term: 'Control',         meaning: 'A safeguard that reduces risk — MFA, a firewall rule, an offline backup, a security training session.' },
      { term: 'CVE',             meaning: 'Common Vulnerabilities and Exposures — a unique public identifier for a known software flaw, e.g. CVE-2017-0144 (the WannaCry flaw).' },
      { term: 'CVSS',            meaning: 'Common Vulnerability Scoring System — a 0–10 severity score that describes how bad a flaw is in the worst case, before context.' },
    ],
    sections: [
      {
        title: 'Four words that must stay separate',
        paragraphs: [
          'A threat is the who or what that could cause harm. A vulnerability is the weakness it could use. An exploit is the specific technique that weaponises that weakness. ' +
          'Risk combines the probability that harm will occur with the size of the impact if it does. ' +
          'All four can be present in the same situation, but removing any one of them changes the risk fundamentally: a threat with no reachable vulnerability is low risk; a serious vulnerability with no known threat is also low risk. ' +
          'Risk requires both sides, and your job is to understand your specific context, not just the abstract severity of a flaw.',
        ],
        code:
          'Risk  ≈  Likelihood × Impact\n\n' +
          'Likelihood factors:  Is there an active threat? Is the vulnerability internet-reachable?\n' +
          '                     Is a working exploit publicly available? Is the system monitored?\n\n' +
          'Impact factors:      What data is at risk? How many people depend on this system?\n' +
          '                     What are the operational, financial, and reputational consequences?\n' +
          '                     Is recovery possible? How quickly?',
        label: 'The logic behind every risk decision',
      },
      {
        title: 'Who attacks, and why — the threat actor landscape',
        paragraphs: [
          'Defenders plan differently for different adversaries, so understanding motivation and capability matters. ' +
          'Cybercriminals are financially motivated and are the most common threat to ordinary organisations. ' +
          'Their tools include ransomware (encrypt and demand payment), business email compromise (forge a request to redirect a payment), infostealers (harvest saved passwords and session tokens at scale), and account takeover fraud. ' +
          'The 2025 Verizon DBIR found that 54% of ransomware victims had their credentials appear in infostealer logs before the incident — the criminal pipeline from phishing to ransomware is industrialised.',
          'Nation-state threat groups operate on behalf of governments and prioritise intelligence collection or the ability to disrupt critical infrastructure. ' +
          'They are often patient, well-resourced, and skilled at avoiding detection for months. ' +
          'The SolarWinds supply chain attack of 2020, attributed to a Russian intelligence group, compromised the update mechanism of widely used IT management software and reached around 18,000 organisations — including US government departments — before detection.',
          'Hacktivists seek publicity for a political or social cause and commonly target public-facing websites and services for defacement or data exposure. ' +
          'Script kiddies are low-skill opportunists who run downloaded tools against anything that responds, without deep technical understanding. ' +
          'Insiders — current or former employees, contractors, or partners — present a distinct challenge because they already have authorised access; their misuse may be deliberate or accidental. ' +
          'Finally, human error without any malicious actor at all remains a leading cause of incidents: a misconfigured cloud storage bucket left public, a laptop left in a taxi, a database backup posted to the wrong server.',
        ],
      },
      {
        title: 'Naming and scoring vulnerabilities: CVE and CVSS',
        paragraphs: [
          'The CVE (Common Vulnerabilities and Exposures) programme, run by MITRE and sponsored by CISA, assigns a unique identifier to each publicly known software flaw in the form CVE-year-sequence. ' +
          'CVE-2017-0144 identifies the Windows SMB flaw that WannaCry exploited. ' +
          'CVE identifiers let a defender, a tester, a vendor, and a researcher point at exactly the same bug without ambiguity.',
          'CVSS (the Common Vulnerability Scoring System, maintained by FIRST) adds a severity score from 0.0 to 10.0 based on how the flaw is accessed, what privileges it requires, whether user interaction is needed, and what systems are affected if exploited. ' +
          'A score above 9.0 is Critical. ' +
          'A score is a worst-case assessment of the flaw in isolation — it describes what a full compromise of a vulnerable system would mean, not what it means for your specific environment. ' +
          'A Critical vulnerability on a server with no network exposure and no real data may be less urgent to patch than a High vulnerability on your public-facing login page. ' +
          'Context — exposure, criticality of the asset, compensating controls — always shapes actual priority.',
        ],
      },
      {
        title: 'Social engineering: bypassing technology by targeting people',
        paragraphs: [
          'Many attacks do not target software at all. ' +
          'Social engineering exploits human psychology — trust, urgency, helpfulness, fear of consequences — to obtain credentials, authorisations, or access directly from people. ' +
          'Phishing sends a convincing message (email, chat, or website) that tricks someone into typing their password or clicking a malicious link. ' +
          'Spear phishing is targeted at a specific person using personalised details. ' +
          'Vishing uses phone calls; smishing uses SMS. ' +
          'Pretexting builds a believable false scenario: "I am from IT, the system is down, I need your code to fix your account."',
          'Social engineering works because the attack is on a human strength — the tendency to help, to respond to authority, to act under time pressure — not a software bug. ' +
          'That is why defenders combine technical controls (MFA, email filtering, link scanning) with training (teaching staff to verify requests through a known channel before complying) and culture (making it safe and normal to report suspicious contacts). ' +
          'No technical control fully compensates for a person who can be convinced to hand over their credentials on request.',
        ],
      },
      {
        title: 'Controls: what they do and what they are made of',
        paragraphs: [
          'A control is grouped in two dimensions. ' +
          'By function: preventive controls stop an event from happening (MFA, encryption, firewall rules, patching). ' +
          'Detective controls notice that something is happening or has happened (SIEM alerts, log reviews, intrusion detection, audit trails). ' +
          'Corrective controls limit damage and restore normality afterwards (restoring from an offline backup, isolating an infected machine, revoking a compromised credential, incident response plans). ' +
          'Some frameworks also include deterrent controls (warning banners, visible security cameras, published audit policies) that discourage attempts without blocking them directly.',
          'By composition: technical controls are software and hardware. ' +
          'Administrative controls are policies, procedures, training, and contractual obligations. ' +
          'Physical controls are locks, badge readers, server room cages, and security guards. ' +
          'A mature organisation layers all three types so that when one control fails — as controls inevitably do — another catches the problem. ' +
          'That principle is called defence in depth, and it is the structural reason why a security programme is not a single product or policy but a system of overlapping safeguards.',
        ],
      },
      {
        title: 'Two principles that appear everywhere: least privilege and zero trust',
        paragraphs: [
          'Least privilege means every user account, service, process, or device receives the minimum access required for its job and nothing more. ' +
          'A student account cannot change exam results. A web application process cannot read the HR database. A laptop used for browsing cannot administer the domain. ' +
          'When a least-privilege account is compromised, the attacker inherits only that account\'s limited access — a contained problem rather than a catastrophic one.',
          'Zero trust (described in NIST SP 800-207) replaces the assumption that everything inside the network perimeter is safe. ' +
          'Under zero trust, every access request is verified regardless of where it originates — inside the network or outside, from a corporate device or a personal phone. ' +
          'Identity and device health are checked on every request, and the access granted is the minimum needed for that specific action. ' +
          'The principle became urgent after a series of breaches showed that attackers who reach any foothold inside a traditional network can often move laterally to anything else on it.',
        ],
      },
      {
        title: 'Four ways to respond to a known risk',
        paragraphs: [
          'Once a risk is understood, there are four options. ' +
          'Mitigate: add or improve controls to reduce likelihood or impact. ' +
          'Transfer: share the risk — through cyber insurance, contractual liability clauses, or outsourcing the function to a managed service provider. ' +
          'Avoid: stop the risky activity entirely — retire the legacy system, do not collect the data, do not offer the service. ' +
          'Accept: decide the remaining risk, after mitigations, is tolerable, document that decision formally, assign an owner, and review it on a schedule. ' +
          'The person responsible for the business outcome — not the security team — normally makes the final call. The security team\'s job is to give them the information they need to make it.',
        ],
        code:
          'ID  Asset                 Threat              Vulnerability                L  I  Response\n' +
          'R1  Staff portal (login)  Credential theft    No MFA enforced              H  H  Mitigate: enforce MFA now\n' +
          'R2  File server           Ransomware          Unpatched SMB (CVE known)    M  H  Mitigate: patch + test offline backups\n' +
          'R3  Old library website   Defacement          Unmaintained CMS, no owner   M  L  Avoid: retire the site\n' +
          'R4  Staff laptops         Theft               Devices leave campus daily   M  M  Mitigate: disk encryption; Transfer: insurance',
        label: 'A simple risk register — four assets, four decisions',
      },
    ],
    table: {
      headers: ['Control type', 'Example', 'What it addresses'],
      rows: [
        ['Preventive (technical)',    'MFA on all remote access accounts',                      'Stolen passwords being sufficient to log in'],
        ['Preventive (technical)',    'Automated patch management for OS and software',          'Known exploitable vulnerabilities remaining open'],
        ['Detective (technical)',     'SIEM alert on 50 failed logins in 60 seconds',            'Password-guessing and credential stuffing going unnoticed'],
        ['Detective (administrative)', 'Monthly review of privileged account activity logs',    'Insider misuse building unnoticed over weeks'],
        ['Corrective (technical)',    'Restore systems from verified offline backups',           'Permanent data loss or operational failure after ransomware'],
        ['Preventive (administrative)', 'Staff phishing-awareness training with simulations',   'Employees handing over credentials when asked convincingly'],
        ['Preventive (physical)',     'Locked server room with badge access and visitor log',   'Unauthorised physical access to hardware'],
      ],
    },
    exercise: {
      scenario:
        'A security team receives a news alert: a vulnerability with CVSS 9.8 (Critical) has been disclosed in a popular database server. ' +
        'Your organisation runs that database server in two places: on a public-facing analytics platform used by thousands of customers, and on an isolated internal test machine that holds only dummy data with no network connection to anything outside the lab.',
      task:
        'Assess the risk for each deployment separately. ' +
        'Use the words threat, vulnerability, likelihood, impact, and exploit in your answer. ' +
        'Then choose a risk response for each deployment.',
      answer:
        'Both deployments have the same vulnerability and the same CVSS score, but the risk is very different. ' +
        'The public analytics platform has high likelihood — a threat actor can reach it from the internet, and an exploit for a 9.8-scored flaw will appear quickly. ' +
        'Impact is also high — customer data and the service reputation are at stake. ' +
        'Response: mitigate immediately by patching or applying a compensating control (such as disabling the vulnerable feature) within hours. ' +
        'The isolated test machine has low likelihood — no network exposure means the exploit cannot reach it remotely — and low impact, as the data is dummy data. ' +
        'Response: mitigate on the normal patch cycle (within days), not an emergency. ' +
        'A CVSS score describes the worst-case severity of the flaw; risk depends on your environment.',
      evidence:
        'Write a two-row risk register: one row per deployment, with likelihood (H/M/L), impact (H/M/L), and response.',
    },
    misconceptions: [
      'A vulnerability is not a risk on its own; it becomes a risk only when a threat can reach it and the impact would be significant.',
      'A Critical CVSS score is a starting point, not an action priority; exposure and asset value change the urgency.',
      'Social engineering targets human nature, not software bugs — no technical tool fully compensates for it without training and culture.',
      'Defence in depth means overlapping layers, not buying multiple tools that protect the same thing the same way.',
      'Accepting a risk is a legitimate decision — but it must be documented, owned, and reviewed; it is not the same as ignoring it.',
    ],
    sources: [
      primarySources.csf,
      introSources.nist800_30,
      introSources.cvss,
      introSources.dbir2025,
      { title: 'NIST SP 800-207 — Zero Trust Architecture', url: 'https://csrc.nist.gov/pubs/sp/800/207/final' },
      { title: 'CVE Program — About CVE records',            url: 'https://www.cve.org/About/Overview' },
    ],
    labs: [],
    questions: [
      {
        prompt: 'What do we call a weakness — such as a software bug or a misconfigured server — that a threat could exploit?',
        answer: 'vulnerability',
        accept: ['a vulnerability'],
      },
      {
        prompt: 'An alert that fires when 50 logins fail in 60 seconds is which kind of control: preventive, detective, or corrective?',
        answer: 'detective',
        accept: ['detective control'],
      },
    ],
    quiz: [
      {
        question: 'Which statement uses the four terms correctly?',
        options: [
          'The criminal group is the threat; the unpatched server is the vulnerability',
          'The unpatched server is the threat; the criminal is the risk',
          'The exploit and the vulnerability are the same thing',
          'Risk and likelihood mean the same thing',
        ],
        answer: 0,
      },
      {
        question: 'An organisation discovers a flaw on its public login page scored CVSS 7.5. Its isolated test server has a different flaw scored CVSS 9.8. Which is higher risk?',
        options: [
          'The public login page flaw — because it is reachable by any internet user',
          'The isolated test server flaw — because 9.8 is a higher score',
          'They are identical risks because CVSS fully measures risk',
          'Neither is a risk until an attacker is detected',
        ],
        answer: 0,
      },
      {
        question: 'What does least privilege mean in a university context?',
        options: [
          'A student account can view their own result but cannot change any result',
          'Only the most senior staff may use computers',
          'All accounts share administrator access to reduce support calls',
          'Students cannot log in after 6 pm',
        ],
        answer: 0,
      },
      {
        question: 'Which response to a risk involves documenting that the remaining exposure is tolerable and assigning an owner?',
        options: ['Accept', 'Avoid', 'Transfer', 'Mitigate'],
        answer: 0,
      },
    ],
  },

  // ── Lesson 3 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'pre-intro-3',
    slug: 'defensive-and-offensive-security',
    title: 'Defensive and Offensive Security',
    summary:
      'Understand what professionals on each side of the field actually do every day, the frameworks both sides share, and why authorisation is the only thing that separates an ethical tester from a criminal.',
    minutes: 26,
    prerequisite: 'Complete "Threats, Vulnerabilities, Risk, and Controls".',
    outcomes: [
      'Describe at least four roles on the defensive side and what distinguishes each',
      'Name the six NIST CSF 2.0 functions and give one concrete activity for each',
      'Explain the SOC tier model and what moves an alert from Tier 1 to Tier 3',
      'Explain what a penetration test is, why the report is the deliverable, and what rules of engagement must contain',
      'State why authorisation is the single most important concept in offensive work',
    ],
    introduction:
      'Cybersecurity professionals broadly work in one of two directions: defending organisations against attack, or testing them with authorised attacks to find weaknesses before real attackers do. ' +
      'Neither side is more important. Defenders need to understand attacker thinking to build good detections; testers need to understand what defenders can see to write useful reports. ' +
      'This lesson introduces both roles in enough depth to let you decide which direction interests you, and to understand why the same knowledge base underlies both.',
    keyTerms: [
      { term: 'Blue team',         meaning: 'The defenders: people who protect, monitor, detect, respond, and recover for an organisation.' },
      { term: 'Red team',          meaning: 'Authorised testers who simulate a realistic adversary to test whether defences hold and whether the blue team detects the activity.' },
      { term: 'SOC',               meaning: 'Security Operations Centre: the team and function that monitors security alerts and coordinates response to incidents.' },
      { term: 'SIEM',              meaning: 'Security Information and Event Management: collects and correlates log data from across an organisation so analysts can search and alert on it.' },
      { term: 'EDR',               meaning: 'Endpoint Detection and Response: software on laptops and servers that records process and network activity and can isolate a compromised device.' },
      { term: 'Penetration test',  meaning: 'An authorised, time-limited attempt to find and safely demonstrate real weaknesses within a defined scope, ending in a written report with remediation advice.' },
      { term: 'Rules of engagement', meaning: 'The written agreement that defines the scope, timing, permitted techniques, and emergency contacts for an authorised test — the document that makes it legal.' },
      { term: 'Triage',            meaning: 'The rapid process of deciding whether an alert is real, how serious it is, and who should handle it next.' },
    ],
    sections: [
      {
        title: 'The defensive side: what a blue team does',
        paragraphs: [
          'Defensive security protects organisations every day, not only during a crisis. ' +
          'The range of roles is wide. Security Operations Centre (SOC) analysts monitor alert queues around the clock, triage each alert against playbooks, close false positives efficiently, and escalate confirmed incidents with clear and complete notes. ' +
          'This is the highest-volume entry-level role in the field — Tier 1 is where most people begin a defensive career. ' +
          'Incident responders lead the structured process of containing a confirmed incident, removing the attacker\'s foothold, restoring services, and running a formal lessons-learned review. ' +
          'Digital forensics and incident response (DFIR) analysts reconstruct exactly what happened from disk images, memory captures, and log data — producing findings that may need to stand up to scrutiny in legal proceedings. ' +
          'Threat hunters proactively search for attacker activity that never triggered any alert — using hypotheses drawn from threat intelligence and the MITRE ATT&CK framework. ' +
          'Detection engineers write, test, and tune the rules that generate alerts, working backward from known attacker techniques.',
          'Other defensive roles include security architects (who design systems to be secure before they are built), cloud security engineers (who secure infrastructure as code and cloud-native environments), GRC analysts (governance, risk, and compliance — who manage policy, risk registers, and regulatory obligations), and threat intelligence analysts (who study adversary groups and turn reports into actionable detection and response guidance).',
        ],
      },
      {
        title: 'NIST CSF 2.0: the framework that maps the whole defensive programme',
        paragraphs: [
          'The NIST Cybersecurity Framework (CSF), currently at version 2.0 (published February 2024), organises all security activity into six functions. ' +
          'Govern: set the organisation\'s cybersecurity risk strategy, roles, policies, and supply-chain risk management. This is new in version 2.0 and is described as wrapping around the other five — without governance, the rest lacks direction and accountability. ' +
          'Identify: know your assets, what matters, and what risks exist. An accurate asset inventory is the foundation everything else depends on. ' +
          'Protect: put safeguards in place — MFA, patch management, access control, staff training, data encryption, secure configuration. ' +
          'Detect: notice attacks and anomalies — monitor SIEM alerts, run threat hunts, analyse network flow data. ' +
          'Respond: act on a detected incident — triage, contain, communicate, eradicate, document. ' +
          'Recover: restore services and learn — rebuild from clean backups, conduct a lessons-learned review, improve controls.',
          'These six functions run continuously and in parallel. They are not a sequential checklist. An organisation that only protects without detecting is blind; one that detects without a response plan is paralysed. ' +
          'Every defensive role maps primarily to one or two functions, and every defensive tool and control belongs inside this structure.',
        ],
        code:
          'Function  Description                              Example activity\n' +
          '--------  ---------------------------------------  ----------------------------------------\n' +
          'Govern    Strategy, policy, supply-chain risk      Write the incident response policy\n' +
          'Identify  Assets, risks, dependencies              Maintain the asset and risk register\n' +
          'Protect   Safeguards and hardening                 Enforce MFA; patch OS weekly; train staff\n' +
          'Detect    Monitoring and anomaly detection         Monitor SIEM; tune alerts; run threat hunt\n' +
          'Respond   Incident handling and coordination       Isolate host; communicate; eradicate\n' +
          'Recover   Restoration and improvement             Restore from backup; lessons-learned review',
        label: 'NIST CSF 2.0 — six functions at a glance (February 2024)',
      },
      {
        title: 'Inside a SOC: the three-tier model',
        paragraphs: [
          'Many organisations run a Security Operations Centre where analysts work in a tiered structure. ' +
          'Tier 1 analysts are the front line. They monitor the alert queue, apply documented playbooks to triage each alert, close clear false positives, and escalate everything else with a structured note that records what triggered the alert, what context was checked, and what the analyst concluded. ' +
          'The volume at Tier 1 is high — a mid-sized enterprise may generate thousands of alerts per day. ' +
          'Speed, accuracy, and clear written communication matter more here than deep technical depth.',
          'Tier 2 analysts receive escalations and investigate in depth. They confirm or refute the Tier 1 verdict, determine how far an incident spread, begin containment where policy permits, and feed findings back to detection engineers when an alert was noisy or missed something. ' +
          'Tier 3 analysts are senior engineers who handle complex or high-impact incidents, perform threat hunting, build and tune detections, and lead digital forensics where needed. ' +
          'In practice the tiers blur — the structure describes a division of labour, not rigid job titles, and many teams combine responsibilities by seniority.',
        ],
        code:
          '── Tier 1 triage note (example) ───────────────────────────────────────────────────────\n' +
          'Alert:    Encoded PowerShell launched by Word process — EDR, severity High\n' +
          'Time:     14 Nov 2026, 09:41 UTC\n' +
          'User:     a.mensah (Finance department)\n' +
          'Observed: WINWORD.EXE spawned powershell.exe -EncodedCommand <base64>\n' +
          'Context:  Email "Invoice_Nov.docm" received 09:38 from new external sender\n' +
          'Verdict:  Likely true positive — Office spawning encoded PowerShell is rarely benign\n' +
          'Action:   Host isolated via EDR; email forwarded to Tier 2 with full process tree\n' +
          'Next:     Check whether other recipients in Finance received or opened the same file\n' +
          '────────────────────────────────────────────────────────────────────────────────────────',
        label: 'What a good Tier 1 triage note looks like — specific, evidence-based, actionable',
      },
      {
        title: 'The offensive side: authorised testing',
        paragraphs: [
          'The offensive side of the profession is paid to find weaknesses before real attackers do — using real attacker techniques, with written permission for a defined scope. ' +
          'A vulnerability assessment catalogues known weaknesses across a set of systems, usually without attempting to exploit them: wide coverage, shallower depth. ' +
          'A penetration test goes further: within an agreed scope and time window, testers attempt to safely exploit weaknesses to prove actual impact, then deliver a prioritised written report of everything found and how to fix it. ' +
          'A red team engagement emulates a specific adversary over days or weeks toward a named objective — "reach the payroll database", "access the board\'s email" — while remaining as quiet as possible, specifically to test whether the blue team\'s detection and response capabilities hold.',
          'Bug bounty programmes are a third model: organisations publish a scope and invite independent researchers worldwide to find and report vulnerabilities through a managed platform, usually with a payment schedule tied to severity. ' +
          'Other offensive specialisms include web application security testing, mobile security, cloud configuration review, Active Directory assessment, wireless security, social engineering assessments, and hardware and IoT security.',
        ],
      },
      {
        title: 'Rules of engagement: the document that makes it legal',
        paragraphs: [
          'Before any offensive test sends a single packet, both the client organisation and the testing team sign a rules of engagement document. ' +
          'It must state: the in-scope targets (IP addresses, domains, accounts) and anything explicitly out of scope; the testing window (dates, times, time zones); the permitted and forbidden techniques (for example, no denial of service, no phishing of customers, no social engineering of executives without a separate authorisation); how any personal data encountered during testing is handled; the emergency contact on each side, available around the clock; and the stop conditions — events that require the test to pause immediately, such as discovering evidence of a real ongoing attack or causing unintended service disruption.',
          'If it is not in writing, it is not in scope. That is an absolute rule. ' +
          'Good intentions, verbal agreements, and assumptions about what an organisation "probably" is fine with are not authorisation. ' +
          'This habit is what every offensive lab on this platform practises from the start: read the briefing, understand the scope, and do not act outside it.',
        ],
        code:
          'Rules of engagement — minimum contents\n' +
          '───────────────────────────────────────────────────────────\n' +
          'Client:         Example University, IT Security Department\n' +
          'In scope:       portal.example.edu, 10.20.0.0/24 (student VLAN)\n' +
          'Out of scope:   Payment gateway (third party); staff personal email;\n' +
          '                any denial-of-service or destructive technique\n' +
          'Window:         Mon–Fri, 09:00–17:00 GMT, 18–22 November\n' +
          'Data handling:  Do not retain real student records; redact before screenshot\n' +
          'Contacts:       Client IT lead (24/7 mobile); Lead tester (24/7 mobile)\n' +
          'Stop if:        Evidence of real intrusion; unintended service disruption;\n' +
          '                any out-of-scope system responds to a probe',
        label: 'Rules of engagement — the essentials in one document',
      },
      {
        title: 'The report is the deliverable',
        paragraphs: [
          'A client cannot fix what they do not understand, and they cannot remediate what cannot be reproduced. ' +
          'The deliverable of every offensive engagement is the written report: an executive summary in business language that a non-technical manager can act on, followed by each finding with a severity rating (usually Critical / High / Medium / Low), the affected system, a proof-of-concept demonstration, exact reproduction steps, and practical remediation advice.',
          'A spectacular exploitation technique with a vague write-up has little value. A moderate finding explained so clearly that the developer fixes it in a single reading is worth far more. ' +
          'The best offensive professionals spend a large proportion of every engagement documenting: writing, refining, and verifying that every finding can be reproduced by someone else from the write-up alone.',
        ],
        code:
          '── Sample finding ──────────────────────────────────────────────────────────────────────\n' +
          'Title:      Any student can read any other student\'s records (IDOR)\n' +
          'Severity:   High\n' +
          'System:     https://portal.example.edu/api/results?id=\n' +
          'Evidence:   Logged in as student s1001; changed id=1001 to id=1002 in the request;\n' +
          '            received full record for a different student (HTTP 200, 892 bytes)\n' +
          'Reproduce:  1) Authenticate as any student  2) Request /api/results?id=<another id>\n' +
          '            3) Observe: another student\'s name, DOB, and grades are returned\n' +
          'Impact:     Every registered student can read the personal data of every other student\n' +
          'Fix:        On the server, verify that the requested record belongs to the session user\n' +
          '────────────────────────────────────────────────────────────────────────────────────────',
        label: 'A finding written so a developer can verify and fix it immediately',
      },
    ],
    table: {
      headers: ['Engagement type', 'Primary question it answers', 'Typical output'],
      rows: [
        ['Vulnerability assessment', 'What known weaknesses exist across our systems?',                                        'Prioritised list of CVEs and misconfigurations'],
        ['Penetration test',         'Can these weaknesses be exploited for real impact, and how?',                            'Findings with proof, impact, and remediation steps'],
        ['Red team engagement',      'Could a realistic adversary reach our most valuable data, and would we detect them?',    'Attack narrative plus detection and response gaps'],
        ['Bug bounty programme',     'What can outside researchers find in our published scope?',                              'Individual vulnerability reports at published severity rates'],
        ['Web application test',     'Which OWASP Top 10 and business-logic issues affect our web applications?',              'Application-specific findings mapped to OWASP categories'],
      ],
    },
    exercise: {
      scenario:
        'During an authorised penetration test of portal.example.edu, you discover that the login page sends credentials over HTTP instead of HTTPS on a minor sub-path. ' +
        'While investigating, you notice the site also links to pay.example-payments.com — an entirely separate third-party payment processor that is not listed in the rules of engagement.',
      task:
        'What do you do about each finding? Explain using the words scope, authorisation, and rules of engagement.',
      answer:
        'The HTTP credentials finding is in scope — it is on portal.example.edu, which the rules of engagement authorise. ' +
        'Document it with a proof-of-concept (capture the HTTP request showing the credentials in plaintext), write it up as a finding, and include it in the report. ' +
        'The payment processor is out of scope — it is a separate third party not listed in the rules of engagement, so you have no authorisation to test it. ' +
        'Do not probe, test, or even browse it beyond what normal site usage would involve. ' +
        'Record the observation in your notes, flag it in the report under "out-of-scope observations", and recommend the client arrange a separate authorised assessment with the payment provider. ' +
        'The boundary between authorised testing and an offence is defined by the rules of engagement, not by curiosity or good intentions.',
      evidence:
        'Two sentences: one for each finding, stating the action taken and the reason.',
    },
    misconceptions: [
      'The tools and techniques of ethical hacking are identical to those of criminal hacking; authorisation and scope are the only difference.',
      'The exciting exploitation moment is a small fraction of offensive work; most time goes on research, documentation, and writing.',
      'Blue team work is not passive monitoring; detection engineering, threat hunting, and incident response are demanding disciplines requiring deep attacker knowledge.',
      'A red team does not "win" by defeating the blue team; its purpose is to make the blue team better at detecting and responding.',
      'Defensive and offensive skills are not competing specialisms; each side does its job better when it understands the other.',
    ],
    sources: [
      primarySources.csf,
      primarySources.attack,
      primarySources.testing,
      introSources.ptes,
      introSources.owasp,
      primarySources.ir,
    ],
    labs: [],
    questions: [
      {
        prompt: 'What is the written agreement that defines scope, timing, and permitted techniques for an authorised test?',
        answer: 'rules of engagement',
        accept: ['rules of engagement document'],
      },
      {
        prompt: 'Which NIST CSF 2.0 function covers monitoring alerts and detecting anomalies?',
        answer: 'detect',
        accept: ['Detect'],
      },
    ],
    quiz: [
      {
        question: 'What is the single most important thing that separates an ethical penetration tester from a criminal?',
        options: [
          'Written authorisation for a defined scope from someone with the right to give it',
          'Using only open-source tools',
          'Working only during business hours',
          'Not saving any evidence of what was found',
        ],
        answer: 0,
      },
      {
        question: 'A Tier 1 SOC analyst finds a confirmed malicious alert. What is their primary responsibility?',
        options: [
          'Escalate it to Tier 2 with a clear, structured triage note',
          'Immediately wipe the affected machine',
          'Wait until three similar alerts appear before acting',
          'Publish the finding on a public platform',
        ],
        answer: 0,
      },
      {
        question: 'Which NIST CSF 2.0 function was new in version 2.0 and is described as wrapping around the other five?',
        options: ['Govern', 'Identify', 'Protect', 'Detect'],
        answer: 0,
      },
    ],
  },

  // ── Lesson 4 ─────────────────────────────────────────────────────────────────────────────────
  {
    id: 'pre-intro-4',
    slug: 'careers-and-choosing-a-direction',
    title: 'Careers and Choosing Your Direction',
    summary:
      'Map the cybersecurity career landscape from regulatory requirements to entry-level roles, understand what employers actually look for, and build a plan for your first three months.',
    minutes: 22,
    prerequisite: 'Complete "Defensive and Offensive Security".',
    outcomes: [
      'Name the five NICE Framework work role categories and give one example role in each',
      'Describe the most realistic entry path for defensive, offensive, and GRC roles',
      'Explain what the Ghana Cybersecurity Act requires of professional practitioners',
      'State two portfolio activities that demonstrate real ability to an employer',
      'Sketch a 90-day study plan for the direction that interests you most',
    ],
    introduction:
      'Cybersecurity is one of the fastest-growing and most genuinely skill-short fields in technology. ' +
      'The ISC2 2025 Cybersecurity Workforce Study surveyed over 16,000 practitioners and found that 95% reported at least one skills gap in their team, with 59% describing those gaps as critical or significant. ' +
      'AI (41%) and cloud security (36%) topped the list of most urgent skills needed. ' +
      'The demand is real — but employers reward demonstrated ability, not certificate names. ' +
      'This lesson maps the landscape so you can focus your energy where it will make the fastest difference.',
    keyTerms: [
      { term: 'NICE Framework', meaning: 'The NIST Workforce Framework for Cybersecurity (SP 800-181) — organises the field into 5 work role categories and 42 work roles used by employers, educators, and governments.' },
      { term: 'GRC',            meaning: 'Governance, Risk, and Compliance — the part of the field that manages policy, risk assessments, audits, and regulatory obligations.' },
      { term: 'SOC analyst',    meaning: 'The most common defensive entry-level role: monitoring security alerts, triaging events, and escalating confirmed incidents.' },
      { term: 'CTF',            meaning: 'Capture The Flag — a competition or practice environment where participants solve security challenges to find hidden flags, building and demonstrating practical skills.' },
      { term: 'Portfolio',      meaning: 'A collection of practical work — lab write-ups, CTF solutions, home-lab projects — that shows what you can actually do, not only what you have studied.' },
      { term: 'eJPT',           meaning: 'eLearnSecurity Junior Penetration Tester — a widely recognised entry-level, fully practical offensive certification from INE, suitable as a first offensive credential.' },
    ],
    sections: [
      {
        title: 'The NICE Framework: how the field is officially organised',
        paragraphs: [
          'The NICE Workforce Framework for Cybersecurity (NIST SP 800-181), maintained by CISA, is the reference architecture used by employers, universities, and governments to describe what cybersecurity professionals do. ' +
          'It currently organises the field into five Work Role Categories containing 42 Work Roles. ' +
          'Oversight and Governance (17 roles) covers cybersecurity leadership, policy, programme management, and legal/regulatory work. ' +
          'Design and Development (9 roles) covers security architecture, secure software development, and systems testing. ' +
          'Implementation and Operation (7 roles) covers network operations, systems administration, and database administration. ' +
          'Protection and Defense (7 roles) covers incident response, threat analysis, and vulnerability analysis — the core SOC and blue team functions. ' +
          'Investigation (2 roles) covers digital evidence analysis and cybercrime investigation.',
          'Note that offensive specialisms such as red teaming and penetration testing do not appear as named roles in the NICE Framework\'s five-category model for civilian work. ' +
          'That is a reflection of how the framework was designed, not a suggestion that offensive roles are uncommon — they are simply described through adjacent categories and employer-specific job titles. ' +
          'The Department of Defense maintains a parallel framework (DCWF) that includes Cyberspace Effects roles for military contexts.',
        ],
      },
      {
        title: 'Common entry points on each path',
        paragraphs: [
          'Defensive — SOC Tier 1 analyst: the highest-volume entry-level security role in terms of job postings. ' +
          'The day-to-day work is monitoring SIEM dashboards, applying playbooks, writing clear triage notes, and escalating confirmed incidents. ' +
          'Skills needed: IP networking and common protocols, reading logs, familiarity with one SIEM platform, and clear written communication. ' +
          'Certifications commonly expected at entry: CompTIA Security+, and sometimes CompTIA CySA+ for mid-tier roles. ' +
          'Progression from Tier 1 to Tier 2 typically takes one to two years, with advancement to Tier 3 or specialist roles after three to five years of consistent, documented growth.',
          'Offensive — junior penetration tester: significantly fewer entry-level postings than defensive roles, and most expect demonstrable practical skill. ' +
          'The most direct route is building a foundation in networking, Linux, web technologies, and scripting (the DarkWorld pre-security path covers exactly this), then completing the offensive path and an entry-level certification such as the eJPT (eLearnSecurity Junior Penetration Tester) or CompTIA PenTest+. ' +
          'The OSCP (Offensive Security Certified Professional) is the industry benchmark for mid-level offensive roles but requires a solid technical foundation first. ' +
          'Many people reach junior offensive work after one to two years in a sysadmin, helpdesk, or SOC role.',
          'GRC — junior risk or compliance analyst: an overlooked but consistently in-demand path that suits strong writers and analytical thinkers. ' +
          'The work involves risk assessments, vendor security reviews, policy writing, audit preparation, and mapping an organisation\'s controls to regulatory frameworks such as GDPR, ISO 27001, or PCI-DSS. ' +
          'A technical background strengthens GRC work significantly — an analyst who can read a network diagram or understand what a penetration test finding means will always be more effective. ' +
          'Entry certifications commonly cited: CompTIA Security+, CISM, or CRISC for senior GRC roles.',
        ],
      },
      {
        title: 'The Ghana context: regulation, opportunity, and professional requirements',
        paragraphs: [
          'Ghana is an increasingly important cybersecurity market in West Africa. ' +
          'The Cyber Security Authority (CSA), established by the Cybersecurity Act, 2020 (Act 1038), is Ghana\'s national cybersecurity regulator. ' +
          'The CSA\'s stated five-year goal under its L.A.C.E. 2028 strategy is for Ghana to lead Africa in cybersecurity excellence and rank among the top 25 globally. ' +
          'The CSA has stated that it aims to position Ghana as a regional hub for cybersecurity services — which translates directly into professional opportunities for Ghanaian practitioners who meet the required standards.',
          'Act 1038 creates a licensing and accreditation regime that affects professionals working in the field in Ghana. ' +
          'Section 57 of the Act mandates the CSA to establish a mechanism to accredit cybersecurity professionals. ' +
          'Cybersecurity Professionals (CPs) — individuals who provide cybersecurity services professionally — must be accredited by the CSA to operate legally in Ghana. ' +
          'The regime has been in force since 2023, and the CSA has warned that providing cybersecurity services without the required accreditation is a breach of the law and can result in administrative penalties and criminal prosecution. ' +
          'The specific current requirements for accreditation (qualifications, fees, renewal cycle) should be checked directly with the CSA, as the draft Cybersecurity (Amendment) Bill 2025 is under consultation and may change them.',
          'Ghana\'s Electronic Transactions Act, 2008 (Act 772) covers cyber offences: section 118 covers unauthorised access to a protected computer; sections 124–126 cover unauthorised access, interception, and interference. ' +
          'These provisions apply regardless of intention — there is no "I was just testing" defence without prior written authorisation.',
        ],
      },
      {
        title: 'Why foundations are non-negotiable on every path',
        paragraphs: [
          'Networking, Linux, Windows, and scripting appear in every cybersecurity specialisation. ' +
          'A SOC analyst reading a firewall alert needs to understand IP addresses, ports, and protocols. ' +
          'A penetration tester needs to move through a Linux terminal under pressure. ' +
          'A detection engineer writes Python to automate log analysis. ' +
          'A GRC analyst reviewing a cloud security configuration needs to understand what permissions mean. ' +
          'The DarkWorld pre-security path covers all four foundations before any specialisation — not to teach every tool, but to build the vocabulary and working habits that make every later lesson faster and clearer.',
          'The ISC2 2025 study found that 73% of practitioners believe AI will create more specialised cybersecurity skills rather than fewer. ' +
          'AI is already taking over some of the mechanical alert-triage work at Tier 1, which means the premium is shifting to deeper reasoning, attacker understanding, and the ability to investigate what an AI-driven system escalates. ' +
          'Foundations are becoming more valuable, not less.',
        ],
      },
      {
        title: 'Building a portfolio before the first job',
        paragraphs: [
          'Employers in security pay attention to what candidates have done, not only what credentials they hold. ' +
          'A portfolio of practical work demonstrates ability more convincingly than a certificate name on a CV. ' +
          'Three types of work build a credible portfolio: completed lab write-ups that show evidence-led thinking (exactly what the DarkWorld platform produces with every exercise); CTF write-ups from open platforms such as picoCTF or OverTheWire Bandit; and home-lab or cloud-lab projects — building a small network, setting up a SIEM and log pipeline, running a vulnerability scanner in a controlled environment.',
          'The write-up matters as much as the work itself. ' +
          'An explanation that shows what you tried, what you observed, what it means, and where your evidence stops is a demonstration of the professional discipline security employers want. ' +
          'Keep your write-ups in a repository, a blog, or a portfolio site you can share in an application.',
        ],
        code:
          'Free practice resources — no subscription required to start\n' +
          '─────────────────────────────────────────────────────────────\n' +
          'picoCTF          Beginner CTF challenges, always open (Carnegie Mellon)\n' +
          'OverTheWire      Linux wargames from zero — start with Bandit\n' +
          'CyberDefenders   Blue team practice labs — real SIEM, EDR, network data\n' +
          'roadmap.sh       Visual, structured cyber security learning map\n' +
          '─────────────────────────────────────────────────────────────',
        label: 'Start here — build the habit of writing up everything you do',
      },
      {
        title: 'Which direction is right for you?',
        paragraphs: [
          'Defensive work suits people who enjoy reading evidence carefully, building reliable systems, and asking "would we have caught this?" — and who can maintain focus through high-volume, repetitive alert queues without missing something important. ' +
          'The career is stable, the entry-level supply of roles is reliable, and the work is immediately mission-critical.',
          'Offensive work suits people who enjoy puzzles, persistence, and creative "what if I try this?" thinking — and who can stay disciplined and document everything meticulously while doing it. ' +
          'Entry is harder and takes longer, but the specialisation commands premium compensation once established.',
          'GRC suits people who are strong writers, analysts, and communicators and who want to influence security strategy and risk decisions across the whole organisation, not just in the technical trenches. ' +
          'It is a path that scales quickly into management and advisory roles.',
          'Most experienced professionals develop genuine understanding of both the defensive and offensive sides over a career. ' +
          'Wherever you start, the technical foundations this path builds are exactly what you will use on the first day of any cybersecurity role.',
        ],
      },
    ],
    table: {
      headers: ['Direction', 'Common first role', 'Foundations first, then entry credential'],
      rows: [
        ['Defensive',        'SOC Tier 1 analyst',                                  'Networking, log reading, one SIEM, clear writing — then CompTIA Security+'],
        ['Offensive',        'Junior penetration tester (after a foundation role)', 'Linux, networking, web tech, scripting — then eJPT, later PenTest+'],
        ['GRC',              'Junior risk / compliance analyst',                    'Policy writing, risk frameworks, vendor comms — then Security+, later CISM'],
        ['Forensics / DFIR', 'Junior analyst (often via SOC)',                      'Log analysis, file systems, evidence handling — then Security+, later GCFE'],
      ],
    },
    readinessChecklist: [
      'I can explain the CIA triad and AAA in plain language without looking anything up.',
      'I can distinguish between a threat, a vulnerability, a risk, and an exploit in a sentence.',
      'I know what authorisation means and why it is non-negotiable in security work.',
      'I understand the difference between a preventive, detective, and corrective control.',
      'I have an idea of which direction — defensive, offensive, or GRC — I want to explore first.',
      'I know that networking, Linux, scripting, and clear writing matter on every path.',
    ],
    exercise: {
      scenario:
        'You are applying for a Tier 1 SOC analyst role. The job description asks for: "experience with log analysis, understanding of basic networking, and clear written communication." ' +
        'You have completed the DarkWorld pre-security foundations, solved 10 CTF challenges on picoCTF, and kept structured write-ups for each.',
      task:
        'Write three sentences — one per requirement — describing your practical experience that directly addresses what the employer asked for.',
      answer:
        'Log analysis: in Wireshark and Autopsy lab exercises, I read packet captures and file-system evidence to locate specific artefacts, write findings that state only what the evidence shows, and include explicit limitation statements when the data is insufficient for a conclusion. ' +
        'Basic networking: across five networking labs, I interpreted DNS lookups, TCP handshakes, HTTP exchanges, and TLS visibility limits, and I can explain what each layer does and why it matters when analysing an alert. ' +
        'Written communication: for every lab and CTF challenge, I write a structured note — objective, tools used, evidence observed, conclusion, and limitation — that another analyst could read and reproduce without asking me questions.',
      evidence:
        'Three sentences, one per requirement, each pointing to a specific piece of practical work you have produced.',
    },
    misconceptions: [
      'A certificate name demonstrates that you studied material; it does not by itself prove you can do the work — employers are increasingly aware of this distinction.',
      'You do not need to be a programmer to work in security, but basic scripting (Python or PowerShell) makes almost every role faster and opens more specialisation paths.',
      'GRC is not a soft option or a fallback — policy and risk decisions have more organisational impact than individual technical controls.',
      'The NICE Framework describes the field, it does not prescribe a single correct career path — real roles blend categories and evolve continuously.',
      'AI is changing the volume and character of Tier 1 work, but it is increasing the premium on reasoning and investigation skills, not replacing them.',
    ],
    sources: [
      introSources.niceCisa,
      introSources.isc2work,
      introSources.act1038,
      introSources.csaGhana,
      introSources.act772,
      { title: 'picoCTF — free beginner challenges (Carnegie Mellon)',  url: 'https://picoctf.org/' },
      { title: 'OverTheWire — Bandit wargame',                          url: 'https://overthewire.org/wargames/bandit/' },
      { title: 'CyberDefenders — blue team practice labs',              url: 'https://cyberdefenders.org/' },
      { title: 'roadmap.sh — Cyber Security roadmap',                   url: 'https://roadmap.sh/cyber-security' },
    ],
    labs: [],
    questions: [
      {
        prompt: 'Which NICE Framework work role category contains Incident Response and Threat Analysis roles?',
        answer: 'protection and defense',
        accept: ['protection and defence', 'Protection and Defense', 'Protection and Defence'],
      },
      {
        prompt: 'What do we call a competition or practice environment where participants solve security challenges to find hidden flags?',
        answer: 'CTF',
        accept: ['capture the flag', 'Capture The Flag'],
      },
    ],
    quiz: [
      {
        question: 'According to the ISC2 2025 Workforce Study, what have cybersecurity employers prioritised over headcount?',
        options: [
          'Skills — 95% of teams reported at least one critical skills gap',
          'Hardware — most teams lack enough servers',
          'Certifications — CISSP holders only',
          'Automation — replacing all Tier 1 roles immediately',
        ],
        answer: 0,
      },
      {
        question: 'What does Ghana\'s Cybersecurity Act 1038 require of individuals providing cybersecurity services professionally?',
        options: [
          'Accreditation by the Cyber Security Authority (CSA)',
          'A university degree in computer science only',
          'Membership of an international hacking competition',
          'Registration with the Ghana Police Service only',
        ],
        answer: 0,
      },
      {
        question: 'Why do employers value lab write-ups and CTF solutions in a portfolio more than a certificate name alone?',
        options: [
          'They demonstrate practical reasoning and professional communication — what security work actually requires',
          'They prove you paid for a subscription',
          'They are legally required for employment in Ghana',
          'They replace the need for any formal training',
        ],
        answer: 0,
      },
    ],
  },
];
