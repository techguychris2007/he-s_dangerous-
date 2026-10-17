import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

export const readinessLessons: CurriculumLesson[] = [
  {
    id: 'pre-ready-1', slug: 'first-lab-observe-explain-repeat', title: 'Tool Selection: Which Evidence Answers Which Question?', summary: 'Choose between terminal, Netcat, Wireshark, Burp, and Autopsy by the question you need answered.', minutes: 20,
    prerequisite: 'Complete the Netcat, Wireshark, Burp, and Autopsy introductions.',
    outcomes: ['Pick a tool based on the evidence question', 'Avoid using every tool for every problem', 'Prepare for the capstone workflow'],
    introduction: 'Tools are not trophies. A tool is useful when it answers the question in front of you. Pre-security readiness means knowing which question each tool answers.',
    sections: [
      { title: 'Question First', paragraphs: ['If the question is "what service is listening," use nmap and Netcat. If the question is "what packets crossed the wire," use Wireshark. If the question is "how does the server respond when I edit this request," use Burp Repeater. If the question is "what does this file artifact support," use Autopsy.', 'Choosing the right tool keeps your work focused and your evidence clean.'] },
      { title: 'A Beginner Workflow', paragraphs: ['Start with scope. Identify the target. Get a baseline. Change one thing. Save evidence. Write the limitation. This same rhythm applies across network, web, and forensic work.', 'When a lab feels confusing, ask which evidence type you are missing: service evidence, packet evidence, HTTP evidence, or file evidence.'] },
      { title: 'Do Not Tool-Spam', paragraphs: ['Running more tools does not automatically make an investigation better. A precise Netcat banner can be more useful than five unrelated scans. A single well-tagged artifact can be stronger than a folder of screenshots.'] },
    ],
    table: { headers: ['Question', 'Tool', 'Evidence'], rows: [['What is listening?', 'nmap / Netcat', 'Service version or banner'], ['What crossed the network?', 'Wireshark', 'Filtered packet or stream'], ['What changes a web response?', 'Burp Repeater', 'Request/response comparison']] },
    exercise: { scenario: 'You need to prove portal.lab resolves to an address, then show the HTTP health request.', task: 'Pick the tool sequence.', answer: 'Use Wireshark with dns to prove the name mapping, then http and Follow TCP Stream to show the readable health request and response.', evidence: 'Save frame number, filter, stream number, and response text.' },
    misconceptions: ['The fanciest tool is not always the right tool.', 'One good evidence item can beat many weak screenshots.', 'A tool result still needs interpretation.'],
    sources: [primarySources.testing, primarySources.wireshark, primarySources.burp, primarySources.autopsy],
    labs: ['pre-toolkit-capstone'],
    quiz: [
      { question: 'Which tool best answers what changed in an HTTP request?', options: ['Burp Repeater', 'Autopsy', 'Certificate designer', 'Image viewer'], answer: 0 },
      { question: 'Which tool best answers what file artifact contains a keyword?', options: ['Autopsy', 'Netcat', 'nmap', 'curl'], answer: 0 },
    ],
  },
  {
    id: 'pre-ready-2', slug: 'evidence-notes-and-professional-reports', title: 'Professional Notes and Lab Write-Ups', summary: 'Write proof-of-experience notes that look like analyst work, not random copied output.', minutes: 21,
    prerequisite: 'Complete at least one hands-on pre-security lab.',
    outcomes: ['Structure a short evidence note', 'Write limitations without weakening the work', 'Create reusable proof-of-experience material'],
    introduction: 'A solved lab is useful once you can explain it. Good notes show target, action, evidence, interpretation, and limitation.',
    sections: [
      { title: 'The Five-Line Note', paragraphs: ['A beginner write-up can be simple: target, question, action, evidence, conclusion. Example: target 10.10.10.20; question what service is on 31337; action nc connection; evidence banner text; conclusion plain TCP training banner responded.', 'That structure makes your proof of experience readable to an instructor, employer, or your future self.'] },
      { title: 'Limitations Are Professional', paragraphs: ['Limitations do not make your work weaker. They show you understand evidence boundaries. "The supplied fixture does not establish the author" is more professional than pretending the artifact proves identity.', 'Use limitations for TLS visibility, synthetic fixtures, single artifacts, denied requests, and missing metadata.'] },
      { title: 'Screenshots Need Captions', paragraphs: ['A screenshot without a caption asks the reader to do your thinking. Caption each image with the tool, filter or request, key result, and meaning. Keep raw output in the notebook when text is clearer than an image.'] },
    ],
    table: { headers: ['Write-up part', 'Example', 'Purpose'], rows: [['Target', '10.10.10.20', 'Sets scope'], ['Evidence', 'HTTP 200 {"status":"ready"}', 'Shows result'], ['Limitation', 'Synthetic capture', 'Prevents overclaiming']] },
    exercise: { scenario: 'You completed DNS, Burp, and Autopsy checkpoints.', task: 'Write a compact report outline.', answer: 'Scope and fixture note; network evidence; HTTP request comparison; forensic artifact register; conclusion; limitations; next practice step.', evidence: 'Save one paragraph and one evidence table.' },
    misconceptions: ['Raw output is not automatically a report.', 'Limitations are part of strong evidence.', 'Captions should explain why the image matters.'],
    sources: [primarySources.testing, primarySources.ir],
    labs: ['pre-toolkit-capstone'],
    quiz: [
      { question: 'What should a screenshot caption include?', options: ['Tool, key result, and meaning', 'Only the date', 'Only the flag', 'Nothing'], answer: 0 },
      { question: 'Why include limitations?', options: ['To keep claims aligned with evidence', 'To hide mistakes', 'To make reports longer', 'To avoid testing'], answer: 0 },
    ],
  },
  {
    id: 'pre-ready-3', slug: 'offensive-lab-readiness-capstone', title: 'Pre-Security Capstone: Ready for Offensive Labs', summary: 'Prove you can use the beginner toolkit across packets, web requests, and forensic artifacts.', minutes: 25,
    prerequisite: 'Complete the orientation, Netcat, Wireshark, Burp, and Autopsy labs.',
    outcomes: ['Complete a nine-checkpoint tool workflow', 'Explain packet, web, and file evidence together', 'Identify readiness gaps before offensive labs'],
    introduction: 'The capstone is not about breaking in. It is about being ready to learn breaking-in responsibly: read scope, collect evidence, test carefully, and write what the evidence supports.',
    sections: [
      { title: 'What Readiness Looks Like', paragraphs: ['You are ready for offensive labs when you can explain DNS, service banners, readable HTTP, encrypted limits, session cookies, object boundaries, keyword hits, and evidence limitations without guessing.', 'You do not need to be perfect. You do need to know how to slow down and make the next observation.'] },
      { title: 'The Nine Checkpoints', paragraphs: ['The toolkit capstone asks for three Wireshark checkpoints, three Burp checkpoints, and three Autopsy checkpoints. Completing all nine proves you can move across the core evidence types beginners will meet in offensive and defensive paths.', 'If one tool still feels weak, repeat only that tool lab before moving forward.'] },
      { title: 'Moving Into Offensive Labs', paragraphs: ['Offensive labs add enumeration, vulnerability validation, exploitation, privilege escalation, and cleanup. The pre-security toolkit stays relevant because every offensive step still needs scoped evidence and careful interpretation.'] },
    ],
    table: { headers: ['Readiness skill', 'Proof', 'Next path'], rows: [['Network literacy', 'Explain DNS and stream evidence', 'Recon and enumeration'], ['Web literacy', 'Compare request variants', 'Web exploitation labs'], ['Forensic literacy', 'Tag evidence carefully', 'SOC and incident response']] },
    exercise: { scenario: 'You complete all nine capstone flags.', task: 'Write your readiness statement.', answer: 'I can identify scoped targets, inspect service and packet evidence, compare HTTP request changes, and tag forensic artifacts without overclaiming. I am ready to enter guided offensive labs.', evidence: 'Save the capstone transcript and a one-page proof-of-experience note.' },
    misconceptions: ['Offensive readiness includes evidence discipline.', 'Tool familiarity is built by repetition, not memorizing definitions.', 'The pre-security path remains useful after you start advanced labs.'],
    sources: [primarySources.testing, primarySources.wireshark, primarySources.burp, primarySources.autopsy],
    labs: ['pre-toolkit-capstone'],
    quiz: [
      { question: 'What does the capstone prove?', options: ['Beginner tool readiness across packet, web, and file evidence', 'Permission to attack anything online', 'Guaranteed job placement', 'Automatic admin access'], answer: 0 },
      { question: 'What should you repeat if one tool feels weak?', options: ['That specific tool lab', 'Every unrelated roadmap', 'No practice at all', 'Only the certificate page'], answer: 0 },
    ],
  },
];
