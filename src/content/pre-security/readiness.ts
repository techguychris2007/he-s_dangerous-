import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

/** A quiz item with the correct option placed at `position`, so answers are not always first. */
const q = (question: string, correct: string, wrong: string[], position: number) => ({ question, options: [...wrong.slice(0, position), correct, ...wrong.slice(position)], answer: position });

/** Pre-security capstone: general professional habits, no single tool. */
export const readinessLessons: CurriculumLesson[] = [
  {
    id: 'pre-ready-1', slug: 'first-lab-observe-explain-repeat', title: 'Thinking Like a Security Professional', summary: 'Practise the habit behind every security job: start with a question, gather evidence, claim only what it supports, and stay inside your authorisation.', minutes: 20,
    prerequisite: 'Complete the earlier pre-security modules.',
    outcomes: ['Turn a vague worry into a specific, answerable question', 'Match a question to the kind of evidence that can answer it', 'Separate what you observed from what you concluded'],
    introduction: 'Attackers and defenders use different techniques, but good ones think the same way. They ask a precise question, look for the evidence that can answer it, and say only what that evidence supports. This habit matters more than any single technique, because techniques change every year and the habit does not.',
    keyTerms: [
      { term: 'Hypothesis', meaning: 'A specific, testable idea about what happened, such as "the account was signed into from an unknown address".' },
      { term: 'Observation', meaning: 'Something you directly saw in the evidence, stated without interpretation.' },
      { term: 'Conclusion', meaning: 'What you infer from one or more observations, with its limits stated.' },
      { term: 'Authorisation', meaning: 'Written permission defining which systems and actions you may test; without it, testing is not allowed.' },
    ],
    readinessChecklist: ['You can rewrite "something is wrong with the server" as a testable question.', 'You can name which kind of evidence answers a question about sign-ins, network traffic or web access.', 'You can write one observation and one conclusion about the same evidence.'],
    sections: [
      { title: 'Question first', paragraphs: ['"Is the server hacked?" is too big to answer. "Did anyone sign in as admin from outside the company this week?" can be checked. Good investigators and testers break big worries into small questions with yes, no or unknown answers.', 'Writing the question down first also stops you wandering. If an action does not help answer the current question, it can wait.'] },
      { title: 'Match the question to the evidence', paragraphs: ['Each kind of evidence answers different questions. Sign-in and account logs answer who accessed what. Network records answer which systems talked to each other. Web requests and responses answer what an application allowed. Files and their hashes answer what changed or was installed.', 'If the evidence you have cannot answer your question, say so and find better evidence rather than stretching what you have.'] },
      { title: 'Observe, conclude, stay in scope', paragraphs: ['An observation is what you saw: "20 failed sign-ins for alice from 203.0.113.25, then one success." A conclusion is what it suggests: "alice\'s password was likely guessed." Keeping them separate lets others check your reasoning and disagree with the conclusion without doubting the facts.', 'All of this happens inside authorisation. In DarkWorld every target is simulated and in scope. In the real world you need written permission that names the systems and actions allowed, and you stop the moment something falls outside it.'] },
    ],
    table: { headers: ['Question', 'Evidence that can answer it', 'Evidence that cannot'], rows: [['Who signed in as admin this week?', 'Sign-in and account logs', 'A list of installed programs'], ['Did a workstation talk to an unknown address?', 'Network or firewall records', 'A password policy document'], ['Can a user see another user\'s data?', 'Web requests and responses with two test accounts', 'The website\'s home page design'], ['Was a file changed after the incident?', 'Hashes compared with a known-good copy', 'The file\'s name alone']] },
    exercise: { scenario: 'A manager says, "I think someone has been in our email system."', task: 'Write two specific questions, the evidence for each, and one thing you could not conclude from that evidence alone.', answer: 'Example: "Were there sign-ins to any mailbox from unfamiliar locations in the last 14 days?" (sign-in logs) and "Were any mail forwarding rules created recently?" (mailbox audit logs). Sign-in logs alone cannot show what the person read once inside.', evidence: 'Each question names one evidence source and one limitation.' },
    misconceptions: ['Running more tools does not replace asking a better question.', 'A conclusion without its supporting observation is an opinion.', 'Having access to a system is not the same as being authorised to test it.'],
    sources: [primarySources.testing, primarySources.ir],
    labs: [],
    questions: [{ prompt: 'What is the written permission that defines which systems and actions you may test called?', answer: 'authorisation', accept: ['authorization', 'authorisation letter', 'scope'], hint: 'Without it, testing is not allowed.' }],
    quiz: [
      q('Which is the best investigation question?', 'Did anyone sign in as admin from outside the company this week?', ['Is everything hacked?', 'Are computers safe?', 'Why is security hard?'], 2),
      q('Which statement is an observation, not a conclusion?', '20 failed sign-ins for alice, then one success, from the same address', ['Alice is the attacker', 'The company was definitely breached', 'The password policy caused this'], 0),
      q('What must you have before testing a real system?', 'Written authorisation that names the systems and actions', ['A fast internet connection', 'A free trial of a tool', 'Curiosity'], 3),
    ],
  },
  {
    id: 'pre-ready-2', slug: 'evidence-notes-and-professional-reports', title: 'Professional Notes and Reports', summary: 'Write notes another person can check and reports a non-technical reader can act on, including honest limitations.', minutes: 18,
    prerequisite: 'Know the difference between an observation and a conclusion.',
    outcomes: ['Write a five-line evidence note', 'State limitations without weakening your findings', 'Explain why reports need both technical and plain-language parts'],
    introduction: 'Work that is not written down did not happen, as far as anyone else is concerned. Security professionals spend a surprising amount of time writing: notes while they work, and reports when they finish. Clear writing is what turns your effort into decisions other people can make.',
    keyTerms: [
      { term: 'Evidence note', meaning: 'A short record of what you did, what you saw and what it means, written as you work.' },
      { term: 'Limitation', meaning: 'Something your evidence cannot show, stated openly.' },
      { term: 'Executive summary', meaning: 'A short, plain-language section of a report for decision-makers.' },
      { term: 'Reproducible', meaning: 'Described clearly enough that someone else can repeat the steps and get the same result.' },
    ],
    readinessChecklist: ['You can write a note with time, action, observation, conclusion and limitation.', 'You can rewrite a technical finding for a manager in two sentences.', 'You can caption a screenshot so it explains itself.'],
    sections: [
      { title: 'The five-line note', paragraphs: ['A good working note has five parts: when, what you did, what you observed, what you conclude, and what you cannot yet say. It takes a minute to write and saves hours later.', 'Write it at the time, not from memory at the end. Notes made during the work are more accurate and more trusted.'], code: 'Time:        2026-03-14 09:40 UTC\nAction:      Reviewed sign-in log for the VPN, 08:00-10:00 UTC\nObserved:    20 failures for alice from 203.0.113.25, then success at 09:13:02\nConclusion:  alice\'s password was probably guessed\nLimitation:  The log does not show what alice\'s session did after sign-in', label: 'A five-line evidence note' },
      { title: 'Limitations make findings stronger', paragraphs: ['Saying what your evidence cannot show is not a weakness. It tells the reader exactly how far to trust each finding and what to check next. Reviewers trust analysts who state limits more than those who sound certain about everything.', 'Common limitations are missing logs, encrypted traffic you could not read, time ranges you did not cover, and systems you were not authorised to examine.'] },
      { title: 'Writing for two audiences', paragraphs: ['A report usually has an executive summary for managers (what happened, how serious it is, what to do) and technical detail for the people who will fix it (exact steps, evidence and recommendations).', 'Screenshots and excerpts need captions that say what to notice and why it matters. A screenshot without a caption makes the reader do your analysis again.'] },
    ],
    table: { headers: ['Section', 'Reader', 'Contains'], rows: [['Executive summary', 'Managers', 'What happened, impact, decisions needed'], ['Findings', 'Technical teams', 'Evidence, severity and affected systems'], ['Recommendations', 'Both', 'Specific, prioritised fixes'], ['Limitations', 'Both', 'What was not covered or could not be shown']] },
    exercise: { scenario: 'You found that a web application lets any signed-in user view other users\' invoices by changing a number in the address.', task: 'Write a two-sentence executive summary and one limitation.', answer: 'Summary: Any customer can view other customers\' invoices, exposing names, addresses and purchase history. The application must check that each invoice belongs to the signed-in customer before showing it. Limitation: we tested invoices only; other pages may have the same weakness.', evidence: 'The summary states impact and the fix without jargon.' },
    misconceptions: ['A longer report is not a better report.', 'Admitting a limitation does not undermine a finding.', 'Managers need impact and decisions, not raw logs.'],
    sources: [primarySources.testing],
    labs: [],
    questions: [{ prompt: 'What is the short, plain-language part of a report written for decision-makers called?', answer: 'executive summary', hint: 'It comes first and avoids jargon.' }],
    quiz: [
      q('Which part of a five-line note says what your evidence cannot show?', 'Limitation', ['Time', 'Action', 'Observed'], 3),
      q('Who is the executive summary written for?', 'Managers and decision-makers', ['Only attackers', 'The operating system', 'Search engines'], 1),
      q('What should a screenshot in a report have?', 'A caption saying what to notice and why it matters', ['As many colours as possible', 'No explanation at all', 'The tester\'s password'], 0),
    ],
  },
  {
    id: 'pre-ready-3', slug: 'offensive-lab-readiness-capstone', title: 'Pre-Security Capstone: Putting It Together', summary: 'Work one realistic incident through every module of this path, check your readiness, and choose the path you want to follow next.', minutes: 25,
    prerequisite: 'Complete every earlier module in the pre-security path.',
    outcomes: ['Apply concepts from every pre-security module to one scenario', 'Check your readiness against the path\'s core skills', 'Choose a next path based on the work you enjoyed'],
    introduction: 'Real incidents do not arrive sorted by topic. A single compromise can involve a weak password, a web application flaw, a privileged account, network traffic, logs and a response plan, all at once. This capstone walks one scenario through everything you have learned, then helps you decide where to go next.',
    keyTerms: [
      { term: 'Attack chain', meaning: 'The sequence of steps an attacker takes, from first access to their goal.' },
      { term: 'Defence in depth', meaning: 'Layering several controls so one failure does not lead to full compromise.' },
      { term: 'Root cause', meaning: 'The underlying weakness that made an incident possible.' },
    ],
    readinessChecklist: ['You can explain the CIA triad with an example.', 'You can describe how a request travels from browser to server.', 'You can explain least privilege, patching and hardening.', 'You can separate authentication from authorization.', 'You can read a log entry and build a short timeline.', 'You can name the phases of incident response.', 'You can write a five-line evidence note.', 'You can explain why every DarkWorld target is in scope and real systems need permission.'],
    sections: [
      { title: 'The scenario', paragraphs: ['A small online shop notices customers complaining about orders they never placed. Logs show an administrator account signed in at 03:10 UTC from an unfamiliar address after hundreds of failed attempts. Minutes later a new admin account appears, and the web server starts sending large amounts of data to an unknown address.', 'The admin account had a short password, no multi-factor authentication, and was used for everyday work. The web server ran with full administrator rights and had not been updated for months.'] },
      { title: 'Walking it through every module', paragraphs: ['Introduction: confidentiality (customer data leaving) and integrity (fake orders) were both harmed. Operating systems: the server ran with too many privileges and missed patches, so one foothold became total control. Web: weak authentication let the attacker in; the admin panel did not limit who could use it. Networking: the outbound transfer to an unknown address was the clearest sign of data theft.', 'Logs and incident response: the sign-in failures, the new account and the transfer form the timeline. Containment means disabling both admin accounts and isolating the server; eradication means removing the attacker\'s access and patching; recovery means restoring from clean backups. Lessons learned: multi-factor authentication, separate admin accounts, least privilege and regular patching.'] },
      { title: 'Choosing your next path', paragraphs: ['If you enjoyed thinking about how the attacker got in, the offensive security path teaches authorised testing: finding and proving weaknesses before criminals do. If you preferred building the timeline and deciding what to contain, the defensive path and SOC casebooks teach investigation and response. If you wanted to automate the analysis, the programming path builds the coding skills both sides use.', 'Whichever you choose, the habits from this path come with you: question first, evidence before conclusions, honest limitations, and never acting outside your authorisation.'] },
    ],
    table: { headers: ['Module', 'What it explains in the scenario', 'Control that would have helped'], rows: [['Introduction', 'Confidentiality and integrity were harmed', 'Defence in depth'], ['Computers & Operating Systems', 'Over-privileged, unpatched server', 'Least privilege and patching'], ['How the Web Works', 'Weak admin sign-in', 'Multi-factor authentication and rate limiting'], ['Networking', 'Large outbound transfer', 'Egress monitoring and firewall rules'], ['Logs, Evidence & Incident Basics', 'Timeline and response', 'Central logging and a tested response plan']] },
    exercise: { scenario: 'Using the shop scenario, the owner asks for the single most important change to prevent a repeat.', task: 'Choose one change, justify it with evidence from the scenario, and name a second layer you would add.', answer: 'Require multi-factor authentication on all admin accounts: the attack began with a password guessed after hundreds of failures, and a second factor would have stopped that sign-in. Add least privilege as a second layer, so even a compromised account or web server cannot take over the whole system.', evidence: 'Point to the sign-in failures and the over-privileged server in the scenario.' },
    misconceptions: ['Incidents rarely have only one cause; look for every layer that failed.', 'Fixing the symptom (deleting the fake account) is not fixing the root cause.', 'Choosing a path now does not lock you out of the others.'],
    sources: [primarySources.ir, primarySources.csf, primarySources.nice],
    labs: [],
    questions: [{ prompt: 'What is the term for layering several controls so one failure does not lead to full compromise?', answer: 'defence in depth', accept: ['defense in depth'], hint: 'Many layers, like a castle.' }],
    quiz: [
      q('In the scenario, which control would most likely have stopped the first sign-in?', 'Multi-factor authentication on the admin account', ['A bigger company logo', 'More customer reviews', 'Faster web pages'], 1),
      q('Why did one compromised account lead to total control of the server?', 'The server and account had far more privileges than needed', ['Because the website used HTTPS', 'Because logs were enabled', 'Because backups existed'], 2),
      q('What is the root cause, as opposed to a symptom?', 'A weak, single-factor admin password used for everyday work', ['The fake orders customers saw', 'A slow checkout page', 'The new admin account by itself'], 0),
    ],
  },
];
