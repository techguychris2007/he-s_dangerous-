import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

const sources = {
  logs: { title: 'NIST SP 800-92 — Guide to Computer Security Log Management', url: 'https://csrc.nist.gov/pubs/sp/800/92/final' },
  forensics: { title: 'NIST SP 800-86 — Guide to Integrating Forensic Techniques into Incident Response', url: 'https://csrc.nist.gov/pubs/sp/800/86/final' },
};

/** A quiz item with the correct option placed at `position`, so answers are not always first. */
const q = (question: string, correct: string, wrong: string[], position: number) => ({ question, options: [...wrong.slice(0, position), correct, ...wrong.slice(position)], answer: position });

/** Foundations module "Logs, Evidence & Incident Basics": general concepts, no single tool. */
export const beginnerSecurityLessons: CurriculumLesson[] = [
  {
    id: 'pre-security-1', slug: 'risk-threats-and-security-controls', title: 'Logs: What Systems Record', summary: 'Learn what logs are, which events matter most, and why time, consistency and central collection decide whether logs can answer questions later.', minutes: 20,
    prerequisite: 'Know what an operating system, an account and a web request are.',
    outcomes: ['Explain what a log entry records', 'Name the event types defenders care about most', 'Explain why accurate time and central collection matter'],
    introduction: 'Computers keep diaries. Operating systems, applications, firewalls and cloud services write a line every time something notable happens: a sign-in, a failed password, a file change, a blocked connection. When something goes wrong, those lines are often the only record of what happened, so defenders spend much of their time collecting and reading them.',
    keyTerms: [
      { term: 'Log', meaning: 'A recorded list of events from a system or application, usually with a timestamp.' },
      { term: 'Event', meaning: 'Something that happened and was recorded, such as a sign-in or a file deletion.' },
      { term: 'Timestamp', meaning: 'The date and time an event was recorded; UTC is used to compare systems reliably.' },
      { term: 'SIEM', meaning: 'Security information and event management: a system that collects logs centrally so they can be searched and alerted on.' },
    ],
    readinessChecklist: ['You can name the who, what, when and where fields of a log entry.', 'You can list four event types worth collecting.', 'You can explain why logs should be copied off the machine that produced them.'],
    sections: [
      { title: 'Anatomy of a log entry', paragraphs: ['A useful log entry answers who did what, when, where and with what result. A sign-in event, for example, records the account, the time, the device or address it came from, and whether it succeeded.', 'Different systems format logs differently, but the questions are the same. Reading logs well starts with finding those fields and noticing which ones are missing.'], code: '2026-03-14T09:12:44Z  host=web01  event=login  user=alice  src=203.0.113.25  result=failure\n2026-03-14T09:12:51Z  host=web01  event=login  user=alice  src=203.0.113.25  result=failure\n2026-03-14T09:13:02Z  host=web01  event=login  user=alice  src=203.0.113.25  result=success', label: 'Three sign-in events: two failures, then a success from the same address' },
      { title: 'Events that matter most', paragraphs: ['Defenders prioritise events that show access and change: sign-ins and failures, new accounts or privilege changes, software installs, service starts, security tool alerts, and network connections in and out.', 'Logging everything forever is expensive and noisy; logging nothing leaves you blind. Organisations decide what to keep and for how long based on risk and legal requirements.'] },
      { title: 'Time and central collection', paragraphs: ['To build a story across several systems, their clocks must agree. Systems synchronise time over the network and record it in UTC, so a sign-in on one server can be lined up with a file change on another.', 'Attackers who gain control of a machine may delete its logs. Sending logs to a central system, such as a SIEM, keeps a copy out of their reach and lets analysts search everything in one place. DarkWorld\'s SOC casebooks let you practise exactly this kind of search.'] },
    ],
    table: { headers: ['Event', 'Why it matters', 'Example question'], rows: [['Failed sign-ins', 'Password guessing', 'Did many failures come from one address?'], ['New admin account', 'Attackers keeping access', 'Who created it, and when?'], ['Software install', 'Malware or unapproved tools', 'What was installed right after the sign-in?'], ['Outbound connection', 'Data leaving or remote control', 'Which host talked to an unfamiliar address?']] },
    exercise: { scenario: 'You see twenty failed sign-ins for one account from one address, followed by a successful sign-in from the same address a minute later.', task: 'What might this mean, and what would you check next?', answer: 'It may be password guessing that succeeded. Next, check what the account did after signing in, whether the address is known, whether multi-factor authentication was used, and whether other accounts saw failures from the same address.', evidence: 'Quote the timestamps, account, address and results that support each statement.' },
    misconceptions: ['A missing log entry does not prove something did not happen.', 'Logs on a compromised machine may have been changed or deleted.', 'Comparing times across systems only works if their clocks agree.'],
    sources: [sources.logs, primarySources.ir],
    labs: [],
    questions: [{ prompt: 'What kind of system collects logs centrally so they can be searched and alerted on?', answer: 'SIEM', accept: ['security information and event management'], hint: 'Four letters; DarkWorld casebooks simulate one.' }],
    quiz: [
      q('Which fields make a log entry most useful?', 'Who, what, when, where and the result', ['Only the colour of the text', 'The file size of the log', 'The name of the monitor'], 1),
      q('Why record time in UTC?', 'So events from different systems can be compared reliably', ['Because it is faster to type', 'To hide events from attackers', 'Because local time is illegal'], 2),
      q('Why send logs to a central system?', 'An attacker on one machine cannot easily erase the copy', ['To make the network slower', 'To avoid ever reading them', 'Because logs cannot be stored locally'], 0),
    ],
  },
  {
    id: 'pre-security-2', slug: 'passwords-cryptography-and-personal-security', title: 'Digital Evidence: Integrity and Chain of Custody', summary: 'Learn how investigators collect digital evidence without changing it, prove it is unchanged with hashes, and keep a record of who handled it.', minutes: 22,
    prerequisite: 'Know what files and logs are.',
    outcomes: ['Explain why evidence must not be changed', 'Describe how a hash proves integrity', 'Explain chain of custody and the order of volatility'],
    introduction: 'Evidence is only useful if others can trust it. If an investigator opens and edits a suspect file, or cannot say who had a disk last week, conclusions built on it become doubtful, and in legal cases may be rejected. Digital forensics is about collecting carefully, proving nothing changed, and claiming only what the evidence supports.',
    keyTerms: [
      { term: 'Digital evidence', meaning: 'Information stored or sent in digital form that can support or disprove a claim.' },
      { term: 'Hash', meaning: 'A fixed-length fingerprint of data; any change to the data gives a completely different hash.' },
      { term: 'Chain of custody', meaning: 'A record of who collected, held and transferred evidence, and when.' },
      { term: 'Order of volatility', meaning: 'Collecting the most short-lived evidence first, such as memory before disk.' },
    ],
    readinessChecklist: ['You can explain why investigators work on copies, not originals.', 'You can describe how comparing two hashes proves a copy is identical.', 'You can list what a chain of custody record contains.'],
    sections: [
      { title: 'Do not change the evidence', paragraphs: ['Simply opening a file or starting a computer can change dates and data. Investigators therefore make an exact copy (an image) of the evidence, often using a write blocker that prevents any change to the original, and then examine only the copy.', 'Their notes record what was done, when, and why, so another person could repeat the work and get the same result.'] },
      { title: 'Hashes prove integrity', paragraphs: ['A hash function such as SHA-256 turns any amount of data into a short fingerprint. Change a single character and the fingerprint changes completely. Investigators hash the original and the copy; if the values match, the copy is identical.', 'Hashing again later shows the evidence has not changed since. Hashes are also used to recognise known files, such as a known piece of malware, without opening them.'], code: 'sha256  original-disk.img  9f2c...e41a\nsha256  working-copy.img   9f2c...e41a   (match: identical copy)\nsha256  edited-copy.img    41b7...0c93   (different: the data changed)', label: 'Matching hashes prove a copy is identical' },
      { title: 'Chain of custody and volatility', paragraphs: ['Chain of custody records every person who handled the evidence, when, where it was stored, and why it moved. Gaps in that record let others argue the evidence could have been altered.', 'Some evidence disappears quickly. Memory contents vanish when a machine powers off; network connections close; logs roll over. The order of volatility says to collect the most short-lived evidence first, which is why responders think before simply unplugging a machine.'] },
    ],
    table: { headers: ['Practice', 'Protects', 'Example'], rows: [['Work on a copy', 'The original evidence', 'Image the disk, examine the image'], ['Hash and compare', 'Proof of integrity', 'Original and copy have the same SHA-256'], ['Chain of custody', 'Trust in who handled it', 'Signed log of each transfer'], ['Order of volatility', 'Short-lived evidence', 'Capture memory before shutting down']] },
    exercise: { scenario: 'A manager finds a suspicious laptop, opens several files to "have a look", then hands it to IT without writing anything down.', task: 'Explain two problems this causes for an investigation and what should have happened.', answer: 'Opening files changed data and timestamps, and there is no record of who handled the laptop or when, so the evidence is harder to trust. The laptop should have been left as found, its handling recorded, and an exact copy made and hashed before examination.', evidence: 'Link each problem to integrity or chain of custody.' },
    misconceptions: ['Looking at a file can change it.', 'A hash proves data has not changed; it does not say whether the data is good or bad.', 'Turning a machine off can destroy useful evidence in memory.'],
    sources: [sources.forensics, primarySources.ir],
    labs: [],
    questions: [{ prompt: 'What is the record of who collected, held and transferred evidence called?', answer: 'chain of custody', hint: 'A chain of people who had custody.' }],
    quiz: [
      q('Why do investigators examine a copy instead of the original?', 'So the original stays unchanged and trustworthy', ['Because copies are always faster', 'To delete the original afterwards', 'Because originals cannot be read'], 3),
      q('What does it mean if the original and copy have the same hash?', 'The copy is identical to the original', ['The files contain malware', 'The files are encrypted', 'The copy is newer'], 0),
      q('According to the order of volatility, what is usually collected first?', 'Memory contents', ['Printed documents', 'Archived backups', 'The building floor plan'], 2),
    ],
  },
  {
    id: 'pre-security-3', slug: 'authorization-ethics-and-evidence', title: 'Responding to Incidents', summary: 'Walk through how organisations prepare for, detect, contain and recover from security incidents, and why lessons learned matter as much as the fix.', minutes: 22,
    prerequisite: 'Know what logs and digital evidence are.',
    outcomes: ['Describe the phases of incident response', 'Explain containment, eradication and recovery with an example', 'Explain why communication and lessons learned are part of the job'],
    introduction: 'An incident is anything that threatens the confidentiality, integrity or availability of systems or data: a phishing click, ransomware, a stolen laptop, a leaked password. Organisations that respond well are not the ones that never get attacked; they are the ones that prepared a plan, notice quickly, limit the damage and learn from it.',
    keyTerms: [
      { term: 'Incident', meaning: 'An event that actually or potentially harms the confidentiality, integrity or availability of systems or data.' },
      { term: 'Containment', meaning: 'Stopping an incident from spreading or causing more harm, such as isolating an infected computer.' },
      { term: 'Eradication', meaning: 'Removing the cause, such as malware or an attacker\'s access.' },
      { term: 'Recovery', meaning: 'Returning systems to normal, safe operation and confirming they stay that way.' },
      { term: 'Lessons learned', meaning: 'A review after an incident to improve defences and the response itself.' },
    ],
    readinessChecklist: ['You can name the incident response phases in order.', 'You can give a containment step for a malware infection.', 'You can explain why the response does not end when systems are back online.'],
    sections: [
      { title: 'Prepare before anything happens', paragraphs: ['Preparation means knowing what you have and who does what: an inventory of systems, logging in place, contact lists, a written plan, and practice exercises. NIST\'s incident response guidance places this inside an organisation\'s wider risk management, alongside the Cybersecurity Framework\'s govern, identify and protect functions.', 'Without preparation, the first hours of an incident are spent finding passwords, phone numbers and log access instead of responding.'] },
      { title: 'Detect, analyse, contain', paragraphs: ['Detection comes from alerts, logs, users reporting something odd, or outside notifications. Analysis asks: is this real, what is affected, and how bad is it? Analysts build a timeline from logs and evidence, as in DarkWorld\'s SOC casebooks.', 'Containment limits the damage: isolate an infected computer from the network, disable a compromised account, block a malicious address. Short-term containment buys time; it should preserve evidence where possible so the investigation can continue.'] },
      { title: 'Eradicate, recover, learn', paragraphs: ['Eradication removes the cause: delete the malware, close the vulnerability that let it in, reset stolen passwords. Recovery restores systems, often from clean backups, and watches them closely to confirm the attacker has not returned.', 'Afterwards, a lessons-learned review asks what happened, what worked, what did not and what will change. Throughout, clear communication with management, affected people and sometimes regulators is part of the response, not an afterthought.'] },
    ],
    table: { headers: ['Phase', 'Goal', 'Ransomware example'], rows: [['Prepare', 'Be ready before an incident', 'Offline backups and a tested plan'], ['Detect and analyse', 'Confirm and scope it', 'Alerts show files being encrypted on two servers'], ['Contain', 'Stop the spread', 'Disconnect the affected servers from the network'], ['Eradicate and recover', 'Remove the cause and restore', 'Rebuild servers, restore from clean backups'], ['Lessons learned', 'Improve', 'Add multi-factor authentication to remote access']] },
    exercise: { scenario: 'An employee reports their computer shows a ransom note and files have strange extensions. Other computers on the same network share are still working.', task: 'List your first three actions in order and explain each.', answer: 'First contain: disconnect the computer from the network to stop it encrypting shared files. Then analyse and scope: check logs and other machines for the same activity and identify how it started. Then escalate and communicate under the incident plan, preserving evidence before wiping anything.', evidence: 'Tie each action to a phase and the harm it prevents.' },
    misconceptions: ['Incident response is not just restoring from backup; the cause must be removed too.', 'Wiping a machine immediately can destroy evidence needed to understand the attack.', 'An incident is not over until lessons are learned and acted on.'],
    sources: [primarySources.ir, primarySources.csf],
    labs: [],
    questions: [{ prompt: 'Which incident response phase limits the damage, for example by isolating an infected computer?', answer: 'containment', accept: ['contain'], hint: 'Keep it from spreading.' }],
    quiz: [
      q('Which phase happens before any incident?', 'Preparation', ['Eradication', 'Recovery', 'Lessons learned'], 0),
      q('What is a good containment step for an infected computer?', 'Isolate it from the network', ['Post about it publicly', 'Ignore it until the weekend', 'Give it more permissions'], 3),
      q('Why hold a lessons-learned review?', 'To improve defences and the response for next time', ['To find someone to blame', 'Because backups require it', 'To delete the evidence'], 1),
    ],
  },
];
