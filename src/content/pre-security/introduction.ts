import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

/** Introduction to Cybersecurity module — the opening lessons of the pre-security path.
 *  These lessons give learners the conceptual vocabulary and career map before any technical tooling.
 *  Covers: what the field protects, the threat landscape, how both sides of the profession work,
 *  and how learners can choose a direction. */

export const introductionLessons: CurriculumLesson[] = [
  // ── Lesson 1: The field and what it protects ─────────────────────────────────────────────────
  {
    id: 'pre-intro-1',
    slug: 'what-cybersecurity-is',
    title: 'What Is Cybersecurity?',
    summary: 'Understand what the field protects, the three security goals every professional works toward, and why the basics matter more than the headlines.',
    minutes: 20,
    prerequisite: 'None. This is the first lesson. You only need curiosity and willingness to read carefully.',
    outcomes: [
      'Define cybersecurity in plain language',
      'Classify any incident as a confidentiality, integrity, or availability failure',
      'Explain authentication, authorisation, and accounting with everyday examples',
      'State why unpatched systems and weak passwords cause the majority of real breaches',
    ],
    introduction:
      'Cybersecurity is the practice of protecting systems, networks, data, and the people who rely on them from unauthorised access, misuse, and disruption. That becomes concrete fast: mobile money transfers, hospital records, examination results, electricity infrastructure — every one of those is a system someone has to protect. This lesson gives you the vocabulary and mental model that every later lesson builds on.',
    keyTerms: [
      { term: 'Asset', meaning: 'Anything of value that needs protecting: data, a device, a service, or a reputation.' },
      { term: 'Confidentiality', meaning: 'Only authorised people can read the information.' },
      { term: 'Integrity', meaning: 'Information and systems are accurate and have not been changed without permission.' },
      { term: 'Availability', meaning: 'The system works when the people who need it need it.' },
      { term: 'Authentication', meaning: 'Proving who you are, for example with a password or a one-time code.' },
      { term: 'Authorisation', meaning: 'Deciding what an authenticated identity is allowed to do.' },
    ],
    sections: [
      {
        title: 'The CIA Triad: three goals behind every control',
        paragraphs: [
          'Security professionals organise every goal under three headings called the CIA triad. Confidentiality means only the right people can read the information — a leaked student result or a stolen mobile money PIN is a confidentiality failure. Integrity means information is accurate and unchanged — an attacker quietly editing a grade or an invoice amount is an integrity failure. Availability means the service works when needed — ransomware locking a hospital system or a surge of junk traffic taking a website offline is an availability failure.',
          'Almost every security control you will ever study protects one or more of these three goals. Almost every incident you will ever investigate breaks at least one of them. When you read a news headline about a breach, your first question should be: which goal failed?',
        ],
        code:
          'Incident                                       Primary failure\n' +
          '---------------------------------------------  ---------------\n' +
          'Student records posted publicly on a forum     Confidentiality\n' +
          'Attacker changes a payee bank account number   Integrity\n' +
          'Ransomware locks a clinic\'s patient database   Availability\n' +
          'Phishing steals a lecturer\'s email password    Confidentiality',
        label: 'Classify by which goal broke first',
      },
      {
        title: 'AAA: who are you, what may you do, what did you do?',
        paragraphs: [
          'Most access decisions follow three steps. Authentication proves identity: a password, a fingerprint, a hardware token. Authorisation decides permission: a student can view their own result; a registrar can edit all results. Accounting records what happened: the log that shows who changed which grade and when.',
          'Multi-factor authentication (MFA) strengthens the first step by requiring two different kinds of proof — something you know, something you have, or something you are. A stolen password on its own is no longer enough to log in. That single control changes the outcome of many real breaches.',
        ],
      },
      {
        title: 'Why the basics still decide most breaches',
        paragraphs: [
          'In 2017, the WannaCry ransomware spread across hospitals, factories, and transport networks in a single day. The underlying flaw in Windows had been patched two months earlier; the organisations that were hit had simply not applied the update. In 2021, attackers entered a major pipeline company through a VPN account that had no MFA enabled and whose password had been exposed in an earlier breach. Two controls — timely patching and a second authentication factor — would have changed both outcomes.',
          'Industry surveys consistently show that stolen or weak credentials and unpatched systems are the leading causes of confirmed breaches year after year. High-skill attacks attract headlines, but the most common path in is ordinary: a password that was reused, a software update that was skipped, or a staff member who clicked a convincing fake message. Cybersecurity begins with the basics, and the basics remain important at every career level.',
        ],
      },
      {
        title: 'Security is a trade-off, not a switch',
        paragraphs: [
          'A computer disconnected from every network and locked in a safe is very secure and completely useless. Real security balances protection against usability and cost. A bank enforces MFA on every login because the risk is high; a public news website does not ask readers for a fingerprint before showing an article. Security professionals do not say no to everything — they ask what is valuable, what could go wrong, and what protection is proportionate to that risk.',
        ],
      },
    ],
    table: {
      headers: ['Goal', 'Failure example', 'Common control'],
      rows: [
        ['Confidentiality', 'Leaked PIN or database posted online', 'Encryption, access control, MFA'],
        ['Integrity', 'Altered grade or changed invoice amount', 'Permissions, audit logs, digital signatures'],
        ['Availability', 'Ransomware or overwhelming junk traffic', 'Backups, patching, redundancy'],
      ],
    },
    exercise: {
      scenario:
        'An attacker logs into a university portal using a lecturer\'s stolen password, downloads a list of student phone numbers, quietly edits three exam results, and deletes the system\'s backup copies.',
      task: 'Name the CIA goal broken by each of the three actions. Then name one control that would have blocked the initial login.',
      answer:
        'Downloading phone numbers breaks confidentiality. Editing exam results breaks integrity. Deleting backups threatens availability by removing the recovery option. Multi-factor authentication on staff logins would have made the stolen password insufficient to log in at all.',
      evidence: 'Write a three-row table: action, CIA goal broken, one control that would prevent or detect it.',
    },
    misconceptions: [
      'Cybersecurity is not only about sophisticated attacks; most real incidents start with ordinary failures like reused passwords and skipped updates.',
      'Availability is a full security goal — an outage can be as damaging as a data leak.',
      'A strong password is not the same as strong authentication; MFA adds a second, independent proof.',
      'Making a system difficult to use to increase security is itself a failure of a different kind.',
    ],
    sources: [
      primarySources.csf,
      primarySources.testing,
      { title: 'NIST SP 800-63B — Digital Identity Guidelines', url: 'https://pages.nist.gov/800-63-3/sp800-63b.html' },
    ],
    labs: [],
    questions: [
      { prompt: 'Which CIA goal is broken when ransomware stops a hospital from opening patient records?', answer: 'availability' },
      { prompt: 'Which step of AAA decides what a logged-in user is allowed to do?', answer: 'authorisation', accept: ['authorization'] },
    ],
    quiz: [
      {
        question: 'An attacker silently changes a supplier invoice to redirect a payment. Which CIA goal is broken?',
        options: ['Integrity', 'Availability', 'Authentication', 'Confidentiality'],
        answer: 0,
        explanation: 'Unauthorised change to data is an integrity failure.',
      },
      {
        question: 'What does MFA add beyond a password?',
        options: ['A second independent proof of identity', 'A longer password requirement', 'Automatic encryption', 'Network isolation'],
        answer: 0,
      },
      {
        question: 'Which statement best explains why the basics matter most in real breaches?',
        options: [
          'Stolen credentials and unpatched systems are the leading causes of confirmed breaches year after year',
          'Nation-state attackers cause the majority of incidents',
          'Only large organisations face real threats',
          'Firewalls alone prevent most incidents',
        ],
        answer: 0,
      },
    ],
  },

  // ── Lesson 2: Threats, risk, and controls ───────────────────────────────────────────────────
  {
    id: 'pre-intro-2',
    slug: 'threats-vulnerabilities-risk-controls',
    title: 'Threats, Vulnerabilities, Risk, and Controls',
    summary: 'Learn the precise vocabulary every security conversation depends on, and the control types that reduce risk across any organisation.',
    minutes: 22,
    prerequisite: 'Complete "What Is Cybersecurity?" or be able to explain the CIA triad.',
    outcomes: [
      'Use threat, vulnerability, exploit, and risk in a sentence without confusing them',
      'Describe the main categories of threat actor and their motivations',
      'Classify a control as preventive, detective, or corrective',
      'Explain defence in depth and least privilege',
    ],
    introduction:
      'Security professionals use a small vocabulary very precisely. Mixing up these terms leads to bad decisions: patching the wrong thing, over-reacting to the wrong headline, or missing the real exposure. Learn these words now and every later lesson — whether offensive or defensive — will make more sense.',
    keyTerms: [
      { term: 'Threat', meaning: 'A person or circumstance that could cause harm, such as a criminal, an insider, or a natural disaster.' },
      { term: 'Vulnerability', meaning: 'A weakness that a threat could exploit: a software bug, a weak password, or an open port that should be closed.' },
      { term: 'Exploit', meaning: 'A method or piece of code that takes advantage of a specific vulnerability.' },
      { term: 'Risk', meaning: 'The combination of how likely a threat is to use a vulnerability and how bad the impact would be.' },
      { term: 'Attack surface', meaning: 'Every place an attacker could try to interact with a system: open network ports, web forms, email inboxes, and staff.' },
      { term: 'Control', meaning: 'A safeguard that reduces risk, such as MFA, a firewall rule, a backup, or a staff awareness session.' },
    ],
    sections: [
      {
        title: 'Four words that must stay separate',
        paragraphs: [
          'A threat is the who or what that could cause harm. A vulnerability is the weakness it could use. An exploit is the specific method. Risk combines the chance of harm with the size of the harm. A threat with no reachable vulnerability is low risk. A serious vulnerability with no plausible threat is also low risk. Risk needs both sides.',
          'Consider a classic example. A criminal (threat) could use an unpatched Windows file-sharing flaw (vulnerability) through a tool built on a leaked government exploit (exploit). Whether that is high risk for your organisation depends on whether that service is exposed, how many machines run it, and what data lives on them.',
        ],
        code:
          'Risk  ≈  Likelihood × Impact\n\n' +
          'Likelihood: Is there a threat? Is the vulnerability reachable? Is an exploit available?\n' +
          'Impact:     What systems? How many people? What data? What operational consequences?',
        label: 'The logic behind every risk decision',
      },
      {
        title: 'Who attacks, and why',
        paragraphs: [
          'Threat actors differ in motivation, skill, and resources. Cybercriminals seek money through ransomware, fraud, or stolen data sold on underground markets — they are the most common threat to everyday organisations. Nation-state groups seek intelligence or the ability to disrupt critical infrastructure; they can be patient and well-resourced. Hacktivists want publicity for a cause and often target websites and public-facing services. Script kiddies run tools they found online against anything that responds, without deep skill. Insiders are staff or contractors who misuse access, deliberately or accidentally.',
          'Accidents deserve their own category. Misconfigured cloud storage, a laptop left in transit, a faulty update applied without testing — these cause real harm with no attacker involved. Good security design expects human error.',
        ],
      },
      {
        title: 'Controls: what they do and what they are made of',
        paragraphs: [
          'A control is grouped two ways. By what it does: preventive controls stop an event from happening (a firewall rule, MFA, encryption at rest). Detective controls notice when something is happening (an alert on unusual login times, a log review, a camera). Corrective controls limit damage and restore normality afterwards (restoring from a clean backup, isolating an infected machine, revoking a compromised account).',
          'By what it is made of: technical controls are software and hardware; administrative controls are policies, procedures, and training; physical controls are locks, badges, and secure rooms. A mature organisation layers all three categories, so that when one control fails another catches the problem. That principle is called defence in depth.',
        ],
      },
      {
        title: 'Two principles that appear in every later lesson',
        paragraphs: [
          'Least privilege means every account, process, or service gets only the access it needs to do its job — a student account cannot change exam grades, a web server process cannot read the financial database. Restricting privilege limits what an attacker can reach after gaining any single foothold.',
          'Zero trust means no user or device is trusted just because it is inside the network perimeter. Every access request is verified regardless of where it comes from. These two principles together shrink the damage any single compromised account or device can cause.',
        ],
      },
      {
        title: 'Responding to a risk: four choices',
        paragraphs: [
          'Once a risk is understood there are four options. Mitigate: add controls to reduce it. Transfer: share it, for example through cyber insurance or a supplier contract. Avoid: stop the risky activity altogether. Accept: decide the remaining risk is tolerable, document that decision, and review it on a schedule. Security teams advise on these options; the person responsible for the business process usually makes the final call.',
        ],
      },
    ],
    table: {
      headers: ['Control type', 'Example', 'What it addresses'],
      rows: [
        ['Preventive (technical)', 'MFA on all staff logins', 'Stolen passwords being enough to log in'],
        ['Detective (technical)', 'Alert on 50 failed logins in one minute', 'Password guessing going unnoticed'],
        ['Corrective (technical)', 'Restore from an offline backup', 'Permanent data loss after ransomware'],
        ['Preventive (administrative)', 'Staff phishing-awareness training', 'Employees giving away credentials'],
        ['Preventive (physical)', 'Locked server room with badge access', 'Unauthorised physical access to hardware'],
      ],
    },
    exercise: {
      scenario:
        'A news report describes a newly disclosed flaw in a popular web server product, scored 9.8 out of 10. Your organisation runs that product, but only on an internal test machine that has no internet exposure and holds no real data.',
      task: 'Is this an emergency? Explain using the words threat, vulnerability, likelihood, and impact. Then choose a risk response.',
      answer:
        'The vulnerability is severe in the abstract, but likelihood is low because the machine is not reachable from the internet, and impact is low because it holds no real data. The right response is to mitigate on a normal patch schedule rather than treating it as an emergency. A score describes the flaw in the worst case; risk describes your specific situation.',
      evidence: 'Write one risk-register row: asset, threat, vulnerability, likelihood (H/M/L), impact (H/M/L), response.',
    },
    misconceptions: [
      'A vulnerability on its own is not a risk; it becomes a risk when a threat can reach it and the impact would be significant.',
      'A high severity score is a starting point, not a final priority; exposure and asset value change the ranking.',
      'Insider threats are often accidental rather than malicious.',
      'Defence in depth requires layers across prevention, detection, and correction — one strong tool is not enough.',
    ],
    sources: [
      primarySources.csf,
      primarySources.testing,
      { title: 'NIST SP 800-30 — Risk Management Guide', url: 'https://csrc.nist.gov/pubs/sp/800/30/r1/final' },
      { title: 'FIRST — CVSS Overview', url: 'https://www.first.org/cvss/' },
    ],
    labs: [],
    questions: [
      {
        prompt: 'What do we call a weakness — such as a software bug or a weak password — that a threat could use?',
        answer: 'vulnerability',
        accept: ['a vulnerability'],
      },
      {
        prompt: 'An alert that fires on 50 failed logins in a minute is which kind of control: preventive, detective, or corrective?',
        answer: 'detective',
        accept: ['detective control'],
      },
    ],
    quiz: [
      {
        question: 'Which sentence uses the four terms correctly?',
        options: [
          'The criminal is the threat; the unpatched flaw is the vulnerability',
          'The flaw is the threat; the criminal is the risk',
          'The exploit is the asset',
          'Risk and vulnerability mean the same thing',
        ],
        answer: 0,
      },
      {
        question: 'What does least privilege mean in practice?',
        options: [
          'Each account gets only the access needed for its role',
          'Junior staff receive no computer access',
          'All administrators share one account',
          'Users must change passwords every 24 hours',
        ],
        answer: 0,
      },
      {
        question: 'An organisation decides a risk is acceptable and documents that decision. Which risk response is this?',
        options: ['Accept', 'Transfer', 'Avoid', 'Mitigate'],
        answer: 0,
      },
    ],
  },

  // ── Lesson 3: The two sides of the profession ───────────────────────────────────────────────
  {
    id: 'pre-intro-3',
    slug: 'defensive-and-offensive-security',
    title: 'Defensive Security and Offensive Security',
    summary: 'Understand what professionals on each side of the field actually do, how they depend on each other, and the shared models both use.',
    minutes: 25,
    prerequisite: 'Complete "Threats, Vulnerabilities, Risk, and Controls".',
    outcomes: [
      'Describe at least three roles on the defensive side and three on the offensive side',
      'Explain the NIST Cybersecurity Framework six functions',
      'Explain what a penetration test is and why the report is the deliverable',
      'Explain why authorisation is the line between security testing and an offence',
    ],
    introduction:
      'Cybersecurity professionals broadly work on one of two sides: defenders who protect, monitor, detect, and respond, and offensive testers who think like attackers to find weaknesses before real attackers do. Neither side is more important. Defenders need to understand attacker thinking; testers need to understand what defenders can see. This lesson introduces both so you can decide which direction interests you.',
    keyTerms: [
      { term: 'Blue team', meaning: 'The defenders: people who protect, monitor, and respond for an organisation.' },
      { term: 'Red team', meaning: 'Authorised testers who simulate a realistic adversary to test whether defences hold.' },
      { term: 'SOC', meaning: 'Security Operations Centre: the team that monitors alerts and coordinates the response to incidents.' },
      { term: 'Penetration test', meaning: 'An authorised, time-limited attempt to find and safely demonstrate weaknesses in a defined scope, ending in a written report.' },
      { term: 'Scope', meaning: 'The exact systems, addresses, and techniques a test is permitted to use.' },
      { term: 'Incident response', meaning: 'The structured process for detecting, containing, removing, and recovering from a security incident.' },
    ],
    sections: [
      {
        title: 'Defensive security: the blue team',
        paragraphs: [
          'The defensive side of the profession protects organisations every day. It includes a wide range of roles. Security Operations Centre (SOC) analysts monitor alert queues, triage events, and escalate confirmed incidents — the most common entry-level role in the field. Incident responders lead the structured process of containing and recovering from confirmed incidents. Digital forensics analysts reconstruct what happened from logs, disk images, and memory. Threat hunters proactively search for attacker activity that never triggered an alert. Detection engineers write and tune the rules that generate those alerts. Security architects design systems and networks to be secure from the start.',
          'The NIST Cybersecurity Framework (CSF), currently at version 2.0, organises all defensive activity into six functions: Govern (strategy, policy, and supply-chain risk), Identify (know your assets and risks), Protect (put safeguards in place), Detect (notice attacks and anomalies), Respond (act on incidents), and Recover (restore services and learn). These functions run continuously and in parallel — they are not a one-time checklist.',
        ],
        code:
          'CSF 2.0 Function  Examples of activity\n' +
          '----------------  ----------------------------------------\n' +
          'Govern            Write security policy; manage supplier risk\n' +
          'Identify          Maintain asset inventory and risk register\n' +
          'Protect           Enforce MFA; apply patches; run staff training\n' +
          'Detect            Monitor SIEM alerts; hunt for anomalies\n' +
          'Respond           Isolate an infected machine; coordinate the incident\n' +
          'Recover           Restore from backup; run a lessons-learned review',
        label: 'NIST CSF 2.0 — six functions at a glance',
      },
      {
        title: 'Offensive security: the red team',
        paragraphs: [
          'The offensive side of the profession is paid to think like attackers — with permission — so that real attackers find less. A vulnerability assessment scans and catalogues known weaknesses across a system without exploiting them. A penetration test goes further: within an agreed scope, testers attempt to safely exploit weaknesses to prove real impact and hand the client a prioritised report of what to fix. A red team engagement emulates a realistic adversary over days or weeks, working toward a specific goal such as reaching sensitive data, while testing whether the defensive team detects and responds.',
          'The difference between a security tester and an unauthorised intruder is not the tools or the techniques — it is written permission for a defined scope. Without that document, the same commands are a criminal offence in Ghana, the UK, the US, and most other countries.',
        ],
      },
      {
        title: 'How an authorised test works',
        paragraphs: [
          'Professional testers follow a methodology. Before any scanning or testing begins, both parties sign a rules of engagement document that states the in-scope targets, the testing window, which techniques are allowed, how any sensitive data found is handled, and an emergency contact on each side. The tester then gathers information about the target, identifies weaknesses, safely demonstrates impact, and produces a written report.',
          'The report is the deliverable. It contains an executive summary in plain language, then each finding with a severity rating, the affected system, clear evidence, exact steps to reproduce it, and practical remediation advice. A finding that cannot be reproduced from the write-up cannot be fixed.',
        ],
        code:
          'Finding:    Student record accessible by changing an ID number in the URL\n' +
          'Severity:   High\n' +
          'System:     https://portal.example.edu/api/results?id=\n' +
          'Evidence:   Logged in as student 1001; changed id=1001 to id=1002; received another student\'s data\n' +
          'Steps:      1) Log in as student 1001  2) Request /api/results?id=1002  3) Observe response\n' +
          'Impact:     Any logged-in student can read any other student\'s personal data\n' +
          'Fix:        On the server, verify the requested record belongs to the requesting user',
        label: 'A finding written so a developer can act on it',
      },
      {
        title: 'How the two sides depend on each other',
        paragraphs: [
          'A defender who understands attacker techniques writes better detection rules — because they know what behaviour to look for. An offensive tester who understands defensive tooling writes better reports — because they know what evidence the SOC would have seen. This is why the same knowledge base, MITRE ATT&CK, is used by both sides: attackers plan against it, defenders detect against it.',
          'Many experienced professionals have worked on both sides at different points in their careers. The skills genuinely transfer. What differs is the daily mindset: defenders ask "would we have seen this?"; testers ask "what could we do from here?"',
        ],
      },
    ],
    table: {
      headers: ['Role', 'Primary question', 'CSF function or test phase'],
      rows: [
        ['SOC Tier 1 analyst', 'Is this alert real or a false positive?', 'Detect'],
        ['Incident responder', 'How far did it spread and how do we stop it?', 'Respond'],
        ['Threat hunter', 'Is something hiding that our alerts missed?', 'Detect'],
        ['Detection engineer', 'Do our rules catch this technique reliably?', 'Detect / Protect'],
        ['Penetration tester', 'Can this weakness be safely exploited for real impact?', 'Exploitation phase'],
        ['Red team operator', 'Could a realistic adversary reach our most valuable data?', 'Full engagement'],
        ['Security architect', 'Is this design secure before we build it?', 'Protect / Govern'],
      ],
    },
    exercise: {
      scenario:
        'A friend invites you to "practise hacking" on a university portal that neither of you owns or has permission to access. They say it is fine because you will not cause any damage and will delete your notes afterwards.',
      task: 'Explain why this is not acceptable, using the words authorisation and scope.',
      answer:
        'Authorisation is written permission from someone with the right to give it, covering a specific scope. Neither of you owns the portal and neither has written permission to test it. Intention and care do not change that. Accessing the system without authorisation is an offence regardless of motivation or whether damage occurs. Acceptable practice requires a written agreement before the first packet is sent.',
      evidence: 'Write one sentence that names the missing document and why it cannot be replaced by good intentions.',
    },
    misconceptions: [
      'Ethical hacking and criminal hacking use the same tools; authorisation and scope are what separate them.',
      'The exciting moment of exploitation is a small part of offensive work; most time goes on research, documentation, and writing.',
      'Blue team work is not passive; detection engineering, threat hunting, and incident response are demanding technical disciplines.',
      'Learning attacker techniques is not only for red teams; a defender who understands attacks writes far better detections.',
    ],
    sources: [
      primarySources.csf,
      primarySources.attack,
      primarySources.testing,
      { title: 'Penetration Testing Execution Standard (PTES)', url: 'https://pentest-standard.readthedocs.io/' },
      { title: 'OWASP — Web Security Testing Guide', url: 'https://owasp.org/www-project-web-security-testing-guide/' },
    ],
    labs: [],
    questions: [
      { prompt: 'What is the written agreement that sets scope, timing, and limits for an authorised test called?', answer: 'rules of engagement', accept: ['rules of engagement document'] },
      { prompt: 'Which NIST CSF 2.0 function covers monitoring alerts and noticing attacks: Identify, Protect, or Detect?', answer: 'detect', accept: ['Detect'] },
    ],
    quiz: [
      {
        question: 'What makes a security test legal and ethical?',
        options: [
          'Written authorisation for a defined scope from someone with the right to give it',
          'Using only open-source tools',
          'Not keeping notes afterwards',
          'Only testing at night when fewer users are online',
        ],
        answer: 0,
      },
      {
        question: 'Which offensive engagement mainly tests whether the defensive team detects and responds to a realistic adversary?',
        options: ['Red team engagement', 'Vulnerability scan', 'Patch review', 'Log rotation'],
        answer: 0,
      },
      {
        question: 'What is the final deliverable of a penetration test?',
        options: [
          'A written report with findings, evidence, and remediation steps',
          'A list of IP addresses that responded to pings',
          'The admin password',
          'A screenshot of the target website',
        ],
        answer: 0,
      },
    ],
  },

  // ── Lesson 4: Choosing a direction ──────────────────────────────────────────────────────────
  {
    id: 'pre-intro-4',
    slug: 'careers-and-choosing-a-direction',
    title: 'Careers and Choosing a Direction',
    summary: 'Map the cybersecurity career landscape, understand what employers look for at entry level, and decide which path to explore first.',
    minutes: 20,
    prerequisite: 'Complete "Defensive Security and Offensive Security".',
    outcomes: [
      'Name the five NICE Framework work role categories',
      'Describe the most common entry-level roles on each side of the field',
      'Explain why foundations — networking, Linux, scripting — matter on both paths',
      'State two things that build a credible portfolio before the first job',
    ],
    introduction:
      'Cybersecurity is one of the fastest-growing fields in technology and one of the most genuinely skill-short. Industry surveys show that most hiring managers report gaps in the skills they need, not just the headcount. That means learners who build real, demonstrable ability — not just certificates — are in demand. This lesson maps the field so you can choose where to focus your energy.',
    keyTerms: [
      { term: 'SOC analyst', meaning: 'An entry-level defensive role: monitoring alerts, triaging events, and escalating confirmed incidents.' },
      { term: 'Penetration tester', meaning: 'An offensive role: authorised testing of systems to find and demonstrate weaknesses.' },
      { term: 'GRC', meaning: 'Governance, Risk, and Compliance: the part of the field that manages policy, risk assessments, and regulatory requirements.' },
      { term: 'CTF', meaning: 'Capture The Flag: a competition or practice challenge where participants solve security puzzles to find hidden flags.' },
      { term: 'Portfolio', meaning: 'A collection of practical work — lab write-ups, CTF solutions, home-lab projects — that shows what you can actually do.' },
    ],
    sections: [
      {
        title: 'The NICE Framework: how the field is officially organised',
        paragraphs: [
          "The NICE Workforce Framework for Cybersecurity (NIST SP 800-181), maintained by CISA, organises the field into five work role categories with 42 work roles in total. Oversight and Governance (17 roles) covers policy, strategy, and leadership. Design and Development (9 roles) covers security architecture and secure software. Implementation and Operation (7 roles) covers systems administration, database administration, and network operations. Protection and Defense (7 roles) covers incident response, threat analysis, and vulnerability analysis. Investigation (2 roles) covers digital evidence analysis and cybercrime investigation.",
          'These categories are reference architecture for employers and educators, not rigid job boundaries. Real job titles vary enormously between organisations. A "Security Engineer" at one company is an architect; at another, a SOC analyst. What matters is understanding which skills a role needs, not matching the label exactly.',
        ],
      },
      {
        title: 'Common entry points',
        paragraphs: [
          'On the defensive side, SOC Tier 1 analyst is the highest-volume entry-level role. It requires careful reading of alerts and logs, following documented playbooks, clear written escalations, and the ability to stay focused on repetitive work without missing something important. Skills needed: basic networking (IP, DNS, ports), log reading, familiarity with one SIEM platform, and clear written communication.',
          'On the offensive side, junior penetration testing roles are fewer and usually expect demonstrable practical skill across web applications, networking, and either Linux or Windows. Most people enter offensive work after a year or two in a technical role such as sysadmin, helpdesk, or SOC, then move into testing once they have built both the knowledge and a portfolio of practical lab work.',
          'GRC roles — policy, risk assessments, vendor reviews, compliance — are a third entry path that suits people who are strong writers and analysts. They are valuable at every organisation size and do not require deep technical skills to start, though a technical foundation makes you more effective.',
        ],
      },
      {
        title: 'Why foundations matter on every path',
        paragraphs: [
          'Networking, Linux, Windows, and scripting appear in every cybersecurity role. A SOC analyst reading a firewall log needs to understand IP addresses, ports, and protocols. A penetration tester needs to move through a Linux terminal fluently. A detection engineer writes Python or PowerShell to automate log analysis. A GRC analyst reading a cloud configuration needs to understand what permissions mean.',
          'This is exactly why the DarkWorld pre-security path covers those foundations before any specialisation. The goal is not to teach every tool — it is to build the vocabulary and habits that make every later lesson faster and clearer.',
        ],
      },
      {
        title: 'Building a portfolio before the first job',
        paragraphs: [
          'Employers in security pay attention to what candidates have done, not only what certificates they hold. A portfolio of practical work demonstrates ability more convincingly than a certificate name. Practical work includes: completed lab write-ups (like the ones you produce on this platform) that show evidence-led thinking; CTF (Capture The Flag) challenge write-ups from platforms such as picoCTF or OverTheWire; and home-lab projects such as building a small network, running a vulnerability scanner in a controlled environment, or setting up a log-collection stack.',
          'Write-ups matter as much as the work itself. A write-up that explains what you did, what you found, and what you concluded shows professional communication — which every security role needs. Keep them in a portfolio, a blog, or a GitHub repository that you can share in an application.',
        ],
        code:
          'Free practice resources\n' +
          '--------------------------------\n' +
          'picoCTF          Beginner CTF challenges (Carnegie Mellon)\n' +
          'OverTheWire      Linux wargames starting from zero (Bandit)\n' +
          'CyberDefenders   Blue team practice labs\n' +
          'roadmap.sh       Structured cyber security learning map',
        label: 'Start here — all free, no signup required for some',
      },
      {
        title: 'Which direction is right for you?',
        paragraphs: [
          'If you enjoy reading evidence, building systems, and asking "would we have caught this?" — defensive work is likely a good fit. If you enjoy puzzles, persistence, creative problem-solving, and asking "what could I do from here?" — offensive work may suit you better. If you are drawn to policy, writing, and organisational risk — GRC is a legitimate and well-paid path that is often overlooked by technical learners.',
          'Most professionals develop understanding of both sides over time. This path covers the technical foundations — networking, packet reading, web request analysis, forensic basics — that are genuinely useful on every route. After the foundations, the DarkWorld offensive and defensive paths diverge so you can go deeper in your chosen direction.',
        ],
      },
    ],
    table: {
      headers: ['Direction', 'Common first role', 'Key skills to build first'],
      rows: [
        ['Defensive', 'SOC Tier 1 analyst', 'Networking basics, log reading, one SIEM, clear writing'],
        ['Offensive', 'Junior penetration tester (after a foundation role)', 'Web tech, Linux fluency, networking, scripting'],
        ['GRC', 'Junior risk or compliance analyst', 'Policy writing, risk frameworks, vendor communication'],
        ['Forensics / IR', 'Junior analyst (often in a SOC first)', 'Log analysis, file systems, evidence handling, clear writing'],
      ],
    },
    readinessChecklist: [
      'I can explain the CIA triad and AAA in plain language.',
      'I understand the difference between a threat, a vulnerability, and a risk.',
      'I know what authorisation means and why it is non-negotiable in security work.',
      'I have an idea of which direction — defensive, offensive, or GRC — I want to explore first.',
      'I know that foundations (networking, Linux, scripting) matter on every path.',
    ],
    exercise: {
      scenario:
        'You are applying for a Tier 1 SOC analyst role. The job description asks for "familiarity with log analysis, basic networking, and clear written communication." You have completed the DarkWorld pre-security foundations, solved 10 CTF challenges, and kept lab notes for each.',
      task: 'Write three sentences describing your practical experience that directly address those three requirements.',
      answer:
        'For log analysis: working through Wireshark and Autopsy labs, I practised reading packet captures and file-system evidence to find specific artefacts and write findings that state only what the evidence shows. For networking: across five networking labs, I interpreted DNS lookups, TCP connections, and HTTP exchanges, and I can explain what each protocol layer does and why it matters in an alert. For communication: I keep structured write-ups for every lab and CTF challenge, each with an objective, the commands or tools used, the evidence observed, and a limitation statement.',
      evidence: 'Three sentences, one per requirement, each pointing at a specific piece of practical work.',
    },
    misconceptions: [
      'A certificate name alone does not demonstrate practical ability; employers want to see evidence of what you can do.',
      'You do not need to be a programmer to work in security, but basic scripting makes almost every role faster.',
      'GRC is not a soft option; policy and risk work has a direct impact on an organisation\'s security posture.',
      'Defensive and offensive skills reinforce each other — time spent on one side makes you better on the other.',
    ],
    sources: [
      primarySources.nice,
      { title: 'CISA NICCS — NICE Framework work roles', url: 'https://niccs.cisa.gov/workforce-development/nice-framework' },
      { title: 'picoCTF — free beginner challenges', url: 'https://picoctf.org/' },
      { title: 'OverTheWire — Bandit wargame', url: 'https://overthewire.org/wargames/bandit/' },
      { title: 'roadmap.sh — Cyber Security roadmap', url: 'https://roadmap.sh/cyber-security' },
    ],
    labs: [],
    questions: [
      { prompt: 'Which NICE Framework category contains Incident Response and Threat Analysis work roles?', answer: 'protection and defense', accept: ['protection and defence', 'Protection and Defense', 'Protection and Defence'] },
      { prompt: 'What do we call a competition or practice challenge where participants solve security puzzles to find hidden flags?', answer: 'CTF', accept: ['capture the flag', 'Capture The Flag'] },
    ],
    quiz: [
      {
        question: 'Which statement about entry-level offensive security roles is most accurate?',
        options: [
          'Junior penetration testing roles usually expect demonstrable practical skill and are fewer than defensive entry roles',
          'Junior penetration testing is the easiest way to enter the field',
          'No experience is needed to start offensive work',
          'Offensive roles only require knowledge of one tool',
        ],
        answer: 0,
      },
      {
        question: 'Why do employers value lab write-ups and CTF solutions in a portfolio?',
        options: [
          'They demonstrate practical ability and professional communication more directly than a certificate name alone',
          'They prove you have an expensive subscription',
          'They are required by law for security roles',
          'They replace the need for networking knowledge',
        ],
        answer: 0,
      },
      {
        question: 'Which foundations appear across every cybersecurity career direction?',
        options: [
          'Networking, Linux, Windows, and scripting',
          'Graphic design and project management only',
          'Only penetration testing tools',
          'Only log analysis',
        ],
        answer: 0,
      },
    ],
  },
];
