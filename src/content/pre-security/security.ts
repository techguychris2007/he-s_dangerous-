import { primarySources, type CurriculumLesson } from '../curriculumDefinition';

export const beginnerSecurityLessons: CurriculumLesson[] = [
  {
    id: 'pre-security-1', slug: 'risk-threats-and-security-controls', title: 'Autopsy: Cases, Data Sources, and Timelines', summary: 'Learn how a forensic case is organized before searching evidence.', minutes: 22,
    prerequisite: 'Know what files, paths, timestamps, and evidence notes are.',
    outcomes: ['Explain case and data source concepts', 'Recognize allocated and deleted entries', 'Record timestamps with timezone context'],
    introduction: 'Forensics is not just finding interesting words. It is organizing evidence so another person can reproduce your work and understand what each artifact proves.',
    toolWorkflow: [
      { tool: 'Autopsy case setup', when: 'Use it when file artifacts need organized forensic review.', actions: ['Name the case clearly.', 'Add the supplied fixture as the data source.', 'Record that the fixture is training evidence before interpreting artifacts.'], evidence: 'Case name, data source name, fixture description, and ingest result.' },
      { tool: 'Timeline review', when: 'Use it when timestamps affect the story.', actions: ['Record the timestamp exactly as shown.', 'Include timezone if the tool provides one.', 'Compare time order before claiming cause and effect.'], evidence: 'Artifact ID, path, timestamp, timezone, and the narrow event it supports.' },
    ],
    keyTerms: [
      { term: 'Case', meaning: 'The container that organizes forensic evidence, tags, searches, and notes.' },
      { term: 'Data source', meaning: 'The disk image, file set, or fixture added for analysis.' },
      { term: 'Allocated file', meaning: 'A file entry still marked active by the filesystem.' },
      { term: 'Deleted entry', meaning: 'A filesystem entry marked deleted that may still have recoverable metadata or content.' },
    ],
    readinessChecklist: ['You can explain the difference between a case and a data source.', 'You can record artifact state without assuming intent.', 'You can include timezone context when timestamps matter.'],
    sections: [
      { title: 'Case First', paragraphs: ['Autopsy organizes work into cases. A case holds data sources, extracted artifacts, keyword results, tags, and notes. Without a case container, evidence handling becomes scattered and hard to review.', 'In DarkWorld, the beginner fixture is not a disk image. It is a small synthetic set of file artifacts built to teach the workflow. Report it honestly as a training fixture.'] },
      { title: 'Data Sources and Artifacts', paragraphs: ['A data source can be a disk image, logical files, or another supported evidence source. After ingest, Autopsy parses files and creates artifacts that can be searched and tagged.', 'Allocated means the file entry is active. A deleted entry means the filesystem metadata marks deletion, but content may still be recoverable in the fixture. Deleted does not automatically mean malicious.'] },
      { title: 'Timeline Discipline', paragraphs: ['Timestamps need context. Record the full time and timezone shown by the tool. A timeline lets you compare a note, download, login, and network event without pretending one artifact tells the whole story.'] },
    ],
    table: { headers: ['Forensic term', 'Meaning', 'Careful wording'], rows: [['Case', 'Container for evidence work', 'Case DW-101 was created'], ['Data source', 'Evidence added for analysis', 'Training fixture ingested'], ['Artifact', 'Parsed item or file record', 'F-01 contains the keyword']] },
    exercise: { scenario: 'A fixture contains an allocated note and a deleted receipt.', task: 'What should you avoid claiming?', answer: 'Do not claim deletion proves malicious intent. Record the artifact state, content, and timestamp, then explain what the artifact does and does not support.', evidence: 'Save an evidence register with ID, path, time, state, and interpretation.' },
    misconceptions: ['Deleted does not automatically mean bad.', 'A case name is part of evidence organization.', 'A training fixture should not be described as a seized production disk.'],
    sources: [primarySources.autopsy],
    labs: ['pre-autopsy-first-case'],
    quiz: [
      { question: 'What is an Autopsy case?', options: ['A container for evidence work', 'A web cookie', 'A TCP port', 'A DNS answer'], answer: 0 },
      { question: 'What does a deleted entry prove by itself?', options: ['Only that metadata marks deletion', 'Malicious intent', 'Root access', 'Packet decryption'], answer: 0 },
    ],
  },
  {
    id: 'pre-security-2', slug: 'passwords-cryptography-and-personal-security', title: 'Autopsy: Keyword Search Without Overclaiming', summary: 'Use keyword hits as leads and write conclusions that match the artifact.', minutes: 21,
    prerequisite: 'Understand case and data source basics.',
    outcomes: ['Run a keyword search', 'Interpret hits as leads', 'Distinguish content from authorship or intent'],
    introduction: 'A keyword hit is exciting, but it is not the whole investigation. The file content may prove that a word appears. It may not prove who wrote it, who read it, or why it exists.',
    toolWorkflow: [
      { tool: 'Autopsy keyword search', when: 'Use it when a case term, username, filename, or indicator needs to be located.', actions: ['Search the exact keyword first.', 'Open the artifact that produced the hit.', 'Separate visible content from authorship, access, and intent.'], evidence: 'Keyword, hit count, artifact ID, path, visible text, and one limitation.' },
    ],
    keyTerms: [
      { term: 'Keyword hit', meaning: 'A search result showing the term appears in indexed evidence.' },
      { term: 'Artifact ID', meaning: 'A stable reference for a parsed item or file record.' },
      { term: 'Authorship', meaning: 'Who created or wrote content, which usually needs supporting metadata.' },
      { term: 'Overclaiming', meaning: 'Stating more than the evidence can prove.' },
    ],
    readinessChecklist: ['You can treat a keyword hit as a lead, not a verdict.', 'You can record hit count and artifact path.', 'You can say what the artifact does not establish.'],
    sections: [
      { title: 'Search Terms Are Hypotheses', paragraphs: ['BLUE-LANTERN in the training fixture is a case reference. Searching for it finds the note that contains the reference. That gives you a place to inspect, not a complete answer.', 'Good searches are repeatable. Save the exact keyword, whether the search was case sensitive, how many hits appeared, and which artifact you inspected.'] },
      { title: 'Content, Authorship, and Intent', paragraphs: ['If a note says "No password is stored here," you can report that the text appears in the note. You cannot report a password was found. If metadata does not identify the author, do not invent one.', 'Professional forensics uses cautious verbs: contains, indicates, suggests, correlates, does not establish. Those words protect the truth of the report.'] },
      { title: 'No Hits Are Also Limited', paragraphs: ['No keyword hits do not prove absence from encrypted, compressed, unparsed, or deleted data outside the indexed set. Say what was searched and what was not covered.'] },
    ],
    table: { headers: ['Observation', 'Supported claim', 'Unsupported claim'], rows: [['BLUE-LANTERN hit', 'The term appears in F-01', 'Alex accessed the portal'], ['No password text', 'The note denies password storage', 'No passwords exist anywhere'], ['One artifact', 'One file contains evidence', 'The whole disk is clean']] },
    exercise: { scenario: 'Autopsy finds BLUE-LANTERN in notes.txt.', task: 'Write a precise finding.', answer: 'Artifact F-01, /Users/alex/Documents/notes.txt, contains the case reference BLUE-LANTERN. The artifact does not establish who created the note or who accessed the portal.', evidence: 'Save the keyword, artifact ID, path, and limitation.' },
    misconceptions: ['A keyword hit is a lead, not a verdict.', 'Text content does not automatically prove authorship.', 'No hits are limited by what was indexed.'],
    sources: [primarySources.autopsy],
    labs: ['pre-autopsy-first-case'],
    quiz: [
      { question: 'What is a keyword hit best treated as?', options: ['A lead for inspection', 'A complete verdict', 'A decrypted password', 'A network route'], answer: 0 },
      { question: 'What should you avoid claiming from one note?', options: ['Who created it without supporting metadata', 'The visible text exists', 'The path of the artifact', 'The timestamp shown'], answer: 0 },
    ],
  },
  {
    id: 'pre-security-3', slug: 'authorization-ethics-and-evidence', title: 'Autopsy: Tags, Evidence Registers, and Reports', summary: 'Turn forensic observations into professional documentation with tags, evidence registers, limitations, and report language another analyst can review.', minutes: 22,
    prerequisite: 'Complete a keyword search in the Autopsy lab.',
    outcomes: ['Tag evidence with supported interpretations', 'Build a small evidence register', 'Write limitations plainly'],
    introduction: 'A forensics report is judged by how well it connects evidence to conclusions. Tags and registers help keep that connection clean.',
    toolWorkflow: [
      { tool: 'Evidence register', when: 'Use it when observations need to become a professional note or report.', actions: ['Create one row per important artifact.', 'Include finding and limitation in the same row.', 'Use cautious interpretation tags that match the evidence.'], evidence: 'Artifact ID, path, timestamp, state, finding, tag, and limitation.' },
      { tool: 'Autopsy tags', when: 'Use them to mark why an artifact matters.', actions: ['Choose a tag that describes the supported interpretation.', 'Avoid dramatic labels unless the artifact proves them.', 'Reference the tag in the report evidence table.'], evidence: 'Tag name, artifact ID, and the sentence explaining why the tag is justified.' },
    ],
    keyTerms: [
      { term: 'Tag', meaning: 'An analyst label that records an interpretation or review status.' },
      { term: 'Evidence register', meaning: 'A structured table connecting artifacts to findings and limitations.' },
      { term: 'Finding', meaning: 'A conclusion supported by specific evidence.' },
      { term: 'Limitation', meaning: 'What the artifact cannot prove by itself.' },
    ],
    readinessChecklist: ['You can build a one-row evidence register.', 'You can choose a tag that does not overstate the artifact.', 'You can write finding and limitation together.'],
    sections: [
      { title: 'Tags Capture Interpretation', paragraphs: ['A tag should describe what the artifact supports. In the training lab, F-01 should be tagged reference-only because it contains a case reference but does not prove account access or password exposure.', 'Bad tags make reports noisy. "password found" is wrong when the artifact explicitly says no password is stored there.'] },
      { title: 'Evidence Register', paragraphs: ['A simple register needs artifact ID, path, timestamp, state, finding, and limitation. This structure lets another analyst understand the case without opening every file first.', 'For beginner labs, one strong register row is better than five screenshots with no explanation.'] },
      { title: 'Report Language', paragraphs: ['Write what the artifact proves, what it suggests, and what remains unknown. That habit prepares you for defensive investigations, incident response, and offensive evidence reports.'] },
    ],
    table: { headers: ['Register field', 'Example', 'Why it matters'], rows: [['Artifact ID', 'F-01', 'Stable reference'], ['Interpretation', 'Reference only', 'Prevents overclaiming'], ['Limitation', 'Author not established', 'Keeps conclusion honest']] },
    exercise: { scenario: 'You tagged F-01 as reference-only after finding BLUE-LANTERN.', task: 'Write the evidence register row.', answer: 'F-01 | /Users/alex/Documents/notes.txt | 2026-01-15 09:02 UTC | Allocated | Contains BLUE-LANTERN case reference | Does not establish author, password, or portal access.', evidence: 'Save the row in your notebook and include it in the lab report.' },
    misconceptions: ['A tag is an interpretation, not decoration.', 'Reports need limitations as much as findings.', 'Screenshots without context are weak evidence.'],
    sources: [primarySources.autopsy, primarySources.ir],
    labs: ['pre-autopsy-first-case', 'pre-toolkit-capstone'],
    quiz: [
      { question: 'Why tag F-01 as reference-only?', options: ['The text supports a reference but not stronger claims', 'It proves a password exists', 'It decrypts TLS', 'It opens a shell'], answer: 0 },
      { question: 'What belongs in an evidence register?', options: ['Artifact ID, path, time, state, finding, limitation', 'Only the final flag', 'Only screenshots', 'Only the learner name'], answer: 0 },
    ],
  },
];
